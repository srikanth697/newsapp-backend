import { fetchRSS } from "./rssService.js";
import { fetchFromNewsAPI } from "./newsApiService.js";
import { scrapeArticle } from "./scrapeService.js";
import { rewriteWithAI, generateQuizFromContent } from "./aiService.js";
import News from "../models/News.js";
import Quiz from "../models/Quiz.js";
import Category from "../models/Category.js";
import { isDuplicateInDB } from "../utils/deduplicate.js";

/**
 * 🧩 AUTO QUIZ GENERATOR
 * Generates and saves a quiz from a saved news item
 */
async function autoGenerateQuiz(savedNews, cleanContent, cleanTitle) {
    try {
        const quizData = await generateQuizFromContent(cleanContent, cleanTitle);
        if (!quizData || !quizData.questions || quizData.questions.length === 0) {
            console.log("⚠️ No quiz generated — skipping.");
            return;
        }

        // Map category string to Quiz model enum
        const catMap = {
            politics: "politics", business: "business", sports: "sports",
            technology: "technology", entertainment: "entertainment",
            world: "world", health: "general", general: "general"
        };
        const newsCategory = (savedNews.category?.toString() || "general").toLowerCase();
        const quizCategory = catMap[newsCategory] || "general";

        await Quiz.create({
            title: quizData.title || cleanTitle,
            description: quizData.description || "Test your knowledge on this news topic.",
            questions: quizData.questions,
            category: quizCategory,
            newsId: savedNews._id,
            sourceType: "ai_news",
            status: "published", // Auto-publish AI quizzes
            timerMinutes: 3
        });

        console.log(`🧩 Quiz auto-generated for: "${cleanTitle}"`);
    } catch (err) {
        console.error(`❌ Quiz Generation failed for "${cleanTitle}":`, err.message);
    }
}

/**
 * 🖼️ GUARANTEED DEFAULT IMAGES
 */
const DEFAULT_IMAGES = {
    tech: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=80",
    politics: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=800&q=80",
    sports: "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800&q=80",
    business: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&q=80",
    world: "https://images.unsplash.com/photo-1521295121783-8a321d551ad2?w=800&q=80",
    health: "https://images.unsplash.com/photo-1505751172569-e701e62f5500?w=800&q=80",
    entertainment: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&q=80",
    general: "https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=800&q=80"
};

const getFallbackImage = (category) => {
    const cat = category?.toLowerCase() || "general";
    if (cat.includes("tech")) return DEFAULT_IMAGES.tech;
    if (cat.includes("polit")) return DEFAULT_IMAGES.politics;
    if (cat.includes("sport")) return DEFAULT_IMAGES.sports;
    if (cat.includes("busin")) return DEFAULT_IMAGES.business;
    if (cat.includes("world")) return DEFAULT_IMAGES.world;
    if (cat.includes("health")) return DEFAULT_IMAGES.health;
    if (cat.includes("entert") || cat.includes("movie")) return DEFAULT_IMAGES.entertainment;
    return DEFAULT_IMAGES.general;
};

/**
 * 🧹 CLEAN HTML Before Storing
 */
function cleanHTMLContent(text) {
    if (!text) return "";
    return text
        .replace(/<[^>]*>?/gm, "") // remove all HTML tags
        .replace(/\s+/g, " ")     // remove extra spaces
        .trim();
}

/**
 * 🖼️ IMAGE VALIDATION
 */
function isValidImage(url) {
    return (
        url &&
        url.startsWith("http") &&
        (url.endsWith(".jpg") ||
            url.endsWith(".jpeg") ||
            url.endsWith(".png") ||
            url.includes("image"))
    );
}

/**
 * 🚀 PRODUCTION AI NEWS GENERATOR
 */
