
import Quiz from "../models/Quiz.js";
import News from "../models/News.js";
import UserQuizAttempt from "../models/UserQuizAttempt.js";
import { generateQuizFromContent } from "../services/aiService.js";

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

/**
 * 🔧 CATEGORY MAP — Maps news categories to quiz enum values
 */
const mapToQuizCategory = (cat = "") => {
    const c = cat.toLowerCase();
    if (c.includes("tech") || c.includes("science")) return "technology";
    if (c.includes("sport")) return "sports";
    if (c.includes("entert") || c.includes("movie") || c.includes("celeb")) return "entertainment";
    if (c.includes("busin") || c.includes("econ") || c.includes("financ")) return "general";
    if (c.includes("world") || c.includes("intern")) return "general";
    if (c.includes("histor")) return "history";
    if (c.includes("geo")) return "geography";
    if (c.includes("scien")) return "science";
    return "general";
};

// 10. GENERATE QUIZ FROM A SPECIFIC NEWS ARTICLE (Admin)
// POST /api/quiz/generate/:newsId
export const generateQuizFromNews = async (req, res) => {
    try {
        const { newsId } = req.params;

        const news = await News.findById(newsId);
        if (!news) return res.status(404).json({ success: false, message: "News article not found" });

        const title = news.title?.en || news.title || "News Quiz";
        const content = news.content?.en || news.content || news.description?.en || "";

        if (!content || content.length < 100) {
            return res.status(400).json({ success: false, message: "News content too short to generate a quiz" });
        }

        // Check if quiz already exists for this news
        const existing = await Quiz.findOne({ newsId });
        if (existing) {
            return res.status(409).json({
                success: false,
                message: "A quiz already exists for this article",
                quiz: existing
            });
        }

        console.log(`🧩 Manually generating quiz for: "${title}"`);
        const quizData = await generateQuizFromContent(content, title);

        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            return res.status(500).json({ success: false, message: "AI failed to generate quiz questions" });
        }

        const quiz = await Quiz.create({
            title: quizData.title || title,
            description: quizData.description || "Test your knowledge on this topic.",
            questions: quizData.questions,
            category: mapToQuizCategory(news.category?.toString()),
            newsId: news._id,
            sourceType: "ai_news",
            status: "published",
            timerMinutes: 3
        });

        res.status(201).json({
            success: true,
            message: `Quiz created with ${quiz.questions.length} questions ✅`,
            quiz
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 11. BACKFILL QUIZZES FOR ALL EXISTING APPROVED NEWS (Admin)
// POST /api/quiz/backfill
// This is a one-time operation to generate quizzes for old news articles
export const backfillQuizzesFromNews = async (req, res) => {
    try {
        const { limit = 5 } = req.body; // Safety: default to 5 at a time

        // Find news articles (both 'approved' user posts AND 'scheduled' AI articles) that don't have a quiz yet
        const existingQuizNewsIds = (await Quiz.find({ newsId: { $ne: null } }).distinct("newsId")).map(String);

        const newsArticles = await News.find({
            status: { $in: ["approved", "scheduled"] }, // AI news = scheduled, User news = approved
            _id: { $nin: existingQuizNewsIds }
        })
            .sort({ publishedAt: -1 })
            .limit(parseInt(limit));

        if (newsArticles.length === 0) {
            return res.json({ success: true, message: "All news articles already have quizzes! ✅", generated: 0 });
        }

        console.log(`🧩 Backfilling quizzes for ${newsArticles.length} articles...`);

        const results = [];
        for (const news of newsArticles) {
            try {
                const title = typeof news.title === "object" ? (news.title?.en || "News Quiz") : (news.title || "News Quiz");
                const content = typeof news.content === "object"
                    ? (news.content?.en || news.description?.en || "")
                    : (news.content || news.description || "");

                if (!content || content.length < 100) {
                    results.push({ title, status: "skipped", reason: "content too short" });
                    continue;
                }

                const quizData = await generateQuizFromContent(content, title);
                if (!quizData || !quizData.questions || quizData.questions.length === 0) {
                    results.push({ title, status: "failed", reason: "AI returned no questions" });
                    continue;
                }

                await Quiz.create({
                    title: quizData.title || title,
                    description: quizData.description || "Test your knowledge.",
                    questions: quizData.questions,
                    category: mapToQuizCategory(news.category?.toString()),
                    newsId: news._id,
                    sourceType: "ai_news",
                    status: "published",
                    timerMinutes: 3
                });

                results.push({ title, status: "created", questions: quizData.questions.length });

                // Small delay to avoid Gemini rate limits
                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                results.push({ title: news.title?.en, status: "error", reason: err.message });
            }
        }

        const created = results.filter(r => r.status === "created").length;
        res.json({
            success: true,
            message: `Backfill complete: ${created} quizzes created out of ${newsArticles.length} articles`,
            generated: created,
            results
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
