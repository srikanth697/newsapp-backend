import axios from "axios";
import News from "../models/News.js";

export const fetchIndiaNews = async () => {
    const response = await axios.get(
        "https://newsapi.org/v2/top-headlines",
        {
            params: {
                country: "in",
                apiKey: process.env.NEWS_API_KEY,
            },
        }
    );

    for (const article of response.data.articles) {
        if (!article.title) continue; // Skip articles without titles

        await News.updateOne(
            { title: article.title },
            {
                title: article.title,
                description: article.description,
                image: article.urlToImage,
                country: "IN",
                category: "general",
                publishedAt: article.publishedAt,
            },
            { upsert: true }
        );
    }
};
