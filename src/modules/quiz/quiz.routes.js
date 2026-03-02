import express from "express";
import { getQuiz, generateCustomQuiz, submitAttempt, getCategories, getAdminQuizzes, createQuiz, updateQuiz, deleteQuiz } from "./quiz.controller.js";
import { protect, adminOnly } from "../../middleware/authMiddleware.js";

const router = express.Router();

// 👩‍💼 Admin Panel Routes
router.get("/admin/list", protect, adminOnly, getAdminQuizzes);
router.post("/admin/create", protect, adminOnly, createQuiz);
router.put("/admin/:id", protect, adminOnly, updateQuiz);
router.delete("/admin/:id", protect, adminOnly, deleteQuiz);

// 📱 Mobile App Routes (Aliased for Admin compatibility)
router.get("/all", getCategories); // Alias for card listing
router.get("/categories", getCategories);
router.get("/:id([0-9a-fA-F]{24})", getQuiz);
router.put("/:id([0-9a-fA-F]{24})", protect, adminOnly, updateQuiz); // Allow direct PUT without /admin prefix
router.get("/", getQuiz);
router.post("/generate-from-url", generateCustomQuiz);
router.post("/submit", protect, submitAttempt);

export default router;
