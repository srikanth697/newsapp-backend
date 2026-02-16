
import Notification from "../models/Notification.js";

/**
 * Creates a system notification for the admin.
 * @param {string} title - Notification title
 * @param {string} message - Notification details
 * @param {string} type - 'info', 'success', 'warning', 'error'
 */
export const createSystemNotification = async (title, message, type = "info") => {
    try {
        await Notification.create({
            title,
            message,
            type,
            recipient: "admin",
            isRead: false
        });
        console.log(`🔔 System Notification Created: ${title}`);
    } catch (error) {
        console.error("Failed to create system notification:", error.message);
    }
};
