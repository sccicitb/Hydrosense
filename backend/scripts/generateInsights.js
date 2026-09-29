"use strict";
// Manual AI analysis generator - run with: npm run generate:insights
// Calls the self-hosted LLM (llama.cpp, see LLM_BASE_URL in .env) to analyze
// (1) the current real leakage-segment data and (2) recently-scraped TikTok
// posts, and caches both results to data/ai-insights.json. Same underlying
// logic (helper/aiInsights.js) also runs behind the "Generate" button on the
// Reports page - this script is the manual/CLI entry point for it.

const { generateInsights, getInsightsFilePath } = require("../helper/aiInsights");

async function main() {
  console.log("Generating AI insights (leakage + TikTok)...");

  const result = await generateInsights();

  if (result.leakage?.error) {
    console.log("\n=== Leakage insight FAILED ===");
    console.log(result.leakage.error);
  } else {
    console.log("\n=== Leakage insight ===");
    console.log(result.leakage?.text || "(kosong)");
  }

  if (result.tiktok?.error) {
    console.log("\n=== TikTok insight FAILED ===");
    console.log(result.tiktok.error);
  } else {
    console.log("\n=== TikTok insight ===");
    console.log(result.tiktok?.text || "(kosong)");
  }

  console.log(`\nSaved to ${getInsightsFilePath()}`);
}

main().catch((err) => {
  console.error("Failed to generate insights:", err.message);
  process.exitCode = 1;
});
