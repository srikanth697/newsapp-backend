import express from "express";
import News from "../models/News.js";
import User from "../models/User.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 GET ALL NEWS WITH FILTERS (Category, Country, Search)
// Example: /news?country=IN or /news?category=sports or /news?q=cricket
router.get("/", async (req, res) => {
    try {
        const { category, country, q, yesterday } = req.query;

        const filter = {};
        if (category) filter.category = category;
        if (country) filter.country = country;

        // 🕓 YESTERDAY LOGIC
        if (yesterday === "true") {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            filter.publishedAt = { $gte: d };
        }

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
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid News ID format. Use a real MongoDB ID." });
        }
        const news = await News.findById(req.params.id);
        if (!news) return res.status(404).json({ message: "News not found" });
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 LIKE NEWS (Public Counter)
router.post("/:id/like", async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid News ID format." });
        }
        const news = await News.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );
        if (!news) return res.status(404).json({ message: "News not found" });
        res.json({ likes: news.likes });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 SHARE NEWS (Public Counter)
router.post("/:id/share", async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid News ID format." });
        }
        const news = await News.findByIdAndUpdate(
            req.params.id,
            { $inc: { shares: 1 } },
            { new: true }
        );
        if (!news) return res.status(404).json({ message: "News not found" });
        res.json({ shares: news.shares });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🔹 SAVE NEWS (Public Counter)
router.post("/:id/save", async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(400).json({ message: "Invalid News ID format." });
        }
        const news = await News.findByIdAndUpdate(
            req.params.id,
            { $inc: { savedCount: 1 } },
            { new: true }
        );
        if (!news) return res.status(404).json({ message: "News not found" });
        res.json({ savedCount: news.savedCount });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


export default router;
