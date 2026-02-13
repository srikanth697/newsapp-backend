import express from "express";
import {
    signup,
    login,
    forgotPassword,
    verifyOTP,
    resetPassword,
    getProfile,
    updateProfile,
    updateSettings,
    googleLogin,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/google-login", googleLogin);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);

// User Profile
router.get("/profile", protect, getProfile);
router.post("/update", protect, updateProfile);
router.post("/settings/update", protect, updateSettings);


export default router;
