import axios from "axios";
import * as cheerio from "cheerio";

/**
 * 🕷️ SCRAPE ARTICLE SERVICE
 * Extracts full text, images, and videos from a given URL
 */
export const scrapeArticle = async (url) => {
    try {
        // Skip known bot-blockers like NY Times
        if (url.includes("nytimes.com")) {
            return null;
        }

        console.log(`\n🕷️ Scraping: ${url}...`);

        // Add a tiny random delay to be more human
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

        // Add headers to mimic a browser and avoid some basic bot blocks
        const { data } = await axios.get(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
            },
            timeout: 10000,
        });

        const $ = cheerio.load(data);

        // 🖼️ EXTRACT IMAGES (Improved logic)
        let images = [];

        // 1. OpenGraph image (Strongest candidate)
        const ogImage = $('meta[property="og:image"]').attr("content") ||
            $('meta[name="twitter:image"]').attr("content") ||
            $('meta[property="og:image:url"]').attr("content");
        if (ogImage && ogImage.startsWith("http")) {
            images.push(ogImage);
        }

        // 2. Normal images
        $("img").each((i, el) => {
            const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src") || $(el).attr("srcset");

            if (src && src.startsWith("http")) {
                const cleanSrc = src.split(" ")[0]; // Clean srcset
                if (!cleanSrc.includes("logo") && !cleanSrc.includes("icon") && !cleanSrc.includes("avatar")) {
                    images.push(cleanSrc);
                }
            }
        });

        images = [...new Set(images)]; // Deduplicate

        // Remove unwanted elements
        $('script, style, nav, footer, header, ads, .ads, #ads, aside').remove();

        // Extract content from <p> tags
        let paragraphs = [];
        $("p").each((i, el) => {
            const text = $(el).text().trim();
            if (text.length > 25) {
                paragraphs.push(text);
            }
        });

        // Extract videos
        let videos = [];
        $("iframe").each((i, el) => {
            const src = $(el).attr("src");
            if (src && (src.includes("youtube") || src.includes("vimeo") || src.includes("dailymotion"))) {
                videos.push(src);
            }
        });

        const fullContent = paragraphs.join("\n\n");

        if (!fullContent || fullContent.length < 100) {
            console.warn(`⚠️ Warning: Scraped content for ${url} is very short or empty.`);
        }

        return {
            content: fullContent,
            images: images.slice(0, 10),
            videos: [...new Set(videos)],
            sourceUrl: url
        };
    } catch (error) {
        console.error(`❌ Scraping Error (${url}):`, error.message);
        return null;
    }
};
