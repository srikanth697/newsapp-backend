import express from "express";
import News from "../models/News.js";

const router = express.Router();

// 🇮🇳 India News
router.get("/india", async (req, res) => {
    try {
        const news = await News.find({ country: "IN" })
            .sort({ publishedAt: -1 })
            .limit(20);
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🌍 International News
router.get("/international", async (req, res) => {
    try {
        const news = await News.find({ country: { $ne: "IN" } })
            .sort({ publishedAt: -1 })
            .limit(20);
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 🕓 Yesterday News
router.get("/yesterday", async (req, res) => {
    try {
        const d = new Date();
        d.setDate(d.getDate() - 1);
        const news = await News.find({
            publishedAt: { $gte: d },
        }).sort({ publishedAt: -1 });
        res.json(news);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
