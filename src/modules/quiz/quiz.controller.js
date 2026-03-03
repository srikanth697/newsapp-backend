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
                _id: q._id,
                title: q.title || `${q.category.toUpperCase()} QUIZ`,
                description: q.description || `Test your knowledge on ${q.category}.`,
                category: q.category,
                difficulty: q.difficulty || "medium",
                image: q.image || q.newsId?.image || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=1000",
                questionCount: q.questions?.length || 0,
                createdAt: q.createdAt
            };
        });

        console.log(`✅ Returning ${result.length} quiz cards to UI.`);

        res.json({
            success: true,
            quizzes: result
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

        // Map questions to fields Flutter's QuizQuestion.fromJson expects
        const mappedQuestions = quiz.questions.map((q, index) => ({
            _id: q._id,
            questionNumber: index + 1,
            questionText: q.question,
            options: q.options,
            correctOptionIndex: q.options.indexOf(q.correctAnswer),
            explanation: q.explanation || ''
        }));

        res.json({
            success: true,
            _id: quiz._id,
            title: quiz.title,
            description: quiz.description || '',
            category: quiz.category,
            difficulty: quiz.difficulty || 'medium',
            image: quiz.image || quiz.newsId?.image || null,
            headline: quiz.newsId?.title || quiz.title,
            questions: mappedQuestions
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

// 👩‍💼 Admin: Get list for the table with attempt counts
export const getAdminQuizzes = async (req, res) => {
    try {
        const quizzes = await Quiz.find().sort({ createdAt: -1 });

        const result = await Promise.all(quizzes.map(async (q) => {
            const attemptCount = await QuizAttempt.countDocuments({ quizId: q._id });
            return {
                _id: q._id, // Changed from id to _id
                question: q.questions[0]?.question || q.title,
                correctAnswer: q.questions[0]?.correctAnswer || "N/A",
                category: q.category,
                attempts: attemptCount,
                date: q.createdAt.toISOString().split('T')[0],
                active: q.active
            };
        }));

        res.json({ success: true, quizzes: result });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ➕ Admin: Manual Create
export const createQuiz = async (req, res) => {
    try {
        const { title, description, category, difficulty, questions } = req.body;
        const quiz = await Quiz.create({
            title: title || questions[0]?.question,
            description,
            category,
            difficulty,
            questions
        });
        res.status(201).json({ success: true, quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ✏️ Admin: Update
export const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
        res.json({ success: true, quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🗑️ Admin: Delete
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
        res.json({ success: true, message: "Quiz deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

