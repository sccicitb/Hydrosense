"use strict";
// Real, time-integrated leakage statistics over a rolling window (default: 7
// days), computed from actual historical rows - not the single latest row.
//
// Why this exists: the live "latest reading" segment view (see
// getLatestLeakageSegments in aiInsights.js) can show all-zero numbers
// whenever the instant a user happens to load the page has no flow (e.g.
// pumps idle at night), even though real flow happened earlier that day or
// week. This module instead walks every reading in the window and
// numerically integrates flow-rate x time-elapsed into an actual liters
// total, which reflects what really happened over the period rather than
// one instant.
//
// Shared by Controllers/DataController.js (REST endpoint powering the
// Reports page table) and helper/aiInsights.js (weekly AI narrative), so the
// integration logic lives in exactly one place.

const { Op } = require("sequelize");
const { PanelA, PanelB, PanelE } = require("../models");

const WATER_TARIFF_PER_LITER = 6; // Rp, rough estimate - see reports page for sourcing notes.
// If the gap between two consecutive readings is larger than this, we don't
// know what the flow rate actually was during that gap (sensor likely went
// silent/offline) - skip it rather than assume the last known rate held.
const MAX_INTERVAL_MINUTES = 60;

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

// Some sensors (Panel E in particular - see reports page notes) occasionally
// emit physically-impossible readings: negative flow through a one-directional
// meter, or absurd floating-point noise near zero. Treat a negative reading
// as "unknown" (0) rather than let it drag totals negative or invert a loss
// calculation - and count how often it happens so callers can flag it
// honestly instead of silently hiding it.
function sanitizeFlow(raw) {
  const value = toNumber(raw);
  if (value < 0) return { value: 0, invalid: true };
  return { value, invalid: false };
}

// Numerically integrates one panel field's flow rate (L/min) over time into
// a real total liters figure, using each reading's rate held constant until
// the next reading ("step" integration) - skipping any gap too large to
// trust.
function computeFlowStats(rows, field) {
  if (!rows.length) {
    return {
      totalLiters: 0,
      avgFlow: 0,
      maxFlow: 0,
      minFlow: 0,
      readingCount: 0,
      coverageMinutes: 0,
      invalidReadingCount: 0,
    };
  }

  let totalLiters = 0;
  let coverageMinutes = 0;
  let sumFlow = 0;
  let maxFlow = -Infinity;
  let minFlow = Infinity;
  let invalidReadingCount = 0;

  const sanitized = rows.map((row) => {
    const { value, invalid } = sanitizeFlow(row[field]);
    if (invalid) invalidReadingCount += 1;
    return value;
  });

  sanitized.forEach((flow, index) => {
    sumFlow += flow;
    if (flow > maxFlow) maxFlow = flow;
    if (flow < minFlow) minFlow = flow;

    if (index > 0) {
      const minutesElapsed = (rows[index].createdAt.getTime() - rows[index - 1].createdAt.getTime()) / 60000;
      if (minutesElapsed > 0 && minutesElapsed <= MAX_INTERVAL_MINUTES) {
        totalLiters += sanitized[index - 1] * minutesElapsed;
        coverageMinutes += minutesElapsed;
      }
    }
  });

  return {
    totalLiters,
    avgFlow: sumFlow / rows.length,
    maxFlow: maxFlow === -Infinity ? 0 : maxFlow,
    minFlow: minFlow === Infinity ? 0 : minFlow,
    readingCount: rows.length,
    coverageMinutes,
    invalidReadingCount,
  };
}

