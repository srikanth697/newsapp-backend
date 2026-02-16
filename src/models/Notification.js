import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    type: {
        type: String,
        enum: ["info", "success", "warning", "error"],
        default: "info"
    },
    recipient: {
        type: String, // 'admin', 'all', or specific userId
        required: true,
        default: 'admin' // Default to system alerts for admin
    },
    targetAudience: { // Specifically for the "Send Notification" feature
        type: String,
        enum: ["All Users", "Active Users", "Inactive Users"],
        default: "All Users"
    },
    image: {
        type: String, // URL to uploaded image
        default: ""
    },
    isRead: {
        type: Boolean,
        default: false
    },
    readBy: [{ // For broadcast notifications, track who read it (optional scaling)
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }]
}, {
    timestamps: true
});

export default mongoose.model("Notification", notificationSchema);
