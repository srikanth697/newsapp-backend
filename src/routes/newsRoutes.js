import express from "express";
import News from "../models/News.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";
import { correctNewsContent } from "../services/aiService.js";
import upload from "../config/upload.js";
import { createNews, getMyStatus } from "../controllers/newsController.js";

const VALID_CATEGORIES = ["general", "politics", "sports", "business", "tech", "health", "entertainment", "current_affairs", "india", "international"];

const router = express.Router();

// 🔹 CREATE NEWS (Professional with Image Upload)
router.post("/create", protect, upload.single("image"), createNews);

// 🔹 GET MY STATUS (To show Pending Screen in Flutter)
router.get("/my-status", protect, getMyStatus);

// 🔹 GET ALL NEWS WITH FILTERS (Category, Country, Search)
router.get("/", async (req, res) => {
    try {
        const { category, country, q, yesterday, all, ids } = req.query;

        const filter = { status: "approved" };

        if (ids) {
            const idArray = ids.split(",");
            filter._id = { $in: idArray };
        }
        if (category) filter.category = category;
        if (country) filter.country = country;

        if (yesterday === "true") {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            filter.publishedAt = { $gte: d };
        } else if (all === "today") {
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);
            filter.publishedAt = { $gte: startOfToday };
        }

        if (q) {
            filter.$or = [
                { title: { $regex: q, $options: "i" } },
                { description: { $regex: q, $options: "i" } }
            ];
        }

        const news = await News.find(filter).sort({ publishedAt: -1 });
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 GET SAVED NEWS
router.get("/saved", protect, async (req, res) => {
    try {
        const user = await User.findById(req.userId).populate("savedNews");
        res.json(user.savedNews);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 READ MORE
router.get("/:id", async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid News ID format." });
        }
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ message: "News not found" });
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 LIKE NEWS
router.post("/:id/like", async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(req.params.id, { $inc: { likes: 1 } }, { new: true });
        res.json({ likes: news?.likes || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 SHARE NEWS
router.post("/:id/share", async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(req.params.id, { $inc: { shares: 1 } }, { new: true });
        res.json({ shares: news?.shares || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 SAVE NEWS
router.post("/:id/save", async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(req.params.id, { $inc: { savedCount: 1 } }, { new: true });
        res.json({ savedCount: news?.savedCount || 0 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 STANDALONE AI FIX
router.post("/ai-fix", protect, async (req, res) => {
    try {
        const { title, description } = req.body;
        const corrected = await correctNewsContent(title, description);
        res.json({ success: true, title: corrected.title, description: corrected.description });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 GET MY POSTS
router.get("/my-posts", protect, async (req, res) => {
    try {
        const posts = await News.find({ author: req.userId }).sort({ publishedAt: -1 });
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

/* =========================
   ADMIN PANEL APIS
========================= */

router.get("/admin/pending", protect, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user.isAdmin) return res.status(403).json({ message: "Admin access denied" });
        const pending = await News.find({ status: "pending" }).populate("author", "fullName email");
        res.json(pending);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/admin/approve/:id", protect, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user.isAdmin) return res.status(403).json({ message: "Admin access denied" });
        const news = await News.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
        res.json({ message: "News approved and live", news });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post("/admin/reject/:id", protect, async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user.isAdmin) return res.status(403).json({ message: "Admin access denied" });
        const { reason } = req.body;
        const news = await News.findByIdAndUpdate(req.params.id, { status: "rejected", rejectionReason: reason }, { new: true });
        res.json({ message: "News rejected", news });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
