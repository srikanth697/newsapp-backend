
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
    getUserQuizHistory,
    toggleQuizStatus
} from "../controllers/quizController.js";

const router = express.Router();

// ==========================================
// 🔐 ADMIN ROUTES
// ==========================================
router.post("/create", protect, adminOnly, createQuiz);          // Create quiz
router.put("/:id", protect, adminOnly, updateQuiz);              // Edit quiz
router.delete("/:id", protect, adminOnly, deleteQuiz);           // Delete quiz
router.patch("/:id/toggle", protect, adminOnly, toggleQuizStatus); // Publish / Unpublish toggle
router.get("/attempts/:id", protect, adminOnly, getQuizAttempts); // Who attempted quiz :id

// ==========================================
// 👥 PUBLIC ROUTES (no auth required)
// ==========================================
router.get("/all", getAllQuizzes);     // GET /api/quiz/all?category=sports&difficulty=easy&page=1&limit=10
router.get("/", getAllQuizzes);        // GET /api/quiz (same as /all)
router.get("/:id", getQuizById);      // GET /api/quiz/:id  (answers hidden)
router.post("/:id/submit", submitQuiz); // POST /api/quiz/:id/submit  { "answers": [0, 2, 1, 3, 2] }

// ==========================================
// 🔒 USER ROUTES (login required)
// ==========================================
router.get("/history/me", protect, getUserQuizHistory); // My quiz history

export default router;
