import express from "express";
import { getQuiz, generateCustomQuiz, submitAttempt, getCategories } from "./quiz.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/", getQuiz);
router.post("/generate-from-url", generateCustomQuiz);
router.post("/submit", protect, submitAttempt);

export default router;
