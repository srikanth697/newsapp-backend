import * as quizService from "./quiz.service.js";
import QuizAttempt from "./attempt.model.js";
import Quiz from "./quiz.model.js";

export const getCategories = async (req, res) => {
    try {
        const categories = await Quiz.distinct("category", { active: true });

        const result = await Promise.all(categories.map(async (cat) => {
            const latest = await Quiz.findOne({ category: cat, active: true })
                .populate('newsId', 'title image')
                .sort({ createdAt: -1 });

            return {
                category: cat,
                headline: latest?.newsId?.title || `${cat.charAt(0).toUpperCase() + cat.slice(1)} Quiz`,
                image: latest?.newsId?.image || "",
                totalQuestions: latest?.questions?.length || 0,
                quizId: latest?._id
            };
        }));

        res.json({ success: true, categories: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getQuiz = async (req, res) => {
    try {
        const { category, id } = req.query;
        let quiz;

        if (id) {
            quiz = await Quiz.findById(id).populate('newsId', 'title');
        } else {
            quiz = await quizService.getQuestionsByCategory(category);
        }

        if (!quiz) throw new Error("Quiz not found");

        res.json({
            success: true,
            quizId: quiz._id,
            category: quiz.category,
            headline: quiz.newsId?.title || `${quiz.category} Quiz`,
            questions: quiz.questions
        });
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
