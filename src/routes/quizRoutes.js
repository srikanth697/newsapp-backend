
import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    createQuiz,
    getAllQuizzes,
    getQuizById,
    updateQuiz,
    deleteQuiz,
    submitQuiz,
    getQuizAttempts,
    getUserQuizHistory
} from "../controllers/quizController.js";

const router = express.Router();

// 🔐 Admin Routes (Full CRUD)
router.post("/create", protect, adminOnly, createQuiz);
router.get("/all", protect, getAllQuizzes); // Admins see draft/archived, Users see published
router.put("/:id", protect, adminOnly, updateQuiz);
router.delete("/:id", protect, adminOnly, deleteQuiz);
router.get("/attempts/:id", protect, adminOnly, getQuizAttempts); // See who took a specific quiz

// 👥 User Routes
router.get("/", getAllQuizzes); // Public
router.get("/history", protect, getUserQuizHistory); // My quiz history (login required)
router.get("/:id", getQuizById); // Public
router.post("/:id/submit", submitQuiz); // Public

export default router;
