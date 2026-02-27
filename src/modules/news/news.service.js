import axios from "axios";
import slugify from "slugify";
import Parser from "rss-parser";
import dayjs from "dayjs";
import News from "./news.model.js";
import { callDeepSeek } from "../../services/ai.service.js";

const parser = new Parser();
let isFetching = false; // Prevents cron overlap

const isPublishedToday = (date) => dayjs(date).isSame(dayjs(), "day");

const CATEGORY_MAP = {
    sports: ["cricket", "ipl", "football", "olympics", "fifa", "bcci", "tennis", "wimbledon", "athlete"],
    technology: ["tech", "iphone", "software", "ai", "gadget", "silicon", "semiconductor", "cyber", "robotics", "app"],
    business: ["market", "stock", "sensex", "nifty", "economy", "startup", "investing", "finance", "ceo", "shares"],
    politics: ["election", "modi", "minister", "parliament", "congress", "bjp", "democracy", "government", "policy"],
    entertainment: ["bollywood", "hollywood", "movie", "celebrity", "actor", "actress", "cinema", "trailer", "streaming"],
    india: ["delhi", "mumbai", "india", "isro", "bharat"]
};

const detectCategory = (article) => {
    // 1. Check API source category if available
    const apiCat = (article.category || article.topic || "").toLowerCase();
    if (["sports", "entertainment", "politics", "business", "technology"].includes(apiCat)) {
        return { category: apiCat, country: "india" };
    }

    // 2. Keyword check
    const text = `${article.title} ${article.description || ""}`.toLowerCase();
    for (const [cat, keywords] of Object.entries(CATEGORY_MAP)) {
        if (keywords.some(kw => text.includes(kw))) {
            return { category: cat, country: cat === "india" ? "india" : "world" };
        }
    }

    return { category: "current-affairs", country: "world" };
};

const saveArticle = async (article) => {
    try {
        const title = article.title?.trim();
        if (!title) return;

        // 1. Professional Slug Generation
        const cleanSlug = slugify(title, { lower: true, strict: true, trim: true });
        if (!cleanSlug || cleanSlug === "!") return;

        const image = article.image || article.urlToImage || article.enclosure?.url;
        const publishedAt = article.publishedAt || article.pubDate;

        // Validation
        if (!image || !publishedAt || !isPublishedToday(publishedAt)) return;

        const { category, country } = detectCategory(article);

        // 2. Atomic Upsert Check (Race Condition Safe)
        const result = await News.updateOne(
            { slug: cleanSlug },
            {
                $setOnInsert: {
                    title,
                    slug: cleanSlug,
                    shortDescription: article.description || title,
                    rewrittenContent: article.description || article.content || title, // Temp placeholder
                    image,
                    category,
                    country,
                    source: article.source?.name || article.source || "Global News",
                    publishedAt: new Date(publishedAt),
                    isToday: true
                }
            },
            { upsert: true }
        );

        // 3. Rewrite only if inserted
        if (result.upsertedCount > 0) {
            console.log(`🆕 New Article Inserted: ${cleanSlug}. Triggering AI Rewrite...`);

            try {
                const rewritten = await callDeepSeek(
                    "You are a professional journalist. Rewrite any news (translating to English if non-English) into a professional 400-500 word report. Use proper paragraphs and neutal tone.",
                    `Source Title: ${title}\nRaw Content: ${article.description || article.content}`
                );

                if (rewritten) {
                    await News.updateOne({ slug: cleanSlug }, { $set: { rewrittenContent: rewritten } });
                    console.log(`✨ AI Rewrite Success: ${cleanSlug}`);
                }
            } catch (aiError) {
                console.warn(`⚠️ AI Rewrite Failed for ${cleanSlug}: ${aiError.message}`);
            }
        } else {
            // console.log(`⏩ Duplicate Skipped (Slug Match): ${cleanSlug}`);
        }

    } catch (err) {
        if (err.code !== 11000) { // Ignore duplicate key errors if index catches it first
            console.error(`❌ Save Error: ${err.message}`);
        }
    }
};

export const fetchFromGNews = async () => {
    const url = `https://gnews.io/api/v4/top-headlines?country=in&lang=en&token=${process.env.GNEWS_API_KEY}`;
    const res = await axios.get(url);
    for (const art of res.data.articles) await saveArticle(art);
};

export const fetchFromNewsAPI = async () => {
    const url = `https://newsapi.org/v2/top-headlines?country=in&language=en&apiKey=${process.env.NEWS_API_KEY}`;
    const res = await axios.get(url);
    for (const art of res.data.articles) await saveArticle(art);
};

export const fetchFromRSS = async () => {
    const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
    for (const item of feed.items) await saveArticle(item);
};

export const runCronFetch = async () => {
    if (isFetching) return console.log("⏳ Fetch already in progress. Skipping...");
    isFetching = true;

    console.log("⏰ Starting Race-Safe Fetch Cycle...");
    try {
        await fetchFromGNews();
        await fetchFromNewsAPI();
        await fetchFromRSS();
    } catch (error) {
        console.error("Cron Execution Failure:", error.message);
    } finally {
        isFetching = false;
    }
};

export const fetchAllNews = runCronFetch; // Alias for compatibility
