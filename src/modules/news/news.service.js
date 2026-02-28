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

const KEYWORD_MAP = {
    sports: ["cricket", "football", "tennis", "olympics", "ipl", "fifa", "bcci", "match", "tournament", "athlete", "golf", "wrestling", "score", "game", "stadium", "pro-kabaddi", "sports"],
    technology: ["tech", "iphone", "apple", "google", "microsoft", "silicon", "semiconductor", "cyber", "ai", "artificial intelligence", "robot", "gadget", "software", "whatsapp", "meta", "nvidia", "openai"],
    business: ["market", "stock", "shares", "sensex", "nifty", "economy", "startup", "founder", "billionaire", "bank", "finance", "ceo", "investment", "tax", "budget", "gdp"],
    politics: ["election", "modi", "minister", "parliament", "congress", "bjp", "government", "policy", "visa", "diplomatic", "treaty", "senate", "candidate"],
    entertainment: ["movie", "bollywood", "hollywood", "ott", "netflix", "trailer", "actor", "actress", "celebrity", "cinema", "film", "concert", "music", "pop star", "fashion", "vogue"]
};

const detectCategoryLocally = (title, content) => {
    const text = `${title} ${content}`.toLowerCase();
    for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
        if (keywords.some(kw => text.includes(kw))) return category;
    }
    return "current-affairs";
};

const saveArticle = async (article, forceCategory = null) => {
    try {
        const title = article.title?.trim();
        const rawContent = article.description || article.content || title;

        if (!title || !isEnglish(title)) return false;

        const slug = slugify(title, { lower: true, strict: true, trim: true });
        if (!slug || slug === "!") return false;

        const image = article.image || article.urlToImage || article.enclosure?.url;
        const publishedAt = article.publishedAt || article.pubDate;

        if (!image || !publishedAt) return false;

        const hourWindow = (forceCategory === 'current-affairs' || (title + rawContent).toLowerCase().includes('current affairs')) ? 48 : 24;
        if (!isRecent(publishedAt, hourWindow)) return false;

        const contentHash = generateHash(rawContent);
        if (await News.findOne({ contentHash })) return false;

        if (await News.findOne({ similarityFingerprint: rawContent.slice(0, 300) })) return false;

        const cat = forceCategory || detectCategoryLocally(title, rawContent);
        const isIndia = (title + rawContent).toLowerCase().match(/india|delhi|mumbai|indian|chennai|kolkata|karnataka|kerala|gujarat|surat|pune/);

        const newArt = await News.create({
            title,
            slug,
            shortDescription: article.description || title,
            rewrittenContent: "Processing AI Rewrite...",
            image,
            category: cat,
            country: isIndia ? "india" : "world",
            source: article.source?.name || article.source || "Global",
            publishedAt: new Date(publishedAt),
            isToday: true,
            contentHash,
            similarityFingerprint: rawContent.slice(0, 300)
        });

        console.log(`🆕 Save [${cat.toUpperCase()}]: ${title.substring(0, 30)}...`);

        // Trigger AI Rewrite (Background)
        callDeepSeek(
            "Rewrite this news into professional English (450+ words). Keep facts same.",
            `Source: ${newArt.source}\nTitle: ${newArt.title}\nContent: ${rawContent}`
        ).then(async rewritten => {
            if (rewritten) {
                await News.findByIdAndUpdate(newArt._id, { rewrittenContent: rewritten, trendingScore: calculateTrendingScore(0, publishedAt) });
            }
        }).catch(() => { });

        return true;
    } catch (err) {
        return false;
    }
};

export const runCronFetch = async () => {
    if (isFetching) return;
    isFetching = true;

    try {
        console.log("🔁 Deep Fetch: Categorized Polling Start...");
        const categories = ["business", "entertainment", "general", "health", "science", "sports", "technology"];
        const countries = ["in", "us"];

        // 1. NewsAPI: Fetch from each category to ensure variety
        for (const cat of categories) {
            try {
                const res = await axios.get(`https://newsapi.org/v2/top-headlines?category=${cat}&language=en&apiKey=${process.env.NEWS_API_KEY}`);
                if (res.data.articles) {
                    for (const art of res.data.articles) await saveArticle(art);
                }
            } catch (err) { }
        }

        // 2. GNews: India specific top headlines
        try {
            const res = await axios.get(`https://gnews.io/api/v4/top-headlines?country=in&lang=en&token=${process.env.GNEWS_API_KEY}`);
            if (res.data.articles) {
                for (const art of res.data.articles) await saveArticle(art);
            }
        } catch (err) { }

        // 3. RSS BBC
        try {
            const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
            for (const item of feed.items) await saveArticle(item);
        } catch (err) { }

        console.log("🏁 Deep Fetch Cycle Complete.");
    } finally {
        isFetching = false;
    }
};

export const fetchAllNews = runCronFetch;
