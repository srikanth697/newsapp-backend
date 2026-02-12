# 🔥 News Aggregation Engine

## 🎯 Architecture Overview

```
RSS Feeds (BBC, NY Times, Reuters, Guardian)
              +
API Feeds (NewsAPI - India, International, Tech, Health)
              ↓
         Normalize Format
              ↓
         Merge Articles
              ↓
    Deduplicate (URL + Title Similarity)
              ↓
      Sort by Publish Date
              ↓
      Store in MongoDB (FeedNews)
              ↓
         GET /api/feed
              ↓
         Mobile App
```

---

## 📁 New Files Created

### **Services**
- `src/services/rssService.js` - Fetches and normalizes RSS feeds
- `src/services/apiService.js` - Fetches and normalizes NewsAPI data
- `src/services/feedAggregator.js` - **Core pipeline** that merges, deduplicates, and saves

### **Models**
- `src/models/FeedNews.js` - Unified feed model (separate from old News model)

### **Routes**
- `src/routes/feedRoutes.js` - Feed API endpoints

### **Utilities**
- `src/utils/deduplicate.js` - Smart deduplication (URL + Title similarity)

---

## 🚀 API Endpoints

### **1. Get Aggregated Feed**
```http
GET /api/feed
```

**Query Parameters:**
- `limit` (default: 50) - Number of articles to return
- `category` - Filter by category (india, international, tech, health, etc.)
- `source` - Filter by source (BBC News, Reuters, etc.)

**Example:**
```bash
curl http://localhost:5000/api/feed?limit=20&category=tech
```

**Response:**
```json
{
  "success": true,
  "count": 20,
  "news": [
    {
      "_id": "...",
      "title": "Article Title",
      "summary": "Brief summary...",
      "content": "Full content...",
      "url": "https://...",
      "image": "https://...",
      "source": "BBC News",
      "category": "tech",
      "publishedAt": "2026-02-12T05:23:45.000Z",
      "likes": 0,
      "shares": 0,
      "createdAt": "2026-02-12T05:23:45.000Z"
    }
  ]
}
```

---

### **2. Manually Refresh Feed**
```http
POST /api/feed/refresh
```

Triggers immediate aggregation from all sources.

**Example:**
```bash
curl -X POST http://localhost:5000/api/feed/refresh
```

**Response:**
```json
{
  "success": true,
  "message": "Feed refreshed successfully",
  "saved": 45,
  "skipped": 12,
  "duration": "8.34"
}
```

---

### **3. Get Feed Statistics**
```http
GET /api/feed/stats
```

Returns analytics about the feed.

**Response:**
```json
{
  "success": true,
  "total": 234,
  "byCategory": [
    { "_id": "tech", "count": 67 },
    { "_id": "international", "count": 54 }
  ],
  "bySource": [
    { "_id": "BBC News", "count": 89 },
    { "_id": "Reuters", "count": 45 }
  ]
}
```

---

## ⚙️ Configuration

### **RSS Feeds**
Edit `src/services/rssService.js` to add more RSS feeds:

```javascript
const RSS_FEEDS = [
  {
    url: "https://feeds.bbci.co.uk/news/rss.xml",
    source: "BBC News",
    category: "general",
  },
  // Add more feeds here
];
```

### **API Sources**
Edit `src/services/apiService.js` to modify NewsAPI queries.

### **Aggregation Frequency**
In `src/server.js`, the aggregation runs:
- **On startup** (after 5 seconds)
- **Every 10 minutes** (configurable)

Change the interval:
```javascript
setInterval(() => {
  aggregateFeed();
}, 15 * 60 * 1000); // 15 minutes
```

---

## 🔍 Deduplication Logic

### **Level 1: Exact URL Match**
Removes articles with identical URLs.

### **Level 2: Title Similarity**
Uses **Jaccard similarity** on word sets:
- Calculates similarity score between titles
- If similarity > 70%, considers it a duplicate
- Keeps only the first occurrence

