import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

/* =========================
   SIGNUP
========================= */
export const signup = async (req, res) => {
    try {
        const { fullName, email, phone, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password required",
            });
        }

        const userExists = await User.findOne({
            $or: [{ email }, { phone }],
        });

        if (userExists) {
            return res.status(409).json({
                success: false,
                code: "USER_EXISTS",
                message: "User already exists",
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            email,
            phone,
            password: hashedPassword,
        });

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            success: true,
            code: "SIGNUP_SUCCESS",
            message: "User registered successfully",
            token,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   LOGIN
========================= */
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                code: "USER_NOT_FOUND",
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                code: "INVALID_PASSWORD",
            });
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            success: true,
            code: "LOGIN_SUCCESS",
            message: "Login successful",
            token,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   FORGOT PASSWORD (SEND OTP)
========================= */
export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Email not registered",
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        user.resetOTP = otp;
        user.resetOTPExpire = Date.now() + 5 * 60 * 1000;
        await user.save();

        console.log("RESET OTP:", otp); // later send email

        res.json({
            success: true,
            message: "OTP sent",
            otp: otp
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   VERIFY OTP
========================= */
export const verifyOTP = async (req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        if (
            !user ||
            user.resetOTP !== otp ||
            user.resetOTPExpire < Date.now()
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired OTP",
            });
        }

        res.json({
            success: true,
            message: "OTP verified",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   RESET PASSWORD
========================= */
export const resetPassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetOTP = null;
        user.resetOTPExpire = null;
        await user.save();

        res.json({
            success: true,
            message: "Password reset successful",
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   GET PROFILE
========================= */
export const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId).select("-password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   UPDATE PROFILE
========================= */
export const updateProfile = async (req, res) => {
    try {
        const { fullName, phone, location } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (fullName) user.fullName = fullName;
        if (phone) user.phone = phone;
        if (location) user.location = location;

        await user.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            user: {
                fullName: user.fullName,
                email: user.email,
                phone: user.phone,
                location: user.location,
                readsCount: user.readsCount,
                postsCount: user.postsCount,
                createdAt: user.createdAt
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/* =========================
   UPDATE SETTINGS (Dark Mode / Language / Notifications)
========================= */
export const updateSettings = async (req, res) => {
    try {
        const { darkMode, language, notificationPreferences, quietHours } = req.body;
        const user = await User.findById(req.userId);

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (typeof darkMode !== 'undefined') user.darkMode = darkMode;
        if (language) user.language = language;

        // Update Notification Preferences
        if (notificationPreferences) {
            if (typeof notificationPreferences.allNotifications !== 'undefined') user.notificationPreferences.allNotifications = notificationPreferences.allNotifications;
            if (typeof notificationPreferences.breakingNews !== 'undefined') user.notificationPreferences.breakingNews = notificationPreferences.breakingNews;
            if (typeof notificationPreferences.trendingNews !== 'undefined') user.notificationPreferences.trendingNews = notificationPreferences.trendingNews;
            if (typeof notificationPreferences.quizReminders !== 'undefined') user.notificationPreferences.quizReminders = notificationPreferences.quizReminders;
            if (typeof notificationPreferences.postUpdates !== 'undefined') user.notificationPreferences.postUpdates = notificationPreferences.postUpdates;
        }

        // Update Quiet Hours
        if (quietHours) {
            if (quietHours.from) user.quietHours.from = quietHours.from;
            if (quietHours.to) user.quietHours.to = quietHours.to;
        }

        await user.save();

        res.json({
            success: true,
            message: "Settings updated",
            settings: {
                darkMode: user.darkMode,
                language: user.language,
                notificationPreferences: user.notificationPreferences,
                quietHours: user.quietHours
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


