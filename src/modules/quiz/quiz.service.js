import News from "../news/news.model.js";
import Quiz from "./quiz.model.js";
import { callDeepSeek } from "../../services/ai.service.js";
import axios from "axios";

const QUIZ_PROMPT = `Generate 5 multiple-choice questions based ONLY on the provided news article content. 
Rules:
- 4 options per question.
- 1 correct answer.
- Fact-based, do not invent facts.
- Provide explanation why the answer is correct.
- Return ONLY a JSON array with this format:
[
  {
    "question": "text",
    "options": ["a", "b", "c", "d"],
    "correctAnswer": "exact string match from options",
    "explanation": "text"
  }
]`;

export const generateQuizFromNewsId = async (newsId) => {
    const news = await News.findById(newsId);
    if (!news || !news.rewrittenContent) throw new Error("Rewritten content required for quiz");

    const existing = await Quiz.findOne({ newsId });
    if (existing) return existing;

    console.log(`🧠 Generating Quiz for News: ${news.title.substring(0, 30)}...`);

    const aiResponse = await callDeepSeek(QUIZ_PROMPT, news.rewrittenContent);
    const questions = JSON.parse(aiResponse.replace(/```json|```/g, ""));

    return await Quiz.create({
        category: news.category,
        newsId: news._id,
        questions
    });
};

export const generateQuizFromSource = async (urlOrContent) => {
    let content = urlOrContent;

    // Basic URL detection
    if (urlOrContent.startsWith("http")) {
        const res = await axios.get(urlOrContent);
        content = res.data; // Note: In production you might use a proper scraper like Cheerio
    }

    const aiResponse = await callDeepSeek(QUIZ_PROMPT, content);
    const questions = JSON.parse(aiResponse.replace(/```json|```/g, ""));

    return await Quiz.create({
        category: "custom",
        questions
    });
};

export const getQuestionsByCategory = async (category) => {
    // Find latest quiz for this category
    const quiz = await Quiz.findOne({ category }).sort({ createdAt: -1 });
    if (!quiz) throw new Error("No quiz found for this category");
    return quiz;
};
