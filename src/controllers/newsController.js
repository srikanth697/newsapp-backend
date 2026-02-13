import News from "../models/News.js";
import User from "../models/User.js";

/**
 * 📰 CREATE NEWS (Professional Version)
 * Handles image upload as Base64
 */
export const createNews = async (req, res) => {
    try {
        const { title, content, category } = req.body;

        // 🚫 Check for existing pending post
        const existingPending = await News.findOne({ author: req.userId, status: "pending" });
        if (existingPending) {
            return res.status(400).json({
                success: false,
                message: "You already have a pending news"
            });
        }

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Image required" });
        }

        // Convert buffer to Base64 string
        const imageBase64 = req.file.buffer.toString("base64");

        const news = await News.create({
            title,
            description: content,
            content,
            category,
            image: imageBase64,
            author: req.userId,
            status: "pending",
            isUserPost: true
        });

        // Increment user's post count
        await User.findByIdAndUpdate(req.userId, { $inc: { postsCount: 1 } });

        res.status(201).json({
            success: true,
            message: "News created successfully and pending approval",
            news,
        });

    } catch (error) {
        console.error("Create News Error:", error.message);
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
};

/**
 * 🛰️ GET MY STATUS
 * Checks if user has a pending post to show the "Pending Screen" in Flutter
 */
export const getMyStatus = async (req, res) => {
    try {
        const pending = await News.findOne({ author: req.userId, status: "pending" });

        res.json({
            hasPending: !!pending,
            pendingNewsId: pending?._id || null
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
