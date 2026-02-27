import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true, unique: true },
    slug: { type: String, required: true },
    shortDescription: String,
    rewrittenContent: String,
    image: { type: String, required: true }, // Every saved article MUST contain image
    source: String,
    author: { type: String, default: "First Report Staff" },
    category: { type: String, required: true },
    country: { type: String, default: "world" },
    publishedAt: { type: Date, required: true },
    isToday: { type: Boolean, default: true },
    views: { type: Number, default: 0 }
}, { timestamps: true });

// Indexes for performance
newsSchema.index({ category: 1, isToday: 1 });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 Day TTL

export default mongoose.model("News", newsSchema);
