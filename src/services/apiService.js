import axios from "axios";

const API_KEY = process.env.NEWS_API_KEY;

const fetchFullCategory = async (params) => {
    let all = [];
    const maxPages = 5; // Fetch up to 500 articles per category

    for (let page = 1; page <= maxPages; page++) {
        try {
            console.log(`   📡 Page ${page}...`);
            const res = await axios.get("https://newsapi.org/v2/top-headlines", {
                params: { ...params, page, pageSize: 100, apiKey: API_KEY }
            });

            if (!res.data.articles || res.data.articles.length === 0) break;

            all.push(...res.data.articles);
        } catch (error) {
            console.error(`   ❌ Error fetching page ${page}:`, error.message);
            break;
        }
    }
    return all;
};

/**
 * 🔥 Fetch news from NewsAPI (Massive Fetch)
 */
export const fetchAPINews = async () => {
    const allArticles = [];

    if (!API_KEY) {
        console.log("⚠️  NewsAPI key not found - skipping API sources");
        return allArticles;
    }

    // 1️⃣ India News (Everything endpoint for volume)
    console.log("📡 Fetching India news (Massive)...");
    try {
        const res = await axios.get("https://newsapi.org/v2/everything", {
            params: { q: "india", apiKey: API_KEY, pageSize: 100, sortBy: "publishedAt" }
        });
        const articles = res.data.articles || [];
        allArticles.push(...articles.map(item => normalize(item, "india")));
        console.log(`✅ Fetched ${articles.length} India articles`);
    } catch (e) { console.error(e.message); }

    // 2️⃣ International (US)
    console.log("📡 Fetching International news...");
    const intlRaw = await fetchFullCategory({ country: "us" });
    allArticles.push(...intlRaw.map(item => normalize(item, "international")));
    console.log(`✅ Fetched ${intlRaw.length} Intl articles`);

    // 3️⃣ Technology
    console.log("📡 Fetching Tech news...");
    const techRaw = await fetchFullCategory({ category: "technology", language: "en" });
    allArticles.push(...techRaw.map(item => normalize(item, "tech")));
    console.log(`✅ Fetched ${techRaw.length} Tech articles`);

    // 4️⃣ Health
    console.log("📡 Fetching Health news...");
    const healthRaw = await fetchFullCategory({ category: "health", language: "en" });
    allArticles.push(...healthRaw.map(item => normalize(item, "health")));
    console.log(`✅ Fetched ${healthRaw.length} Health articles`);

    // 5️⃣ Business
    console.log("📡 Fetching Business news...");
    const bizRaw = await fetchFullCategory({ category: "business", language: "en" });
    allArticles.push(...bizRaw.map(item => normalize(item, "business")));
    console.log(`✅ Fetched ${bizRaw.length} Business articles`);

    // 6️⃣ Sports
    console.log("📡 Fetching Sports news...");
    const sportsRaw = await fetchFullCategory({ category: "sports", language: "en" });
    allArticles.push(...sportsRaw.map(item => normalize(item, "sports")));
    console.log(`✅ Fetched ${sportsRaw.length} Sports articles`);

    // 7️⃣ General (Current Affairs / Headlines)
    console.log("📡 Fetching General news (Current Affairs)...");
    const generalRaw = await fetchFullCategory({ category: "general", language: "en" });
    allArticles.push(...generalRaw.map(item => normalize(item, "general")));
    console.log(`✅ Fetched ${generalRaw.length} General articles`);

    return allArticles;
};

// 🖼️ High-Quality Fallback Images by Category
const FALLBACK_IMAGES = {
    tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    business: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    health: "https://images.unsplash.com/photo-1505751172569-e701e62f5500?w=800&q=80",
    sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
    india: "https://images.unsplash.com/photo-1532375810709-75b1da00537c?w=800&q=80",
    international: "https://images.unsplash.com/photo-1529243856184-fd5465488984?w=800&q=80",
    general: "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&q=80",
    default: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"
};

// Helper: Normalize
const normalize = (item, category) => {
    // Select default image based on category
    const defaultImage = FALLBACK_IMAGES[category] || FALLBACK_IMAGES.default;

    return {
        title: item.title?.trim(),
        summary: item.description || "",
        content: item.content || item.description || "",
        url: item.url?.trim(),
        image: item.urlToImage || defaultImage, // Use API image or fallback
        source: item.source?.name || "NewsAPI",
        category: category,
        publishedAt: new Date(item.publishedAt),
    };
};
