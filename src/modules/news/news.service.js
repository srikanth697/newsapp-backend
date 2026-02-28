import axios from "axios";
import slugify from "slugify";
import Parser from "rss-parser";
import dayjs from "dayjs";
import crypto from "crypto";
import News from "./news.model.js";
import { callDeepSeek } from "../../services/ai.service.js";

const parser = new Parser();
let isFetching = false;

// 🕒 Freshness Check
const isRecent = (date, hours = 24) => {
    const pubDate = dayjs(date);
    const now = dayjs();
    return pubDate.isAfter(now.subtract(hours, 'hour')) || pubDate.isSame(now, 'day');
};

const isEnglish = (text) => {
    if (!text) return false;
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

        if (!title || !isEnglish(title)) return false;

        const slug = slugify(title, { lower: true, strict: true, trim: true });
        if (!slug || slug === "!") return false;

        const image = article.image || article.urlToImage || article.enclosure?.url;
        const publishedAt = article.publishedAt || article.pubDate;

        if (!image || !publishedAt) return false;

        // Special logic for Current Affairs (48h) vs others (24h)
        const isCurrentAffairsCandidate = (article.category === 'current-affairs' || (article.title + (article.description || "")).toLowerCase().includes('current affairs'));
        const hourWindow = isCurrentAffairsCandidate ? 48 : 24;

        if (!isRecent(publishedAt, hourWindow)) return false;

        const contentHash = generateHash(rawContent);
        const similarityFingerprint = rawContent.slice(0, 300);

        const simExisting = await News.findOne({ similarityFingerprint });
        if (simExisting) return false;

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
                    isToday: true,
                    contentHash,
                    similarityFingerprint
                }
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log(`🆕 Save Success: ${title.substring(0, 40)}...`);

            try {
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
        return 0;
    }
};

export const runCronFetch = async () => {
    if (isFetching) return;
    isFetching = true;
    try {
        console.log("🔁 Starting Multi-Layer News Fetch...");
        let count = await fetchFromGNews();
        if (count === 0) count = await fetchFromNewsAPI();
        if (count === 0) count = await fetchFromRSS();
        console.log(`🏁 Fetch cycle finished. Articles added: ${count}`);
    } finally {
        isFetching = false;
    }
};

export const fetchAllNews = runCronFetch;
