import News from "../modules/news/news.model.js";
import User from "../models/User.js";
import Quiz from "../modules/quiz/quiz.model.js";
import Category from "../models/Category.js";
import Notification from "../models/Notification.js";
import Submission from "../models/Submission.js";
import slugify from "slugify";
import bcrypt from "bcryptjs";

/* =========================
   DASHBOARD DATA
========================= */
export const getDashboardData = async (req, res) => {
    try {
        const totalNews = await News.countDocuments();
        const totalUsers = await User.countDocuments();
        const totalQuizzes = await Quiz.countDocuments();
        const totalCategories = await Category.countDocuments();
        const userSubmitted = await Submission.countDocuments({ status: "pending" });
        const fakeNews = await Submission.countDocuments({ status: "fake" });

        // Mock analytics for the chart if real historical data isn't tracked yet
        const analytics = {
            months: ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"],
            newUsers: [120, 150, 180, 240, 310, 450],
            newsPublished: [400, 450, 500, 580, 620, 780]
        };

        const stats = {
            totalNews,
            totalUsers,
            totalQuizzes,
            totalCategories,
            userSubmitted,
            fakeNews,
            growth: {
                news: 12,
                users: 25,
                quizzes: 8,
                fakeNews: -5
            }
        };

        const recentActivity = [
            { id: 1, user: "System", action: "News engine crawled 50 articles", time: "10 mins ago" },
            { id: 2, user: "Admin", action: "Approved 3 user submissions", time: "1 hour ago" },
            { id: 3, user: "AI Engine", action: "Generated Category Quiz: World News", time: "2 hours ago" }
        ];

        res.json({
            success: true,
            stats,
            analytics,
            recentActivity,
            quickStats: {
                totalViews: totalNews * 450, // Estimating based on news count
                engagement: 88.5,
                activeUsers: totalUsers > 0 ? totalUsers : 2341
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   SUBMISSIONS MANAGEMENT
========================= */
export const getSubmissions = async (req, res) => {
    try {
        const { status, page = 1, limit = 10, search = "" } = req.query;
        let query = {};

        if (status) query.status = status;
        if (search) query.title = { $regex: search, $options: "i" };

        const submissions = await Submission.find(query)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Submission.countDocuments(query);
        const stats = {
            pending: await Submission.countDocuments({ status: "pending" }),
            approved: await Submission.countDocuments({ status: "approved" }),
            rejected: await Submission.countDocuments({ status: "rejected" }),
            fake: await Submission.countDocuments({ status: "fake" })
        };

        res.json({
            success: true,
            submissions,
            total,
            stats
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSubmissionStats = async (req, res) => {
    try {
        const stats = {
            pending: await Submission.countDocuments({ status: "pending" }),
            approved: await Submission.countDocuments({ status: "approved" }),
            rejected: await Submission.countDocuments({ status: "rejected" }),
            fake: await Submission.countDocuments({ status: "fake" })
        };
        res.json({ success: true, stats });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const approveSubmission = async (req, res) => {
    try {
        const submission = await Submission.findById(req.params.id);
        if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });

        submission.status = "approved";
        submission.approvedBy = req.userId;
        submission.approvedAt = new Date();
        await submission.save();

        // Create a News entry from the approved submission
        const slug = slugify(submission.title, { lower: true, strict: true });

        await News.create({
            title: submission.title,
            slug,
            shortDescription: submission.description,
            rewrittenContent: submission.content || submission.description,
            image: submission.imageUrl || "https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&q=80&w=1000",
            category: submission.category,
            source: "User Submitted",
            author: submission.author?.fullName || "Community Contributor",
            publishedAt: new Date(),
            isToday: true
        });

        res.json({ success: true, message: "Submission approved and published as news." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const rejectSubmission = async (req, res) => {
    try {
        const { reason } = req.body;
        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            { status: "rejected", rejectionReason: reason },
            { new: true }
        );
        if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
        res.json({ success: true, message: "Submission rejected." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const markFakeSubmission = async (req, res) => {
    try {
        const submission = await Submission.findByIdAndUpdate(
            req.params.id,
            { status: "fake" },
            { new: true }
        );
        if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
        res.json({ success: true, message: "Submission marked as fake news." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   USER MANAGEMENT
========================= */
export const getUsers = async (req, res) => {
    try {
        const users = await User.find().select("-password").limit(10);
        res.json({
            success: true,
            users,
            total: await User.countDocuments()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getUserStats = async (req, res) => {
    try {
        const total = await User.countDocuments();
        const active = await User.countDocuments({ status: "active" });
        const blocked = await User.countDocuments({ status: "blocked" });

        res.json({
            success: true,
            stats: {
                total,
                active,
                blocked,
                growth: 15
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getSingleUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   NEWS MANAGEMENT
========================= */
export const getAdminNews = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;
        const query = search ? { title: { $regex: search, $options: "i" } } : {};

        const news = await News.find(query)
            .sort({ publishedAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await News.countDocuments(query);

        res.json({
            success: true,
            news,
            total,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAdminNews = async (req, res) => {
    try {
        const { title, shortDescription, rewrittenContent, image, category, country, publishedAt, source, author } = req.body;

        if (!title || !image || !category) {
            return res.status(400).json({ success: false, message: "Title, image, and category are required" });
        }

        const slug = slugify(title, { lower: true, strict: true });

        const news = await News.create({
            title,
            slug,
            shortDescription: shortDescription || title,
            rewrittenContent: rewrittenContent || "Content coming soon...",
            image,
            category,
            country: country || "world",
            source: source || "Admin Manual",
            author: author || "Admin",
            publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
            isToday: true
        });

        res.status(201).json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSingleAdminNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findById(id);
        if (!news) return res.status(404).json({ success: false, message: "News not found" });
        res.json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdminNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findByIdAndUpdate(id, req.body, { new: true });
        if (!news) return res.status(404).json({ success: false, message: "News not found" });
        res.json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAdminNews = async (req, res) => {
    try {
        const { id } = req.params;
        const news = await News.findByIdAndDelete(id);
        if (!news) return res.status(404).json({ success: false, message: "News not found" });
        res.json({ success: true, message: "News deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   ADMIN PROFILE
========================= */
export const getAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "Admin profile not found" });

        res.json({
            success: true,
            admin: {
                id: user._id,
                name: user.fullName,
                email: user.email,
                role: user.role,
                image: user.avatar || "",
                phone: user.phone || ""
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdminProfile = async (req, res) => {
    try {
        const { fullName, email, password, phone } = req.body;
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "Admin profile not found" });

        if (fullName) user.fullName = fullName;
        if (email) user.email = email;
        if (phone) user.phone = phone;
        if (password) user.password = await bcrypt.hash(password, 10);

        await user.save();
        res.json({ success: true, message: "Admin profile updated successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   CATEGORY MANAGEMENT
========================= */
export const getAdminCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ name: 1 });
        res.json({ success: true, categories });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const createAdminCategory = async (req, res) => {
    try {
        const { name, icon, color, description } = req.body;
        if (!name) return res.status(400).json({ success: false, message: "Name is required" });

        const slug = slugify(name, { lower: true, strict: true });
        const category = await Category.create({ name, slug, icon, color, description });

        res.status(201).json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateAdminCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        if (name) req.body.slug = slugify(name, { lower: true, strict: true });

        const category = await Category.findByIdAndUpdate(id, req.body, { new: true });
        res.json({ success: true, category });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const deleteAdminCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: "Category deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
