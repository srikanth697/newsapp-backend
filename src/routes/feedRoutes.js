import express from "express";
import FeedNews from "../models/FeedNews.js";
import { aggregateFeed } from "../services/feedAggregator.js";

const router = express.Router();

/**
 * 📰 GET /api/feed
 * Returns the unified, deduplicated feed
 * Query params:
 *   - limit: number of articles (default: 50)
 *   - category: filter by category
 *   - source: filter by source
 */
router.get("/", async (req, res) => {
    try {
        const { limit = 50, category, source } = req.query;

        // Build query
        const query = {};
        if (category) query.category = category;
        if (source) query.source = source;

        const news = await FeedNews.find(query)
            .sort({ score: -1, publishedAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            count: news.length,
            news,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch feed",
            details: error.message,
        });
    }
});

/**
 * 🔄 POST /api/feed/refresh
 * Manually trigger feed aggregation
 */
router.post("/refresh", async (req, res) => {
    try {
        const result = await aggregateFeed();
        res.json({
            success: true,
            message: "Feed refreshed successfully",
            ...result,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Feed refresh failed",
            details: error.message,
        });
    }
});

/**
 * 📊 GET /api/feed/stats
 * Get feed statistics
 */
router.get("/stats", async (req, res) => {
    try {
        const total = await FeedNews.countDocuments();
        const byCategory = await FeedNews.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);
        const bySource = await FeedNews.aggregate([
            { $group: { _id: "$source", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        res.json({
            success: true,
            total,
            byCategory,
            bySource,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: "Failed to fetch stats",
            details: error.message,
        });
    }
});

export default router;
