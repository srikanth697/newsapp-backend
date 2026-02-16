import mongoose from "mongoose";

const NewsSchema = new mongoose.Schema({
    // Multilingual Fields
    title: {
        en: { type: String, required: true }, // English is mandatory as fallback
        te: String,
        hi: String,
        ta: String,
        kn: String,
        ml: String
    },
    description: {
        en: String, // Description might be optional in some cases, but good to have en fallback
        te: String,
        hi: String,
        ta: String,
        kn: String,
        ml: String
    },
    content: {
        en: String,
        te: String,
        hi: String,
        ta: String,
        kn: String,
        ml: String
    },

    // Media
    imageUrl: { type: String }, // URL or Base64 string
    videoUrl: { type: String }, // NEW: Video file path
    audioUrl: { type: String }, // NEW: Audio file path
    source: { type: String, default: "Admin" }, // Default "Admin" now
    sourceUrl: String,

    // Metadata
    category: { type: mongoose.Schema.Types.Mixed, required: true, index: true }, // Allow String OR ObjectId
    language: { type: String, default: "en" }, // NEW: Specific language of the post
    country: { type: String, default: "IN" },

    publishedAt: { type: Date, default: Date.now, index: true },

    // Social Counters
    views: { type: Number, default: 0 }, // NEW: View Count
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    savedCount: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

    // User / Admin Fields
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    status: {
        type: String,
        enum: ["draft", "published", "pending", "approved", "rejected"], // Updated Enums
        default: "draft",
        index: true
    },
    rejectionReason: String,
    isUserPost: { type: Boolean, default: false },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

// Indexes for performance
NewsSchema.index({ "title.en": "text", "description.en": "text" });
NewsSchema.index({ category: 1, publishedAt: -1 });

export default mongoose.model("News", NewsSchema);
