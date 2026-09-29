const axios = require('axios');
const crypto = require('crypto');
const {
  PanelA,
  PanelB,
  PanelC,
  PanelD,
  PanelE,
} = require('../models');
const { Op } = require('sequelize');
const moment = require('moment');
const { Parser } = require('json2csv');

class DataController {
  static async getPanelData(req, res, panelModel) {
    const { filter, start, end, download } = req.query;
    let where = {};

    try {
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);

        if (isNaN(startDate) || isNaN(endDate)) {
          return res.status(400).json({
            error: 'Format tanggal start atau end tidak valid',
          });
        }

        if (startDate > endDate) {
          return res.status(400).json({
            error: 'Tanggal start tidak boleh lebih besar dari end',
          });
        }

        where.createdAt = {
          [Op.gte]: startDate,
          [Op.lte]: endDate,
        };
      } else if (filter === 'daily') {
        where.createdAt = {
          [Op.gte]: moment().startOf('day').toDate(),
          [Op.lte]: moment().endOf('day').toDate(),
        };
      } else if (filter === 'weekly') {
        where.createdAt = {
          [Op.gte]: moment().startOf('isoWeek').toDate(),
          [Op.lte]: moment().endOf('isoWeek').toDate(),
        };
      } else if (filter === 'monthly') {
        where.createdAt = {
          [Op.gte]: moment().startOf('month').toDate(),
          [Op.lte]: moment().endOf('month').toDate(),
        };
      }

      const data = await panelModel.findAll({ where });

