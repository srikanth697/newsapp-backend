import News from "../models/News.js";
import User from "../models/User.js";

/**
 * 🛠️ Helper to Transform News for Response
 * Selects the requested language or falls back to English.
 */
// 🖼️ Shared Fallback Logic (Should be in a utility file ideally, but duplicating for safety now)
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

const transformNews = (news, lang = "en") => {
    // Helper to safely get the language value or fallback to 'en'
    const getField = (field) => {
        if (!field) return "";
        // If field is just a string (legacy data), return it
        if (typeof field === "string") return field;

        // Return requested language, then fallback to English, then first available key
        return field[lang] || field["en"] || Object.values(field)[0] || "";
    };

    const originalImage = news.imageUrl || news.image;
    const defaultImage = FALLBACK_IMAGES[news.category] || FALLBACK_IMAGES.default;

    return {
        id: news._id,
        title: getField(news.title),
        description: getField(news.description),
        content: getField(news.content),
        category: news.category,
        imageUrl: originalImage || defaultImage, // Apply fallback if missing
        source: news.source,
        sourceUrl: news.sourceUrl,
        publishedAt: news.publishedAt,
        createdAt: news.createdAt,
        updatedAt: news.updatedAt,
        author: news.author,
        status: news.status,
        likes: news.likes,
        shares: news.shares,
        savedCount: news.savedCount
    };
};

/**
 * 📰 CREATE NEWS (Multilingual Support)
 * POST /api/news
 */
