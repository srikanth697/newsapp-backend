import mongoose from "mongoose";

const quizSchema = new mongoose.Schema({
    category: { type: String, required: true },
    newsId: { type: mongoose.Schema.Types.ObjectId, ref: 'News' },
    questions: [{
        question: { type: String, required: true },
        options: [{ type: String, required: true }],
        correctAnswer: { type: String, required: true },
        explanation: String
    }],
    active: { type: Boolean, default: true }
}, { timestamps: true });

quizSchema.index({ category: 1 });

export default mongoose.model("Quiz", quizSchema);
