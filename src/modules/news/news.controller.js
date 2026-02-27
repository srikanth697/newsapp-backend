import News from "./news.model.js";
import { fetchAllNews } from "./news.service.js";
import mongoose from "mongoose";

export const fetchNewsNow = async (req, res) => {
    try {
        console.log("🚀 Manual news fetch triggered...");
        fetchAllNews(); // Non-blocking
        res.json({ success: true, message: "News fetch process started in background." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getNewsByCategory = async (req, res) => {
    try {
        const { tab, page = 1 } = req.query;

        const limit = 10;
        const skip = (page - 1) * limit;

        let filter = {};

        if (tab === "previous") {
            filter.isToday = false;
        } else {
            filter.isToday = true;

            if (tab === "india") {
                filter.country = "india";
            } else if (tab === "world") {
                filter.country = "world";
            } else if (["current-affairs", "politics", "business", "technology", "sports", "entertainment"].includes(tab)) {
                filter.category = tab;
            }
        }

        const news = await News.find(filter)
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: news.length,
            news: news
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSingleNews = async (req, res) => {
    try {
        const { id } = req.params;

        // Prevent CastError if ID is invalid (like "fetch")
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: "Invalid article ID format" });
        }

        const news = await News.findById(id);
        if (!news) {
            return res.status(404).json({ success: false, message: "News article not found" });
        }

        news.views += 1;
        await news.save();
        res.json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
