import axios from "axios";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

const TIMEOUT = 10000;

// Browser-like headers to avoid 403 blocking
const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
  "Accept":
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
  "Connection": "keep-alive"
};

async function extractContentFromHtml(html, url) {
  const dom = new JSDOM(html, { url });

  const reader = new Readability(dom.window.document);

  const article = reader.parse();

  if (!article || !article.textContent) {
    throw new Error("Readability could not extract article");
  }

  return article.textContent.trim();
}

const extractionService = {
  async extractFullContent(url) {
    let attempts = 0;
    let lastError = null;

    while (attempts < 2) {
      try {

        const response = await axios.get(url, {
          timeout: TIMEOUT,
          headers: HEADERS,
          maxRedirects: 5
        });

        const html = response.data;

        const content = await extractContentFromHtml(html, url);

        if (content && content.length >= 500) {
          return content;
        }

        throw new Error(
          `Extracted content too short (${content?.length || 0} chars)`
        );

      } catch (err) {
        attempts++;
        lastError = err;

        console.error(
          `[ExtractionService] Attempt ${attempts} failed for ${url}:`,
          err.message
        );
      }
    }

    console.error(
      `[ExtractionService] Failed to extract content from ${url}:`,
      lastError?.message
    );

    return null;
  }
};

export default extractionService;