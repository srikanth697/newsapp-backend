import * as quizService from "./quiz.service.js";
import QuizAttempt from "./attempt.model.js";
import Quiz from "./quiz.model.js";

// 🏆 Returns a list of all Quizzes, formatted as cards for the UI
export const getCategories = async (req, res) => {
    try {
        console.log("🧩 Loading all available quizzes...");

        // Find all active quizzes and populate news details for the card image
        const quizzes = await Quiz.find({ active: true })
            .populate('newsId', 'title image')
            .sort({ createdAt: -1 });

        const result = quizzes.map((q) => {
            return {
                quizId: q._id,
                title: q.title || `${q.category.toUpperCase()} QUIZ`,
                description: q.description || `Test your knowledge on ${q.category}.`,
                category: q.category,
                difficulty: q.difficulty || "medium",
                image: q.image || q.newsId?.image || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=1000",
                totalQuestions: q.questions?.length || 0,
                createdAt: q.createdAt
            };
        });

        console.log(`✅ Returning ${result.length} quiz cards to UI.`);

        res.json({
            success: true,
            categories: result // App currently expects this key "categories"
        });
    } catch (error) {
        console.error("❌ Quiz Controller Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🎯 Returns a single quiz with all questions
export const getQuiz = async (req, res) => {
    try {
        const id = req.params.id || req.query.id;

        if (!id) throw new Error("Quiz ID is required");

        const quiz = await Quiz.findById(id).populate('newsId', 'title');

        if (!quiz) throw new Error("Quiz not found");

        res.json({
            success: true,
            quizId: quiz._id,
            title: quiz.title,
            category: quiz.category,
            headline: quiz.newsId?.title || quiz.title,
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
