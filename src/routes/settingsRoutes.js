import express from "express";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import {
    getSystemSettings,
    updateSystemSettings,
    getUserSettings,
    saveAllSettings
} from "../controllers/settingsController.js";

const router = express.Router();

/**
 * @route   GET /api/settings/system
 * @desc    Get Privacy Policy and Terms & Conditions
 * @access  Public (or protected depending on app needs)
 */
router.get("/system", getSystemSettings);

/**
 * @route   GET /api/settings/me
 * @desc    Get current user theme/notification preferences
 * @access  Private
 */
router.get("/me", protect, getUserSettings);

/**
 * @route   POST /api/settings/save-all
 * @desc    Save all settings from the screenshot (Theme, 2FA, Notifications, Policy)
 * @access  Private
 */
router.post("/save-all", protect, saveAllSettings);

/**
 * @route   PUT /api/settings/system
 * @desc    Update only system settings
 * @access  Private/Admin
 */
router.put("/system", protect, adminOnly, updateSystemSettings);

export default router;
