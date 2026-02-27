import * as quizService from "./quiz.service.js";
import QuizAttempt from "./attempt.model.js";

export const getQuiz = async (req, res) => {
    try {
        const { category } = req.query;
        const quiz = await quizService.getQuestionsByCategory(category);
        res.json({ success: true, questions: quiz.questions, quizId: quiz._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const generateCustomQuiz = async (req, res) => {
    try {
        const { source } = req.body;
        const quiz = await quizService.generateQuizFromSource(source);
        res.json({ success: true, quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const submitAttempt = async (req, res) => {
    try {
        const { quizId, score, totalQuestions, category } = req.body;
        // req.userId from authMiddleware
        const attempt = await QuizAttempt.create({
            userId: req.userId,
            quizId,
            score,
            totalQuestions,
            category
        });
        res.json({ success: true, attempt });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