function computeWeeklySegment(label, upstreamStats, downstreamStats) {
  const lossLiters = Math.max(0, upstreamStats.totalLiters - downstreamStats.totalLiters);
  const lossPercent = upstreamStats.totalLiters > 0 ? (lossLiters / upstreamStats.totalLiters) * 100 : 0;
  const estimatedCost = lossLiters * WATER_TARIFF_PER_LITER;

  // Flag when a "100% loss" number is more likely a data gap than a real
  // leak - e.g. a downstream sensor that recorded literally zero flow for
  // every reading all week while upstream clearly had flow. Surfacing this
  // as a note (rather than asserting the loss as fact) matches this app's
  // stance of never presenting an estimate with more confidence than the
  // underlying data supports.
  let note = null;
  if (
    upstreamStats.totalLiters > 0 &&
    downstreamStats.readingCount > 0 &&
    downstreamStats.totalLiters === 0 &&
    downstreamStats.maxFlow === 0
  ) {
    note =
      "Sensor hilir mencatat 0 di seluruh pembacaan minggu ini, sementara sisi hulu jelas mengalir - ini lebih mungkin celah data (sensor/kolom belum terekam) daripada kebocoran 100% riil.";
  } else if (downstreamStats.invalidReadingCount / Math.max(1, downstreamStats.readingCount) > 0.2) {
    note = `${downstreamStats.invalidReadingCount} dari ${downstreamStats.readingCount} pembacaan sensor hilir bernilai negatif (tidak valid secara fisik) dan diabaikan dari total.`;
  } else if (upstreamStats.invalidReadingCount / Math.max(1, upstreamStats.readingCount) > 0.2) {
    note = `${upstreamStats.invalidReadingCount} dari ${upstreamStats.readingCount} pembacaan sensor hulu bernilai negatif (tidak valid secara fisik) dan diabaikan dari total.`;
  }

  return {
    label,
    upstreamTotalLiters: upstreamStats.totalLiters,
    downstreamTotalLiters: downstreamStats.totalLiters,
    lossLiters,
    lossPercent,
    estimatedCost,
    upstreamAvgFlow: upstreamStats.avgFlow,
    downstreamAvgFlow: downstreamStats.avgFlow,
    note,
  };
}

// The sensors write extremely frequently (~130k+ rows per panel over 7 days
// on a remote DB under continuous MQTT write load), so a full 7-day scan
// genuinely costs ~10-15s at the database/network level - confirmed even
// with a raw, un-ORM'd query, so it isn't Sequelize overhead. Recomputing
// that on every page load/poll is wasteful for a number that only
// meaningfully changes as new data accumulates, not on every request -
// cache it in memory for a few minutes, the same "compute once, serve from
// cache" pattern already used for the TikTok scrape and AI insights caches.
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map(); // days -> { computedAt, promise }

// Fetches the real historical rows for Panel A/B/E over the last `days` days
// and returns per-panel flow stats plus derived segment totals - all
// computed from actual database rows, never fabricated.
async function computeWeeklyLeakageStats(days) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const where = { createdAt: { [Op.gte]: since } };
  const order = [["createdAt", "ASC"]];

  // Only pull the columns the integration actually needs - these tables
  // hold 100k+ rows over a week, and turbidity/ph/tds/timestamp/updatedAt
  // would otherwise be transferred and parsed for nothing.
  const [rowsA, rowsB, rowsE] = await Promise.all([
    PanelA.findAll({ where, order, attributes: ["flow1", "createdAt"] }),
    PanelB.findAll({ where, order, attributes: ["flow1", "flow2", "createdAt"] }),
    PanelE.findAll({ where, order, attributes: ["flow1", "createdAt"] }),
  ]);

  const statsA1 = computeFlowStats(rowsA, "flow1");
  const statsB1 = computeFlowStats(rowsB, "flow1");
  const statsB2 = computeFlowStats(rowsB, "flow2");
  const statsE1 = computeFlowStats(rowsE, "flow1");

  const segments = [
    computeWeeklySegment("WTP Intake -> Pump House (masuk)", statsA1, statsB1),
    computeWeeklySegment("Pump House (masuk -> keluar)", statsB1, statsB2),
    computeWeeklySegment("Pump House (keluar) -> Dormitory", statsB2, statsE1),
  ];

  const totalLossLiters = segments.reduce((sum, s) => sum + s.lossLiters, 0);
  const totalCost = segments.reduce((sum, s) => sum + s.estimatedCost, 0);

  return {
    since: since.toISOString(),
    until: new Date().toISOString(),
    days,
    segments,
    totalLossLiters,
    totalCost,
    panelStats: { A1: statsA1, B1: statsB1, B2: statsB2, E1: statsE1 },
  };
}

// Cached wrapper around computeWeeklyLeakageStats - see CACHE_TTL_MS note
// above. Concurrent callers within the same cache miss share one in-flight
// query (via the cached promise) instead of each triggering their own
// 10s+ scan.
async function getWeeklyLeakageStats(days = 7) {
  const cached = cache.get(days);
  if (cached && Date.now() - cached.computedAt < CACHE_TTL_MS) {
    return cached.promise;
  }

  const promise = computeWeeklyLeakageStats(days);
  cache.set(days, { computedAt: Date.now(), promise });

  try {
    return await promise;
  } catch (err) {
    cache.delete(days); // don't cache a failure
    throw err;
  }
}

module.exports = {
  getWeeklyLeakageStats,
  WATER_TARIFF_PER_LITER,
};
