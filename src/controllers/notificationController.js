
import Notification from "../models/Notification.js";
import User from "../models/User.js";

// ==========================================
// 🔔 NOTIFICATION MANAGEMENT
// ==========================================

// 1. GET ALL NOTIFICATIONS (List View)
export const getAllNotifications = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, type, isRead } = req.query;
        let filter = { recipient: "admin" }; // Default to Admin Inbound for Dashboard

        if (search) {
            filter.title = { $regex: search, $options: "i" };
        }

        if (type) {
            filter.type = type;
        }

        if (isRead !== undefined) {
            filter.isRead = isRead === "true";
        }

        const notifications = await Notification.find(filter)
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await Notification.countDocuments(filter);

        res.json({
            success: true,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 1b. GET UNREAD NOTIFICATIONS (Convenience)
export const getUnreadNotifications = async (req, res) => {
    try {
        const { limit = 5 } = req.query;
        const notifications = await Notification.find({ recipient: "admin", isRead: false })
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        const count = await Notification.countDocuments({ recipient: "admin", isRead: false });

        res.json({
            success: true,
            count,
            notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. GET NOTIFICATION STATS (Dashboard Cards)
export const getNotificationStats = async (req, res) => {
    try {
        const total = await Notification.countDocuments({ recipient: "admin" });
        const unread = await Notification.countDocuments({ recipient: "admin", isRead: false });
        const read = await Notification.countDocuments({ recipient: "admin", isRead: true });

        res.json({
            success: true,
            stats: { total, unread, read }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. SEND NOTIFICATION (Action Button)
export const sendNotification = async (req, res) => {
    try {
        let { title, message, targetAudience = "All Users" } = req.body;

        // Normalize targetAudience to match Enum
        const audienceMap = {
            "all": "All Users",
            "active": "Active Users",
            "inactive": "Inactive Users"
        };
        if (targetAudience && audienceMap[targetAudience.toLowerCase()]) {
            targetAudience = audienceMap[targetAudience.toLowerCase()];
        }
        let imageUrl = "";

        if (req.file) {
            imageUrl = `/uploads/images/${req.file.filename}`;
        }

        // Logic here: Typically you'd use FCM (Firebase) to push to devices.
        // For now, we'll store it as a "System Broadcast" in the DB.

        // Option 1: Create a single record for "All Users"
        const notification = await Notification.create({
            title,
            message,
            type: "info", // Default for broadcasts
            recipient: "all",
            targetAudience,
            image: imageUrl,
            isRead: false
        });

        // Option 2: If you want INDIVIDUAL records for every user (heavy), iterate.
        // We stick to Option 1 for scalability.

        res.status(201).json({
            success: true,
            message: `Notification sent to ${targetAudience}`,
            notification
        });

    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 4. MARK AS READ (Blue Dot Click)
export const markNotificationRead = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.json({ success: true, message: "Marked as read", notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 5. DELETE NOTIFICATION
export const deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByIdAndDelete(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: "Notification not found" });
        }

        res.json({ success: true, message: "Notification deleted" });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
