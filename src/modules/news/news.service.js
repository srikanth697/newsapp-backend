import axios from "axios";
import slugify from "slugify";
import Parser from "rss-parser";
import dayjs from "dayjs";
import crypto from "crypto";
import News from "./news.model.js";
import { callDeepSeek } from "../../services/ai.service.js";

const parser = new Parser();
let isFetching = false;

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

// 🎯 Keywords for robust local detection before AI
const KEYWORD_MAP = {
    sports: ["cricket", "football", "tennis", "olympics", "ipl", "fifa", "bcci", "match", "tournament", "athlete", "golf", "wrestling"],
    technology: ["tech", "iphone", "apple", "google", "microsoft", "silicon", "semiconductor", "cyber", "ai", "artificial intelligence", "robot", "gadget", "software", "whatsapp", "meta"],
    business: ["market", "stock", "shares", "sensex", "nifty", "economy", "startup", "founder", "billionaire", "bank", "finance", "ceo", "investment", "tax", "budget"],
    politics: ["election", "modi", "minister", "parliament", "congress", "bjp", "government", "policy", "visa", "diplomatic", "treaty", "senate"],
    entertainment: ["movie", "bollywood", "hollywood", "ott", "netflix", "trailer", "actor", "actress", "celebrity", "cinema", "film", "concert", "music", "pop star"]
};

const detectCategoryLocally = (title, content) => {
    const text = `${title} ${content}`.toLowerCase();
    for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
        if (keywords.some(kw => text.includes(kw))) return category;
    }
    return "current-affairs";
};

const detectCategoryWithAI = async (title, content) => {
    try {
        const prompt = `Classify this news into exactly one category: politics, business, technology, sports, entertainment, current-affairs. Return only the category word.\n\nTitle: ${title}\nContent: ${content.substring(0, 300)}`;
        const result = await callDeepSeek("You are a news classification AI.", prompt);
        const cat = result.trim().toLowerCase().split(' ')[0].replace(/[^a-z-]/g, "");
        const validCategories = ["politics", "business", "technology", "sports", "entertainment", "current-affairs"];
        return validCategories.includes(cat) ? cat : detectCategoryLocally(title, content);
    } catch (e) {
        return detectCategoryLocally(title, content);
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

        // Smart Window logic
        const contentForCheck = (title + (article.description || "")).toLowerCase();
        const isCurrentAffairsCandidate = contentForCheck.includes('current affairs') || contentForCheck.includes('breaking');
        const hourWindow = isCurrentAffairsCandidate ? 48 : 24;

        if (!isRecent(publishedAt, hourWindow)) return false;

        const contentHash = generateHash(rawContent);
        const similarityFingerprint = rawContent.slice(0, 300);

        const simExisting = await News.findOne({ similarityFingerprint });
        if (simExisting) return false;

        // Perform local detection immediately to avoid empty categories
        const localCategory = detectCategoryLocally(title, rawContent);
        const isIndia = contentForCheck.includes('india') || contentForCheck.includes('delhi') || contentForCheck.includes('mumbai') || contentForCheck.includes('indian');

        const result = await News.updateOne(
            { contentHash },
            {
                $setOnInsert: {
                    title,
                    slug,
                    shortDescription: article.description || title,
                    rewrittenContent: "Processing AI Rewrite...",
                    image,
                    category: localCategory,
                    source: article.source?.name || article.source || "Global",
                    publishedAt: new Date(publishedAt),
                    isToday: true,
                    country: isIndia ? "india" : "world",
                    contentHash,
                    similarityFingerprint
                }
            },
            { upsert: true }
        );

        if (result.upsertedCount > 0) {
            console.log(`🆕 Save [${localCategory.toUpperCase()}]: ${title.substring(0, 40)}...`);

            try {
                const [aiCategory, rewritten] = await Promise.all([
                    detectCategoryWithAI(title, rawContent),
                    callDeepSeek(
                        "You are a professional journalist. Rewrite this news into professional English (450-500 words). Maintain factual accuracy. Structure with intro and conclusion.",
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
                    console.log(`✅ AI Optimized [${aiCategory}]: ${title.substring(0, 30)}`);
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
