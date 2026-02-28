import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Quiz from './src/modules/quiz/quiz.model.js';
import News from './src/modules/news/news.model.js';

dotenv.config();

async function seed() {
    await mongoose.connect(process.env.MONGODB_URI);

    // Clear old quizzes to ensure fresh UI data
    await Quiz.deleteMany({});
    console.log("🗑️ Cleared old quizzes.");

    // Find some news to link to
    const news = await News.find().limit(3);

    const demoQuizzes = [
        {
            title: "Indian History Quiz",
            description: "Test your knowledge about Indian history with these 5 curated questions.",
            category: "politics",
            difficulty: "medium",
            active: true,
            image: "https://plus.unsplash.com/premium_photo-1661919589683-f11880119fb7?auto=format&fit=crop&q=80&w=1000",
            questions: [
                { question: "What is the capital of India?", options: ["Mumbai", "New Delhi", "Kolkata", "Chennai"], correctAnswer: "New Delhi", explanation: "New Delhi was officially inaugurated as the capital in 1931." },
                { question: "Which year did India gain independence?", options: ["1942", "1945", "1947", "1950"], correctAnswer: "1947", explanation: "India gained independence from British rule on August 15, 1947." },
                { question: "What is the national animal of India?", options: ["Lion", "Elephant", "Tiger", "Peacock"], correctAnswer: "Tiger", explanation: "The Royal Bengal Tiger is the national animal." }
            ]
        },
        {
            title: "Sports Trivia",
            description: "Are you a true sports fan? Prove it by scoring 5/5 in this trivia!",
            category: "sports",
            difficulty: "easy",
            active: true,
            image: "https://images.unsplash.com/photo-1541252260730-0412e3e21079?auto=format&fit=crop&q=80&w=1000",
            questions: [
                { question: "Who won the FIFA World Cup 2022?", options: ["France", "Argentina", "Brazil", "Germany"], correctAnswer: "Argentina" },
                { question: "How many players are in a cricket team?", options: ["9", "10", "11", "12"], correctAnswer: "11" }
            ]
        },
        {
            title: "Current Affairs",
            description: "Stay updated with the latest happenings around the globe.",
            category: "current-affairs",
            difficulty: "hard",
            active: true,
            image: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=1000",
            questions: [
                { question: "Which country is hosting the 2024 Olympics?", options: ["USA", "Japan", "France", "China"], correctAnswer: "France" }
            ]
        }
    ];

    await Quiz.insertMany(demoQuizzes);
    console.log("✅ Seeded 3 UI-Ready Quizzes.");
    process.exit(0);
}

seed();