export const generateAINews = async () => {
    console.log("\n🤖 Starting Production AI News Pipeline...");

    try {
        const rssItems = await fetchRSS();
        const apiItems = await fetchFromNewsAPI();

        // Deduplicate based on URL
        const combined = [...rssItems, ...apiItems];
        const uniqueItems = Array.from(new Map(combined.map(item => [item.url, item])).values());

        console.log(`📡 Sources synced. Processing ${uniqueItems.length} unique articles...`);

        let processedCount = 0;
        const limitPerRun = 10;
        const staggerMinutes = 15; // Gap between articles

        // Determine starting slot for scheduling
        const latestQueued = await News.findOne({ isUserPost: false }).sort({ publishedAt: -1 });
        let nextPublishTime = new Date();
        if (latestQueued && latestQueued.publishedAt > nextPublishTime) {
            nextPublishTime = new Date(latestQueued.publishedAt.getTime() + staggerMinutes * 60000);
        }

        for (const item of uniqueItems) {
            if (processedCount >= limitPerRun) break;

            try {
                // 1. Skip if exists
                const exists = await News.findOne({ sourceUrl: item.url });
                if (exists) continue;

                // 2. Scrape
                const scraped = await scrapeArticle(item.url);
                if (!scraped || !scraped.content || scraped.content.length < 300) continue;

                // 3. Smart Duplicate Check (Content similarity)
                const isDuplicate = await isDuplicateInDB(item.title, scraped.content);
                if (isDuplicate) continue;

                // 4. AI Rewrite
                let aiData = await rewriteWithAI(scraped.content, item.title);
                if (!aiData) continue;

                // 🧠 EXTRA SAFETY CHECK: Word Count Validation
                const wordCount = aiData.content?.split(/\s+/).length || 0;
                if (wordCount < 400) {
                    console.log(`⚠️ Too short (${wordCount} words), retrying with stronger emphasis...`);
                    aiData = await rewriteWithAI(scraped.content + "\n\nCRITICAL: EXPAND THIS TO 500+ WORDS.", item.title);
                }

                if (!aiData || !aiData.title || !aiData.content) continue;

                // Clean HTML from strings
                const cleanTitle = cleanHTMLContent(aiData.title);
                const cleanSummary = cleanHTMLContent(aiData.summary);
                const cleanContent = cleanHTMLContent(aiData.content);

                // 5. Guaranteed Image priority
                let finalImageUrl = null;
                if (scraped.images && scraped.images.length > 0 && isValidImage(scraped.images[0])) {
                    finalImageUrl = scraped.images[0];
                } else if (item.image && isValidImage(item.image)) {
                    finalImageUrl = item.image;
                } else {
                    finalImageUrl = getFallbackImage(aiData.category);
                }

                // 6. Resolve Category ID
                let categoryId = null;
                try {
                    const categoryName = aiData.category || "General";
                    let foundCategory = await Category.findOne({
                        name: { $regex: new RegExp(`^${categoryName}$`, "i") }
                    });

                    // If not found, try common synonyms
                    if (!foundCategory) {
                        const synonyms = {
                            "World": ["International", "Global", "World"],
                            "Politics": ["Government", "Politics"],
                            "Business": ["Economy", "Finance", "Business"],
                            "Technology": ["Tech", "Science", "Technology"],
                            "Entertainment": ["Movies", "CELEBRITY", "Entertainment"],
                            "General": ["Other", "India", "General"]
                        };

                        for (const [key, syns] of Object.entries(synonyms)) {
                            if (syns.some(s => s.toLowerCase() === categoryName.toLowerCase())) {
                                foundCategory = await Category.findOne({ name: { $regex: new RegExp(`^${key}$`, "i") } });
                                break;
                            }
                        }
                    }

                    categoryId = foundCategory ? foundCategory._id : categoryName; // Use ID if found, else original name string
                } catch (e) {
                    categoryId = aiData.category || "General";
                }

                // 7. Save as 'scheduled'
                let publishDate = item.publishedAt && !isNaN(new Date(item.publishedAt))
                    ? new Date(item.publishedAt)
                    : new Date(nextPublishTime.getTime());

                if (publishDate > nextPublishTime) {
                    publishDate = new Date(nextPublishTime.getTime());
                }

                // Determine Region/Country
                const countryCode = aiData.region?.toLowerCase() === "india" ? "IN" : "GLOBAL";

                const savedNews = await News.create({
                    title: { en: cleanTitle },
                    description: { en: cleanSummary },
                    content: { en: cleanContent },
                    imageUrl: finalImageUrl,
                    images: scraped.images && scraped.images.length > 0 ? scraped.images.filter(isValidImage) : [finalImageUrl],
                    videos: scraped.videos,
                    sourceUrl: item.url,
                    source: item.source || "AI Daily",
                    category: categoryId || aiData.category || "General",
                    country: countryCode,
                    status: "scheduled", // ALWAYS scheduled for AI
                    publishedAt: publishDate,
                    isUserPost: false
                });

                console.log(`✅ Scheduled: "${cleanTitle}" (${cleanContent.split(/\s+/).length} words) for ${publishDate.toLocaleString()}`);

                // 🧩 Auto-generate quiz from this news article (non-blocking)
                autoGenerateQuiz(savedNews, cleanContent, cleanTitle).catch(err =>
                    console.error("Quiz auto-gen failed silently:", err.message)
                );

                processedCount++;
                nextPublishTime = new Date(nextPublishTime.getTime() + staggerMinutes * 60000);

                await new Promise(r => setTimeout(r, 2000));

            } catch (err) {
                console.error(`❌ Item Error (${item.title}):`, err.message);
            }
        }

        console.log(`🤖 Pipeline finished. ${processedCount} slots filled.`);
        return { success: true, count: processedCount };

    } catch (error) {
        console.error("❌ Global Pipeline Failure:", error.message);
        return { success: false, error: error.message };
    }
};

/**
 * ⏰ CRON: Convert Scheduled to Approved
 */
export const autoPublishScheduledNews = async () => {
    try {
        const now = new Date();
        const result = await News.updateMany(
            { status: "scheduled", publishedAt: { $lte: now } },
            { $set: { status: "approved" } }
        );

        if (result.matchedCount > 0) {
            console.log(`🚀 Automated Publish: ${result.modifiedCount} news items gone live.`);
        }
    } catch (error) {
        console.error("❌ Cron Publish Error:", error.message);
    }
};
