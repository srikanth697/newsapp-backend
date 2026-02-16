
import Quiz from "../models/Quiz.js";
import User from "../models/User.js";

// ==========================================
// 🧩 QUIZ MANAGEMENT
// ==========================================

// 1. CREATE QUIZ
export const createQuiz = async (req, res) => {
    try {
        const { title, description, category, difficulty, questions, timerMinutes } = req.body;

        const quiz = await Quiz.create({
            title,
            description,
            category: category || "general",
            difficulty: difficulty || "medium",
            questions,
            timerMinutes: timerMinutes || 5,
            createdBy: req.user._id,
            status: "draft"
        });

        res.status(201).json({ success: true, message: "Quiz created successfully", quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET ALL QUIZZES (Admin View: List All, User View: List Published)
export const getAllQuizzes = async (req, res) => {
    try {
        const { category, difficulty, search, status } = req.query;
        let query = {};

        // If user is admin, allow status filtering. Otherwise only published.
        if (req.user && req.user.role === "admin") {
            if (status) query.status = status;
        } else {
            query.status = "published";
        }

        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (search) query.title = { $regex: search, $options: "i" };

        const quizzes = await Quiz.find(query)
            .sort({ createdAt: -1 })
            .select("-questions.correctOptionIndex -questions.explanation"); // Hide answers for list view

        res.json({ success: true, count: quizzes.length, quizzes });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. GET SINGLE QUIZ (For Taking the Quiz)
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        // If user is admin, showing full details including answers
        if (req.user && req.user.role === "admin") {
            return res.json({ success: true, quiz });
        }

        // For users, hide answers until they submit
        const quizForUser = quiz.toObject();
        quizForUser.questions.forEach(q => {
            delete q.correctOptionIndex;
            delete q.explanation;
        });

        res.json({ success: true, quiz: quizForUser });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. SUBMIT QUIZ & CALCULATE SCORE
export const submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body; // Array of selected option indexes [0, 2, 1, 3...]

        const quiz = await Quiz.findById(id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        // Detailed results for feedback
        const responses = quiz.questions.map((q, index) => {
            const isCorrect = q.correctOptionIndex === answers[index];
            if (isCorrect) correctCount++;
            return {
                questionId: q._id,
                selectedOptionIndex: answers[index],
                isCorrect
            };
        });

        const score = (correctCount / totalQuestions) * 100;

        // Save Attempt
        const attempt = await UserQuizAttempt.create({
            user: req.user._id,
            quiz: quiz._id,
            score,
            totalQuestions,
            correctAnswers: correctCount,
            responses
        });

        // Results with explanations for frontend display
        const results = quiz.questions.map((q, index) => ({
            questionId: q._id,
            correct: q.correctOptionIndex === answers[index],
            correctOption: q.correctOptionIndex,
            explanation: q.explanation
        }));

        res.json({
            success: true,
            score,
            correctCount,
            totalQuestions,
            results,
            attemptId: attempt._id
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. UPDATE QUIZ (Admin)
export const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        res.json({ success: true, message: "Quiz updated", quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. DELETE QUIZ (Admin)
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        res.json({ success: true, message: "Quiz deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. GET QUIZ ATTEMPTS (Admin View)
export const getQuizAttempts = async (req, res) => {
    try {
        const attempts = await UserQuizAttempt.find({ quiz: req.params.id })
            .populate("user", "fullName email avatar")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: attempts.length, attempts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. GET USER QUIZ HISTORY (User View)
export const getUserQuizHistory = async (req, res) => {
    try {
        const attempts = await UserQuizAttempt.find({ user: req.user._id })
            .populate("quiz", "title category difficulty")
            .sort({ createdAt: -1 });

        res.json({ success: true, count: attempts.length, attempts });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
