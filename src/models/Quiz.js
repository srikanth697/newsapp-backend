
import mongoose from "mongoose";

const QuizSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        default: "general",
        enum: ["general", "science", "history", "geography", "entertainment", "sports", "politics", "business", "technology", "world"]
    },
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium"
    },
    questions: [
        {
            questionText: { type: String, required: true },
            options: [{ type: String, required: true }], // Array of 4 options
            correctOptionIndex: { type: Number, required: true }, // 0-3
            explanation: String
        }
    ],
    status: {
        type: String,
        enum: ["draft", "published", "archived"],
        default: "draft"
    },
    // 🔗 AI News Link
    newsId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "News",
        default: null
    },
    sourceType: {
        type: String,
        enum: ["admin", "ai_content", "ai_news"],
        default: "admin"
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    timerMinutes: {
        type: Number,
        default: 5
    }
}, {
    timestamps: true
});

// Faster public quiz listing
QuizSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Quiz", QuizSchema);


