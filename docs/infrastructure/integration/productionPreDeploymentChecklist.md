# Production Pre-Deployment Checklist

**Complete this checklist before merging `develop` → `main` for the first time**

---

## 🎯 Required: Critical Services

### ✅ 1. PostgreSQL Database

**Status:** Should already be configured

**Verify:**
```bash
# Check Railway Dashboard → Services → PostgreSQL
# Should see DATABASE_URL variable
```

**If missing:**
1. Railway Dashboard → New Service → PostgreSQL
2. Link `DATABASE_URL` to your app
3. Link `DATABASE_URL_POOLED` (same as DATABASE_URL + `?pgbouncer=true`)

---

### ✅ 2. Redis Cache

**Status:** ⚠️ NEEDS TO BE ADDED

**Required for:**
- Performance metrics storage
- Session management
- Rate limiting

**Setup Steps:**
1. Railway Dashboard → New Service → **Add Redis**
2. Click your app service → Variables → **New Variable** → **Reference**
3. Add reference:
   - Variable name: `REDIS_URL`
   - Service: Select your Redis service
   - Variable: `REDIS_URL`
4. Wait for auto-redeploy

**Documentation:** See `railwayRedisSetup.md`

**Alternative:** Use Upstash Redis (serverless) - see `railwayRedisSetup.md`

---

## 🔧 Required: Environment Variables

### ✅ 3. NextAuth Configuration

**Required Variables:**
```bash
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_URL=https://your-app.railway.app
```

**Setup:**
```bash
# Generate secret locally
openssl rand -base64 32

# Add to Railway:
# Railway → Your App → Variables → New Variable
# Name: NEXTAUTH_SECRET
# Value: <paste generated secret>

# Add NEXTAUTH_URL
# Name: NEXTAUTH_URL
# Value: https://your-app.railway.app (replace with your Railway domain)
```

---

### ✅ 4. Database URLs

**Required Variables:**
```bash
DATABASE_URL=<railway-provides-this>
DATABASE_URL_POOLED=<railway-provides-this>?pgbouncer=true
```

**Verify:**
- Railway → Your App → Variables
- Should see both variables linked from PostgreSQL service

---

### ✅ 5. Web Push Notifications (Optional but Recommended)

**Required for push notifications:**
```bash
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<your-public-key>
VAPID_PRIVATE_KEY=<your-private-key>
VAPID_SUBJECT=mailto:admin@your-domain.com
```

**Generate keys:**
```bash
cd app
npm run generate-vapid-keys
# Copy the output keys to Railway variables
```

---

## 🔍 Optional: Enhanced Features

### ✅ 6. Sentry Error Tracking (Recommended)

