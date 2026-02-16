
import User from "../models/User.js";
import News from "../models/News.js";
import FeedNews from "../models/FeedNews.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🔐 ADMIN LOGIN (POST /api/admin/login)
export const adminLogin = async (req, res) => {
    try {
        console.log("🔹 Admin Login Attempt:", req.body);
        const { email, password } = req.body;

        if (!email || !password) {
            console.log("❌ Missing email or password");
            return res.status(400).json({ success: false, message: "Please provide email and password" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            console.log("❌ User not found:", email);
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        if (user.role !== "admin") {
            console.log("❌ Access denied. Not admin:", user.role);
            return res.status(403).json({ success: false, message: "Access denied. Admin only." });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            console.log("❌ Password mismatch for:", email);
            return res.status(400).json({ success: false, message: "Invalid email or password" });
        }

        console.log("✅ Admin Login Successful:", email);

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            message: "Login successful",
            token,
            admin: {
                _id: user._id,
                name: user.fullName || "Admin",
                email: user.email,
                role: user.role,
                avatar: user.avatar
            },
        });
    } catch (error) {
        console.error("💥 Admin Login Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔐 FORGOT PASSWORD (POST /api/admin/forgot-password)
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email, role: "admin" });

        if (!user) {
            // Return success regardless to prevent email enumeration
            return res.json({ success: true, message: "Verification code sent to your email" });
        }

        // Generate 4-digit numeric code
        const code = Math.floor(1000 + Math.random() * 9000).toString();

        // Set expiration to 5 mins
        user.resetCode = code;
        user.resetCodeExpiry = Date.now() + 5 * 60 * 1000;

        await user.save();

        console.log(`🔑 ADMIN RESET CODE for ${email}: ${code}`); // Log code for testing since no email service yet

        // TODO: Integrate actual email service (Nodemailer/SendGrid)

        // ⚠️ FOR TESTING ONLY: Returning code in response so you can verify it
        res.json({ success: true, message: "Verification code sent to your email", code });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔐 VERIFY RESET CODE (POST /api/admin/verify-reset-code)
export const verifyResetCode = async (req, res) => {
    try {
        const { email, code } = req.body;

        // Find admin user with matching email
        const user = await User.findOne({ email, role: "admin" });

        if (
            !user ||
            user.resetCode !== code ||
            !user.resetCodeExpiry ||
            user.resetCodeExpiry < Date.now()
        ) {
            return res.status(400).json({ success: false, message: "Invalid or expired code" });
        }

        res.json({ success: true, message: "Code verified" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 🔐 RESET PASSWORD (POST /api/admin/reset-password)
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email, role: "admin" });

        if (!user) {
            return res.status(400).json({ success: false, message: "User not found" });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        user.resetCode = undefined;
        user.resetCodeExpiry = undefined;

        await user.save();

        res.json({ success: true, message: "Password reset successful" });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 📊 DASHBOARD STATS (GET /api/admin/dashboard)
export const getDashboardStats = async (req, res) => {
    try {
        // 1. Get Counts
        const totalNews = await News.countDocuments(); // User manual posts
        const feedNewsCount = await FeedNews.countDocuments(); // Auto-fetched posts
        const userSubmitted = await News.countDocuments({ status: "pending" });
        const totalUsers = await User.countDocuments({ role: "user" });

        // Mock data for Quizzes as model might not exist yet
        const totalQuizzes = 156;
        const fakeNews = 23;

        // 2. Growth Stats (Standard static data to match UI)
        const growth = {
            news: 12.8,
            users: 23.1,
            quizzes: 5.2,
            fakeNews: -15.3
        };

        // 3. Recent Activity (Mock for now, will connect to logs later)
        const recentActivity = [
            {
                user: "John Doe",
                action: "Published new article",
                detail: "Breaking: Major Tech Announcement",
                time: "5 min ago",
                avatar: ""
            },
            {
                user: "Sarah Smith",
                action: "Submitted news for review",
                detail: "Politics Update",
                time: "15 min ago",
                avatar: ""
            },
            {
                user: "New User",
                action: "Registered an account",
                detail: "",
                time: "1 hour ago",
                avatar: ""
            }
        ];

        res.json({
            success: true,
            stats: {
                totalNews: totalNews + feedNewsCount, // Combine sources for big number
                userSubmitted,
                totalUsers,
                totalQuizzes,
                fakeNews,
                growth
            },
            analytics: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                newUsers: [400, 300, 500, 450, 600, 780],
                newsPublished: [250, 200, 320, 290, 410, 450]
            },
            quickStats: {
                totalViews: 156200, // Placeholder until tracking exists
                engagement: 89.5,
                activeUsers: 2341
            },
            recentActivity
        });

    } catch (error) {
        console.error("Dashboard Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 📰 NEWS MANAGEMENT
// ==========================================

// 1. GET ALL NEWS (With Filters & Pagination)
export const getAllNews = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, category, status } = req.query;
        const query = {};

        // Search by Title (English fallback for regex)
        if (search) {
            query["title.en"] = { $regex: search, $options: "i" };
        }

        if (category) query.category = category;
        if (status) query.status = status;

        const total = await News.countDocuments(query);
        const news = await News.find(query)
            .populate("author", "fullName email")
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            news
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET SINGLE NEWS
export const getSingleNews = async (req, res) => {
    try {
        const news = await News.findById(req.params.id).populate("author", "fullName");
        if (!news) return res.status(404).json({ success: false, message: "News not found" });

        res.json({ success: true, news });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. CREATE NEWS (Admin)
export const createNewsAdmin = async (req, res) => {
    try {
        const { title, description, category, language = "en", status = "draft" } = req.body;
        console.log("Admin Creating News:", req.body);

        // Handle Media Uploads
        let imageUrl = "", videoUrl = "", audioUrl = "";

        if (req.files) {
            if (req.files.image) imageUrl = `/uploads/images/${req.files.image[0].filename}`;
            if (req.files.video) videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
            if (req.files.audio) audioUrl = `/uploads/audio/${req.files.audio[0].filename}`;
        }

        // Construct Multilingual Objects
        // If admin selects "Hindi", we verify the input is going to title.hi
        // For simplicity, we default to saving in the specific lang key AND english as fallback if missing

        const titleObj = { [language]: title };
        const descObj = { [language]: description };

        if (language !== "en") {
            titleObj.en = title; // Fallback ensure
            descObj.en = description;
        }

        const newNews = new News({
            title: titleObj,
            description: descObj,
            category, // String or ObjectId depending on input
            language,
            status,
            source: "Admin",
            imageUrl,
            videoUrl,
            audioUrl,
            author: req.user._id,
            isUserPost: false
        });

        await newNews.save();

        res.status(201).json({ success: true, message: "News created successfully", news: newNews });

    } catch (error) {
        console.error("Create News Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. UPDATE NEWS
export const updateNewsAdmin = async (req, res) => {
    try {
        const { title, description, category, language, status } = req.body;
        const news = await News.findById(req.params.id);

        if (!news) return res.status(404).json({ success: false, message: "News not found" });

        // Update Text Fields
        if (title && language) news.title[language] = title;
        if (description && language) news.description[language] = description;
        if (category) news.category = category;
        if (status) news.status = status;
        if (language) news.language = language;

        // Handle Media Replacements
        if (req.files) {
            if (req.files.image) news.imageUrl = `/uploads/images/${req.files.image[0].filename}`;
            if (req.files.video) news.videoUrl = `/uploads/videos/${req.files.video[0].filename}`;
            if (req.files.audio) news.audioUrl = `/uploads/audio/${req.files.audio[0].filename}`;
        }

        await news.save();

        res.json({ success: true, message: "News updated successfully", news });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. DELETE NEWS
export const deleteNewsAdmin = async (req, res) => {
    try {
        const news = await News.findByIdAndDelete(req.params.id);
        if (!news) return res.status(404).json({ success: false, message: "News not found" });

        res.json({ success: true, message: "News deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 📬 USER SUBMITTED NEWS (APPROVAL SYSTEM)
// ==========================================

// 1. GET ALL SUBMISSIONS (With Filters)
export const getUserSubmissions = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        // Filter: Only User submitted news (assumes isUserPost: true or source: 'User')
        const filter = {
            $or: [
                { isUserPost: true },
                { source: { $in: ["User", "user", "Android", "iOS"] } }
            ]
        };

        if (search) {
            filter["title.en"] = { $regex: search, $options: "i" };
        }

        if (status) {
            filter.status = status;
        }

        console.log("Fetching Submissions with Filter:", JSON.stringify(filter));

        const submissions = await News.find(filter)
            .populate("author", "fullName email avatar")
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await News.countDocuments(filter);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            submissions
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET SUBMISSION STATS
export const getSubmissionStats = async (req, res) => {
    try {
        const filter = {
            $or: [
                { isUserPost: true },
                { source: { $in: ["User", "user", "Android", "iOS"] } }
            ]
        };

        const pending = await News.countDocuments({ ...filter, status: "pending" });
        const approved = await News.countDocuments({ ...filter, status: "published" }); // 'published' means approved/live
        const rejected = await News.countDocuments({ ...filter, status: "rejected" });
        const fake = await News.countDocuments({ ...filter, status: "fake" });

        res.json({
            success: true,
            stats: {
                pending,
                approved,
                rejected,
                fake
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. GET SINGLE SUBMISSION
export const getSingleSubmission = async (req, res) => {
    try {
        const submission = await News.findById(req.params.id)
            .populate("author", "fullName email avatar");

        if (!submission) {
            return res.status(404).json({ success: false, message: "Submission not found" });
        }

        res.json({ success: true, submission });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. APPROVE SUBMISSION
export const approveSubmission = async (req, res) => {
    try {
        await News.findByIdAndUpdate(req.params.id, {
            status: "published" // Make it live
        });

        res.json({ success: true, message: "Submission approved and published" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. REJECT SUBMISSION
export const rejectSubmission = async (req, res) => {
    try {
        await News.findByIdAndUpdate(req.params.id, {
            status: "rejected"
        });

        res.json({ success: true, message: "Submission rejected" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. MARK AS FAKE
// 6. MARK AS FAKE
export const markFakeSubmission = async (req, res) => {
    try {
        await News.findByIdAndUpdate(req.params.id, {
            status: "fake"
        });

        res.json({ success: true, message: "Submission marked as Fake News" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// ==========================================
// 👤 USERS MANAGEMENT
// ==========================================

// 1. GET ALL USERS (Search + Filter + Pagination)
export const getAllUsers = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status } = req.query;

        const filter = { role: "user" };

        if (search) {
            filter.fullName = { $regex: search, $options: "i" }; // Assuming fullName instead of name based on User model
        }

        if (status && status !== "all") {
            filter.status = status;
        }

        const users = await User.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments(filter);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET USER STATS (Top Cards)
export const getUserStats = async (req, res) => {
    try {
        const total = await User.countDocuments({ role: "user" });
        const active = await User.countDocuments({ role: "user", status: "active" });
        const blocked = await User.countDocuments({ role: "user", status: "blocked" });

        res.json({
            success: true,
            stats: { total, active, blocked }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. GET SINGLE USER (View Action)
export const getSingleUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get submission counts
        const totalSubmissions = await News.countDocuments({
            author: user._id, // Match by author ID
            $or: [{ isUserPost: true }, { source: { $in: ["User", "user", "Android", "iOS"] } }]
        });

        // You can add more detailed counts if needed (approved, pending, etc.)

        res.json({
            success: true,
            user: {
                ...user.toObject(),
                totalSubmissions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. BLOCK USER
export const blockUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, {
            status: "blocked"
        });

        res.json({ success: true, message: "User blocked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. UNBLOCK USER
export const unblockUser = async (req, res) => {
    try {
        await User.findByIdAndUpdate(req.params.id, {
            status: "active"
        });

        res.json({ success: true, message: "User unblocked successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 6. DELETE USER
export const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
