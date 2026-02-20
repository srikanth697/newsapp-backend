
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
    toggleQuizStatus,
    generateQuizFromNews,
    backfillQuizzesFromNews
} from "../controllers/quizController.js";

const router = express.Router();

// ==========================================
// ⚠️  STATIC ROUTES MUST COME BEFORE /:id
// ==========================================

// 🔐 ADMIN — CRUD
router.post("/create", protect, adminOnly, createQuiz);
router.get("/all", getAllQuizzes);                                    // GET /api/quiz/all
router.get("/attempts/:id", protect, adminOnly, getQuizAttempts);    // GET /api/quiz/attempts/:id

// 🔐 ADMIN — AI Quiz Tools
router.post("/generate/:newsId", protect, adminOnly, generateQuizFromNews);  // Generate quiz from a specific news article
router.post("/backfill", protect, adminOnly, backfillQuizzesFromNews);       // Generate quizzes for all recent approved news

// 🔒 USER — must come before /:id
router.get("/history/me", protect, getUserQuizHistory);              // GET /api/quiz/history/me

// 👥 PUBLIC — general listing
router.get("/", getAllQuizzes);                                       // GET /api/quiz

// ⚠️  WILDCARD /:id routes MUST be LAST
router.get("/:id", getQuizById);                                     // GET /api/quiz/:id
router.post("/:id/submit", submitQuiz);                              // POST /api/quiz/:id/submit
router.put("/:id", protect, adminOnly, updateQuiz);                  // PUT /api/quiz/:id
router.delete("/:id", protect, adminOnly, deleteQuiz);               // DELETE /api/quiz/:id
router.patch("/:id/toggle", protect, adminOnly, toggleQuizStatus);   // PATCH /api/quiz/:id/toggle

export default router;
