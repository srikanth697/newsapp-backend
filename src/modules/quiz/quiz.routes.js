import express from "express";
import { getQuiz, generateCustomQuiz, submitAttempt, getCategories } from "./quiz.controller.js";
import { protect } from "../../middleware/authMiddleware.js";

const router = express.Router();

router.get("/categories", getCategories);
router.get("/:id([0-9a-fA-F]{24})", getQuiz); // Support direct /id
router.get("/", getQuiz); // Support ?id= query
router.post("/generate-from-url", generateCustomQuiz);
router.post("/submit", protect, submitAttempt);

export default router;
