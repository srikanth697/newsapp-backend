import mongoose from "mongoose";

const newsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  originalUrl: { type: String, required: true, unique: true },
  source: { type: String, required: true },
  image: String,
  fullContent: { type: String, required: true },
  publishedAt: { type: Date, required: true }
}, { timestamps: true });

export default mongoose.model("News", newsSchema);
