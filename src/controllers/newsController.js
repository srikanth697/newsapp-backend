import News from "../models/News.js";
import newsService from "../services/newsService.js";

const newsController = {
  // 📱 Mobile App: Get categorized news by tab
  async getNewsByTab(req, res) {
    try {
      const { tab, page = 1 } = req.query;
      const limit = 10;
      const skip = (page - 1) * limit;

      let filter = {};

      if (tab === "previous") {
        filter.isToday = false;
      } else {
        switch (tab) {
          case "politics":
          case "business":
          case "technology":
          case "sports":
          case "entertainment":
            filter.category = tab;
            filter.isToday = true;
            break;
          case "india":
            filter.country = "india";
            filter.isToday = true;
            break;
          case "world":
            filter.country = "world";
            filter.isToday = true;
            break;
          case "current-affairs":
            filter.category = "current-affairs";
            filter.isToday = true;
            break;
          default:
            filter.isToday = true;
        }
      }

      const news = await News.find(filter)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit);

      res.json({
        success: true,
        count: news.length,
        tab: tab || 'all',
        news: news
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // 📝 Get single article detail
  async getNewsDetail(req, res) {
    try {
      const { id } = req.params;
      const news = await News.findById(id);
      if (!news) {
        return res.status(404).json({ success: false, message: "Article not found" });
      }

      // Update views
      news.views = (news.views || 0) + 1;
      await news.save();

      res.json({ success: true, news });
    } catch (err) {
      res.status(400).json({ success: false, message: "Invalid ID format or Error: " + err.message });
    }
  },

  // 🔄 Trigger background fetch
  async manualFetch(req, res) {
    newsService.runPipeline(); // Background
    res.json({ success: true, message: "Manual fetch initiated in background." });
  },

  // 🧹 Debug: Clear all news
  async debugClearNews(req, res) {
    try {
      const result = await News.deleteMany({});
      res.json({ success: true, message: `Cleared ${result.deletedCount} articles.` });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 🧪 Legacy search (deprecated but kept for fallback)
  async fetchAndSaveNews(req, res) {
    try {
      const { query } = req.query;
      if (!query) return res.status(400).json({ success: false, error: "Missing query" });
      const newsList = await newsService.runPipeline(); // Ignores query, uses pipeline
      res.json({ success: true, data: newsList });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

export default newsController;
