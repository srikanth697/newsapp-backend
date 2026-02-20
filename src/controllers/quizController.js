
import Quiz from "../models/Quiz.js";
import UserQuizAttempt from "../models/UserQuizAttempt.js";

// ==========================================
// 🧩 QUIZ MANAGEMENT
// ==========================================

// 1. CREATE QUIZ (Admin)
export const createQuiz = async (req, res) => {
    try {
        const { title, description, category, difficulty, questions, timerMinutes, status } = req.body;

        if (!title || !questions || questions.length === 0) {
            return res.status(400).json({ success: false, message: "Title and questions are required." });
        }

        const quiz = await Quiz.create({
            title,
            description: description || "",
            category: category || "general",
            difficulty: difficulty || "medium",
            questions,
            timerMinutes: timerMinutes || 5,
            status: status || "draft",
            createdBy: req.user._id,
            sourceType: "admin"
        });

        res.status(201).json({ success: true, message: "Quiz created successfully", quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET ALL QUIZZES
// Public: returns only published quizzes (no answers)
// Admin: can filter by status
export const getAllQuizzes = async (req, res) => {
    try {
        const { category, difficulty, search, status, limit = 20, page = 1 } = req.query;
        let query = {};

        // Safe check — req.user may be undefined on public route
        if (req.user?.role === "admin") {
            if (status) query.status = status;
            // else admin sees everything
        } else {
            query.status = "published";
        }

        if (category) query.category = category;
        if (difficulty) query.difficulty = difficulty;
        if (search) query.title = { $regex: search, $options: "i" };

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [quizzes, total] = await Promise.all([
            Quiz.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("newsId", "title imageUrl publishedAt") // Link to source news
                .select("-questions.correctOptionIndex -questions.explanation"), // Hide answers in list
            Quiz.countDocuments(query)
        ]);

        res.json({
            success: true,
            count: quizzes.length,
            total,
            page: parseInt(page),
            totalPages: Math.ceil(total / parseInt(limit)),
            quizzes
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. GET SINGLE QUIZ (For Taking the Quiz)
// Public: questions shown WITHOUT answers
// Admin: full data including answers
export const getQuizById = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id)
            .populate("newsId", "title imageUrl publishedAt source");

        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });
        if (quiz.status !== "published" && req.user?.role !== "admin") {
            return res.status(403).json({ success: false, message: "This quiz is not available" });
        }

        // Admin gets full data including correct answers
        if (req.user?.role === "admin") {
            return res.json({ success: true, quiz });
        }

        // Public: hide correct answers until submit
        const quizForUser = quiz.toObject();
        quizForUser.questions = quizForUser.questions.map((q, i) => ({
            _id: q._id,
            questionNumber: i + 1,
            questionText: q.questionText,
            options: q.options
            // correctOptionIndex and explanation are intentionally hidden
        }));

        res.json({
            success: true,
            quiz: quizForUser
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. SUBMIT QUIZ & CALCULATE SCORE
// Body: { "answers": [0, 2, 1, 3, 2] }  (array of selected option indexes)
// Returns: score, correct count, and per-question feedback with correct answer + explanation
export const submitQuiz = async (req, res) => {
    try {
        const { id } = req.params;
        const { answers } = req.body;

        if (!answers || !Array.isArray(answers)) {
            return res.status(400).json({ success: false, message: "Provide answers as an array: { \"answers\": [0, 1, 2] }" });
        }

        const quiz = await Quiz.findById(id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        // Build per-question result with full feedback
        const results = quiz.questions.map((q, index) => {
            const selected = answers[index] ?? null;
            const isCorrect = selected !== null && q.correctOptionIndex === selected;
            if (isCorrect) correctCount++;

            return {
                questionNumber: index + 1,
                questionText: q.questionText,
                options: q.options,
                selectedOptionIndex: selected,
                selectedOptionText: selected !== null ? q.options[selected] : null,
                correctOptionIndex: q.correctOptionIndex,
                correctOptionText: q.options[q.correctOptionIndex],
                isCorrect,
                explanation: q.explanation || "No explanation provided."
            };
        });

        const score = Math.round((correctCount / totalQuestions) * 100);

        // Score grade label
        let grade = "F";
        if (score >= 90) grade = "A+";
        else if (score >= 75) grade = "A";
        else if (score >= 60) grade = "B";
        else if (score >= 45) grade = "C";
        else if (score >= 30) grade = "D";

        // Save attempt for logged-in users
        let attemptId = null;
        if (req.user) {
            const attempt = await UserQuizAttempt.create({
                user: req.user._id,
                quiz: quiz._id,
                score,
                totalQuestions,
                correctAnswers: correctCount,
                responses: results.map(r => ({
                    questionId: r._id,
                    selectedOptionIndex: r.selectedOptionIndex,
                    isCorrect: r.isCorrect
                }))
            });
            attemptId = attempt._id;
        }

        res.json({
            success: true,
            quizTitle: quiz.title,
            score,
            grade,
            correctCount,
            totalQuestions,
            percentage: `${score}%`,
            results,
            attemptId,
            message: req.user ? "Result saved to your history ✅" : "Guest attempt — result not saved"
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. UPDATE QUIZ (Admin)
export const updateQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndUpdate(
            req.params.id,
            { ...req.body, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        res.json({ success: true, message: "Quiz updated ✅", quiz });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. DELETE QUIZ (Admin)
export const deleteQuiz = async (req, res) => {
    try {
        const quiz = await Quiz.findByIdAndDelete(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        res.json({ success: true, message: "Quiz deleted ✅" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 7. GET QUIZ ATTEMPTS for a specific quiz (Admin)
export const getQuizAttempts = async (req, res) => {
    try {
        const attempts = await UserQuizAttempt.find({ quiz: req.params.id })
            .populate("user", "fullName email avatar")
            .sort({ createdAt: -1 });

        const avgScore = attempts.length
            ? Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length)
            : 0;

        res.json({
            success: true,
            count: attempts.length,
            averageScore: avgScore,
            attempts
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 8. GET USER QUIZ HISTORY
export const getUserQuizHistory = async (req, res) => {
    try {
        const attempts = await UserQuizAttempt.find({ user: req.user._id })
            .populate("quiz", "title category difficulty timerMinutes")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: attempts.length,
            attempts: attempts.map(a => ({
                _id: a._id,
                quiz: a.quiz,
                score: a.score,
                grade: a.score >= 90 ? "A+" : a.score >= 75 ? "A" : a.score >= 60 ? "B" : a.score >= 45 ? "C" : a.score >= 30 ? "D" : "F",
                correctAnswers: a.correctAnswers,
                totalQuestions: a.totalQuestions,
                completedAt: a.completedAt
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 9. PUBLISH / UNPUBLISH (Admin shortcut)
export const toggleQuizStatus = async (req, res) => {
    try {
        const quiz = await Quiz.findById(req.params.id);
        if (!quiz) return res.status(404).json({ success: false, message: "Quiz not found" });

        quiz.status = quiz.status === "published" ? "draft" : "published";
        await quiz.save();

        res.json({
            success: true,
            message: `Quiz is now ${quiz.status} ✅`,
            status: quiz.status
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
