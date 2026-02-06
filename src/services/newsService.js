import axios from "axios";
import News from "../models/News.js";

export const fetchIndiaNews = async () => {
    const response = await axios.get(
        "https://newsapi.org/v2/everything?q=india",
        {
            params: {
                apiKey: process.env.NEWS_API_KEY,
            },
        }
    );

    await News.deleteMany({}); // clear old data (TEMP)

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
