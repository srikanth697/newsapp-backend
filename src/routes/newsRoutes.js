import express from "express";
import News from "../models/News.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 GET ALL NEWS WITH FILTERS (Category, Country)
// Example: /news?country=IN or /news?category=sports
router.get("/", async (req, res) => {
    try {
        const { category, country } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (country) filter.country = country;

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

// 🔹 READ MORE (Detailed News)
router.get("/:id", async (req, res) => {
    try {
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
        const news = await News.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );
        res.json({ likes: news.likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 SHARE NEWS
router.post("/:id/share", async (req, res) => {
    try {
        const news = await News.findByIdAndUpdate(
            req.params.id,
            { $inc: { shares: 1 } },
            { new: true }
        );
        res.json({ shares: news.shares });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 SAVE NEWS (Bookmark)
router.post("/:id/save", protect, async (req, res) => {
    try {
        await User.findByIdAndUpdate(
            req.userId,
            { $addToSet: { savedNews: req.params.id } }
        );
        res.json({ message: "Saved" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
