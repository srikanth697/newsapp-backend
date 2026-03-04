import newsService from "../services/newsService.js";

const newsController = {
  async fetchAndSaveNews(req, res) {
    try {
      const { query } = req.query;
      if (!query) return res.status(400).json({ success: false, error: "Missing query" });
      const newsList = await newsService.aggregateNews(query);
      res.json({ success: true, data: newsList });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getNewsDetail(req, res) {
    try {
      const { id } = req.params;
      const news = await newsService.getNewsById(id);
      if (!news || !news.fullContent) {
        return res.status(404).json({ success: false, error: "Article not found or missing content" });
      }
      res.json({
        success: true,
        data: {
          title: news.title,
          image: news.image,
          source: news.source,
          publishedAt: news.publishedAt,
          fullContent: news.fullContent
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

export default newsController;
