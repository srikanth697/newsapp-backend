import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  content: { type: String },
  image: { type: String },
  source: { type: String },
  category: { type: String },
  publishedAt: { type: Date, required: true },
  url: { type: String, required: true, unique: true },

  // Backward compatibility fields for old controller queries
  slug: { type: String },
  shortDescription: { type: String },
  rewrittenContent: { type: String },
  country: { type: String },
  isToday: { type: Boolean, default: true },
  isFresh: { type: Boolean, default: true },
  quiz: { type: Array, default: [] },
  contentHash: { type: String },
  similarityFingerprint: { type: String },
  trendingScore: { type: Number, default: 0 },
  views: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model("News", newsSchema);
