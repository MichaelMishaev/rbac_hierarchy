# ✅ FINAL Railway Environment Variables Configuration

## 🚨 Critical Fix for Redirect Loop

The issue is that Auth.js needs to trust **BOTH domains**:
- Public: `app.rbac.shop`
- Internal Railway: `rbachierarchy-production.up.railway.app`

---

## 📝 Complete Variable List (Copy These Exactly)

```bash
# Next.js URLs
NEXTAUTH_URL=https://app.rbac.shop
NEXT_PUBLIC_APP_URL=https://app.rbac.shop

# Auth.js v5 Configuration
AUTH_URL=https://app.rbac.shop
AUTH_TRUST_HOST=app.rbac.shop,rbachierarchy-production.up.railway.app

# Auth Secret (ONLY ONE, not two!)
NEXTAUTH_SECRET=eHVkuADSbxfdvj+GLAb0t8sZ2kuZuc9tvorxa5XLq5g=

# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_URL_POOLED=${{Postgres.DATABASE_URL}}?pgbouncer=true&connection_limit=1

# Other
EMAIL_FROM=noreply@localhost
NODE_ENV=production
```

---

## ❌ Remove These Variables (If They Exist)

1. `AUTH_URL_INTERNAL` - NOT needed with AUTH_TRUST_HOST
2. `AUTH_SECRET` - Duplicate of NEXTAUTH_SECRET

---

## 🔧 How to Update in Railway

### Step 1: Delete Old Variables

1. Go to Railway → Your Service → **Variables** tab
2. **Delete** these if they exist:
   - `AUTH_URL_INTERNAL` ❌
   - `AUTH_SECRET` ❌

### Step 2: Update AUTH_TRUST_HOST

1. Find `AUTH_TRUST_HOST`
2. Click **Edit**
3. Change value to:
   ```
   app.rbac.shop,rbachierarchy-production.up.railway.app
   ```
4. Click **Save**

### Step 3: Verify Final Variables

Your variables should be **EXACTLY** these 9 variables:

```
✅ NEXTAUTH_URL = https://app.rbac.shop
✅ NEXT_PUBLIC_APP_URL = https://app.rbac.shop
✅ AUTH_URL = https://app.rbac.shop
✅ AUTH_TRUST_HOST = app.rbac.shop,rbachierarchy-production.up.railway.app
✅ NEXTAUTH_SECRET = eHVkuADSbxfdvj+GLAb0t8sZ2kuZuc9tvorxa5XLq5g=
✅ DATABASE_URL = ${{Postgres.DATABASE_URL}}
✅ DATABASE_URL_POOLED = ${{Postgres.DATABASE_URL}}?pgbouncer=true&connection_limit=1
✅ EMAIL_FROM = noreply@localhost
✅ NODE_ENV = production
```

### Step 4: Redeploy

**IMPORTANT**: Railway does NOT auto-reload env vars!

1. Click **Deployments** tab
2. Find latest deployment
3. Click **"..."** (three dots)
4. Click **"Redeploy"**

---

## 🧠 Why This Works

```
Before (broken):
- Browser visits: app.rbac.shop
- NextAuth internally calls: rbachierarchy-production.up.railway.app/api/auth/session
- AUTH_TRUST_HOST="true" (not specific enough)
- NextAuth: "Untrusted host!" → Reject → Redirect → Loop 🔁

After (fixed):
- Browser visits: app.rbac.shop
- NextAuth internally calls: rbachierarchy-production.up.railway.app/api/auth/session
- AUTH_TRUST_HOST="app.rbac.shop,rbachierarchy-production.up.railway.app"
- NextAuth: "Both domains trusted!" → Allow → Success ✅
```

---

## ⏱️ Timeline

1. ✅ Update variables (2 minutes)
2. ✅ Click "Redeploy" (triggers rebuild)
3. ⏳ Wait for deployment (2-3 minutes)
4. 🧪 Test: https://app.rbac.shop
5. 🎉 Should show login page!

---

## 🧪 Test After Deployment

```bash
# Clear browser cache first!
curl -sI https://app.rbac.shop | head -20
```

Expected:
```
HTTP/2 200
content-type: text/html
```

---

**Last Updated**: 2025-11-30 08:25 UTC
