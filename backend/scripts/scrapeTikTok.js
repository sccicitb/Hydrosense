"use strict";
// Manual, one-at-a-time TikTok scraper.
//
// Usage:
//   node scripts/scrapeTikTok.js "jatinangor air bersih"
//
// TikTok actively blocks anonymous automated requests for real content
// (confirmed: the page loads, but its own content-serving API calls return
// empty/error responses without a logged-in session). This script uses a
// stealth-patched browser and human-like pacing to reduce the chance of
// being flagged as a bot, but does not attempt to bypass the login wall
// itself — it reports honestly when a run finds nothing, rather than
// pretending to succeed. Running from a residential/home network instead
// of a datacenter IP matters more than anything in this file.

const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const DataController = require("../Controllers/DataController");

puppeteer.use(StealthPlugin());

const DEFAULT_QUERY = "jatinangor air bersih kualitas air pencemaran";
const DATA_FILE = DataController.getTikTokPostsFilePath();
const MAX_STORED_POSTS = 50;
const USER_AGENT = DataController.getTikTokHeaders()["User-Agent"];

function loadExistingPosts() {
  try {
    const raw = fs.readFileSync(DATA_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

function savePosts(items) {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify({ updatedAt: new Date().toISOString(), items }, null, 2),
    "utf-8"
  );
}

function randomDelay(minMs, maxMs) {
  const duration = minMs + Math.random() * (maxMs - minMs);
  return new Promise((resolve) => setTimeout(resolve, duration));
}

async function randomMouseWander(page) {
  const moves = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < moves; i += 1) {
    const x = 100 + Math.random() * 1000;
    const y = 100 + Math.random() * 700;
    await page.mouse.move(x, y, { steps: 10 + Math.floor(Math.random() * 15) });
    await randomDelay(150, 500);
  }
}

function mergePosts(existing, incoming) {
  const known = new Set(existing.map((item) => item.sourceUrl || item.id));
  const fresh = incoming.filter((item) => {
    const key = item.sourceUrl || item.id;
    if (!key || known.has(key)) return false;
    known.add(key);
    return true;
  });

  return {
    merged: [...fresh, ...existing].slice(0, MAX_STORED_POSTS),
    newCount: fresh.length,
  };
}

async function scrapeQuery(query) {
  // --no-sandbox is required on most Linux servers/containers: Chromium's
  // sandbox needs user-namespace features that typically aren't enabled
  // there. Safe in this context since the browser only ever navigates to
  // TikTok's own pages under this fixed script, not arbitrary content.
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const capturedResponses = [];

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 900 });

    page.on("response", async (res) => {
      const url = res.url();
      if (!/\/api\/(search|challenge|recommend)\//.test(url)) return;
      try {
        const json = await res.json();
        capturedResponses.push(json);
      } catch {
        // Non-JSON or empty response body — ignore.
      }
    });

    // Land on the homepage first and browse a little, like a real visitor,
    // instead of hitting the search URL as the very first request.
    await page.goto("https://www.tiktok.com/", {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });
    await randomDelay(1500, 3000);
    await randomMouseWander(page);
    await randomDelay(800, 2000);

    await page.goto(`https://www.tiktok.com/search?q=${encodeURIComponent(query)}`, {
      waitUntil: "domcontentloaded",
      timeout: 25000,
    });
    await randomDelay(3000, 5000);
    await randomMouseWander(page);
    await page.evaluate(() => window.scrollBy(0, 800 + Math.random() * 700));
    await randomDelay(1500, 3000);
    await page.evaluate(() => window.scrollBy(0, 800 + Math.random() * 700));
    await randomDelay(2000, 3500);

    const domHtml = await page.content();

    return { capturedResponses, domHtml };
  } finally {
    await browser.close();
  }
}

function extractVideosFromResponses(responses) {
  const candidates = [];
  const seen = new WeakSet();
  responses.forEach((response) => {
    DataController.collectTikTokVideoCandidates(response, candidates, seen);
  });
  return DataController.normalizeTikTokItems(candidates);
}

function extractVideosFromHtml(html) {
  const state = DataController.extractTikTokState(html);
  if (!state) return [];
  const candidates = DataController.collectTikTokVideoCandidates(state);
  return DataController.normalizeTikTokItems(candidates);
}

function toStoredPost(video, query) {
  const issue = DataController.inferTikTokIssue(video.desc || "");

  return {
    id: `tiktok-${video.id}`,
    title: video.desc ? video.desc.slice(0, 88) : `Video TikTok @${video.author}`,
    description:
      video.desc ||
      "Unggahan TikTok terkait isu air, drainase, atau lingkungan di sekitar Jatinangor.",
    source: `@${video.authorName || video.author}`,
    sourceUrl: video.tiktokUrl,
    author: video.author,
    authorName: video.authorName,
    cover: video.cover,
    videoUrl: video.videoUrl || null,
    stats: video.stats,
    publishedAt: video.createTime ? new Date(video.createTime).toISOString() : null,
    scrapedAt: new Date().toISOString(),
    query,
    ...issue,
  };
}

async function main() {
  const query = process.argv[2] || DEFAULT_QUERY;
  console.log(`Scraping TikTok for query: "${query}"...`);

  let capturedResponses;
  let domHtml;

  try {
    ({ capturedResponses, domHtml } = await scrapeQuery(query));
  } catch (err) {
    console.error(`Scrape failed: ${err.message}`);
    process.exitCode = 1;
    return;
  }

  const fromApi = extractVideosFromResponses(capturedResponses);
  const videos = fromApi.length ? fromApi : extractVideosFromHtml(domHtml);

  if (!videos.length) {
    console.log(
      "0 posts found this run — TikTok likely blocked this request (expected sometimes for anonymous requests). Nothing was written."
    );
    return;
  }

  const posts = videos.map((video) => toStoredPost(video, query));
  const existing = loadExistingPosts();
  const { merged, newCount } = mergePosts(existing, posts);
  savePosts(merged);

  if (newCount === 0) {
    console.log(
      `Scraped ${posts.length} post(s), but all were already in the store. ${merged.length} total stored in ${DATA_FILE}.`
    );
  } else {
    console.log(
      `${newCount} new post(s) added (${posts.length} scraped this run). ${merged.length} total stored in ${DATA_FILE}.`
    );
  }
}

main();
