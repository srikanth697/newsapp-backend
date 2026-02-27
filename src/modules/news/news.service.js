import axios from "axios";
import slugify from "slugify";
import Parser from "rss-parser";
import dayjs from "dayjs";
import News from "./news.model.js";
import { callDeepSeek } from "../../services/ai.service.js";

const parser = new Parser();

const isPublishedToday = (date) => dayjs(date).isSame(dayjs(), "day");

const detectMetadata = (article) => {
    const text = (article.title + " " + (article.description || "")).toLowerCase();

    if (text.includes("cricket") || text.includes("ipl") || text.includes("sport") || text.includes("football")) return { category: "sports", country: "india" };
    if (text.includes("tech") || text.includes("gadget") || text.includes("iphone") || text.includes("software")) return { category: "technology", country: "world" };
    if (text.includes("business") || text.includes("stock") || text.includes("market") || text.includes("economy")) return { category: "business", country: "india" };
    if (text.includes("politics") || text.includes("election") || text.includes("government") || text.includes("minister")) return { category: "politics", country: "india" };
    if (text.includes("movie") || text.includes("bollywood") || text.includes("cinema") || text.includes("actor")) return { category: "entertainment", country: "india" };
    if (text.includes("india") || text.includes("delhi") || text.includes("mumbai") || text.includes("indian")) return { category: "india", country: "india" };

    return { category: "current-affairs", country: "world" };
};

const processAndSave = async (article) => {
    try {
        const title = article.title?.trim();
        const image = article.image || article.urlToImage || article.enclosure?.url;
        const publishedAt = article.publishedAt || article.pubDate;

        // 🛑 STRICT CONDITIONS
        if (!title || !image || !publishedAt) return false;
        if (!isPublishedToday(publishedAt)) return false;

        // Duplicate Check
        const exists = await News.findOne({ title });
        if (exists) return false;

        console.log(`🧠 Processing DeepSeek Rewrite: ${title.substring(0, 50)}...`);

        let rewrittenContent;
        try {
            rewrittenContent = await callDeepSeek(
                "You are a professional journalist. Rewrite news articles in a professional, neutral, and engaging style (400-500 words). Use a proper introduction and a forward-looking conclusion. Do not copy sentences. Expand details logically.",
                `Translate to English if needed and rewrite this news article:\n\nTitle: ${title}\nContent: ${article.description || article.content}`
            );
        } catch (aiError) {
            if (aiError.message === "AI_BALANCE_EXHAUSTED") {
                console.warn("⚠️ AI Balance exhausted. Saving original content.");
                rewrittenContent = article.description || article.content;
            } else {
                throw aiError;
            }
        }

        const { category, country } = detectMetadata(article);

        await News.create({
            title,
            slug: slugify(title, { lower: true, strict: true }),
            shortDescription: article.description || title,
            rewrittenContent,
            image,
            category,
            country,
            source: article.source?.name || article.source || "Global News",
            publishedAt: new Date(publishedAt),
            isToday: true
        });

        console.log("✅ Article Saved Successfully.");
        return true;
    } catch (err) {
        console.error(`❌ Error saving article: ${err.message}`);
        return false;
    }
};

export const fetchFromGNews = async () => {
    const url = `https://gnews.io/api/v4/top-headlines?country=in&lang=en&token=${process.env.GNEWS_API_KEY}`;
    const res = await axios.get(url);
    let savedCount = 0;
    for (const art of res.data.articles) {
        if (await processAndSave(art)) savedCount++;
    }
    return savedCount;
};

export const fetchFromNewsAPI = async () => {
    const url = `https://newsapi.org/v2/top-headlines?country=in&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    const res = await axios.get(url);
    let savedCount = 0;
    for (const art of res.data.articles) {
        if (await processAndSave(art)) savedCount++;
    }
    return savedCount;
};

export const fetchFromRSS = async () => {
    const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
    let savedCount = 0;
    for (const item of feed.items) {
        if (await processAndSave(item)) savedCount++;
    }
    return savedCount;
};

export const runCronFetch = async () => {
    console.log("⏰ Starting Scheduled Fetch Pattern...");
    try {
        let freshCount = await fetchFromGNews();
        if (freshCount === 0) {
            console.log("⚠️ No fresh GNews today. Switching to NewsAPI...");
            freshCount = await fetchFromNewsAPI();
        }
        if (freshCount === 0) {
            console.log("⚠️ Still no fresh news. Falling back to RSS...");
            await fetchFromRSS();
        }
    } catch (error) {
        console.error("Critical Fetch Failure:", error.message);
    }
};
