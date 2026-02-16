
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
