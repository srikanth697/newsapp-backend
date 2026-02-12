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
 * 🎯 Main deduplication function
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
