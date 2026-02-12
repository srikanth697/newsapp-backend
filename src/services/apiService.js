import axios from "axios";

const API_KEY = process.env.NEWS_API_KEY;

/**
 * 🔥 Fetch news from NewsAPI and normalize to standard format
 * This replaces the old newsService functions but with normalized output
 */
export const fetchAPINews = async () => {
    const allArticles = [];

    // Check if NewsAPI key is available
    if (!API_KEY) {
        console.log("⚠️  NewsAPI key not found - skipping API sources (RSS feeds will still work)");
        return allArticles;
    }

    try {
        // 1️⃣ India News
        console.log("📡 Fetching India news from API...");
        const indiaRes = await axios.get("https://newsapi.org/v2/everything", {
            params: {
                q: "india",
                apiKey: API_KEY,
                pageSize: 20,
                sortBy: "publishedAt",
            },
        });

        const indiaArticles = indiaRes.data.articles.map((item) => ({
            title: item.title?.trim(),
            summary: item.description || "",
            content: item.content || item.description || "",
            url: item.url?.trim(),
            image: item.urlToImage,
            source: item.source?.name || "NewsAPI",
            category: "india",
            publishedAt: new Date(item.publishedAt),
        }));

        allArticles.push(...indiaArticles);
        console.log(`✅ Fetched ${indiaArticles.length} India articles`);
    } catch (error) {
        console.error("❌ India API Error:", error.message);
    }

    try {
        // 2️⃣ International News
        console.log("📡 Fetching international news from API...");
        const intlRes = await axios.get("https://newsapi.org/v2/top-headlines", {
            params: {
                country: "us",
                apiKey: API_KEY,
                pageSize: 20,
            },
        });

        const intlArticles = intlRes.data.articles.map((item) => ({
            title: item.title?.trim(),
            summary: item.description || "",
            content: item.content || item.description || "",
            url: item.url?.trim(),
            image: item.urlToImage,
            source: item.source?.name || "NewsAPI",
            category: "international",
            publishedAt: new Date(item.publishedAt),
        }));

        allArticles.push(...intlArticles);
        console.log(`✅ Fetched ${intlArticles.length} international articles`);
    } catch (error) {
        console.error("❌ International API Error:", error.message);
    }

    try {
        // 3️⃣ Technology News
        console.log("📡 Fetching tech news from API...");
        const techRes = await axios.get("https://newsapi.org/v2/top-headlines", {
            params: {
                category: "technology",
                apiKey: API_KEY,
                language: "en",
                pageSize: 20,
            },
        });

        const techArticles = techRes.data.articles.map((item) => ({
            title: item.title?.trim(),
            summary: item.description || "",
            content: item.content || item.description || "",
            url: item.url?.trim(),
            image: item.urlToImage,
            source: item.source?.name || "NewsAPI",
            category: "tech",
            publishedAt: new Date(item.publishedAt),
        }));

        allArticles.push(...techArticles);
        console.log(`✅ Fetched ${techArticles.length} tech articles`);
    } catch (error) {
        console.error("❌ Tech API Error:", error.message);
    }

    try {
        // 4️⃣ Health News
        console.log("📡 Fetching health news from API...");
        const healthRes = await axios.get("https://newsapi.org/v2/top-headlines", {
            params: {
                category: "health",
                apiKey: API_KEY,
                language: "en",
                pageSize: 20,
            },
        });

        const healthArticles = healthRes.data.articles.map((item) => ({
            title: item.title?.trim(),
            summary: item.description || "",
            content: item.content || item.description || "",
            url: item.url?.trim(),
            image: item.urlToImage,
            source: item.source?.name || "NewsAPI",
            category: "health",
            publishedAt: new Date(item.publishedAt),
        }));

        allArticles.push(...healthArticles);
        console.log(`✅ Fetched ${healthArticles.length} health articles`);
    } catch (error) {
        console.error("❌ Health API Error:", error.message);
    }

    return allArticles;
};
