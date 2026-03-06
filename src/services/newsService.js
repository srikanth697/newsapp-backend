import fetchService from "./fetchService.js";
import extractionService from "./extractionService.js";
import aiService from "./aiService.js";
import quizService from "./quizService.js";
import { detectCategory, isIndiaNews } from "../utils/categoryDetector.js";
import dateUtils from "../utils/dateUtils.js";
import { withRetry } from "../utils/retryUtils.js";
import News from "../models/News.js";

async function processArticle(article, source) {
  try {
    const url = article.url || article.link;

    if (!url) return null;

    const exists = await News.findOne({ url });
    if (exists) return null;

    const publishedAt = new Date(article.pubDate || article.publishedAt);

    if (!dateUtils.isFresh(publishedAt)) return null;

    const fullContent = await extractionService.extractFullContent(url);

    if (!fullContent || fullContent.length < 500) return null;

    const rewritten = await withRetry(() => aiService.rewriteArticle(fullContent));

    const category = detectCategory(
      (article.title || "") + " " + (rewritten || "")
    );
    const country = isIndiaNews((article.title || ""), (rewritten || "")) ? "india" : "world";

    const quiz = await withRetry(() => quizService.generateQuiz(rewritten));

    const newsDoc = new News({
      title: article.title || "Untitled",
      url,
      source,
      image: article.image_url || article.image || article.urlToImage || "",
      content: fullContent,
      rewrittenContent: rewritten,
      category,
      country,
      quiz,
      publishedAt,
      isFresh: true
    });

    await newsDoc.save();

    return newsDoc;

  } catch (error) {
    console.error(`Pipeline error processing article:`, error.message);
    return null;
  }
}

async function runPipeline() {
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
