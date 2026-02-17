
import User from "../models/User.js";
import News from "../models/News.js";
import FeedNews from "../models/FeedNews.js";
import Quiz from "../models/Quiz.js";
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
                fullName: user.fullName || "Admin",
                email: user.email,
                role: user.role,
                avatar: user.avatar || "",
                phone: user.phone || "N/A",
                joinedAt: user.createdAt
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
        // 1. Get Core Counts
        const adminNews = await News.countDocuments({ isUserPost: false, source: "Admin" });
        const userSubmitted = await News.countDocuments({ status: "pending" });
        const totalUsers = await User.countDocuments({ role: "user" });
        const totalQuizzes = await Quiz.countDocuments();
        const fakeNews = await News.countDocuments({ status: "fake" });

        // 2. API vs RSS Breakdown
        const rssSources = ["BBC News", "NY Times World", "BBC Tech", "The Guardian"];

        const rssCount = await FeedNews.countDocuments({ source: { $in: rssSources } });
        const apiCount = (await FeedNews.countDocuments({ source: { $nin: rssSources } }))
            + (await News.countDocuments({ source: "NewsAPI" }));

        const feedNewsCount = await FeedNews.countDocuments();

        // 3. Category Breakdown (for charts)
        const categories = await FeedNews.aggregate([
            { $group: { _id: "$category", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);

        // 4. Growth Stats (Standard static data for now)
        const growth = {
            news: 12.8,
            users: 23.1,
            quizzes: 5.2,
            fakeNews: -15.3
        };

        // 5. Recent Activity (Fetch real recent logs/posts)
        const recentNews = await News.find()
            .populate("author", "fullName avatar")
            .sort({ createdAt: -1 })
            .limit(3);

        const recentActivity = recentNews.map(item => ({
            user: item.author?.fullName || "Admin",
            action: item.status === "published" ? "Published news" : "Submitted news",
            detail: item.title?.en || "New Post",
            time: "Recently",
            avatar: item.author?.avatar || ""
        }));

        res.json({
            success: true,
            stats: {
                totalNews: adminNews + feedNewsCount + (await News.countDocuments({ isUserPost: true })),
                rssNews: rssCount,
                apiNews: apiCount,
                userSubmitted,
                totalUsers,
                totalQuizzes,
                fakeNews,
                growth
            },
            analytics: {
                months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                newUsers: [400, 300, 500, 450, 600, 780],
                newsPublished: [250, 200, 320, 290, 410, 450],
                categories: categories.map(c => ({ name: c._id, value: c.count }))
            },
            quickStats: {
                totalViews: 156200,
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

        if (search && search !== "undefined") {
            filter.fullName = { $regex: search, $options: "i" };
        }

        if (status && status !== "all") {
            if (status === "active") {
                filter.$or = [{ status: "active" }, { status: { $exists: false } }];
            } else {
                filter.status = status;
            }
        }

        const users = await User.find(filter)
            .select("fullName email phone avatar status createdAt postsCount") // Only required fields
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
        const user = await User.findById(req.params.id)
            .select("fullName email phone avatar status createdAt location bio");

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Get submission counts and actual posts for the list
        const totalSubmissions = await News.countDocuments({ author: user._id });
        const approvedSubmissions = await News.countDocuments({ author: user._id, status: "published" });

        const submissions = await News.find({ author: user._id })
            .select("title.en publishedAt status")
            .sort({ createdAt: -1 })
            .limit(10);

        const responseData = {
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                avatar: user.avatar,
                status: user.status || "active",
                joinedAt: user.createdAt,
                location: user.location,
                bio: user.bio,
                stats: {
                    totalSubmissions,
                    approvedSubmissions
                },
                submissions: submissions.map(s => ({
                    _id: s._id,
                    title: s.title.en,
                    date: s.publishedAt,
                    status: s.status
                }))
            }
        };

        res.json(responseData);
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

// ==========================================
// ⚙️ ADMIN PROFILE MANAGEMENT
// ==========================================

// 1. GET ADMIN PROFILE
export const getAdminProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Calculate specific stats for this admin if needed
        const articlesPublished = await News.countDocuments({ author: user._id });
        const actionsTaken = 45; // Mock or calculate from logs
        const pendingReviews = await News.countDocuments({ status: "pending" });

        res.json({
            success: true,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phone: user.phone || "N/A",
                bio: user.bio || "N/A",
                location: user.location || "N/A",
                avatar: user.avatar || "",
                status: user.status || "active",
                joinedAt: user.createdAt,
                stats: {
                    articlesPublished,
                    pendingReviews,
                    actionsTaken
                }
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. UPDATE ADMIN PROFILE
export const updateAdminProfile = async (req, res) => {
    try {
        // Destructure and handle potential space in field names from Postman/Frontend
        let { fullName, email, phone, bio, currentPassword, newPassword, changepassword } = req.body;

        // Map space-separated or variation keys if they exist
        if (req.body["full name"]) fullName = req.body["full name"];
        if (changepassword) newPassword = changepassword;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Update Basic Info
        if (fullName) user.fullName = fullName.trim();
        if (email) user.email = email.toLowerCase().trim();
        if (phone) user.phone = phone.trim();
        if (bio) user.bio = bio.trim();

        // Update Password if provided
        if (currentPassword && newPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                return res.status(400).json({ success: false, message: "Current password is incorrect" });
            }
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);
        }

        // Handle Avatar Upload
        if (req.files && req.files.image) {
            user.avatar = `/uploads/images/${req.files.image[0].filename}`;
        }

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
                phone: user.phone || "N/A",
                bio: user.bio || "N/A",
                location: user.location || "N/A",
                avatar: user.avatar || "",
                status: user.status || "active",
                joinedAt: user.createdAt
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