export const createNews = async (req, res) => {
    try {
        let { title, description, content, category, country } = req.body;

        // Handle file upload (Base64)
        let imageUrl = "";
        if (req.file) {
            imageUrl = req.file.buffer.toString("base64");
        } else if (req.body.imageUrl) {
            imageUrl = req.body.imageUrl;
        }

        // Parse JSON strings if they come from FormData
        try {
            if (typeof title === 'string' && (title.startsWith('{') || title.startsWith('['))) title = JSON.parse(title);
            if (typeof description === 'string' && (description.startsWith('{') || description.startsWith('['))) description = JSON.parse(description);
            if (typeof content === 'string' && (content.startsWith('{') || content.startsWith('['))) content = JSON.parse(content);
        } catch (e) {
            // If parsing fails, assume it's a simple string (English default)
            title = { en: title };
            description = { en: description };
            content = { en: content };
        }

        // Validate required fields (English title is mandatory)
        if (!title || (!title.en && typeof title !== 'string')) {
            // If title is an object but no 'en' key, check if there are other keys
            if (typeof title === 'object' && Object.keys(title).length === 0) {
                return res.status(400).json({ success: false, message: "Title is required (at least in English)" });
            }
        }

        // Check for duplicate/pending posts for user
        if (req.userId) {
            const existingPending = await News.findOne({ author: req.userId, status: "pending" });
            if (existingPending) {
                return res.status(400).json({ success: false, message: "You already have a pending news post." });
            }
        }

        const news = await News.create({
            title: typeof title === "string" ? { en: title } : title,
            description: typeof description === "string" ? { en: description } : description,
            content: typeof content === "string" ? { en: content } : content,
            category: category || "general",
            country: country || "IN",
            imageUrl: imageUrl, // Storing in new field
            image: imageUrl,    // Backwards compatibility
            author: req.userId || null,
            isUserPost: !!req.userId,
            status: req.userId ? "pending" : "approved" // Admin/System posts are auto-approved
        });

        if (req.userId) {
            await User.findByIdAndUpdate(req.userId, { $inc: { postsCount: 1 } });
        }

        res.status(201).json({
            success: true,
            message: "News created successfully",
            data: transformNews(news, "en")
        });

    } catch (error) {
        console.error("Create News Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

import FeedNews from "../models/FeedNews.js";

/**
 * 🌍 GET ALL NEWS (Unified)
 * GET /api/news?lang=en&category=tech&q=searchterm
 * Note: Redirects logic to ensure FeedNews + User News are returned.
 */
export const getAllNews = async (req, res) => {
    try {
        const { lang = "en", category, q, query: searchParams, ...filters } = req.query;

        // Detect if this is a "previous" or "today" request based on URL path or query
        const isPrevious = req.path.includes("previous") || req.query.yesterday === "true";
        const isToday = req.path.includes("today") || req.query.all === "true"; // Assuming 'all=true' meant today based on old logic

        // Build query
        const dbQuery = {};
        if (category) {
            // 🧠 Smart Category Mapping
            if (category === "current_affairs") {
                dbQuery.category = { $in: ["india", "international", "general"] };
            } else if (category === "breaking_news") {
                dbQuery.category = { $in: ["india", "general"] };
            } else {
                dbQuery.category = category;
            }
        }

        // Search Logic
        const searchQuery = q || searchParams;
        if (searchQuery) {
            const regex = new RegExp(searchQuery, "i");
            dbQuery.$or = [
                { "title.en": regex }, // Search in English title
                { "title": regex },    // Search in legacy string title
                { "description.en": regex },
                { "description": regex }, // Legacy string desc
                { "summary": regex }      // FeedNews summary
            ];
        }

        // Date Filter Logic
        let dateFilter = {};
        if (isPrevious) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dateFilter = { publishedAt: { $lt: today } };
        } else if (isToday) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            dateFilter = { publishedAt: { $gte: today } };
        }

        // Fetch from BOTH collections
        // Removed limit(50) to show UNLIMITED news as requested
        const [userNews, feedNews] = await Promise.all([
            News.find({ ...dbQuery, ...dateFilter, status: "approved" }).sort({ publishedAt: -1 }),
            FeedNews.find({ ...dbQuery, ...dateFilter }).sort({ publishedAt: -1 })
        ]);

        // Merge & Transform
        const combined = [...userNews, ...feedNews].map(item => transformNews(item, lang));

        // Sort by Date (newest first)
        combined.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

        res.json({
            success: true,
            count: combined.length,
            data: combined
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 🔍 GET SINGLE NEWS
 * GET /api/news/:id?lang=en
 */
export const getSingleNews = async (req, res) => {
    try {
        const { id } = req.params;
        const { lang = "en" } = req.query;

        if (!id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ success: false, message: "Invalid ID format" });
        }

        const news = await News.findById(id);
        if (!news) {
            return res.status(404).json({ success: false, message: "News not found" });
        }

        res.json({
            success: true,
            data: transformNews(news, lang)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * ✏️ UPDATE NEWS
 * PUT /api/news/:id
 */
export const updateNews = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const news = await News.findByIdAndUpdate(id, updates, { new: true });
        if (!news) {
            return res.status(404).json({ success: false, message: "News not found" });
        }

        res.json({
            success: true,
            message: "News updated successfully",
            data: transformNews(news, "en")
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 🗑️ DELETE NEWS
 * DELETE /api/news/:id
 */
export const deleteNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findByIdAndDelete(id);

        if (!news) {
            return res.status(404).json({ success: false, message: "News not found" });
        }

        res.json({
            success: true,
            message: "News deleted successfully"
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 👤 GET MY STATUS (Legacy Support)
 */
/**
 * 👤 GET MY STATUS (Legacy Support)
 */
export const getMyStatus = async (req, res) => {
    try {
        // Find the most recent submission by this user
        const latestSubmission = await News.findOne({ author: req.userId })
            .sort({ createdAt: -1 });

        if (!latestSubmission) {
            return res.json({
                hasPending: false,
                status: null,
                message: "No submissions found"
            });
        }

        res.json({
            hasPending: latestSubmission.status === "pending",
            status: latestSubmission.status, // "pending", "published", "rejected", "fake"
            pendingNewsId: latestSubmission._id,
            title: latestSubmission.title?.en || latestSubmission.title,
            rejectionReason: latestSubmission.rejectionReason || null,
            publishedAt: latestSubmission.publishedAt
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * 👁️ INCREMENT VIEW COUNT
 * PUT /api/news/:id/view
 */
export const incrementNewsView = async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(
            req.params.id,
            { $inc: { views: 1 } },
            { new: true }
        );
        res.json({ success: true, views: news.views });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
