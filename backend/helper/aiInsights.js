"use strict";
// Shared logic for generating AI analysis of (1) real leakage-segment data
// and (2) recently-scraped TikTok posts, using the self-hosted llama.cpp
// server. Used by both scripts/generateInsights.js (manual CLI run) and the
// on-demand "Generate" button's API endpoint - the LLM-calling logic lives
// here once, not duplicated in both places.

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { PanelA, PanelB, PanelE } = require("../models");

const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://llama.sccic.org";
const LLM_MODEL = process.env.LLM_MODEL || "unsloth/Qwen3.8-27B-GGUF:UD-Q4_K_XL";
const INSIGHTS_FILE = path.join(__dirname, "..", "data", "ai-insights.json");
const TIKTOK_FILE = path.join(__dirname, "..", "data", "tiktok-posts.json");
const WATER_TARIFF_PER_LITER = 6; // Rp, rough estimate - see reports page for sourcing notes.
const MINUTES_PER_DAY = 24 * 60;

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function computeSegment(label, upstreamFlow, downstreamFlow) {
  const upstream = toNumber(upstreamFlow);
  const downstream = toNumber(downstreamFlow);
  const lossRate = Math.max(0, upstream - downstream);
  const lossPercent = upstream > 0 ? (lossRate / upstream) * 100 : 0;
  const estimatedDailyLiters = lossRate * MINUTES_PER_DAY;
  const estimatedDailyCost = estimatedDailyLiters * WATER_TARIFF_PER_LITER;

  return { label, upstream, downstream, lossRate, lossPercent, estimatedDailyLiters, estimatedDailyCost };
}

async function getLatestLeakageSegments() {
  const [latestA, latestB, latestE] = await Promise.all([
    PanelA.findOne({ order: [["createdAt", "DESC"]] }),
    PanelB.findOne({ order: [["createdAt", "DESC"]] }),
    PanelE.findOne({ order: [["createdAt", "DESC"]] }),
  ]);

  const flowA1 = latestA ? latestA.flow1 : null;
  const flowB1 = latestB ? latestB.flow1 : null;
  const flowB2 = latestB ? latestB.flow2 : null;
  const flowE1 = latestE ? latestE.flow1 : null;

  return [
    computeSegment("WTP Intake -> Pump House (masuk)", flowA1, flowB1),
    computeSegment("Pump House (masuk -> keluar)", flowB1, flowB2),
    computeSegment("Pump House (keluar) -> Dormitory", flowB2, flowE1),
  ];
}

function loadTikTokPosts() {
  try {
    const raw = fs.readFileSync(TIKTOK_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

async function callLlm(systemPrompt, userPrompt) {
  const response = await axios.post(
    `${LLM_BASE_URL}/v1/chat/completions`,
    {
      model: LLM_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: 2000,
      temperature: 0.3,
    },
    { timeout: 120000 }
  );

  const message = response.data?.choices?.[0]?.message;
  const content = message?.content?.trim();
  if (content) return content;

  // Qwen3 is a "thinking" model: on longer prompts it can spend the whole
  // token budget on reasoning_content and never emit a final `content`.
  // Fall back to the reasoning trace itself rather than returning nothing.
  const reasoning = message?.reasoning_content?.trim();
  return reasoning || "";
}

async function generateLeakageInsight() {
  const segments = await getLatestLeakageSegments();
  const totalDailyLiters = segments.reduce((sum, s) => sum + s.estimatedDailyLiters, 0);
  const totalDailyCost = segments.reduce((sum, s) => sum + s.estimatedDailyCost, 0);

  const systemPrompt =
    "Anda adalah analis operasional untuk sistem monitoring air kampus di Jatinangor. " +
    "Jawab singkat, dalam Bahasa Indonesia, dengan struktur: ringkasan kondisi, lalu rekomendasi tindakan (poin-poin). " +
    "Jangan mengulang angka mentah secara berlebihan, fokus pada interpretasi dan tindakan nyata.";

  const userPrompt = [
    "Data segmen kebocoran air terkini (dihitung dari selisih laju alir sensor, bukan data historis):",
    ...segments.map(
      (s) =>
        `- ${s.label}: masuk ${s.upstream.toFixed(2)} L/m, keluar ${s.downstream.toFixed(2)} L/m, ` +
        `selisih ${s.lossRate.toFixed(2)} L/m (${s.lossPercent.toFixed(1)}% kehilangan), ` +
        `estimasi kerugian Rp ${Math.round(s.estimatedDailyCost).toLocaleString("id-ID")}/hari`
    ),
    `Total estimasi kehilangan: ${totalDailyLiters.toFixed(0)} L/hari, Rp ${Math.round(totalDailyCost).toLocaleString("id-ID")}/hari.`,
    "Berikan analisis kondisi kebocoran dan rekomendasi tindakan yang perlu diambil operator.",
  ].join("\n");

  const text = await callLlm(systemPrompt, userPrompt);
  return { text, segments, generatedAt: new Date().toISOString() };
}

async function generateTikTokInsight() {
  const posts = loadTikTokPosts().slice(0, 15);

  if (!posts.length) {
    return {
      text: "Belum ada data TikTok tersimpan untuk dianalisis. Jalankan scripts/scrapeTikTok.js terlebih dahulu.",
      postCount: 0,
      generatedAt: new Date().toISOString(),
    };
  }

  const systemPrompt =
    "Anda adalah analis isu lingkungan dan air bersih untuk kawasan Jatinangor. " +
    "Anda akan diberikan judul/deskripsi video TikTok publik yang mungkin relevan. " +
    "Jawab singkat, dalam Bahasa Indonesia: ringkasan tema/isu yang muncul, lalu apakah ada sinyal yang perlu " +
    "ditindaklanjuti oleh pengelola air kampus. Jika kontennya tidak relevan dengan air/lingkungan, katakan itu " +
    "secara jujur, jangan dipaksakan.";

  const userPrompt = [
    "Daftar video TikTok terbaru yang berhasil di-scrape (judul/deskripsi):",
    ...posts.map((post, index) => `${index + 1}. "${post.title || post.description || "(tanpa judul)"}"`),
    "Analisis tema/isu apa yang muncul dari daftar ini, dan apakah relevan dengan pemantauan air/lingkungan Jatinangor.",
  ].join("\n");

  const text = await callLlm(systemPrompt, userPrompt);
  return { text, postCount: posts.length, generatedAt: new Date().toISOString() };
}

async function generateInsights() {
  const [leakage, tiktok] = await Promise.all([
    generateLeakageInsight().catch((err) => ({ text: null, error: err.message, generatedAt: new Date().toISOString() })),
    generateTikTokInsight().catch((err) => ({ text: null, error: err.message, generatedAt: new Date().toISOString() })),
  ]);

  const result = { generatedAt: new Date().toISOString(), leakage, tiktok };
  fs.mkdirSync(path.dirname(INSIGHTS_FILE), { recursive: true });
  fs.writeFileSync(INSIGHTS_FILE, JSON.stringify(result, null, 2), "utf-8");
  return result;
}

function loadCachedInsights() {
  try {
    const raw = fs.readFileSync(INSIGHTS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

module.exports = {
  getInsightsFilePath: () => INSIGHTS_FILE,
  generateInsights,
  loadCachedInsights,
};