**Setup:**
1. Create account at [sentry.io](https://sentry.io)
2. Create new Next.js project
3. Copy DSN and auth token
4. Add to Railway:
   ```bash
   NEXT_PUBLIC_SENTRY_DSN=https://your-key@sentry.io/your-project-id
   SENTRY_DSN=https://your-key@sentry.io/your-project-id
   SENTRY_ORG=your-org-slug
   SENTRY_PROJECT=your-project-slug
   SENTRY_AUTH_TOKEN=your-auth-token
   ```

**Benefits:**
- Real-time error monitoring
- Performance tracking
- User session replay
- Release tracking

---

### ✅ 7. Build Version Tracking

**Auto-configured:** Railway automatically sets `NEXT_PUBLIC_BUILD_ID` during build

**Verify in logs:**
```
Building...
Setting NEXT_PUBLIC_BUILD_ID=2026-01-03-abc1234
```

---

## 🚀 Deployment Configuration

### ✅ 8. Railway.toml Configuration

**Status:** ✅ Already configured (just merged to develop)

**Verify:**
```bash
# Check root railway.toml contains:
cat railway.toml | grep preDeployCommand
# Should show: preDeployCommand = "npx prisma migrate deploy"
```

**What it does:**
- Automatically runs database migrations before each deployment
- Aborts deployment if migration fails (safety!)

---

## 📋 Pre-Deployment Verification

### Before Merging `develop` → `main`:

- [ ] **Redis added** to Railway (or Upstash configured)
- [ ] **REDIS_URL** linked to app service
- [ ] **NEXTAUTH_SECRET** generated and added
- [ ] **NEXTAUTH_URL** set to Railway domain
- [ ] **DATABASE_URL** and **DATABASE_URL_POOLED** verified
- [ ] **VAPID keys** generated and added (optional)
- [ ] **Sentry** configured (optional)
- [ ] **railway.toml** has `preDeployCommand`
- [ ] **Local build succeeds**: `cd app && npm run build`
- [ ] **Local tests pass**: `cd app && npm run test:e2e` (optional)

---

## 🎬 Deployment Steps

### Once all services are configured:

```bash
# 1. Verify Railway services are healthy
#    Railway Dashboard → Check all services are "Active"

# 2. Merge develop → main
git checkout main
git merge develop
git push origin main

# 3. Railway automatically:
#    - Detects push to main
#    - Runs migrations (npx prisma migrate deploy)
#    - Builds app (npm run build)
#    - Deploys app (npm start)

# 4. Verify deployment
#    Railway Dashboard → Your App → Deployments → Latest
#    - Check logs for "Pre-Deploy Command" success
#    - Check logs for "Build completed"
#    - Check logs for "Server started"

# 5. Test production app
curl https://your-app.railway.app
# Should return 200 OK

# 6. Test login
#    Open https://your-app.railway.app/login
#    Use test credentials from seed
```

---

## 🐛 Troubleshooting

### Deployment Failed: "Migration failed"

**Cause:** Schema migration has errors

**Fix:**
1. Check Railway logs for migration error details
2. Fix migration locally:
   ```bash
   cd app
   npx prisma migrate dev --name fix_migration_error
   ```
3. Test locally: `npx prisma migrate deploy`
4. Commit and push to develop
5. Re-merge to main

### Deployment Failed: "Build error"

**Cause:** TypeScript or build errors

**Fix:**
1. Run locally: `cd app && npm run build`
2. Fix errors
3. Commit to develop
4. Re-merge to main

### App Running but Features Not Working

**Check:**
1. Redis connected? → Check `REDIS_URL` in Railway variables
2. Database connected? → Check `DATABASE_URL` in Railway variables
3. Auth working? → Check `NEXTAUTH_SECRET` and `NEXTAUTH_URL`

---

## 📊 Post-Deployment Monitoring

### After successful deployment:

1. **Check Railway Metrics:**
   - Railway Dashboard → Your App → Metrics
   - Monitor CPU, Memory, Network usage

2. **Check Application Health:**
   - Visit: `https://your-app.railway.app`
   - Test login
   - Test creating a user
   - Test RBAC permissions

3. **Check Sentry (if configured):**
   - [sentry.io](https://sentry.io) → Your Project
   - Should see first deployment
   - Monitor for errors

4. **Check Redis:**
   - Railway Dashboard → Redis → Metrics
   - Should see connections from app
   - Monitor memory usage

---

## 🎯 Success Criteria

**Deployment is successful when:**

- ✅ Railway shows "Deployed" status (green)
- ✅ App loads at `https://your-app.railway.app`
- ✅ Login works with test credentials
- ✅ No errors in Railway logs
- ✅ Redis metrics show active connections
- ✅ Database migrations applied successfully
- ✅ No Sentry errors (if configured)

---

## 🔄 Future Deployments

**After initial setup, deployments are automatic:**

```bash
# 1. Work on develop
git checkout develop
# ... make changes ...
git commit -m "feat: new feature"
git push origin develop

# 2. Merge to main
git checkout main
git merge develop
git push origin main

# 3. Railway auto-deploys!
# ✅ Migrations run automatically
# ✅ App builds and deploys
# ✅ No manual steps needed
```

---

**Ready to deploy?** Complete the checklist above, then merge to `main`!
