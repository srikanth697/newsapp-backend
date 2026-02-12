import mongoose from "mongoose";

/**
 * 📰 FEED NEWS MODEL
 * This is the unified feed that merges RSS + API news
 * Separate from the old News model for clean architecture
 */
const feedSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        summary: String,
        content: String,
        url: { type: String, unique: true, required: true },
        image: String,
        source: String,
        category: String,
        publishedAt: { type: Date, default: Date.now },

        // Engagement metrics
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 },
        savedCount: { type: Number, default: 0 },
        likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
        score: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// Index for faster queries
feedSchema.index({ score: -1 });
feedSchema.index({ publishedAt: -1 });
feedSchema.index({ category: 1 });

export default mongoose.model("FeedNews", feedSchema);
