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
        if (!article.title) continue;

        await News.updateOne(
            { title: article.title },
            {
                title: article.title,
                description: article.description,
                content: article.content,
                image: article.urlToImage,
                sourceUrl: article.url,

                country: "IN",
                category: "general", // Default for top-headlines if category not specified

                publishedAt: article.publishedAt,
            },
            { upsert: true }
        );
    }
};
