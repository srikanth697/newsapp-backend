import mongoose from "mongoose";

const attemptSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    category: String,
    score: { type: Number, required: true },
    totalQuestions: { type: Number, required: true },
    completedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("QuizAttempt", attemptSchema);
