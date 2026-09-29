"use client";

import { useEffect, useState } from "react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3006";

// Rough estimate, not an exact published rate: universities/schools fall under
// PDAM's "Sosial Khusus" tariff category, which prices below the commercial
// rate. PDAM Tirta Medal (serves Sumedang regency, including Jatinangor)
// publishes a commercial rate of ~Rp 6,825-6,850/m3; social/education tiers
// run below that. Rp 6,000/m3 chosen as a reasonable working figure — update
// here if a real billed rate becomes available. (Matches WATER_TARIFF_PER_LITER
// in backend/helper/leakageStats.js, which actually computes the cost figures below.)
const WATER_TARIFF_PER_M3 = 6000;

const toNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const statusStyles = {
  normal: { label: "Normal", border: "border-sky-200", bg: "bg-sky-50", text: "text-sky-700", dot: "bg-sky-500" },
  watch: { label: "Perlu Dipantau", border: "border-amber-200", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  danger: { label: "Kritis", border: "border-red-200", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

// A "100% loss" segment flagged with a data-quality note (see
// backend/helper/leakageStats.js) is capped at "watch" rather than
// "danger" — we can't be confident it's a real leak versus a sensor/data
// gap, so the UI shouldn't cry critical over it.
const getLeakStatus = (percent, hasNote) => {
  if (percent >= 10) return hasNote ? "watch" : "danger";
  if (percent >= 5) return "watch";
  return "normal";
};

const StatusPill = ({ status }) => {
  const style = statusStyles[status] || statusStyles.normal;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold ${style.border} ${style.bg} ${style.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {style.label}
    </span>
  );
};

const fmtLiters = (value) => `${toNumber(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })} L`;
const fmtRupiah = (value) => `Rp ${Math.round(toNumber(value)).toLocaleString("id-ID")}`;
const fmtPercent = (value) => `${toNumber(value).toFixed(1)}%`;

// The LLM writes lightweight markdown (**bold** lines, "- " bullets, plain
// paragraphs). Render it without pulling in a markdown library for this.
const InsightText = ({ text }) => {
  if (!text) return <p className="text-slate-400 text-sm">Belum ada analisis.</p>;

  return (
    <div className="text-sm leading-relaxed">
      {text.split("\n").map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return null;

        if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
          return (
            <p key={index} className="font-bold text-slate-900 mt-3 mb-1">
              {trimmed.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <p key={index} className="ml-4 text-slate-600 mb-1">
              &bull; {trimmed.slice(2).replace(/\*\*/g, "")}
            </p>
          );
        }
        return (
          <p key={index} className="text-slate-600 mb-2">
            {trimmed.replace(/\*\*/g, "")}
          </p>
        );
      })}
    </div>
  );
};

const Report = () => {
  // Live instant readings — kept only as a small transparency footnote, not
  // the primary numbers. A single instant can legitimately read all-zero
  // (pumps idle) without meaning the week itself was inactive.
  const [flowA1, setFlowA1] = useState(null);
  const [flowB1, setFlowB1] = useState(null);
  const [flowB2, setFlowB2] = useState(null);
  const [flowE1, setFlowE1] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState("-");

  // Weekly, time-integrated totals from backend/helper/leakageStats.js —
  // the primary numbers shown on this page.
  const [weekly, setWeekly] = useState(null);
  const [weeklyLoading, setWeeklyLoading] = useState(true);
  const [weeklyError, setWeeklyError] = useState(null);

  const [insights, setInsights] = useState(null);
  const [insightsGeneratedAt, setInsightsGeneratedAt] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState(null);

  const fetchInsights = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/insights`, { cache: "no-store" });
      const data = await response.json().catch(() => null);
      if (data) {
        setInsights(data);
        setInsightsGeneratedAt(data.generatedAt);
      }
    } catch {
      // Leave existing insights state; the section shows "belum ada analisis".
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/insights/generate`, { method: "POST" });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setGenerateError(data?.error || "Gagal membuat analisis AI.");
      } else if (data) {
        setInsights(data);
        setInsightsGeneratedAt(data.generatedAt);
      }
    } catch (err) {
      setGenerateError(err?.message || "Gagal membuat analisis AI.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  useEffect(() => {
    const fetchWeekly = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/data/leakage/weekly`, { cache: "no-store" });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data) {
          setWeeklyError(data?.error || "Gagal memuat rekap mingguan.");
        } else {
          setWeekly(data);
          setWeeklyError(null);
        }
      } catch (err) {
        setWeeklyError(err?.message || "Gagal memuat rekap mingguan.");
      } finally {
        setWeeklyLoading(false);
      }
    };

    fetchWeekly();
    const interval = setInterval(fetchWeekly, 600000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchLatest = async (path) => {
      try {
        const response = await fetch(`${API_BASE_URL}/data/${path}/latest`, { cache: "no-store" });
        if (!response.ok) return null;
        const data = await response.json().catch(() => null);
        return data && typeof data === "object" ? data : null;
      } catch {
        return null;
      }
    };

    const fetchAll = async () => {
      const [dataA, dataB, dataE] = await Promise.all([
        fetchLatest("panelA1"),
        fetchLatest("panelB1"),
        fetchLatest("panelE1"),
      ]);

      if (dataA?.flow1 !== undefined) setFlowA1(dataA.flow1);
      if (dataB?.flow1 !== undefined) setFlowB1(dataB.flow1);
      if (dataB?.flow2 !== undefined) setFlowB2(dataB.flow2);
      if (dataE?.flow1 !== undefined) setFlowE1(dataE.flow1);

      setLastUpdated(dataA || dataB || dataE ? new Date().toLocaleString("id-ID") : "Data sensor belum tersedia");
      setIsLoading(false);
    };

    fetchAll();
    const interval = setInterval(fetchAll, 600000);
    return () => clearInterval(interval);
  }, []);

  const segments = (weekly?.segments || []).map((segment) => ({
    ...segment,
    status: getLeakStatus(segment.lossPercent, Boolean(segment.note)),
  }));

  const statusRank = { normal: 0, watch: 1, danger: 2 };
  const worstSegment = segments.length
    ? segments.reduce((worst, segment) => (statusRank[segment.status] > statusRank[worst.status] ? segment : worst), segments[0])
    : null;
  const totalLossLiters = weekly?.totalLossLiters ?? 0;
  const totalCost = weekly?.totalCost ?? 0;
  const overallStatus = worstSegment?.status || "normal";
  const periodLabel =
    weekly?.since && weekly?.until
      ? `${new Date(weekly.since).toLocaleDateString("id-ID")} - ${new Date(weekly.until).toLocaleDateString("id-ID")} (${weekly.days} hari terakhir)`
      : "-";

  return (
    <div className="min-h-full w-full overflow-x-hidden bg-[#F3FAFF] px-4 py-5 sm:px-6 lg:px-8">
      <div className="flex flex-row justify-between items-center pb-7">
        <h1 className="text-4xl font-bold text-slate-900">Water Leakage Report</h1>
      </div>

      <div className="mb-7 w-full rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
        <div className="flex flex-col gap-1 mb-4">
          <h2 className="text-slate-900 text-2xl font-bold">Estimasi Kebocoran per Segmen (Mingguan)</h2>
          <p className="text-slate-500 text-sm">
            Dihitung dari total volume riil tiap sensor selama periode {periodLabel} (integrasi laju alir x waktu
            dari data historis) &mdash; bukan satu pembacaan sesaat, sehingga tetap menunjukkan aktivitas nyata
            walau sensor kebetulan membaca nol saat halaman ini dimuat.
          </p>
        </div>

        {weeklyError ? <p className="text-red-600 text-sm mb-4">{weeklyError}</p> : null}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm">Estimasi Kehilangan Minggu Ini</h3>
            <p className="text-slate-900 text-xl font-bold">{weeklyLoading ? "Memuat..." : fmtLiters(totalLossLiters)}</p>
            <p className="text-slate-400 text-xs mt-1">total selama {weekly?.days ?? 7} hari terakhir</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm">Estimasi Kerugian Minggu Ini</h3>
            <p className="text-slate-900 text-xl font-bold">{weeklyLoading ? "Memuat..." : fmtRupiah(totalCost)}</p>
            <p className="text-slate-400 text-xs mt-1">tarif estimasi Rp {WATER_TARIFF_PER_M3.toLocaleString("id-ID")}/m&sup3;</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm">Segmen Tertinggi</h3>
            <p className="text-slate-900 text-lg font-bold leading-snug">{worstSegment ? worstSegment.label : "-"}</p>
            <p className="text-slate-400 text-xs mt-1">{worstSegment ? fmtPercent(worstSegment.lossPercent) : "-"} kehilangan</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-500 text-sm mb-2">Status Keseluruhan</h3>
            <StatusPill status={overallStatus} />
          </div>
        </div>

        {/* Segment table */}
        <div className="overflow-x-auto">
          <table className="w-full text-slate-900">
            <thead>
              <tr className="border-b border-sky-100">
                <th className="text-left py-3 px-2">Segmen</th>
                <th className="text-right py-3 px-2">Total Masuk (L)</th>
                <th className="text-right py-3 px-2">Total Keluar (L)</th>
                <th className="text-right py-3 px-2">Selisih (L)</th>
                <th className="text-right py-3 px-2">Kehilangan (%)</th>
                <th className="text-right py-3 px-2">Est. Rp minggu ini</th>
                <th className="text-right py-3 px-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {weeklyLoading && !segments.length ? (
                <tr>
                  <td colSpan={7} className="py-4 px-2 text-center text-slate-400 text-sm">
                    Memuat rekap mingguan...
                  </td>
                </tr>
              ) : (
                segments.map((segment) => (
                  <tr key={segment.label} className="border-b border-sky-100 align-top">
                    <td className="py-2 px-2">
                      {segment.label}
                      {segment.note ? (
                        <p className="text-amber-600 text-xs mt-1 max-w-xs">&#9888; {segment.note}</p>
                      ) : null}
                    </td>
                    <td className="py-2 px-2 text-right">{fmtLiters(segment.upstreamTotalLiters)}</td>
                    <td className="py-2 px-2 text-right">{fmtLiters(segment.downstreamTotalLiters)}</td>
                    <td className="py-2 px-2 text-right">{fmtLiters(segment.lossLiters)}</td>
                    <td className="py-2 px-2 text-right">{fmtPercent(segment.lossPercent)}</td>
                    <td className="py-2 px-2 text-right">{fmtRupiah(segment.estimatedCost)}</td>
                    <td className="py-2 px-2 text-right">
                      <StatusPill status={segment.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <p className="text-slate-400 text-xs mt-4">
          Segmen mengikuti rangkaian flow yang sudah dipakai di Dashboard (WTP Intake &rarr; Pump House &rarr;
          Dormitory, Panel A &rarr; Panel B &rarr; Panel E). Tarif air Rp {WATER_TARIFF_PER_M3.toLocaleString("id-ID")}/m&sup3;
          adalah estimasi kasar (kategori sosial/pendidikan PDAM), bukan tarif resmi yang tertagih. Baris bertanda
          &#9888; berarti perhitungan lebih mungkin mencerminkan celah data/sensor daripada kebocoran fisik nyata.
        </p>

        <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50 p-3">
          <p className="text-slate-500 text-xs font-bold mb-1">Kondisi saat ini (sesaat, untuk referensi)</p>
          <p className="text-slate-500 text-xs">
            Panel A: {isLoading ? "..." : `${toNumber(flowA1).toFixed(2)} L/m`} &bull; Panel B masuk:{" "}
            {isLoading ? "..." : `${toNumber(flowB1).toFixed(2)} L/m`} &bull; Panel B keluar:{" "}
            {isLoading ? "..." : `${toNumber(flowB2).toFixed(2)} L/m`} &bull; Panel E:{" "}
            {isLoading ? "..." : `${toNumber(flowE1).toFixed(2)} L/m`} &mdash; diperbarui {isLoading ? "..." : lastUpdated}.
          </p>
        </div>
      </div>

      <div className="mb-7 w-full rounded-lg border border-sky-100 bg-white p-5 shadow-sm shadow-sky-100/70">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-slate-900 text-2xl font-bold">Analisis AI</h2>
            <p className="text-slate-500 text-sm">
              Dibuat oleh model AI (llama.cpp, self-hosted) berdasarkan data kebocoran dan laporan TikTok terkini.{" "}
              {insightsGeneratedAt
                ? `Terakhir dibuat: ${new Date(insightsGeneratedAt).toLocaleString("id-ID")}.`
                : "Belum pernah dibuat."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-xs font-bold text-sky-700 disabled:opacity-50 whitespace-nowrap"
          >
            {isGenerating ? "Membuat analisis..." : "Generate Analisis"}
          </button>
        </div>

        {generateError ? (
          <p className="text-red-600 text-sm mb-4">{generateError}</p>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-900 text-lg font-bold mb-2">Berdasarkan Data Kebocoran</h3>
            {insights?.leakage?.error ? (
              <p className="text-red-600 text-sm">{insights.leakage.error}</p>
            ) : (
              <InsightText text={insights?.leakage?.text} />
            )}
          </div>
          <div className="rounded-lg border border-sky-100 bg-sky-50/70 p-4">
            <h3 className="text-slate-900 text-lg font-bold mb-2">Berdasarkan Laporan TikTok</h3>
            {insights?.tiktok?.error ? (
              <p className="text-red-600 text-sm">{insights.tiktok.error}</p>
            ) : (
              <InsightText text={insights?.tiktok?.text} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;
