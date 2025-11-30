# Railway Redirect Loop Debugging Guide

## Current Status

**Problem**: `ERR_TOO_MANY_REDIRECTS` when accessing https://app.rbac.shop
**Last Fix**: Pushed 10 minutes ago (commit 9e91302)
**Status**: Waiting for Railway deployment to complete

---

## ✅ What We've Fixed

1. ✅ Added `trustHost: true` to auth.config.ts
2. ✅ Fixed middleware to mark `/login` as public page
3. ✅ Removed Dockerfile (using Nixpacks)
4. ✅ Set correct PORT handling (`next start -p ${PORT}`)
5. ✅ Added all required environment variables

---

## 🔍 Debugging Steps

### Step 1: Verify Railway Deployment Status

1. Go to Railway dashboard: https://railway.app
2. Open your project
3. Click **Deployments** tab
4. Check the **latest deployment** status:
   - ✅ If showing "Deployed" with green checkmark → Proceed to Step 2
   - ⏳ If showing "Deploying..." → Wait 2-3 minutes
   - ❌ If showing "Failed" → Check build logs

### Step 2: Clear Browser Cache

**Firefox**:
1. Press `Ctrl+Shift+Delete` (Windows/Linux) or `Cmd+Shift+Delete` (Mac)
2. Select "Cookies" and "Cache"
3. Click "Clear Now"
4. **OR** Open a **Private Window** (Ctrl+Shift+P)

**Chrome**:
1. Press `Ctrl+Shift+Delete` or `Cmd+Shift+Delete`
2. Select "Cookies" and "Cached images"
3. Click "Clear data"
4. **OR** Open **Incognito** (Ctrl+Shift+N)

### Step 3: Test Both URLs

After clearing cache, test:

1. **Custom domain**: https://app.rbac.shop
   - Expected: Should show login page
   - If redirect loop: Continue to Step 4

2. **Railway internal**: https://rbachierarchy-production.up.railway.app
   - Expected: Should redirect to custom domain
   - If 404/error: Check Railway logs

### Step 4: Check Railway Logs

1. Railway dashboard → Your service
2. Click **Logs** tab
3. Look for errors like:
   ```
   Error: listen EADDRINUSE
   Failed to start server
   Cannot find module
   Database connection failed
   ```
4. If you see errors, copy them and investigate

### Step 5: Verify Environment Variables

Railway dashboard → Variables → Verify all are set:

```bash
AUTH_URL=https://app.rbac.shop
AUTH_URL_INTERNAL=https://rbachierarchy-production.up.railway.app
AUTH_TRUST_HOST=true
AUTH_SECRET=eHVkuADSbxfdvj+GLAb0t8sZ2kuZuc9tvorxa5XLq5g=
NEXTAUTH_SECRET=eHVkuADSbxfdvj+GLAb0t8sZ2kuZuc9tvorxa5XLq5g=
NEXTAUTH_URL=https://app.rbac.shop
NEXT_PUBLIC_APP_URL=https://app.rbac.shop
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_URL_POOLED=${{Postgres.DATABASE_URL}}?pgbouncer=true&connection_limit=1
```

---

## 🧪 Manual Test via cURL

Run this command to bypass browser cache:

```bash
curl -sI https://app.rbac.shop | head -30
```

**Expected output**:
```
HTTP/2 200
content-type: text/html
```

**If redirect loop**:
```
HTTP/2 307
location: https://app.rbac.shop/
```

---

## 🚨 If Still Not Working

### Possible Issue: Database Not Accessible

If Railway can't connect to the database, Auth.js might fail and cause redirects.

**Check**:
1. Railway → Postgres service → Is it running?
2. Variables → Is `DATABASE_URL` correct?
3. Logs → Any "connection refused" or "database" errors?

### Possible Issue: Missing Prisma Client

**Solution**:
```bash
# In railway.toml, verify build command includes:
build = "npx prisma generate && npm run build"
```

This is already configured in your `railway.toml`.

### Possible Issue: Module Not Found

**Check Railway logs for**:
```
Cannot find module 'next-intl'
Cannot find module '@prisma/client'
```

**Solution**: Trigger a rebuild
1. Railway dashboard → Deployments
2. Click "..." on latest deployment
3. Click "Redeploy"

---

## 📊 Expected Flow (When Working)

```
User visits: https://app.rbac.shop
↓
Middleware: Check if logged in
↓
Not logged in → is this /login or public page?
↓
YES (/ is public) → Allow
↓
Page component: Redirect to /login
↓
Middleware: /login is public → Allow
↓
🎉 Login page renders
```

---

## ⏱️ Timeline

- **9 minutes ago**: Pushed middleware fix
- **Now**: Railway should have redeployed by now
- **If not working**: Wait 5 more minutes and clear browser cache again

---

## 📞 Next Steps

1. ✅ **Wait 2-3 minutes** for Railway deployment
2. ✅ **Clear browser cache** or use Private/Incognito window
3. ✅ **Test https://app.rbac.shop**
4. ❌ **If still broken**: Check Railway deployment logs and share them

---

**Last Updated**: 2025-11-30 08:20 UTC
