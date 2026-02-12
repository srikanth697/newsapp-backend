import Parser from "rss-parser";

const parser = new Parser();

/**
 * 📰 RSS FEED SOURCES
 * Add more RSS feeds here as needed
 */
const RSS_FEEDS = [
    {
        url: "https://feeds.bbci.co.uk/news/rss.xml",
        source: "BBC News",
        category: "general",
    },
    {
        url: "https://rss.nytimes.com/services/xml/rss/nyt/World.xml",
        source: "NY Times World",
        category: "international",
    },
    {
        url: "https://feeds.bbci.co.uk/news/technology/rss.xml",
        source: "BBC Tech",
        category: "tech",
    },
    {
        url: "https://www.theguardian.com/world/rss",
        source: "The Guardian",
        category: "international",
    },
];

/**
 * 🔥 Fetch all RSS feeds and normalize to standard format
 */
export const fetchRSS = async () => {
    const allArticles = [];

    for (const feed of RSS_FEEDS) {
        try {
            console.log(`📡 Fetching RSS from ${feed.source}...`);
            const parsedFeed = await parser.parseURL(feed.url);

            const articles = parsedFeed.items.map((item) => ({
                title: item.title?.trim(),
                summary: item.contentSnippet || item.content || item.description || "",
                content: item.content || item.contentSnippet || item.description || "",
                url: item.link?.trim(),
                image: item.enclosure?.url || item.media?.thumbnail?.url || null,
                source: feed.source,
                category: feed.category,
                publishedAt: item.pubDate ? new Date(item.pubDate) : new Date(),
            }));

            allArticles.push(...articles);
            console.log(`✅ Fetched ${articles.length} articles from ${feed.source}`);
        } catch (error) {
            console.error(`❌ RSS Fetch Error (${feed.source}):`, error.message);
        }
    }

    return allArticles;
};
