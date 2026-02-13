import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
    title: String,
    description: String,
    content: String,
    image: String,
    sourceUrl: String,

    country: String,       // IN, US, GLOBAL
    category: String,      // politics, sports, business, tech, etc.

    publishedAt: { type: Date, default: Date.now },

    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    savedCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // 👤 User Post Fields
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    rejectionReason: String,
    isUserPost: { type: Boolean, default: false },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// 🔥 Keep only 30 days data
NewsSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: 60 * 60 * 24 * 30 }
);

export default mongoose.model("News", NewsSchema);
