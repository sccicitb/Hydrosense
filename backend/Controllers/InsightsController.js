const { generateInsights, loadCachedInsights } = require("../helper/aiInsights");

class InsightsController {
  static async getInsights(req, res) {
    const cached = loadCachedInsights();

    if (!cached) {
      return res.status(200).json({
        generatedAt: null,
        leakage: null,
        tiktok: null,
        warning: "Belum ada analisis AI tersimpan. Klik \"Generate\" atau jalankan scripts/generateInsights.js.",
      });
    }

    return res.status(200).json(cached);
  }

  static async generateInsights(req, res) {
    try {
      const result = await generateInsights();
      return res.status(200).json(result);
    } catch (err) {
      return res.status(500).json({ error: err.message || "Gagal membuat analisis AI." });
    }
  }
}

module.exports = InsightsController;