      if (download === 'csv') {
        if (!data.length) {
          return res.status(404).json({
            error: 'Data tidak ditemukan',
          });
        }

        const parser = new Parser();
        const csv = parser.parse(data.map((item) => item.toJSON()));

        res.header('Content-Type', 'text/csv');
        res.header(
          'Content-Disposition',
          'attachment; filename=data-panel.csv'
        );
        return res.send(csv);
      }

      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({
        error: err.message,
      });
    }
  }

  static async getLatestPanelData(req, res, panelModel) {
    try {
      const data = await panelModel.findOne({
        order: [['createdAt', 'DESC']],
      });
      res.status(200).json(data);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

  static async getPanelA(req, res) {
    return DataController.getPanelData(req, res, PanelA);
  }

  static async getPanelB(req, res) {
    return DataController.getPanelData(req, res, PanelB);
  }

  static async getPanelC(req, res) {
    return DataController.getPanelData(req, res, PanelC);
  }

  static async getPanelD(req, res) {
    return DataController.getPanelData(req, res, PanelD);
  }

  static async getPanelE(req, res) {
    return DataController.getPanelData(req, res, PanelE);
  }

  static async getLatestPanelA(req, res) {
    return DataController.getLatestPanelData(req, res, PanelA);
  }

  static async getLatestPanelB(req, res) {
    return DataController.getLatestPanelData(req, res, PanelB);
  }

  static async getLatestPanelC(req, res) {
    return DataController.getLatestPanelData(req, res, PanelC);
  }

  static async getLatestPanelD(req, res) {
    return DataController.getLatestPanelData(req, res, PanelD);
  }

  static extractTikTokState(html) {
    const regexes = [
      /window\['SIGI_STATE'\]\s*=\s*({[\s\S]*?})\s*;\s*window\['SIGI_RETRY'\]/,
      /window\["SIGI_STATE"\]\s*=\s*({[\s\S]*?})\s*;\s*window\["SIGI_RETRY"\]/,
      /<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__" type="application\/json">([\s\S]*?)<\/script>/,
    ];

    for (const regex of regexes) {
      const match = html.match(regex);
      if (match && match[1]) {
        try {
          return JSON.parse(match[1]);
        } catch {
          return null;
        }
      }
    }

    return null;
  }

  static getTikTokHeaders(referer = "https://www.tiktok.com/") {
    return {
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: referer,
    };
  }

  static createStableId(value = "") {
    return crypto
      .createHash("sha1")
      .update(String(value || ""))
      .digest("hex")
      .slice(0, 18);
  }

  static getNestedValue(source, paths = []) {
    for (const path of paths) {
      const value = path.split(".").reduce((current, key) => {
        if (current == null) return undefined;
        return current[key];
      }, source);

      if (value !== undefined && value !== null && value !== "") {
        return value;
      }
    }

    return undefined;
  }

  static collectTikTokVideoCandidates(source, candidates = [], seen = new WeakSet()) {
    if (!source || typeof source !== "object") return candidates;
    if (seen.has(source)) return candidates;
    seen.add(source);

    const id = source.id || source.aweme_id || source.awemeId || source.itemId;
    const description = source.desc || source.description || source.title;
    const hasVideoShape =
      source.video ||
      source.stats ||
      source.statsV2 ||
      source.statistics ||
      source.author ||
      source.authorMeta ||
      source.authorInfo;

    if (id && description && hasVideoShape) {
      candidates.push(source);
    }

    if (Array.isArray(source)) {
      source.forEach((item) => DataController.collectTikTokVideoCandidates(item, candidates, seen));
      return candidates;
    }

    Object.values(source).forEach((value) => {
      if (value && typeof value === "object") {
        DataController.collectTikTokVideoCandidates(value, candidates, seen);
      }
    });

    return candidates;
  }

  static normalizeTikTokItems(itemModule = {}) {
    const rawItems = Array.isArray(itemModule)
      ? itemModule
      : Object.values(itemModule || {});
    const seenIds = new Set();

    return rawItems
      .filter((item) => item && (item.id || item.aweme_id || item.awemeId || item.itemId))
      .map((item) => {
        const id = String(item.id || item.aweme_id || item.awemeId || item.itemId);
        if (seenIds.has(id)) return null;
        seenIds.add(id);

        const author =
          DataController.getNestedValue(item, [
            "author.uniqueId",
            "author.unique_id",
            "authorMeta.name",
            "authorInfo.uniqueId",
            "author",
          ]) || "unknown";
        const authorName =
          DataController.getNestedValue(item, [
            "author.nickname",
            "authorMeta.nickname",
            "authorInfo.nickname",
          ]) || author;
        const stats = item.stats || item.statsV2 || item.statistics || {};
        const cover =
          DataController.getNestedValue(item, [
            "video.cover",
            "video.cover.urlList.0",
            "video.dynamicCover",
            "video.originCover",
            "cover",
          ]) || null;
        const createTime = item.createTime || item.create_time || item.createTimeMs;
        const desc = item.desc || item.description || item.title || "";

        return {
          id,
          desc,
          author,
          authorName,
          cover,
          tiktokUrl:
            item.tiktokUrl ||
            item.url ||
            `https://www.tiktok.com/@${author}/video/${id}`,
          stats: {
            playCount: Number(stats.playCount || stats.play_count || 0),
            likeCount: Number(stats.diggCount || stats.likeCount || stats.digg_count || 0),
            commentCount: Number(stats.commentCount || stats.comment_count || 0),
            shareCount: Number(stats.shareCount || stats.share_count || 0),
          },
          createTime: createTime
            ? new Date(Number(createTime) > 1000000000000 ? Number(createTime) : Number(createTime) * 1000)
            : null,
        };
      })
      .filter(Boolean)
      .slice(0, 15);
  }

  static async fetchTikTokVideos(query = "jatinangor air", count = 12) {
    const encodedQuery = encodeURIComponent(query);
    const urls = [
      `https://www.tiktok.com/api/search/general/full/?keyword=${encodedQuery}&offset=0&count=${count}&aid=1988&app_name=tiktok_web&device_platform=web_pc&region=ID&tz_name=Asia%2FJakarta`,
      `https://www.tiktok.com/search?q=${encodedQuery}`,
      `https://www.tiktok.com/tag/jatinangor?lang=id`,
    ];

    let finalUrl = null;
    let videos = [];
    let warning = null;

    for (const url of urls) {
      try {
        const response = await axios.get(url, {
          timeout: 15000,
          headers: {
            ...DataController.getTikTokHeaders("https://www.tiktok.com/search"),
            Accept: url.includes("/api/")
              ? "application/json, text/plain, */*"
              : DataController.getTikTokHeaders().Accept,
          },
          validateStatus: (status) => status >= 200 && status < 500,
        });

        if (!response.data) {
          finalUrl = url;
          continue;
        }

        const parsed =
          typeof response.data === "string"
            ? DataController.extractTikTokState(response.data)
            : response.data;
        const candidates = DataController.collectTikTokVideoCandidates(parsed);
        videos = DataController.normalizeTikTokItems(candidates);
        finalUrl = url;

        if (videos.length > 0) break;
      } catch (err) {
        warning = err.message;
      }
    }

    if (!videos.length) {
      const tikwmResult = await DataController.fetchTikwmVideos(query, count);
      if (tikwmResult.videos.length) {
        return tikwmResult;
      }
    }

    return {
      source: finalUrl,
      videos,
      warning: videos.length
        ? warning
        : warning || "TikTok tidak mengembalikan data video publik untuk request ini.",
    };
  }

  static normalizeTikwmVideos(payload = {}) {
    const rawVideos = Array.isArray(payload.data?.videos)
      ? payload.data.videos
      : Array.isArray(payload.data?.items)
        ? payload.data.items
        : Array.isArray(payload.videos)
          ? payload.videos
          : payload.data && typeof payload.data === "object" && (payload.data.id || payload.data.video_id)
            ? [payload.data]
            : [];

    return rawVideos
      .filter((video) => video && (video.video_id || video.id || video.aweme_id))
      .map((video) => {
        const id = String(video.video_id || video.id || video.aweme_id);
        const author = video.author || {};
        const authorId =
          author.unique_id ||
          author.uniqueId ||
          author.nickname ||
          author.id ||
          "unknown";
        const authorName = author.nickname || author.unique_id || authorId;

        return {
          id,
          desc: video.title || video.desc || "",
          author: authorId,
          authorName,
          cover: video.cover || video.origin_cover || video.dynamic_cover || null,
          videoUrl: video.play || video.wmplay || video.hdplay || null,
          musicUrl: video.music || null,
          tiktokUrl:
            video.tiktok_url ||
            video.url ||
            `https://www.tiktok.com/@${authorId}/video/${id}`,
          stats: {
            playCount: Number(video.play_count || 0),
            likeCount: Number(video.digg_count || 0),
            commentCount: Number(video.comment_count || 0),
            shareCount: Number(video.share_count || 0),
          },
          createTime: video.create_time
            ? new Date(Number(video.create_time) * 1000)
            : null,
          provider: "TikWM",
          detailSource: video.detailSource || null,
          scrapeSource: video.scrapeSource || null,
        };
      })
      .slice(0, 15);
  }

  static async fetchTikwmVideos(query = "jatinangor air", count = 12) {
    const url = `https://www.tikwm.com/api/feed/search?keywords=${encodeURIComponent(
      query
    )}&count=${count}&cursor=0`;

    try {
      const response = await axios.get(url, {
        timeout: 20000,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const videos = DataController.normalizeTikwmVideos(response.data || {});

      return {
        source: url,
        sourceProvider: "TikWM",
        videos,
        warning: videos.length
          ? null
          : "TikWM tidak mengembalikan video TikTok untuk query ini.",
      };
    } catch (err) {
      return {
        source: url,
        sourceProvider: "TikWM",
        videos: [],
        warning: err.message || "Gagal mengambil video TikTok via TikWM.",
      };
    }
  }

  static async fetchTikwmVideoDetail(videoUrl) {
    if (!videoUrl) {
      return {
        video: null,
        warning: "URL video TikTok kosong.",
      };
    }

    const url = `https://www.tikwm.com/api/?url=${encodeURIComponent(videoUrl)}`;

    try {
      const response = await axios.get(url, {
        timeout: 20000,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const videos = DataController.normalizeTikwmVideos({
        data: {
          ...(response.data?.data || {}),
          detailSource: "video-detail",
          scrapeSource: url,
        },
      });

      return {
        video: videos[0] || null,
        source: url,
        warning: videos.length ? null : "Detail video TikTok tidak tersedia.",
      };
    } catch (err) {
      return {
        video: null,
        source: url,
        warning: err.message || "Gagal mengambil detail video TikTok.",
      };
    }
  }

  static async fetchTikTokDetailVideosFromQuery(query = "jatinangor air", count = 8) {
    const result = await DataController.fetchTikTokVideos(query, count);
    const detailVideos = await Promise.all(
      result.videos.slice(0, count).map(async (video) => {
        const detailResult = await DataController.fetchTikwmVideoDetail(video.tiktokUrl);
        if (!detailResult.video) return null;

        return {
          ...detailResult.video,
          tiktokUrl: detailResult.video.tiktokUrl || video.tiktokUrl,
          detailSource: detailResult.video.detailSource || "video-detail",
          scrapeSource: detailResult.source || null,
          detailWarning: detailResult.warning,
        };
      })
    );

    return {
      ...result,
      query,
      videos: detailVideos.filter(Boolean),
    };
  }

  static async getTikTokSearch(req, res) {
    const query = String(req.query.q || "jatinangor air").trim();

    try {
      const queryCandidates = Array.from(
        new Set([query, "jatinangor air bersih", "jatinangor"])
      );
      let result = null;

      for (const candidate of queryCandidates) {
        result = await DataController.fetchTikTokDetailVideosFromQuery(candidate, 15);
        if (result.videos.length) break;
      }

      return res.status(200).json({
        query,
        ...result,
        effectiveQuery: result?.query || query,
        videos: result?.videos || [],
        warning: result?.videos?.length
          ? result.warning
          : "Detail video TikTok belum tersedia. Endpoint tidak menampilkan object hasil search sebagai data.",
      });
    } catch (err) {
      return res.status(200).json({
        query,
        source: null,
        videos: [],
        warning: err.message || "TikTok tidak dapat diakses saat ini.",
      });
    }
  }

  static normalizeTikTokComments(payload = {}) {
    const rawComments =
      payload.comments ||
      payload.comment_list ||
      payload.data?.comments ||
      payload.data?.comment_list ||
      [];

    return rawComments
      .filter(Boolean)
      .map((comment) => ({
        id: String(comment.cid || comment.id || DataController.createStableId(comment.text || comment.comment_text)),
        text: comment.text || comment.comment_text || "",
        author:
          comment.user?.nickname ||
          comment.user?.unique_id ||
          comment.user?.uniqueId ||
          "Pengguna TikTok",
        likeCount: Number(comment.digg_count || comment.like_count || 0),
        createTime: comment.create_time
          ? new Date(Number(comment.create_time) * 1000).toISOString()
          : null,
      }))
      .filter((comment) => comment.text)
      .slice(0, 5);
  }

  static async fetchTikwmComments(videoId, videoUrl = null) {
    if (!videoId && !videoUrl) {
      return { comments: [], warning: "Video TikTok kosong." };
    }

    const sourceVideoUrl =
      videoUrl || `https://www.tiktok.com/@tiktok/video/${encodeURIComponent(videoId)}`;
    const url = `https://www.tikwm.com/api/comment/list?url=${encodeURIComponent(
      sourceVideoUrl
    )}&count=5&cursor=0`;

    try {
      const response = await axios.get(url, {
        timeout: 15000,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const comments = DataController.normalizeTikTokComments(response.data || {});
      return {
        source: url,
        comments,
        warning: comments.length
          ? null
          : "Komentar TikTok belum tersedia untuk video ini.",
      };
    } catch (err) {
      return {
        source: url,
        comments: [],
        warning: err.message || "Gagal mengambil komentar TikTok via TikWM.",
      };
    }
  }

  static async fetchTikTokComments(videoId, videoUrl = null) {
    const tikwmComments = await DataController.fetchTikwmComments(videoId, videoUrl);
    if (tikwmComments.comments.length) return tikwmComments;

    if (!videoId) return { comments: [], warning: "Video ID kosong." };

    const url = `https://www.tiktok.com/api/comment/list/?aweme_id=${encodeURIComponent(
      videoId
    )}&count=10&cursor=0&aid=1988&app_name=tiktok_web&device_platform=web_pc&region=ID&tz_name=Asia%2FJakarta`;

    try {
      const response = await axios.get(url, {
        timeout: 12000,
        headers: {
          ...DataController.getTikTokHeaders(`https://www.tiktok.com/`),
          Accept: "application/json, text/plain, */*",
        },
        validateStatus: (status) => status >= 200 && status < 500,
      });

      const comments = DataController.normalizeTikTokComments(response.data || {});
      return {
        source: url,
        comments,
        warning: comments.length
          ? null
          : tikwmComments.warning || "Komentar TikTok tidak tersedia atau dibatasi oleh TikTok.",
      };
    } catch (err) {
      return {
        source: url,
        comments: [],
        warning: err.message || "Gagal mengambil komentar TikTok.",
      };
    }
  }

  static inferTikTokIssue(text = "") {
    return DataController.inferNewsIssue(text);
  }

  static async getTikTokPoints(req, res) {
    const query = String(req.query.q || "jatinangor air kualitas air").trim();

    try {
      const queryCandidates = Array.from(
        new Set([query, "jatinangor air", "jatinangor"])
      );
      let result = null;

      for (const candidate of queryCandidates) {
        result = await DataController.fetchTikTokDetailVideosFromQuery(candidate, 8);
        if (result.videos.length) break;
      }

      const videosWithComments = await Promise.all(
        (result?.videos || []).map(async (video) => {
          const commentResult = await DataController.fetchTikTokComments(
            video.id,
            video.tiktokUrl
          );
          const issue = DataController.inferTikTokIssue(video.desc);

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
            videoUrl: video.videoUrl,
            musicUrl: video.musicUrl,
            stats: video.stats,
            comments: commentResult.comments,
            commentWarning: commentResult.warning,
            detailSource: video.detailSource,
            scrapeSource: video.scrapeSource,
            detailWarning: video.detailWarning,
            publishedAt: video.createTime ? video.createTime.toISOString() : null,
            ...issue,
          };
        })
      );

      const items = videosWithComments;

      return res.status(200).json({
        query,
        source: result?.source || null,
        effectiveQuery: result?.query || query,
        items,
        warning: items.length
          ? result?.warning || null
          : "Detail video TikTok belum tersedia. Endpoint tidak menampilkan hasil search sebagai data.",
      });
    } catch (err) {
      return res.status(200).json({
        query,
        source: null,
        items: [],
        warning: err.message || "Gagal mengambil data TikTok.",
      });
    }
  }

  static decodeHtmlEntities(value = "") {
    return String(value)
      .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
      .replace(/&#x([a-fA-F0-9]+);/g, (_, code) =>
        String.fromCharCode(parseInt(code, 16))
      )
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&nbsp;/g, " ")
      .replace(/&#39;/g, "'");
  }

  static stripHtml(value = "") {
    return DataController.decodeHtmlEntities(value)
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  static extractXmlTag(block, tagName) {
    const match = String(block).match(
      new RegExp(`<${tagName}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tagName}>`, "i")
    );

    return match ? DataController.decodeHtmlEntities(match[1]).trim() : "";
  }

  static extractXmlAttribute(block, tagName, attributeName) {
    const match = String(block).match(
      new RegExp(`<${tagName}[^>]*\\s${attributeName}=["']([^"']+)["'][^>]*>`, "i")
    );

    return match ? DataController.decodeHtmlEntities(match[1]).trim() : "";
  }

  static inferNewsIssue(text = "") {
    const normalized = text.toLowerCase();

    if (/(solar|bbm|minyak|limbah|tercemar|pencemaran|kontaminasi)/.test(normalized)) {
      return { issue: "Pencemaran Air", severity: "critical" };
    }

    if (/(banjir|genangan|drainase|selokan|sampah)/.test(normalized)) {
      return { issue: "Drainase dan Genangan", severity: "warning" };
    }

    if (/(kekeringan|krisis air|air bersih|pdam|sumur|debit|mati air)/.test(normalized)) {
      return { issue: "Ketersediaan Air", severity: "warning" };
    }

    if (/(keruh|bau|e\.coli|bakteri|ph|tds|kualitas air)/.test(normalized)) {
      return { issue: "Kualitas Air", severity: "warning" };
    }

    return { issue: "Berita Lingkungan", severity: "info" };
  }

  static normalizeNewsItems(xml = "") {
    const itemBlocks = String(xml).match(/<item>[\s\S]*?<\/item>/gi) || [];

    return itemBlocks
      .map((block) => {
        const rawTitle = DataController.extractXmlTag(block, "title");
        const link = DataController.extractXmlTag(block, "link");
        const pubDate = DataController.extractXmlTag(block, "pubDate");
        const source =
          DataController.extractXmlTag(block, "source") ||
          DataController.extractXmlAttribute(block, "source", "url") ||
          "Google News";
        const description = DataController.stripHtml(
          DataController.extractXmlTag(block, "description")
        );
        const parts = rawTitle.split(" - ");
        const publisherFromTitle = parts.length > 1 ? parts.pop() : source;
        const title = parts.join(" - ") || rawTitle;
        const inferred = DataController.inferNewsIssue(`${title} ${description}`);

        return {
          id: crypto
            .createHash("sha1")
            .update(link || title)
            .digest("hex")
            .slice(0, 18),
          title,
          description:
            description ||
            "Berita terbaru terkait isu air, lingkungan, atau layanan publik di sekitar Jatinangor.",
          source: publisherFromTitle || source || "Google News",
          sourceUrl: link,
          publishedAt: pubDate ? new Date(pubDate).toISOString() : null,
          ...inferred,
        };
      })
      .filter((item) => item.title && item.sourceUrl)
      .slice(0, 12);
  }

  static async getNewsSearch(req, res) {
    const query = String(
      req.query.q || "jatinangor air bersih kualitas air pencemaran"
    ).trim();
    const encodedQuery = encodeURIComponent(query);
    const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=id&gl=ID&ceid=ID:id`;

    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          Accept: "application/rss+xml, application/xml, text/xml",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        },
      });

      return res.status(200).json({
        query,
        source: url,
        items: DataController.normalizeNewsItems(response.data),
      });
    } catch (err) {
      return res.status(200).json({
        query,
        source: url,
        items: [],
        warning: "Gagal mengambil berita terbaru. Data lama tetap digunakan.",
      });
    }
  }

  static async getLatestPanelE(req, res) {
    return DataController.getLatestPanelData(req, res, PanelE);
  }
}

module.exports = DataController;
