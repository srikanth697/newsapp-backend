import express from "express";
import News from "../models/News.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 GET ALL NEWS WITH FILTERS (Category, Country, Search)
// Example: /news?country=IN or /news?category=sports or /news?q=cricket
router.get("/", async (req, res) => {
    try {
        const { category, country, q } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (country) filter.country = country;

        // 🔍 SEARCH LOGIC (Option 4)
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

// 🔹 LIKE NEWS (Option 1: Prevent Multiple Likes)
router.post("/:id/like", protect, async (req, res) => {
    try {
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ message: "News not found" });

        // Check if user already liked
        const alreadyLiked = news.likedBy.includes(req.userId);

        if (alreadyLiked) {
            // 👎 Unlike logic: Remove user from likedBy and decrement likes
            news.likedBy = news.likedBy.filter(id => id.toString() !== req.userId);
            news.likes = Math.max(0, news.likes - 1);
            await news.save();
            return res.json({ liked: false, likes: news.likes });
        } else {
            // 👍 Like logic: Add user to likedBy and increment likes
            news.likedBy.push(req.userId);
            news.likes += 1;
            await news.save();
            return res.json({ liked: true, likes: news.likes });
        }
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
