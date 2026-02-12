# 🚀 QUICK START GUIDE

## ⚡ Start Server
```bash
npm start
```

## 🧪 Test Aggregation
```bash
node test-aggregation.js
```

## 📡 API Endpoints

### Get Feed
```bash
curl http://localhost:5000/api/feed
```

### Get Tech News
```bash
curl http://localhost:5000/api/feed?category=tech&limit=20
```

### Manual Refresh
```bash
curl -X POST http://localhost:5000/api/feed/refresh
```

### Get Stats
```bash
curl http://localhost:5000/api/feed/stats
```

## 📊 Response Format
```json
{
  "success": true,
  "count": 50,
  "news": [
    {
      "_id": "...",
      "title": "Article Title",
      "summary": "Brief summary",
      "content": "Full content",
      "url": "https://...",
      "image": "https://...",
      "source": "BBC News",
      "category": "tech",
      "publishedAt": "2026-02-12T05:23:45.000Z",
      "likes": 0,
      "shares": 0
    }
  ]
}
```

## 🔧 Configuration

### Add RSS Feed
Edit `src/services/rssService.js`:
```javascript
const RSS_FEEDS = [
  {
    url: "https://your-feed.com/rss.xml",
    source: "Your Source",
    category: "your_category",
  },
];
```

### Change Update Frequency
Edit `src/server.js`:
```javascript
setInterval(() => {
  aggregateFeed();
}, 15 * 60 * 1000); // 15 minutes
```

### Adjust Dedup Threshold
Edit `src/utils/deduplicate.js`:
```javascript
return similarity > 0.8; // 80% instead of 70%
```

## 📚 Documentation
- **Complete Guide:** `AGGREGATION_ENGINE.md`
- **Architecture:** `ARCHITECTURE.md`
- **Summary:** `IMPLEMENTATION_SUMMARY.md`

## 🎯 Data Sources

### RSS Feeds
- BBC News
- NY Times World
- Reuters
- The Guardian

### API Sources
- India News
- International News
- Technology News
- Health News

## ✅ Features
✅ Auto-updates every 10 minutes  
✅ Smart deduplication (URL + Title)  
✅ Unified format  
✅ Sorted by date  
✅ Fast API responses  
✅ Category filtering  
✅ Source filtering  

## 🐛 Troubleshooting

**No articles?**
```bash
curl -X POST http://localhost:5000/api/feed/refresh
```

**Check database:**
```bash
curl http://localhost:5000/api/feed/stats
```

**View logs:**
Check console output for errors

## 📱 Mobile App
```dart
// Use this endpoint in your Flutter app
final response = await http.get('$baseUrl/api/feed?limit=50');
final news = response.data['news'];
```

---
**Built with 🔥 - Ready for production!**
