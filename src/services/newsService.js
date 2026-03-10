import fetchService from "./fetchService.js";
import extractionService from "./extractionService.js";
import aiService from "./aiService.js";
import { detectCategory, isIndiaNews } from "../utils/categoryDetector.js";
import dateUtils from "../utils/dateUtils.js";
import { withRetry } from "../utils/retryUtils.js";
import News from "../models/News.js";
import crypto from "crypto";

// Free-tier protection: Limit AI calls per cycle
let aiCallsInCurrentCycle = 0;
const MAX_AI_CALLS_PER_CYCLE = 5;

function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/gi, "")
    .replace(/\s+/g, "-")
    + "-" + Date.now();
}

function generateHash(content) {
  return crypto.createHash("md5").update(content).digest("hex");
}

async function processArticle(article, source) {
  try {
    const url = article.url || article.link;
    if (!url) return null;

    // 1️⃣ Duplicate Detection (URL)
    const exists = await News.findOne({ url });
    if (exists) return null;

    // 2️⃣ Freshness Check (1 hour)
    const publishedAt = new Date(article.pubDate || article.publishedAt);
    if (!dateUtils.isFresh(publishedAt)) return null;

    // 3️⃣ Extract Full Article Content
    const fullContent = await extractionService.extractFullContent(url);
    if (!fullContent) return null;

    // 4️⃣ Content Length Validation (> 600 chars)
    if (fullContent.length < 600) {
      console.log(`[NewsService] Skipping ${url}: Content too short (${fullContent.length} chars)`);
      return null;
    }

    // 5️⃣ Detect Category BEFORE AI
    const category = detectCategory((article.title || "") + " " + fullContent);
    const country = isIndiaNews((article.title || ""), fullContent) ? "india" : "world";

    // 6️⃣ AI Protection: Check Call Limit
    if (aiCallsInCurrentCycle >= MAX_AI_CALLS_PER_CYCLE) {
      console.log("⚠️ AI Call Limit reached for this cycle. Skipping AI processing for remaining articles.");
      // Option: Save without AI or skip? Requester implies AI is core to "production-grade", so we skip or fallback.
      // But prompt says "Ensure Gemini is only used when necessary", so we skip to save tokens.
      return null;
    }

    // 7️⃣ AI Rewrite with Gemini
    aiCallsInCurrentCycle++;
    const rewritten = (await withRetry(() => aiService.rewriteArticle(fullContent))) || fullContent;

    // 8️⃣ Generate Quiz with Gemini
    const quiz = await withRetry(() => aiService.generateQuiz(rewritten));

    // 9️⃣ Save to MongoDB
    const slug = generateSlug(article.title || "untitled");
    const newsDoc = new News({
      title: article.title || "Untitled",
      slug,
      url,
      source,
      image: article.image_url || article.image || article.urlToImage || "",
      content: fullContent,
      rewrittenContent: rewritten,
      category,
      country,
      quiz,
      publishedAt,
      isFresh: true,
      contentHash: generateHash(fullContent)
    });

    await newsDoc.save();
    return newsDoc;

  } catch (error) {
    console.error(`Pipeline error processing article:`, error.message);
    return null;
  }
}

async function runPipeline() {
  // Reset AI counter for new cycle
  aiCallsInCurrentCycle = 0;

  const sources = [
    { name: "newsdata", fn: async () => { const res = await fetchService.fetchNewsdata("top"); return res.results; } },
    { name: "gnews", fn: async () => await fetchService.fetchGNews() },
    { name: "rss", fn: async () => await fetchService.fetchRSS() }
  ];

  const results = [];

  for (const src of sources) {
    try {
      const articles = await withRetry(src.fn);
      if (!articles) continue;

      for (const article of articles) {
        const processed = await processArticle(article, src.name);
        if (processed) results.push(processed);
      }
    } catch (err) {
      console.error(`Error with source ${src.name}:`, err.message);
    }
  }

  return results;
}

export default { runPipeline };
