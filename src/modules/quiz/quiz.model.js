import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    category: { type: String, required: true, index: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    image: { type: String }, // Optional direct image URL fallback
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News' },
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: String, required: true },
        explanation: String
    }],
    active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("Quiz", quizSchema);
