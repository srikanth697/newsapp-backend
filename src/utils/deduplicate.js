/**
 * 🔥 DEDUPLICATION ENGINE
 * Removes duplicate articles using multi-level approach
 */

/**
 * Level 1: Remove exact URL duplicates
 */
const deduplicateByUrl = (articles) => {
    const uniqueByUrl = {};

    articles.forEach((article) => {
        if (article.url && !uniqueByUrl[article.url]) {
            uniqueByUrl[article.url] = article;
        }
    });

    return Object.values(uniqueByUrl);
};

/**
 * Level 2: Remove similar titles (fuzzy matching)
 */
const deduplicateByTitle = (articles) => {
    const filtered = [];

    articles.forEach((article) => {
        if (!article.title) return;

        const titleLower = article.title.toLowerCase();

        // Check if a similar title already exists
        const exists = filtered.some((existing) => {
            const existingTitleLower = existing.title.toLowerCase();

            // Check if one title contains the other (substring match)
            if (
                titleLower.includes(existingTitleLower) ||
                existingTitleLower.includes(titleLower)
            ) {
                return true;
            }

            // Check similarity score (Jaccard similarity on words)
            const words1 = new Set(titleLower.split(/\s+/));
            const words2 = new Set(existingTitleLower.split(/\s+/));

            const intersection = new Set([...words1].filter(x => words2.has(x)));
            const union = new Set([...words1, ...words2]);

            const similarity = intersection.size / union.size;

            // If similarity > 70%, consider it duplicate
            return similarity > 0.7;
        });

        if (!exists) {
            filtered.push(article);
        }
    });

    return filtered;
};

/**
 * 🎯 Main deduplication function for arrays
 */
export const deduplicateArticles = (articles) => {
    console.log(`🔍 Deduplicating ${articles.length} articles...`);

    // Level 1: Remove exact URL duplicates
    let unique = deduplicateByUrl(articles);
    console.log(`✅ After URL dedup: ${unique.length} articles`);

    // Level 2: Remove similar titles
    unique = deduplicateByTitle(unique);
    console.log(`✅ After title dedup: ${unique.length} articles`);

    return unique;
};

/**
 * 🧠 Smart Duplicate Detection against DB
 * Checks if a news article is already similar to anything in the DB
 */
import News from "../models/News.js";

export const isDuplicateInDB = async (title, content) => {
    if (!title && !content) return false;

    // 1. Check for exact title match (Case insensitive)
    const exactTitleMatch = await News.findOne({
        $or: [
            { "title.en": { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } },
            { "title.te": { $regex: new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') } }
        ]
    });

    if (exactTitleMatch) return true;

    // 2. Fetch recent articles to check similarity (last 3 days)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
    const recentArticles = await News.find({
        publishedAt: { $gt: threeDaysAgo }
    }).select("title.en content.en");

    const titleLower = title.toLowerCase();

    for (const article of recentArticles) {
        const existingTitle = article.title?.en?.toLowerCase() || "";

        // Jaccard similarity for titles
        const words1 = new Set(titleLower.split(/\s+/));
        const words2 = new Set(existingTitle.split(/\s+/));

        const intersection = new Set([...words1].filter(x => words2.has(x)));
        const union = new Set([...words1, ...words2]);

        const similarity = intersection.size / union.size;

        if (similarity > 0.6) { // If >60% similar title
            return true;
        }

        // If content is provided, check for heavy overlap (optional, can be slow)
        if (content && article.content?.en) {
            const contentSnippet = content.substring(0, 200).toLowerCase();
            const existingSnippet = article.content.en.substring(0, 200).toLowerCase();

            if (contentSnippet.includes(existingSnippet) || existingSnippet.includes(contentSnippet)) {
                return true;
            }
        }
    }

    return false;
};
