# Railway Environment Variables - REQUIRED

## 🚨 Critical Auth.js (NextAuth v5) Configuration

Add these environment variables in Railway dashboard:

```bash
# Auth.js v5 URLs
AUTH_URL=https://app.rbac.shop
AUTH_URL_INTERNAL=https://rbachierarchy-production.up.railway.app
AUTH_TRUST_HOST=true

# Auth Secret (generate a random string)
AUTH_SECRET=<generate-random-secret-here>
NEXTAUTH_SECRET=<same-as-AUTH_SECRET>

# Database (already configured)
DATABASE_URL=postgresql://...
DATABASE_URL_POOLED=postgresql://...

# Node Environment
NODE_ENV=production
```

## 🔑 Generate AUTH_SECRET

Run this command locally to generate a secure random secret:

```bash
openssl rand -base64 32
```

Then add it to both `AUTH_SECRET` and `NEXTAUTH_SECRET` in Railway.

## 📍 How to Add in Railway

1. Go to Railway dashboard: https://railway.app
2. Select your project: `corporations-mvp`
3. Click on your service
4. Go to **Variables** tab
5. Click **+ New Variable**
6. Add each variable one by one:
   - Variable name: `AUTH_URL`
   - Value: `https://app.rbac.shop`
   - Click **Add**
   - Repeat for all variables above

## ✅ Verification

After adding these variables, Railway will automatically redeploy.

Test the deployment:
1. https://rbachierarchy-production.up.railway.app (should load)
2. https://app.rbac.shop (should load after DNS propagates)

## 🔍 Why This is Required

Auth.js v5 (NextAuth) blocks all requests from unknown domains by default.
Without `AUTH_TRUST_HOST=true` and proper `AUTH_URL` configuration, Railway domains will be rejected.

This causes:
- ❌ "DNS_PROBE_FINISHED_NXDOMAIN" errors (misleading - it's actually auth blocking)
- ❌ Railway internal domain not loading
- ❌ Custom domain not loading

With proper config:
- ✅ Auth.js trusts Railway domains
- ✅ All domains load correctly
- ✅ Authentication works properly
