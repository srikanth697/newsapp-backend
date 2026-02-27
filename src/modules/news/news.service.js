import axios from "axios";
import slugify from "slugify";
import Parser from "rss-parser";
import dayjs from "dayjs";
import News from "./news.model.js";

const parser = new Parser();

const todayCheck = (date) =>
    dayjs(date).isSame(dayjs(), "day");

const categorize = (article) => {
    const text = (article.title + " " + (article.description || "")).toLowerCase();

    if (text.includes("sports") || text.includes("cricket") || text.includes("football") || text.includes("ipl") || text.includes("olympics")) return { category: "sports", country: "india" };
    if (text.includes("tech") || text.includes("gadget") || text.includes("iphone") || text.includes("software") || text.includes("ai")) return { category: "technology", country: "world" };
    if (text.includes("business") || text.includes("stock") || text.includes("economy") || text.includes("market") || text.includes("startup")) return { category: "business", country: "india" };
    if (text.includes("politics") || text.includes("election") || text.includes("government") || text.includes("modi") || text.includes("minister")) return { category: "politics", country: "india" };
    if (text.includes("entertainment") || text.includes("movie") || text.includes("bollywood") || text.includes("hollywood") || text.includes("actor")) return { category: "entertainment", country: "india" };
    if (text.includes("india") || text.includes("delhi") || text.includes("mumbai") || text.includes("indian")) return { category: "india", country: "india" };

    return { category: "current-affairs", country: "world" };
};

const rewriteWithDeepSeek = async (content) => {
    try {
        const response = await axios.post(
            "https://api.deepseek.com/chat/completions",
            {
                model: "deepseek-chat",
                messages: [
                    {
                        role: "system",
                        content: "You are a world-class news editor and content strategist. Your goal is to rewrite news articles to be highly engaging, informative, and professional, ensuring readers are hooked from the first sentence."
                    },
                    {
                        role: "user",
                        content: `Please rewrite and expand the following news snippet into a professional, high-quality news article. 

REQUIREMENTS:
1. WORD COUNT: Strictly between 450 - 550 words.
2. TONE: Professional, objective, yet captivating.
3. STRUCTURE: 
   - A compelling lead paragraph.
   - 3-4 detailed body paragraphs explaining the context, impact, and latest developments.
   - A forward-looking or analytical concluding paragraph.
4. NO PLACEHOLDERS: Do not use [Source], [Link], or [Date].
5. LANGUAGE: Perfect English.

RAW CONTENT:
${content}`
                    }
                ],
                max_tokens: 1000,
                temperature: 0.7
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        return response.data.choices[0].message.content;
    } catch (error) {
        console.error("DeepSeek API Error:", error.response?.data || error.message);
        return content; // Fallback to original content if AI fails
    }
};

const saveArticle = async (article) => {
    try {
        const exists = await News.findOne({ title: article.title });
        if (exists) return;

        console.log(`🧠 AI Processing: ${article.title}`);
        const rewritten = await rewriteWithDeepSeek(article.description || article.content);

        const { category, country } = categorize(article);

        await News.create({
            title: article.title,
            slug: slugify(article.title, { lower: true }),
            description: article.description,
            content: rewritten,
            image: article.image || article.urlToImage,
            source: article.source?.name || article.source || "Global News",
            author: article.author || "First Report Staff",
            category,
            country,
            publishedAt: article.publishedAt || new Date(),
            isToday: todayCheck(article.publishedAt || new Date())
        });
        console.log(`✅ Saved: ${article.title}`);

    } catch (err) {
        console.log("Error saving article:", err.message);
    }
};

export const fetchFromGNews = async () => {
    console.log("📡 Fetching from GNews...");
    const res = await axios.get(
        `https://gnews.io/api/v4/top-headlines?country=in&token=${process.env.GNEWS_API_KEY}`
    );

    for (const article of res.data.articles) {
        await saveArticle(article);
    }
};

export const fetchFromNewsAPI = async () => {
    console.log("📡 Fetching from NewsAPI...");
    const res = await axios.get(
        `https://newsapi.org/v2/top-headlines?country=in&apiKey=${process.env.NEWS_API_KEY}`
    );

    for (const article of res.data.articles) {
        await saveArticle(article);
    }
};

export const fetchFromRSS = async () => {
    console.log("📡 Fetching from RSS Feed...");
    const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");

    for (const item of feed.items) {
        await saveArticle({
            title: item.title,
            description: item.contentSnippet,
            content: item.content,
            publishedAt: item.pubDate,
            image: item.enclosure?.url
        });
    }
};

export const fetchAllNews = async () => {
    try {
        await fetchFromGNews();
    } catch (e) {
        console.warn("GNews Failed, trying NewsAPI...");
        try {
            await fetchFromNewsAPI();
        } catch (e) {
            console.warn("NewsAPI Failed, trying RSS...");
            await fetchFromRSS();
        }
    }
};
