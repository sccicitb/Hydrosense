"use strict";
// Shared logic for generating AI analysis of (1) real leakage-segment data
// and (2) recently-scraped TikTok posts, using the self-hosted llama.cpp
// server. Used by both scripts/generateInsights.js (manual CLI run) and the
// on-demand "Generate" button's API endpoint - the LLM-calling logic lives
// here once, not duplicated in both places.

const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { getWeeklyLeakageStats } = require("./leakageStats");

const LLM_BASE_URL = process.env.LLM_BASE_URL || "https://llama.sccic.org";
const LLM_MODEL = process.env.LLM_MODEL || "unsloth/Qwen3.8-27B-GGUF:UD-Q4_K_XL";
const INSIGHTS_FILE = path.join(__dirname, "..", "data", "ai-insights.json");
const TIKTOK_FILE = path.join(__dirname, "..", "data", "tiktok-posts.json");

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
  // Weekly, time-integrated totals - not a single instantaneous reading -
  // so the narrative reflects what actually happened over the past week
  // even when the sensors happen to read zero right now (e.g. pumps idle
  // at the moment this runs). See helper/leakageStats.js for the math.
  const weekly = await getWeeklyLeakageStats(7);
  const { segments, totalLossLiters, totalCost } = weekly;

  const systemPrompt =
    "Anda adalah analis operasional untuk sistem monitoring air kampus di Jatinangor. " +
    "Anda akan diberikan rekap MINGGUAN (7 hari terakhir), bukan pembacaan sesaat. " +
    "Jawab singkat, dalam Bahasa Indonesia, dengan struktur: ringkasan kondisi selama seminggu terakhir, " +
    "lalu rekomendasi tindakan (poin-poin). Jangan mengulang angka mentah secara berlebihan, fokus pada " +
    "interpretasi dan tindakan nyata. Jika data tidak cukup (misal sensor sempat mati), katakan itu secara jujur. " +
    "Jika ada baris berlabel [CATATAN KUALITAS DATA: ...], JANGAN simpulkan itu sebagai kebocoran nyata - " +
    "jelaskan sebagai kemungkinan celah data/sensor, bukan kebocoran fisik.";

  const userPrompt = [
    `Rekap kebocoran air 7 hari terakhir (dihitung dari total volume riil tiap sensor selama seminggu, ` +
      `bukan satu titik waktu):`,
    ...segments.map(
      (s) =>
        `- ${s.label}: total masuk ${s.upstreamTotalLiters.toFixed(0)} L, total keluar ${s.downstreamTotalLiters.toFixed(0)} L, ` +
        `selisih ${s.lossLiters.toFixed(0)} L (${s.lossPercent.toFixed(1)}% kehilangan), ` +
        `estimasi kerugian Rp ${Math.round(s.estimatedCost).toLocaleString("id-ID")} minggu ini` +
        (s.note ? ` [CATATAN KUALITAS DATA: ${s.note}]` : "")
    ),
    `Total estimasi kehilangan minggu ini: ${totalLossLiters.toFixed(0)} L, Rp ${Math.round(totalCost).toLocaleString("id-ID")}.`,
    "Berikan analisis kondisi kebocoran selama seminggu terakhir dan rekomendasi tindakan yang perlu diambil operator.",
  ].join("\n");

  const text = await callLlm(systemPrompt, userPrompt);
  return { text, weekly, generatedAt: new Date().toISOString() };
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
    "Anda akan diberikan judul/deskripsi video TikTok publik, sebagian mungkin tidak relevan (konten hiburan, " +
    "iklan, atau topik lain yang tidak terkait air/lingkungan/Jatinangor). " +
    "Saring dahulu secara internal: abaikan sepenuhnya postingan yang tidak relevan - JANGAN menyebutkan, " +
    "meringkas, atau mengomentari isi postingan yang tidak relevan sama sekali, cukup tidak usah dibahas. " +
    "Jawab singkat, dalam Bahasa Indonesia, HANYA berdasarkan postingan yang benar-benar relevan dengan air/" +
    "lingkungan/Jatinangor: ringkasan tema/isu yang muncul, lalu apakah ada sinyal yang perlu ditindaklanjuti " +
    "oleh pengelola air kampus. Jika TIDAK ADA satu pun postingan yang relevan, katakan itu secara jujur dalam " +
    "satu kalimat singkat dan berhenti di situ - jangan membahas postingan yang tidak relevan sebagai gantinya.";

  const userPrompt = [
    "Daftar video TikTok terbaru yang berhasil di-scrape (judul/deskripsi):",
    ...posts.map((post, index) => `${index + 1}. "${post.title || post.description || "(tanpa judul)"}"`),
    "Analisis tema/isu apa yang muncul dari daftar ini, dan apakah relevan dengan pemantauan air/lingkungan Jatinangor. " +
      "Ingat: hanya bahas postingan yang relevan, abaikan sisanya tanpa menyebutkannya.",
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
