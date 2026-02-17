import SystemSettings from "../models/SystemSettings.js";
import User from "../models/User.js";

/**
 * 🛠️ SYSTEM SETTINGS (Privacy Policy, Terms, etc.)
 */

// 1. GET SYSTEM SETTINGS
export const getSystemSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne();

        // Create default if none exists
        if (!settings) {
            settings = await SystemSettings.create({});
        }

        res.json({
            success: true,
            settings: {
                privacyPolicy: settings.privacyPolicy,
                termsAndConditions: settings.termsAndConditions
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. UPDATE SYSTEM SETTINGS (Admin Only)
export const updateSystemSettings = async (req, res) => {
    try {
        const { privacyPolicy, termsAndConditions } = req.body;

        let settings = await SystemSettings.findOne();
        if (!settings) {
            settings = new SystemSettings();
        }

        if (privacyPolicy !== undefined) settings.privacyPolicy = privacyPolicy;
        if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;

        await settings.save();

        res.json({
            success: true,
            message: "System settings updated successfully",
            settings
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * 👤 USER PREFERENCES (Theme, Notifications, 2FA)
 */

// 3. GET USER SETTINGS
export const getUserSettings = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.json({
            success: true,
            settings: {
                darkMode: user.darkMode,
                twoFactorEnabled: user.twoFactorEnabled,
                notificationPreferences: user.notificationPreferences
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. UPDATE ALL SETTINGS (Combined Save as per Screenshot)
export const saveAllSettings = async (req, res) => {
    try {
        const {
            darkMode,
            twoFactorEnabled,
            emailNotifications,
            pushNotifications,
            privacyPolicy,
            termsAndConditions
        } = req.body;

        const user = await User.findById(req.userId);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Update User Preferences
        if (darkMode !== undefined) user.darkMode = darkMode;
        if (twoFactorEnabled !== undefined) user.twoFactorEnabled = twoFactorEnabled;

        if (user.notificationPreferences) {
            if (emailNotifications !== undefined) user.notificationPreferences.emailNotifications = emailNotifications;
            if (pushNotifications !== undefined) user.notificationPreferences.pushNotifications = pushNotifications;
        }

        await user.save();

        // Update System Settings (If User is Admin and fields provided)
        if (user.role === "admin" && (privacyPolicy !== undefined || termsAndConditions !== undefined)) {
            let sysSettings = await SystemSettings.findOne();
            if (!sysSettings) sysSettings = new SystemSettings();

            if (privacyPolicy !== undefined) sysSettings.privacyPolicy = privacyPolicy;
            if (termsAndConditions !== undefined) sysSettings.termsAndConditions = termsAndConditions;

            await sysSettings.save();
        }

        res.json({
            success: true,
            message: "All settings saved successfully",
            userSettings: {
                darkMode: user.darkMode,
                twoFactorEnabled: user.twoFactorEnabled,
                notificationPreferences: user.notificationPreferences
            }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
