import axios from "axios";
import slugify from "slugify";
import Parser from "rss-parser";
import dayjs from "dayjs";
import crypto from "crypto";
import News from "./news.model.js";
import { callDeepSeek } from "../../services/ai.service.js";

const parser = new Parser();
let isFetching = false;

// 🕒 Freshness: Allow news from last 24 hours (not just calendar day)
const isRecent = (date) => {
    const pubDate = dayjs(date);
    const now = dayjs();
    return pubDate.isAfter(now.subtract(24, 'hour')) || pubDate.isSame(now, 'day');
};

// 🌐 English ONLY Check (Allow Latin characters and common punctuation)
const isEnglish = (text) => {
    if (!text) return false;
    // Expanded regex to allow standard Western punctuation and quotes
    const regex = /^[\u0000-\u00FF\u2010-\u205E\u2060-\u206F]*$/;
    return regex.test(text);
};

const generateHash = (content) =>
    crypto.createHash("md5").update(content).digest("hex");

const calculateTrendingScore = (views, publishedAt) => {
    const hoursOld = dayjs().diff(dayjs(publishedAt), "hour");
    return Math.max(100 - hoursOld, 0) + (views * 2);
};

const detectCategoryWithAI = async (title, content) => {
    try {
        const prompt = `Classify this news into exactly one category: politics, business, technology, sports, entertainment, current-affairs. Return only the category word.\n\nTitle: ${title}\nContent: ${content.substring(0, 300)}`;
        const result = await callDeepSeek("You are a news classification AI.", prompt);
        const cat = result.trim().toLowerCase().split(' ')[0].replace(/[^a-z-]/g, "");
        const validCategories = ["politics", "business", "technology", "sports", "entertainment", "current-affairs"];
        return validCategories.includes(cat) ? cat : "current-affairs";
    } catch (e) {
        return "current-affairs";
    }
};

const saveArticle = async (article) => {
    try {
        const title = article.title?.trim();
        const rawContent = article.description || article.content || title;

        if (!title) return false;

        // Validation 1: English Check
        if (!isEnglish(title)) {
            console.log(`⏩ Rejected (Language): ${title.substring(0, 30)}...`);
            return false;
        }

        const slug = slugify(title, { lower: true, strict: true, trim: true });
        if (!slug || slug === "!") return false;

        const image = article.image || article.urlToImage || article.enclosure?.url;
        const publishedAt = article.publishedAt || article.pubDate;

        // Validation 2: Image Check
        if (!image) {
            console.log(`⏩ Rejected (No Image): ${title.substring(0, 30)}...`);
            return false;
        }

        // Validation 3: Date Check (24-hour window)
        if (!publishedAt || !isRecent(publishedAt)) {
            console.log(`⏩ Rejected (Not Recent): ${title.substring(0, 30)}... (${publishedAt})`);
            return false;
        }

        const contentHash = generateHash(rawContent);
        const similarityFingerprint = rawContent.slice(0, 300);

        // 1. Similarity Check (Prevents nearly identical news from different sources)
        const simExisting = await News.findOne({ similarityFingerprint });
        if (simExisting) return false;

        // 2. Atomic Upsert Check
        const result = await News.updateOne(
            { contentHash },
            {
                $setOnInsert: {
                    title,
                    slug,
                    shortDescription: article.description || title,
                    rewrittenContent: "Processing AI Rewrite...",
                    image,
                    category: "current-affairs",
                    source: article.source?.name || article.source || "Global",
                    publishedAt: new Date(publishedAt),
                    isToday: true, // We mark recent articles as 'today' for the UI tabs
                    contentHash,
                    similarityFingerprint
                }
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log(`🆕 Save Success: ${title.substring(0, 40)}...`);

            try {
                // Parallel Processing for Speed
                const [aiCategory, rewritten] = await Promise.all([
                    detectCategoryWithAI(title, rawContent),
                    callDeepSeek(
                        "You are a professional journalist. Rewrite this news into professional English (400-500 words). Maintain factual accuracy. No plagiarism.",
                        `Source: ${article.source?.name || "Global"}\nTitle: ${title}\nContent: ${rawContent}`
                    )
                ]);

                if (rewritten) {
                    await News.updateOne(
                        { contentHash },
                        {
                            $set: {
                                rewrittenContent: rewritten,
                                category: aiCategory,
                                aiCategory,
                                trendingScore: calculateTrendingScore(0, publishedAt)
                            }
                        }
                    );
                    console.log(`✅ Optimized (AI): ${title.substring(0, 30)}`);
                }
            } catch (aiErr) {
                console.warn(`⚠️ AI Enrichment failed for article: ${title.substring(0, 30)}`);
            }
            return true;
        }

        return false;
    } catch (err) {
        if (err.code !== 11000) console.error("Internal Save Error:", err.message);
        return false;
    }
};

export const fetchFromGNews = async () => {
    console.log("📡 Polling GNews...");
    try {
        const res = await axios.get(`https://gnews.io/api/v4/top-headlines?country=in&lang=en&token=${process.env.GNEWS_API_KEY}`);
        let count = 0;
        if (res.data.articles) {
            for (const art of res.data.articles) if (await saveArticle(art)) count++;
        }
        return count;
    } catch (e) {
        console.error("GNews Error:", e.response?.data || e.message);
        return 0;
    }
};

export const fetchFromNewsAPI = async () => {
    console.log("📡 Polling NewsAPI...");
    try {
        const res = await axios.get(`https://newsapi.org/v2/top-headlines?country=in&language=en&apiKey=${process.env.NEWS_API_KEY}`);
        let count = 0;
        if (res.data.articles) {
            for (const art of res.data.articles) if (await saveArticle(art)) count++;
        }
        return count;
    } catch (e) {
        console.error("NewsAPI Error:", e.response?.data || e.message);
        return 0;
    }
};

export const fetchFromRSS = async () => {
    console.log("📡 Polling BBC RSS...");
    try {
        const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
        let count = 0;
        for (const item of feed.items) if (await saveArticle(item)) count++;
        return count;
    } catch (e) {
        console.error("RSS Error:", e.message);
        return 0;
    }
};

export const runCronFetch = async () => {
    if (isFetching) return console.log("⏳ Fetch job already running.");
    isFetching = true;

    try {
        console.log("🔁 Starting Multi-Layer News Fetch...");

        let count = await fetchFromGNews();
        // If GNews hits limit or is empty, try NewsAPI
        if (count === 0) {
            console.log("🔄 GNews zero result. Switching to NewsAPI fallback...");
            count = await fetchFromNewsAPI();
        }
        // If both failed, try RSS
        if (count === 0) {
            console.log("🔄 Fallback to RSS...");
            count = await fetchFromRSS();
        }

        console.log(`🏁 Fetch cycle finished. Articles added: ${count}`);
    } catch (error) {
        console.error("Global Fetch Error:", error.message);
    } finally {
        isFetching = false;
    }
};

export const fetchAllNews = runCronFetch;
