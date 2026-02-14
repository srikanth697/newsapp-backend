import express from "express";
import News from "../models/News.js";
import FeedNews from "../models/FeedNews.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

/**
 * 🔥 UNIFIED FEED ENDPOINT
 * Merges both:
 * 1. Old News model (user posts + old API news)
 * 2. New FeedNews model (RSS + API aggregated news)
 * 
 * This gives your app ALL news in one place!
 */
router.get("/", async (req, res) => {
    try {
        const { category, limit = 50, yesterday, all, lang = "en" } = req.query;

        // Helper to get field based on language
        const getField = (field) => {
            if (!field) return "";
            if (typeof field === "string") return field;
            return field[lang] || field["en"] || Object.values(field)[0] || "";
        };

        // Build query for both models
        const query = {};
        if (category) query.category = category;

        // Date filtering
        let dateFilter = {};
        if (yesterday === "true") {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            dateFilter = { publishedAt: { $gte: d } };
        } else if (req.query.month === "true") {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            dateFilter = { publishedAt: { $gte: d } };
        } else if (all === "today") {
            // Only filter by today if explicitly requested
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            dateFilter = { publishedAt: { $gte: startOfToday } };
        }

        // Fetch from BOTH models in parallel
        const [oldNews, feedNews] = await Promise.all([
            News.find({ ...query, ...dateFilter, status: "approved" })
                .sort({ publishedAt: -1 })
                .limit(parseInt(limit)),
            FeedNews.find({ ...query, ...dateFilter })
                .sort({ publishedAt: -1 })
                .limit(parseInt(limit)),
        ]);

        // Normalize both to same format
        const normalizedOldNews = oldNews.map((item) => ({
            _id: item._id,
            title: getField(item.title),
            description: getField(item.description),
            summary: getField(item.description), // Add summary field
            content: getField(item.content) || getField(item.description), // Fallback if content not set
            image: item.imageUrl || item.image, // Support both new imageUrl and old image
            url: item.sourceUrl,
            sourceUrl: item.sourceUrl,
            source: "NewsAPI", // Old news source
            category: item.category,
            country: item.country,
            publishedAt: item.publishedAt,
            likes: item.likes || 0,
            shares: item.shares || 0,
            savedCount: item.savedCount || 0,
            isUserPost: item.isUserPost || false,
            author: item.author,
            score: 0, // Old news doesn't have smart score yet
        }));

        const normalizedFeedNews = feedNews.map((item) => ({
            _id: item._id,
            title: item.title, // FeedNews might not be multilingual yet, generally assumes one lang
            description: item.summary, // Map summary to description
            summary: item.summary,
            content: item.content,
            image: item.image,
            url: item.url,
            sourceUrl: item.url,
            source: item.source, // RSS source name
            category: item.category,
            country: "GLOBAL", // RSS feeds are global
            publishedAt: item.publishedAt,
            likes: item.likes || 0,
            shares: item.shares || 0,
            savedCount: item.savedCount || 0,
            isUserPost: false,
            author: null,
            score: item.score || 0,
        }));

        // Merge and deduplicate by URL
        const merged = [...normalizedOldNews, ...normalizedFeedNews];

        // Remove duplicates by URL
        const uniqueByUrl = {};
        merged.forEach((article) => {
            const url = article.url || article.sourceUrl;
            if (url && !uniqueByUrl[url]) {
                uniqueByUrl[url] = article;
            } else if (!url) {
                // If no URL, keep it (user posts might not have URLs)
                uniqueByUrl[article._id] = article;
            }
        });

        // Convert back to array and sort by score, then date
        let unified = Object.values(uniqueByUrl);
        unified.sort((a, b) => {
            // Primarily sort by score
            if (b.score !== a.score) {
                return b.score - a.score;
            }
            // Secondarily sort by date
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });

        // Apply limit
        unified = unified.slice(0, parseInt(limit));

        res.json({
            success: true,
            count: unified.length,
            news: unified,
        });
    } catch (error) {
        console.error("Unified feed error:", error);
        res.status(500).json({
            success: false,
            error: "Failed to fetch unified feed",
            details: error.message,
        });
    }
});

/**
 * 🔹 GET STATISTICS
 * Shows stats from both old and new feeds
 */
router.get("/stats", async (req, res) => {
    try {
        const [oldNewsCount, feedNewsCount] = await Promise.all([
            News.countDocuments({ status: "approved" }),
            FeedNews.countDocuments(),
        ]);

        const [oldByCategory, feedByCategory] = await Promise.all([
            News.aggregate([
                { $match: { status: "approved" } },
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            FeedNews.aggregate([
                { $group: { _id: "$category", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        const feedBySource = await FeedNews.aggregate([
            { $group: { _id: "$source", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        res.json({
            success: true,
            total: oldNewsCount + feedNewsCount,
            oldNews: oldNewsCount,
            feedNews: feedNewsCount,
            byCategory: {
                old: oldByCategory,
                feed: feedByCategory,
            },
            bySource: feedBySource,
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
