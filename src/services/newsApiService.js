import axios from "axios";
import dotenv from "dotenv";
dotenv.config();

/**
 * 🌍 NEWS API SERVICE
 * Fetches top headlines from NewsAPI.org
 */
export const fetchFromNewsAPI = async () => {
    try {
        const apiKey = process.env.NEWS_API_KEY;
        if (!apiKey || apiKey === "your_newsapi_key") {
            console.warn("⚠️ NewsAPI Key missing or invalid. Skipping NewsAPI fetch.");
            return [];
        }

        console.log("📡 Fetching from NewsAPI...");
        const response = await axios.get(
            `https://newsapi.org/v2/top-headlines?country=in&pageSize=10&apiKey=${apiKey}`
        );

        if (response.data && response.data.articles) {
            return response.data.articles.map(article => ({
                title: article.title,
                url: article.url,
                source: article.source.name,
                image: article.urlToImage,
                description: article.description,
                category: "General" // NewsAPI categories are separate endpoints, defaulting to General
            }));
        }
        return [];
    } catch (error) {
        console.error("❌ NewsAPI Fetch Error:", error.message);
        return [];
    }
};
