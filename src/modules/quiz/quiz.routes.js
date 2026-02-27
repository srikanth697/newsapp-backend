import express from "express";
import { getQuiz, generateCustomQuiz, submitAttempt } from "./quiz.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getQuiz);
router.post("/generate-from-url", generateCustomQuiz);
router.post("/submit", protect, submitAttempt);

export default router;
