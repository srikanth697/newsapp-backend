import axios from "axios";
import slugify from "slugify";
import Parser from "rss-parser";
import dayjs from "dayjs";
import crypto from "crypto";
import News from "./news.model.js";
import { callDeepSeek } from "../../services/ai.service.js";

const parser = new Parser();
let isFetching = false;

const isToday = (date) => dayjs(date).isSame(dayjs(), "day");

// 🌐 English ONLY Check (Regular Expression for Basic Latin characters)
const isEnglish = (text) => /^[\x00-\x7F]*$/.test(text);

const generateHash = (content) =>
    crypto.createHash("md5").update(content).digest("hex");

const calculateTrendingScore = (views, publishedAt) => {
    const hoursOld = dayjs().diff(dayjs(publishedAt), "hour");
    return Math.max(100 - hoursOld, 0) + (views * 2);
};

// 🧠 AI Intelligence: Category Detection
const detectCategoryWithAI = async (title, content) => {
    try {
        const prompt = `Classify this news into exactly one category: politics, business, technology, sports, entertainment, current-affairs. Return only the category word.\n\nTitle: ${title}\nContent Snippet: ${content.substring(0, 300)}`;
        const result = await callDeepSeek("You are a news classification AI.", prompt);
        return result.trim().toLowerCase().split(' ')[0].replace(/[^a-z-]/g, "");
    } catch (e) {
        return "current-affairs";
    }
};

const saveArticle = async (article) => {
    try {
        const title = article.title?.trim();
        const rawContent = article.description || article.content || title;

        // 1. Language & Content Guards
        if (!title || !isEnglish(title)) return false;

        const slug = slugify(title, { lower: true, strict: true, trim: true });
        if (!slug || slug === "!") return false;

        const image = article.image || article.urlToImage || article.enclosure?.url;
        const publishedAt = article.publishedAt || article.pubDate;

        if (!image || !publishedAt || !isToday(publishedAt)) return false;

        // 2. Multi-Layer Duplicate Detection
        const contentHash = generateHash(rawContent);
        const similarityFingerprint = rawContent.slice(0, 300);

        // Check fingerprint (Similiarity)
        const simExisting = await News.findOne({ similarityFingerprint });
        if (simExisting) return false;

        // 3. Atomic Upsert Strategy
        const result = await News.updateOne(
            { contentHash },
            {
                $setOnInsert: {
                    title,
                    slug,
                    shortDescription: article.description || title,
                    rewrittenContent: "Processing AI Rewrite...",
                    image,
                    category: "current-affairs", // Temp default
                    source: article.source?.name || article.source || "Global",
                    publishedAt: new Date(publishedAt),
                    isToday: true,
                    contentHash,
                    similarityFingerprint
                }
            },
            { upsert: true }
        );

        // 4. Post-Insert Enrichment (AI Rewrite + AI Category)
        if (result.upsertedCount > 0) {
            console.log(`🆕 Processing: ${title.substring(0, 40)}...`);

            // Parallel AI tasks
            const [aiCategory, rewritten] = await Promise.all([
                detectCategoryWithAI(title, rawContent),
                callDeepSeek(
                    "You are a professional journalist. Rewrite this news into professional English (400-500 words). Maintain factual accuracy. No plagiarism.",
                    rawContent
                )
            ]).catch(() => ["current-affairs", null]);

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
                console.log(`✅ Fully Optimized: ${title.substring(0, 30)}`);
            }
            return true;
        }

        return false;
    } catch (err) {
        if (err.code !== 11000) console.error("Save Error:", err.message);
        return false;
    }
};

export const fetchFromGNews = async () => {
    console.log("📡 Checking GNews...");
    const res = await axios.get(`https://gnews.io/api/v4/top-headlines?country=in&lang=en&token=${process.env.GNEWS_API_KEY}`);
    let count = 0;
    for (const art of res.data.articles) if (await saveArticle(art)) count++;
    return count;
};

export const fetchFromNewsAPI = async () => {
    console.log("📡 Checking NewsAPI...");
    const res = await axios.get(`https://newsapi.org/v2/top-headlines?country=in&language=en&apiKey=${process.env.NEWS_API_KEY}`);
    let count = 0;
    for (const art of res.data.articles) if (await saveArticle(art)) count++;
    return count;
};

export const fetchFromRSS = async () => {
    console.log("📡 Checking BBC RSS...");
    const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
    let count = 0;
    for (const item of feed.items) if (await saveArticle(item)) count++;
    return count;
};

export const runCronFetch = async () => {
    if (isFetching) return;
    isFetching = true;

    try {
        console.log("🔁 Starting Intelligent Fetch Cycle...");

        let count = await fetchFromGNews();

        // Smart Fallback only if no fresh articles found
        if (count === 0) {
            console.log("⚠️ GNews yielded no new articles. Trying NewsAPI...");
            count = await fetchFromNewsAPI();
        }

        if (count === 0) {
            console.log("⚠️ Still nothing. Checking RSS fallback...");
            count = await fetchFromRSS();
        }

        console.log(`🏁 Cycle Complete. Fresh articles added: ${count}`);
    } catch (error) {
        console.error("Fetch Cycle Error:", error.message);
    } finally {
        isFetching = false;
    }
};

export const fetchAllNews = runCronFetch; // Compatibility
