/**
 * 🔥 SMART RANKING SYSTEM
 * Ranks articles based on freshness and importance keywords
 */
export const rankArticles = (articles) => {
    const now = new Date();

    return articles.map((article) => {
        const publishedAt = new Date(article.publishedAt);
        const hoursOld = (now - publishedAt) / (1000 * 60 * 60);

        // Freshness Base: Start with 48 points, lose 1 point per hour
        // Ensures news older than 48h starts with 0 freshness base
        let freshnessScore = Math.max(0, 48 - hoursOld);

        // Importance Boost (Keywords)
        let keywordBoost = 0;
        const lowerTitle = article.title.toLowerCase();

        if (lowerTitle.includes("breaking")) keywordBoost += 30;
        if (lowerTitle.includes("urgent")) keywordBoost += 20;
        if (lowerTitle.includes("exclusive")) keywordBoost += 15;
        if (lowerTitle.includes("just in")) keywordBoost += 10;

        // Source Credibility Boost (Optional)
        let sourceBoost = 0;
        if (article.source === "BBC News" || article.source === "NY Times World") {
            sourceBoost = 10;
        }

        const totalScore = parseFloat((freshnessScore + keywordBoost + sourceBoost).toFixed(2));

        return { ...article, score: totalScore };
    });
};
