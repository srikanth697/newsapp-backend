import express from "express";
import News from "../models/News.js";
import FeedNews from "../models/FeedNews.js";
import Category from "../models/Category.js";
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
        const { category, limit, yesterday, all, lang = "en" } = req.query;

        // Helper to get field based on language
        const getField = (field) => {
            if (!field) return "";
            if (typeof field === "string") return field;
            return field[lang] || field["en"] || Object.values(field)[0] || "";
        };

        // Build query for both models
        const query = {};
        const feedQuery = {};

        // 🔥 NEW: Tab-based filtering logic
        const { tab, q, country } = req.query;
        let dateFilter = {};
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const yesterdayStart = new Date(todayStart);
        yesterdayStart.setDate(todayStart.getDate() - 1);

        if (tab === "previous") {
            dateFilter = { publishedAt: { $gte: yesterdayStart, $lt: todayStart } };
        } else if (tab === "all") {
            dateFilter = { publishedAt: { $gte: todayStart } };
        } else if (tab === "india" || country === "IN") {
            query.country = "IN";
            query.$or = [{ country: "IN" }, { category: "india" }];
            feedQuery.category = "india";
            dateFilter = { publishedAt: { $gte: todayStart } };
        } else if (tab === "world" || country === "INTERNATIONAL") {
            query.country = { $ne: "IN" };
            query.$or = [{ category: { $in: ["world", "international"] } }];
            feedQuery.category = { $in: ["world", "international"] };
            dateFilter = { publishedAt: { $gte: todayStart } };
        } else if (tab === "current_affairs") {
            const last48Hours = new Date(Date.now() - 48 * 60 * 60 * 1000);
            dateFilter = { publishedAt: { $gte: last48Hours } };
        } else if (tab) {
            // 🧠 SMART CATEGORY RESOLUTION (Politics, Sports, Tech, etc.)
            try {
                const foundCategory = await Category.findOne({
                    $or: [
                        { name: { $regex: new RegExp(`^${tab}$`, "i") } },
                        { slug: { $regex: new RegExp(`^${tab}$`, "i") } }
                    ]
                });

                if (foundCategory) {
                    // Match by ID for News, and by Slug/Name for FeedNews
                    query.category = foundCategory._id;
                    feedQuery.category = { $regex: new RegExp(`^${foundCategory.slug}|${foundCategory.name}$`, "i") };
                } else {
                    // Fallback to direct string match
                    query.category = { $regex: new RegExp(`^${tab}$`, "i") };
                    feedQuery.category = { $regex: new RegExp(`^${tab}$`, "i") };
                }
            } catch (e) {
                query.category = { $regex: new RegExp(`^${tab}$`, "i") };
                feedQuery.category = { $regex: new RegExp(`^${tab}$`, "i") };
            }

            // For specific category tabs, show latest 24 hours to ensure they aren't empty
            const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
            dateFilter = { publishedAt: { $gte: last24Hours } };
        } else {
            // Fallback for custom or missing tab
            if (category) {
                query.category = category;
                feedQuery.category = category;
            }
            if (country) {
                query.country = country;
            }

            // Legacy date filtering
            if (yesterday === "true") {
                const d = new Date();
                d.setDate(d.getDate() - 1);
                dateFilter = { publishedAt: { $gte: d } };
            } else if (req.query.month === "true") {
                const d = new Date();
                d.setDate(d.getDate() - 30);
                dateFilter = { publishedAt: { $gte: d } };
            } else if (all === "true" || all === "today") {
                // [All] tab should show today's news
                dateFilter = { publishedAt: { $gte: todayStart } };
            } else {
                // DEFAULT: fresh latest news (last 3 days)
                const threeDaysAgo = new Date();
                threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
                dateFilter = { publishedAt: { $gte: threeDaysAgo } };
            }
        }

        // Search logic in unified
        if (q) {
            const regex = new RegExp(q, "i");
            const searchObj = { $or: [{ "title.en": regex }, { title: regex }, { summary: regex }, { content: regex }] };
            Object.assign(query, searchObj);
            Object.assign(feedQuery, searchObj);
        }

        // Fetch from BOTH models in parallel
        // If limit is provided, use it. Otherwise, no limit (unlimited).
        const oldNewsPromise = News.find({ ...query, ...dateFilter, status: "approved" }).sort({ publishedAt: -1 });
        const feedNewsPromise = FeedNews.find({ ...feedQuery, ...dateFilter }).sort({ publishedAt: -1 });

        if (limit) {
            oldNewsPromise.limit(parseInt(limit));
            feedNewsPromise.limit(parseInt(limit));
        }

        // 🖼️ High-Quality Fallback Images
        const FALLBACK_IMAGES = {
            tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
            business: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
            health: "https://images.unsplash.com/photo-1505751172569-e701e62f5500?w=800&q=80",
            sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
            india: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80",
            international: "https://images.unsplash.com/photo-1529243856184-fd5465488984?w=800&q=80",
            general: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80",
            default: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"
        };

        const [oldNews, feedNews] = await Promise.all([oldNewsPromise, feedNewsPromise]);

        // Normalize both to same format
        const normalizedOldNews = oldNews.map((item) => {
            const img = item.imageUrl || item.image;
            const content = getField(item.content) || getField(item.description);
            const summary = getField(item.description);

            return {
                _id: item._id,
                title: getField(item.title),
                description: summary,
                summary: summary,
                content: content,
                imageUrl: img || FALLBACK_IMAGES[item.category] || FALLBACK_IMAGES.default, // MATCH FLUTTER
                fullContent: content, // MATCH FLUTTER
                author: item.source || "AI News", // MATCH FLUTTER
                image: img || FALLBACK_IMAGES[item.category] || FALLBACK_IMAGES.default,
                url: item.sourceUrl,
                sourceUrl: item.sourceUrl,
                source: item.source || "AI News",
                category: item.category,
                country: item.country || "IN",
                publishedAt: item.publishedAt,
                likes: item.likes || 0,
                shares: item.shares || 0,
                savedCount: item.savedCount || 0,
                isUserPost: item.isUserPost || false,
                authorId: item.author,
                score: 100,
            };
        });

        const normalizedFeedNews = feedNews.map((item) => ({
            _id: item._id,
            title: item.title,
            description: item.summary,
            summary: item.summary,
            content: item.content || item.summary,
            imageUrl: item.image || FALLBACK_IMAGES[item.category] || FALLBACK_IMAGES.default, // MATCH FLUTTER
            fullContent: item.content || item.summary, // MATCH FLUTTER
            author: item.source, // MATCH FLUTTER
            image: item.image || FALLBACK_IMAGES[item.category] || FALLBACK_IMAGES.default,
            url: item.url,
            sourceUrl: item.url,
            source: item.source,
            category: item.category,
            country: "GLOBAL",
            publishedAt: item.publishedAt,
            likes: item.likes || 0,
            shares: item.shares || 0,
            savedCount: item.savedCount || 0,
            isUserPost: false,
            authorId: null,
            score: item.score || 0,
        }));

        // Merge and deduplicate by Cleaned URL
        const merged = [...normalizedOldNews, ...normalizedFeedNews];
        const uniqueByUrl = {};

        const cleanUrl = (u) => {
            if (!u) return "";
            try {
                const urlObj = new URL(u);
                return urlObj.origin + urlObj.pathname; // Strip query params like ?utm_source
            } catch (e) {
                return u.split("?")[0]; // Fallback for invalid URLs
            }
        };

        merged.forEach((article) => {
            const rawUrl = article.url || article.sourceUrl;
            const url = cleanUrl(rawUrl);

            if (url) {
                // If it already exists, only overwrite if this one has content/is AI (higher score)
                if (!uniqueByUrl[url] || article.score > uniqueByUrl[url].score) {
                    uniqueByUrl[url] = article;
                }
            } else {
                uniqueByUrl[article._id] = article;
            }
        });

        // Convert back to array and sort by DATE (Latest first)
        let unified = Object.values(uniqueByUrl);
        unified.sort((a, b) => {
            // Primarily sort by date for home screen tabs
            return new Date(b.publishedAt) - new Date(a.publishedAt);
        });

        // 🔥 NEW: Mode to show only latest news per category
        if (req.query.mode === "latest_per_category") {
            const latestByCategory = {};
            unified.forEach(item => {
                const cat = item.category || "General";
                if (!latestByCategory[cat]) {
                    latestByCategory[cat] = item;
                }
            });
            unified = Object.values(latestByCategory);
            // Re-sort as needed (they are already sorted within categories)
            unified.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
        }

        // Apply limit only if specified
        if (limit) {
            unified = unified.slice(0, parseInt(limit));
        }

        res.json({
            success: true,
            count: unified.length,
            news: unified, // Changed key from 'data' to 'news' to match user's screenshot response format if needed, but original code had 'news', user screenshot has 'news' array... wait user screenshot has "news": [ ... ]
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
