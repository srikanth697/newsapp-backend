import axios from "axios";
import News from "../models/News.js";

const API_KEY = process.env.NEWS_API_KEY;

/* ----------------------------------
   1️⃣ INDIA NEWS
----------------------------------- */
export const fetchIndiaNews = async () => {
    const response = await axios.get(
        "https://newsapi.org/v2/everything?q=india",
        {
            params: {
                apiKey: API_KEY,
            },
        }
    );

    await News.deleteMany({ country: "IN" }); // clear old India data

    for (const article of response.data.articles) {
        if (!article.title) continue;

        await News.create({
            title: article.title,
            description: article.description,
            content: article.content,
            image: article.urlToImage,
            sourceUrl: article.url,
            country: "IN",
            category: "general",
            publishedAt: article.publishedAt,
        });
    }
};

/* ----------------------------------
   2️⃣ INTERNATIONAL NEWS
----------------------------------- */
const INTERNATIONAL_COUNTRIES = [
    "us", "gb", "fr", "de", "it", "es", "ru", "jp", "cn", "au", "ca", "br", "za"
];

export const fetchInternationalNews = async () => {
    for (const country of INTERNATIONAL_COUNTRIES) {
        try {
            const res = await axios.get(
                "https://newsapi.org/v2/top-headlines",
                {
                    params: {
                        country,
                        apiKey: API_KEY,
                        pageSize: 10,
                    },
                }
            );

            for (const article of res.data.articles) {
                if (!article.title) continue;
                await News.updateOne(
                    { title: article.title },
                    {
                        title: article.title,
                        description: article.description,
                        content: article.content,
                        image: article.urlToImage,
                        sourceUrl: article.url,
                        category: "general",
                        country: "INTERNATIONAL",
                        publishedAt: article.publishedAt,
                    },
                    { upsert: true }
                );
            }
        } catch (error) {
            console.error(`Error fetching news for ${country}:`, error.message);
        }
    }
};

/* ----------------------------------
   3️⃣ CURRENT AFFAIRS
----------------------------------- */
export const fetchCurrentAffairs = async () => {
    const keywords =
        "politics OR government OR parliament OR election OR economy OR supreme court";

    const res = await axios.get(
        "https://newsapi.org/v2/everything",
        {
            params: {
                q: keywords,
                apiKey: API_KEY,
                sortBy: "publishedAt",
                language: "en",
                pageSize: 30,
            },
        }
    );

    for (const article of res.data.articles) {
        if (!article.title) continue;
        await News.updateOne(
            { title: article.title },
            {
                title: article.title,
                description: article.description,
                content: article.content,
                image: article.urlToImage,
                sourceUrl: article.url,
                category: "current_affairs",
                country: "GLOBAL",
                publishedAt: article.publishedAt,
            },
            { upsert: true }
        );
    }
};

/* ----------------------------------
   4️⃣ HEALTH NEWS
----------------------------------- */
export const fetchHealthNews = async () => {
    const res = await axios.get(
        "https://newsapi.org/v2/top-headlines",
        {
            params: {
                category: "health",
                apiKey: API_KEY,
                language: "en",
                pageSize: 20,
            },
        }
    );

    for (const article of res.data.articles) {
        if (!article.title) continue;
        await News.updateOne(
            { title: article.title },
            {
                title: article.title,
                description: article.description,
                content: article.content,
                image: article.urlToImage,
                sourceUrl: article.url,
                category: "health",
                country: "GLOBAL",
                publishedAt: article.publishedAt,
            },
            { upsert: true }
        );
    }
};
