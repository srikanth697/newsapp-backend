import express from "express";
import Quiz from "../models/Quiz.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// 🔹 GET ALL QUIZZES (with optional category filter)
router.get("/", async (req, res) => {
    try {
        const { category } = req.query;
        const filter = {};
        if (category) filter.category = category;

        const quizzes = await Quiz.find(filter).sort({ createdAt: -1 });
        res.json({ success: true, quizzes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🔹 GET FEATURED/TOP QUIZZES
router.get("/top", async (req, res) => {
    try {
        const topQuizzes = await Quiz.find().limit(5).sort({ createdAt: -1 });
        res.json({ success: true, quizzes: topQuizzes });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🔹 GET SINGLE QUIZ DETAILS (Questions)
router.get("/:id", async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
        res.json({ success: true, quiz });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// 🔹 CREATE A QUIZ (Admin Only - for testing)
router.post("/create", async (req, res) => {
    try {
        const { title, category, image, questions, difficulty } = req.body;
        const quiz = await Quiz.create({ title, category, image, questions, difficulty });
        res.status(201).json({ success: true, quiz });
    } catch (err) {
        res.status(400).json({ success: false, error: err.message });
    }
});

export default router;
