import axios from "axios";
import News from "../models/News.js";
import extractionService from "./extractionService.js";
import dayjs from "dayjs";

const GNEWS_API = "https://gnews.io/api/v4/search";
const NEWSAPI_API = "https://newsapi.org/v2/everything";
const RSS_FEEDS = [];

function normalizeTitle(title) {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

async function fetchFromGNews(query) {
  try {
    const { data } = await axios.get(GNEWS_API, {
      params: { q: query, token: process.env.GNEWS_API_KEY, max: 10 },
      timeout: 7000
    });
    return data.articles || [];
  } catch (err) {
    return [];
  }
}

async function fetchFromNewsAPI(query) {
  try {
    const { data } = await axios.get(NEWSAPI_API, {
      params: { q: query, apiKey: process.env.NEWS_API_KEY, pageSize: 10 },
      timeout: 7000
    });
    return data.articles || [];
  } catch (err) {
    return [];
  }
}

async function fetchFromRSS(query) {
  // Implement RSS fetch logic if needed
  return [];
}

async function aggregateNews(query) {
  let articles = await fetchFromGNews(query);
  let source = "gnews";
  if (!articles.length) {
    articles = await fetchFromNewsAPI(query);
    source = "newsapi";
  }
  if (!articles.length) {
    articles = await fetchFromRSS(query);
    source = "rss";
  }

  const seen = new Set();
  const deduped = articles.filter(a => {
    const key = (a.url || a.link) + "|" + normalizeTitle(a.title);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  const results = [];
  for (const a of deduped) {
    try {
      const fullContent = await extractionService.extractFullContent(a.url || a.link);
      if (!fullContent || fullContent.length < 500) {
        console.error(`[newsService] Skipping incomplete article: ${a.url || a.link}`);
        continue;
      }
      const publishedAtUTC = dayjs(a.publishedAt || a.pubDate).toDate();
      const newsDoc = new News({
        title: a.title,
        originalUrl: a.url || a.link,
        source,
        image: a.image || a.urlToImage || "",
        fullContent,
        publishedAt: publishedAtUTC
      });
      await newsDoc.save();
      console.log(`[newsService] Saved article: ${newsDoc.title}`);
      results.push(newsDoc);
    } catch (err) {
      if (err.code === 11000) {
        console.error(`[newsService] Duplicate article skipped: ${a.url || a.link}`);
      } else {
        console.error(`[newsService] Error saving article: ${a.url || a.link}`, err.message);
      }
    }
  }
  return results;
}

async function getNewsById(id) {
  const news = await News.findById(id);
  if (!news || !news.fullContent) return null;
  return news;
}

export default { aggregateNews, getNewsById };
