# Railway Environment Variables - Production Configuration

**Service:** `rbac_hierarchy`
**Domain:** `https://rbachierarchy-production.up.railway.app`
**Last Updated:** 2025-11-29

---

## ✅ Required Environment Variables

Copy these values to Railway Dashboard → `rbac_hierarchy` → **Variables** tab:

### 🔐 Authentication

```bash
NEXTAUTH_SECRET=ta0wS2z9104SINHhR6f3UDscHjS3nzzRS4xjHbCUvWE=
NEXTAUTH_URL=https://rbachierarchy-production.up.railway.app
```

### 🌐 Application URLs

```bash
NEXT_PUBLIC_APP_URL=https://rbachierarchy-production.up.railway.app
NODE_ENV=production
```

### 🗄️ Database Connection

**Option 1: Use Variable Reference (Recommended)**
1. Click "+ New Variable" or edit existing `DATABASE_URL`
2. Name: `DATABASE_URL`
3. Click `{}` icon (Variable Reference)
4. Select: PostgreSQL service → `DATABASE_URL`
5. Save

**Option 2: Use Railway Internal Reference**
```bash
DATABASE_URL=${{Postgres.DATABASE_URL}}
DATABASE_URL_POOLED=${{Postgres.DATABASE_URL}}?pgbouncer=true&connection_limit=1
```

**Option 3: Use Direct Connection String (Fallback)**
```bash
# Internal Railway network (faster)
DATABASE_URL=postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@postgres.railway.internal:5432/railway

DATABASE_URL_POOLED=postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@postgres.railway.internal:5432/railway?pgbouncer=true&connection_limit=1
```

### 📧 Email Configuration (Optional)

```bash
EMAIL_FROM=noreply@localhost
# For production, replace with real SMTP later:
# SMTP_HOST=smtp.sendgrid.net
# SMTP_PORT=587
# SMTP_USER=apikey
# SMTP_PASSWORD=your-api-key
```

---

## 🎯 Service Settings

Go to Settings → **Service Settings**:

| Setting | Value |
|---------|-------|
| **Root Directory** | `app` |
| **Build Command** | Auto-detected from `railway.toml` |
| **Start Command** | Auto-detected from `railway.toml` |

---

## 🚀 Deployment Steps

### 1. Update Environment Variables
- [ ] Set `NEXTAUTH_SECRET` to generated value
- [ ] Update `NEXTAUTH_URL` to `https://rbachierarchy-production.up.railway.app`
- [ ] Update `NEXT_PUBLIC_APP_URL` to `https://rbachierarchy-production.up.railway.app`
- [ ] Configure `DATABASE_URL` using Variable Reference or direct string
- [ ] Configure `DATABASE_URL_POOLED` with `?pgbouncer=true`
- [ ] Set `NODE_ENV=production`

### 2. Configure Service Settings
- [ ] Set Root Directory to `app`

### 3. Deploy
Railway will auto-deploy when you push changes to GitHub, or:
- [ ] Go to Deployments → Click "Deploy"

### 4. Initialize Database (After First Successful Deploy)
Open Terminal in Railway service and run:
```bash
# Push Prisma schema to production DB
npx prisma db push

# Seed with SuperAdmin and test data
npm run db:seed
```

### 5. Verify Deployment
- [ ] Visit: https://rbachierarchy-production.up.railway.app
- [ ] Check build logs for errors
- [ ] Test login with SuperAdmin credentials
- [ ] Verify organizational tree loads

---

## 🔍 Troubleshooting

### Build Fails with "Cannot find module 'prisma'"
**Solution:** Ensure `DATABASE_URL` is set before build runs (Prisma needs it to generate client)

### "NEXTAUTH_SECRET is not set" Error
**Solution:** Verify `NEXTAUTH_SECRET` is set in Variables tab (not in `.env` files)

### Database Connection Errors
**Checklist:**
1. ✅ `DATABASE_URL` is set correctly
2. ✅ `DATABASE_URL_POOLED` has `?pgbouncer=true`
3. ✅ PostgreSQL service is running
4. ✅ Railway private network is enabled

### "Module not found: @prisma/client"
**Solution:** Check build logs - ensure `npx prisma generate` ran successfully

---

## 📊 Environment Variables Summary

| Variable | Status | Value |
|----------|--------|-------|
| `DATABASE_URL` | ⚠️ Update | Reference Postgres service |
| `DATABASE_URL_POOLED` | ⚠️ Update | Reference + `?pgbouncer=true` |
| `NEXTAUTH_SECRET` | ❌ Missing | `ta0wS2z9104SINHhR6f3UDscHjS3nzzRS4xjHbCUvWE=` |
| `NEXTAUTH_URL` | ❌ Wrong | `https://rbachierarchy-production.up.railway.app` |
| `NEXT_PUBLIC_APP_URL` | ❌ Wrong | `https://rbachierarchy-production.up.railway.app` |
| `NODE_ENV` | ✅ Correct | `production` |

---

## 🎯 Next Commands After Deployment

```bash
# 1. Push database schema
npx prisma db push

# 2. Seed database
npm run db:seed

# 3. Check database (optional)
npx prisma studio

# 4. View logs
# Use Railway Dashboard → Deployments → View Logs
```

---

**Status:** Ready to deploy after variable updates
**Domain:** https://rbachierarchy-production.up.railway.app
**Region:** Metal Edge (Port 8080)
