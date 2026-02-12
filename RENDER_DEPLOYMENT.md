# 🚀 RENDER DEPLOYMENT GUIDE

## 📋 PREREQUISITES

- ✅ GitHub account
- ✅ Render account (free tier works!)
- ✅ MongoDB Atlas (already configured)
- ✅ Your code pushed to GitHub

---

## 🔧 STEP 1: PREPARE YOUR PROJECT

### **1. Create `.gitignore` (if not exists)**

Make sure you have a `.gitignore` file:

```
node_modules/
.env
*.log
.DS_Store
```

### **2. Update `package.json`**

Make sure your `package.json` has the start script:

```json
{
  "scripts": {
    "start": "node src/server.js"
  }
}
```

✅ Already done in your project!

---

## 🌐 STEP 2: PUSH TO GITHUB

```bash
# Initialize git (if not done)
git init

# Add all files
git add .

# Commit
git commit -m "News aggregation engine ready for deployment"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/newsapp-backend.git
git branch -M main
git push -u origin main
```

---

## 🚀 STEP 3: DEPLOY TO RENDER

### **1. Go to Render Dashboard**
- Visit: https://dashboard.render.com/
- Sign in with GitHub

### **2. Create New Web Service**
- Click **"New +"** → **"Web Service"**
- Connect your GitHub repository
- Select your `newsapp-backend` repo

### **3. Configure Service**

| Setting | Value |
|---------|-------|
| **Name** | `newsapp-backend` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | (leave empty) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### **4. Add Environment Variables**

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables:

| Key | Value |
|-----|-------|
| `PORT` | `5000` |
| `MONGODB_URI` | `your_mongodb_atlas_connection_string` |
| `JWT_SECRET` | `super_strong_secret_key_123` |
| `NEWS_API_KEY` | `your_newsapi_key` (optional) |
| `NODE_ENV` | `production` |

**Important:** Copy your MongoDB URI from `.env` file!

### **5. Deploy!**
- Click **"Create Web Service"**
- Render will automatically build and deploy
- Wait 2-3 minutes for deployment

---

## 🌍 STEP 4: GET YOUR URL

After deployment, Render gives you a URL like:
```
https://newsapp-backend.onrender.com
```

---

## 🧪 STEP 5: TEST YOUR DEPLOYMENT

### **Test Unified Feed:**
```
https://newsapp-backend.onrender.com/api/unified
```

### **Test Stats:**
```
https://newsapp-backend.onrender.com/api/unified/stats
```

### **Test Tech News:**
```
https://newsapp-backend.onrender.com/api/unified?category=tech&limit=20
```

---

## 📱 STEP 6: UPDATE FLUTTER APP

Update your Flutter app's base URL:

```dart
class NewsService {
  // OLD (localhost)
  // static const String baseUrl = 'http://localhost:5000';
  
  // NEW (Render deployment)
  static const String baseUrl = 'https://newsapp-backend.onrender.com';
  
  Future<List<dynamic>> getAllNews() async {
    final response = await http.get(
      Uri.parse('$baseUrl/api/unified?limit=50')
    );
    // ... rest of code
  }
}
```

---

## ⚠️ IMPORTANT: FREE TIER LIMITATIONS

### **Render Free Tier:**
- ✅ Free forever
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down takes 30-60 seconds (cold start)
- ✅ Unlimited bandwidth
- ✅ Auto-deploys on git push

### **Solution for Cold Starts:**

**Option 1: Keep-Alive Service (Free)**
Use a service like UptimeRobot to ping your API every 10 minutes:
- https://uptimerobot.com/
- Add monitor: `https://newsapp-backend.onrender.com/api/unified/stats`
- Interval: 5 minutes

**Option 2: Upgrade to Paid Plan**
- $7/month for always-on instance
- No cold starts

---

## 🔄 AUTO-DEPLOYMENT

Every time you push to GitHub, Render automatically:
1. Pulls latest code
2. Runs `npm install`
3. Runs `npm start`
4. Deploys new version

```bash
# Make changes
git add .
git commit -m "Added new feature"
git push

# Render automatically deploys! 🚀
```

---

## 🐛 TROUBLESHOOTING

### **Deployment Failed?**

**Check Build Logs:**
1. Go to Render Dashboard
2. Click your service
3. Click "Logs" tab
4. Look for errors

**Common Issues:**

**1. MongoDB Connection Failed**
- Check if MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Verify `MONGODB_URI` environment variable is correct

**2. Port Issues**
- Make sure your code uses `process.env.PORT`
- Render automatically assigns a port

**3. Missing Dependencies**
- Check `package.json` has all dependencies
- Run `npm install` locally to verify

### **App Not Responding?**

**Check if service is running:**
```
https://newsapp-backend.onrender.com/api/unified/stats
```

If you get an error, check:
1. Render dashboard → Logs
2. MongoDB Atlas → Network Access
3. Environment variables are set correctly

---

## 📊 MONITORING

### **View Logs:**
Render Dashboard → Your Service → Logs

### **Check Metrics:**
Render Dashboard → Your Service → Metrics

### **Restart Service:**
Render Dashboard → Your Service → Manual Deploy → "Clear build cache & deploy"

---

## 🔒 SECURITY BEST PRACTICES

### **1. Environment Variables**
✅ Never commit `.env` to GitHub
✅ Use Render's environment variables
✅ Rotate secrets regularly

### **2. MongoDB Atlas**
✅ Use strong password
✅ Enable IP whitelist (or use 0.0.0.0/0 for Render)
✅ Use read-only users where possible

### **3. API Keys**
✅ Keep NewsAPI key in environment variables
✅ Don't expose in client-side code

---

## 🎯 DEPLOYMENT CHECKLIST

- [ ] Code pushed to GitHub
- [ ] `.env` file NOT in GitHub (in `.gitignore`)
- [ ] MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- [ ] Render service created
- [ ] Environment variables added to Render
- [ ] Deployment successful (check logs)
- [ ] Test API endpoints
- [ ] Update Flutter app base URL
- [ ] Test Flutter app with production API

---

## 🔥 PRODUCTION READY!

Once deployed, your aggregation engine will:
- ✅ Auto-update RSS feeds every 10 minutes
- ✅ Store articles in MongoDB Atlas
- ✅ Serve 334+ articles via API
- ✅ Auto-deploy on git push
- ✅ Scale automatically

---

## 📱 FLUTTER APP CONFIGURATION

### **Development vs Production:**

```dart
class Config {
  static const bool isDevelopment = false; // Change to false for production
  
  static String get baseUrl {
    if (isDevelopment) {
      return 'http://localhost:5000'; // Local development
    } else {
      return 'https://newsapp-backend.onrender.com'; // Production
    }
  }
}

// Usage
class NewsService {
  Future<List<dynamic>> getAllNews() async {
    final response = await http.get(
      Uri.parse('${Config.baseUrl}/api/unified?limit=50')
    );
    // ...
  }
}
```

---

## 🎉 YOU'RE LIVE!

Your news aggregation engine is now:
- 🌍 Accessible worldwide
- 🔄 Auto-updating every 10 minutes
- 📱 Ready for your Flutter app
- 🚀 Auto-deploying on git push

**Your API URL:**
```
https://newsapp-backend.onrender.com/api/unified
```

---

## 📚 USEFUL LINKS

- **Render Dashboard:** https://dashboard.render.com/
- **Render Docs:** https://render.com/docs
- **MongoDB Atlas:** https://cloud.mongodb.com/
- **UptimeRobot:** https://uptimerobot.com/ (keep-alive service)

---

**Need help with deployment? Let me know! 🚀**
