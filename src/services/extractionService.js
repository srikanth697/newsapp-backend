import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const TIMEOUT = 10000; // 10 seconds

async function extractContentFromHtml(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article || !article.textContent) throw new Error("Could not extract article");
  return article.textContent.trim();
}

const extractionService = {
  async extractFullContent(url) {
    let attempts = 0;
    let lastError = null;
    while (attempts < 2) {
      try {
        const { data: html } = await axios.get(url, { timeout: TIMEOUT });
        const content = await extractContentFromHtml(html, url);
        if (content && content.length >= 500) return content;
        throw new Error(`Extracted content too short (${content?.length || 0} chars)`);
      } catch (err) {
        lastError = err;
        attempts++;
        console.error(`[ExtractionService] Attempt ${attempts} failed for ${url}:`, err.message);
      }
    }
    console.error(`[ExtractionService] Failed to extract content from ${url}:`, lastError?.message);
    return null;
  }
};

export default extractionService;
