import axios from "axios";
import Parser from "rss-parser";

const parser = new Parser();

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

const fetchService = {
    /**
     * Fetches the latest global news using Newsdata.io 
     * Provides pagination mechanism
     */
    async fetchNewsdata(category, nextPageToken = null) {
        let url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWSDATA_API_KEY}&country=in&category=${category}&language=en`;
        if (nextPageToken) url += `&page=${nextPageToken}`;

        const res = await axios.get(url, { timeout: 10000 });
        return {
            results: res.data?.results || [],
            nextPage: res.data?.nextPage
        };
    },

    /**
     * Fetches latest headlines from GNews API
     */
    async fetchGNews(country = 'in') {
        const { data } = await axios.get(`https://gnews.io/api/v4/top-headlines`, {
            params: { country, lang: "en", token: process.env.GNEWS_API_KEY },
            timeout: 10000
        });
        return data.articles || [];
    },

    /**
     * Universal RSS Feeder (for BBC / Fallbacks)
     */
    async fetchRSS(feedUrl = "https://feeds.bbci.co.uk/news/rss.xml") {
        try {
            const feed = await parser.parseURL(feedUrl);
            return feed.items || [];
        } catch (err) {
            console.error(`RSS Fetch Error on ${feedUrl}:`, err.message);
            return [];
        }
    }
};

export default fetchService;
