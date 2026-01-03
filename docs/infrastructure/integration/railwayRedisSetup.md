# Railway Redis Setup Guide

**How to add Redis to your Railway production environment**

---

## 🎯 Quick Setup (3 Steps)

### Option A: Railway Redis (Recommended)

```bash
# 1. Add Redis service in Railway dashboard
#    Railway Dashboard → Your Project → New Service → Redis

# 2. Link Redis to your app
#    Click your app service → Variables → Add Reference Variable
#    Variable name: REDIS_URL
#    Reference: Redis → REDIS_URL

# 3. Redeploy your app
#    Railway auto-redeploys when you add variables
```

**Done!** Your app will automatically connect to Redis.

---

## 📋 Step-by-Step Instructions

### Step 1: Add Redis Service

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click **"New Service"** button
4. Select **"Database"** → **"Add Redis"**
5. Railway creates a Redis instance instantly

### Step 2: Get Redis Connection String

**Railway automatically creates these variables for Redis:**
- `REDIS_URL` - Full connection string (use this)
- `REDIS_HOST` - Hostname
- `REDIS_PORT` - Port number
- `REDIS_PASSWORD` - Password

### Step 3: Link Redis to Your App

**Method 1: Using Railway UI (Easiest)**
1. Click on your **app service** (not Redis)
2. Go to **"Variables"** tab
3. Click **"New Variable"** → **"Reference"**
4. Enter:
   - **Variable name**: `REDIS_URL`
   - **Service**: Select your Redis service
   - **Variable**: Select `REDIS_URL`
5. Click **"Add"**

**Method 2: Manual Configuration**
1. Click on **Redis service**
2. Go to **"Variables"** tab
3. Copy the `REDIS_URL` value (e.g., `redis://default:password@redis.railway.internal:6379`)
4. Click on your **app service**
5. Go to **"Variables"** tab
6. Click **"New Variable"** → **"Variable Pair"**
7. Enter:
   - **Variable name**: `REDIS_URL`
   - **Value**: Paste the connection string
8. Click **"Add"**

### Step 4: Verify Connection

After Railway redeploys your app:

1. Check deployment logs:
   ```
   Railway Dashboard → Your App → Deployments → Latest → Logs
   ```

2. Look for Redis connection messages:
   ```
   ✓ Redis connected successfully
   ```

3. Test metrics endpoint:
   ```bash
   curl https://your-app.railway.app/api/metrics/store
   ```

---

## 🔧 Local Development Setup

Your local environment already has Redis configured via Docker:

```bash
# Start Redis locally
make up

# Redis is available at:
# Host: localhost
# Port: 6381
# Password: redis_dev_password
```

**Add to your local `.env`:**

```bash
# Redis (Local Docker)
REDIS_URL="redis://:redis_dev_password@localhost:6381"
```

---

## 🌐 Alternative: Upstash Redis (Serverless)

If you prefer Upstash Redis (serverless, free tier available):

### Step 1: Create Upstash Account
1. Go to [upstash.com](https://upstash.com)
2. Sign up / Log in
3. Create new Redis database
4. Select region closest to your Railway region

### Step 2: Get Credentials
1. Go to your Upstash database
2. Copy these values:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

### Step 3: Add to Railway
1. Railway Dashboard → Your App → Variables
2. Add:
   ```
   UPSTASH_REDIS_REST_URL=https://your-db.upstash.io
   UPSTASH_REDIS_REST_TOKEN=your-token
   ```

**The app automatically detects Upstash and uses it if `REDIS_URL` is not set.**

---

## ⚡ How the App Uses Redis

Your app uses Redis for:

1. **Web Vitals Metrics** (`/api/metrics/store`)
   - Stores performance metrics (FCP, LCP, CLS, etc.)
   - TTL: 7 days
   - Key format: `metrics:webvitals:{userId}:{timestamp}`

2. **Custom Metrics** (`/api/metrics/aggregate`)
   - Aggregates performance data
   - Sorted sets for time-series data

3. **Session Storage** (if configured)
   - User sessions
   - Rate limiting

**Connection Priority:**
1. `REDIS_URL` (Railway/standard Redis) ← **Recommended**
2. `UPSTASH_REDIS_REST_URL` (Upstash REST API)
3. If neither → Redis features disabled (app still works)

---

## 🔍 Verification Checklist

- [ ] Redis service created in Railway
- [ ] `REDIS_URL` variable added to app
- [ ] App redeployed successfully
- [ ] Check logs: no Redis connection errors
- [ ] Test metrics endpoint works

---

## 🐛 Troubleshooting

### Issue: "ECONNREFUSED" or "Connection timeout"

**Cause:** App can't reach Redis service

**Fix:**
1. Verify `REDIS_URL` is set correctly
2. Check Redis service is running (Railway Dashboard → Redis → Deployments)
3. Ensure services are in the same Railway project
4. Use **internal** Railway URLs (e.g., `redis.railway.internal`) not public URLs

### Issue: "WRONGPASS invalid username-password pair"

**Cause:** Incorrect Redis password

**Fix:**
1. Get fresh `REDIS_URL` from Redis service variables
2. Update app's `REDIS_URL` variable
3. Redeploy app

### Issue: Redis metrics not showing

**Cause:** Redis not connected or feature disabled

**Fix:**
1. Check logs for Redis connection messages
2. Verify `REDIS_URL` environment variable exists
3. Test endpoint: `curl https://your-app/api/metrics/store`

---

## 📊 Redis Pricing (Railway)

- **Free Tier**: Railway provides $5/month free credits
- **Redis Usage**: ~$0.10/day for small databases
- **Typical Cost**: ~$3-5/month for production use

**Cost Optimization:**
- Enable eviction policy: `allkeys-lru` (auto-removes old keys)
- Set TTLs on all keys (app already does this)
- Monitor memory usage in Railway dashboard

---

## 🎯 Production Checklist

Before going live with Redis:

- [ ] Redis service created in Railway
- [ ] `REDIS_URL` configured in production app
- [ ] Eviction policy set (optional but recommended)
- [ ] Backup strategy considered (Redis Persistence enabled)
- [ ] Monitor Redis memory usage
- [ ] Test performance metrics collection
- [ ] Verify app works if Redis is down (graceful degradation)

---

## 📝 Summary

**Railway Redis (Recommended):**
```bash
# 1. Railway Dashboard → New Service → Redis
# 2. Link REDIS_URL to your app
# 3. Done! App auto-connects
```

**Upstash Redis (Alternative):**
```bash
# 1. Create database at upstash.com
# 2. Add UPSTASH_REDIS_REST_URL + TOKEN to Railway variables
# 3. Done! App auto-connects
```

**Your app code automatically:**
- ✅ Detects which Redis is available
- ✅ Connects on startup
- ✅ Handles connection failures gracefully
- ✅ Uses Redis if available, works without it if not

---

**Need help?** Check Railway logs or contact support.