**Example:**
```
"Apple releases new iPhone 15" 
vs 
"Apple releases iPhone 15 with new features"
→ 85% similar → Duplicate removed
```

---

## 📊 Database Schema

### **FeedNews Collection**
```javascript
{
  title: String,
  summary: String,
  content: String,
  url: String (unique),
  image: String,
  source: String,
  category: String,
  publishedAt: Date,
  likes: Number,
  shares: Number,
  savedCount: Number,
  likedBy: [ObjectId],
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes:**
- `publishedAt: -1` (for sorting)
- `category: 1` (for filtering)
- `url: 1` (for uniqueness)

---

## 🧪 Testing

### **1. Start the Server**
```bash
npm start
```

### **2. Wait for Initial Aggregation**
Watch the console logs:
```
🚀 Running initial feed aggregation...
📡 Fetching RSS from BBC News...
✅ Fetched 25 articles from BBC News
📡 Fetching India news from API...
✅ Fetched 20 India articles
...
✅ Feed aggregation complete in 8.34s
   💾 Saved: 67 new articles
   ⏭️  Skipped: 8 duplicates
```

### **3. Test the API**
```bash
# Get feed
curl http://localhost:5000/api/feed

# Get tech news only
curl http://localhost:5000/api/feed?category=tech

# Get stats
curl http://localhost:5000/api/feed/stats

# Manual refresh
curl -X POST http://localhost:5000/api/feed/refresh
```

---

## 🔥 Why This is Professional

✅ **Centralized Database** - Single source of truth  
✅ **No Duplicates** - Smart deduplication at URL and title level  
✅ **Sorted Timeline** - Always newest first  
✅ **Fast Frontend** - Pre-aggregated, no client-side merging  
✅ **Scalable** - Easy to add more RSS/API sources  
✅ **Clean Architecture** - Separation of concerns  
✅ **Automatic Updates** - Runs every 10 minutes  
✅ **Error Handling** - Graceful failures per source  
✅ **Analytics** - Built-in stats endpoint  

---

## 🚀 Next Level Features (Optional)

### **1. Story Clustering**
Group similar articles into single event cards:
```javascript
// Use embeddings or advanced NLP to cluster
const clusters = clusterSimilarStories(articles);
```

### **2. Trending Score**
Rank articles by engagement + recency:
```javascript
trendingScore = (likes * 2 + shares * 3) / ageInHours
```

### **3. Language Filtering**
Detect and filter by language:
```javascript
import { franc } from 'franc';
const lang = franc(article.content);
```

### **4. AI Summarization**
Generate concise summaries:
```javascript
import { summarize } from './aiService.js';
article.aiSummary = await summarize(article.content);
```

### **5. Background Worker**
Move aggregation to separate process:
```javascript
// Use Bull queue or node-cron with worker threads
```

---

## 📱 Mobile App Integration

Your Flutter app should now call:

```dart
// Old way (deprecated)
final response = await http.get('/news');

// New way (aggregated feed)
final response = await http.get('/api/feed?limit=50');
```

The feed contains **both RSS and API news**, deduplicated and sorted!

---

## 🐛 Troubleshooting

### **No articles appearing?**
1. Check MongoDB connection
2. Manually trigger: `POST /api/feed/refresh`
3. Check console logs for errors

### **Duplicates still appearing?**
1. Adjust similarity threshold in `src/utils/deduplicate.js`
2. Add more sophisticated matching

### **RSS feed not working?**
1. Check if RSS URL is accessible
2. Some feeds may require headers/authentication
3. Check CORS if fetching from browser

---

## 📝 Notes

- **Old News Model** (`src/models/News.js`) is still used for user-generated posts
- **New FeedNews Model** (`src/models/FeedNews.js`) is for aggregated news
- Both can coexist in your app
- You can merge them later if needed

---

**Built with ❤️ by your AI coding assistant**
