
import User from "../models/User.js";
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

        res.json({ success: true, message: "Verification code sent to your email" });

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
