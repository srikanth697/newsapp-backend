import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: String,
    rewrittenContent: { type: String, default: "Rewriting in progress..." },
    image: { type: String, required: true },
    source: String,
    author: { type: String, default: "First Report Staff" },

    category: { type: String, required: true },
    aiCategory: String,

    country: { type: String, default: "world" },
    publishedAt: { type: Date, required: true },
    isToday: { type: Boolean, default: true },

    views: { type: Number, default: 0 },
    trendingScore: { type: Number, default: 0 },

    contentHash: { type: String, unique: true }, // Logic: MD5 of raw content
    similarityFingerprint: String // Logic: First 300 chars for similarity detection

}, { timestamps: true });

newsSchema.index({ slug: 1 }, { unique: true });
newsSchema.index({ contentHash: 1 }, { unique: true });
newsSchema.index({ category: 1, isToday: 1 });
newsSchema.index({ publishedAt: -1 });
newsSchema.index({ trendingScore: -1 });
newsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("News", newsSchema);
