# Railway Development Environment Setup

## ✅ Completed Steps

1. ✅ Created `develop` branch on GitHub
2. ✅ Created `development` environment on Railway

## 📋 Manual Steps Required (Railway Dashboard)

### Step 1: Add PostgreSQL to Development Environment

1. Go to: https://railway.app/project/812ee13e-900b-4435-9b08-6a6f96060771
2. Switch to **development** environment (dropdown at top)
3. Click **"+ New"**
4. Select **"Database"** → **"Add PostgreSQL"**
5. Wait for deployment to complete

### Step 2: Add App Service to Development Environment

1. In the **development** environment, click **"+ New"**
2. Select **"GitHub Repo"**
3. Choose repository: **MichaelMishaev/rbac_hierarchy**
4. Select branch: **develop**
5. Click **"Add Service"**

### Step 3: Configure App Service Settings

1. Click on the newly created service
2. Go to **Settings** → **Deploy**
3. Set **Root Directory**: `/app`
4. Set **Build Command**: (should auto-detect Next.js)
5. Set **Start Command**: (should auto-detect Next.js)

### Step 4: Add Environment Variables

Go to **Variables** tab and add these (values below):

```
AUTH_TRUST_HOST=1
AUTH_URL=https://[YOUR-DEV-URL]
EMAIL_FROM=noreply@localhost
NEXTAUTH_SECRET=[GENERATE-NEW-SECRET]
NEXTAUTH_URL=https://[YOUR-DEV-URL]
NEXT_PUBLIC_APP_URL=https://[YOUR-DEV-URL]
NODE_ENV=development
```

#### Database Variables (Auto-added by Railway)
These will be automatically set when you add PostgreSQL:
- `DATABASE_URL`
- `DATABASE_URL_POOLED` (you may need to add pgbouncer=true manually)

#### Optional Variables (Copy from Production if needed)
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_DSN`
- `SENTRY_ORG`
- `SENTRY_PROJECT`
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT`

### Step 5: Generate New NEXTAUTH_SECRET

Run this command to generate a new secret for development:
```bash
openssl rand -base64 32
```

### Step 6: Update URLs After Deployment

After Railway assigns a URL to your development service:
1. Copy the Railway-generated URL (e.g., `rbac-hierarchy-dev-production.up.railway.app`)
2. Replace `[YOUR-DEV-URL]` in the environment variables with the actual URL
3. Optionally, set up a custom domain for development

### Step 7: Initialize Development Database

After everything is deployed:
```bash
# Switch to development environment locally
railway environment development

# Run migrations
railway run npm run db:push --prefix app

# Seed database with test data
railway run npm run db:seed --prefix app
```

## 🔍 Verify Setup

```bash
# Check development environment status
railway environment development
railway status

# Check variables
railway variables

# View logs
railway logs
```

## 📊 Environment Comparison

| Aspect | Production | Development |
|--------|-----------|-------------|
| Environment | `production` | `development` |
| Branch | `main` | `develop` |
| Database | Separate instance | Separate instance |
| URL | app.rbac.shop | [Railway-generated] |
| Node ENV | production | development |

## 🚀 Development Workflow

1. Make changes on `develop` branch locally
2. Push to GitHub: `git push origin develop`
3. Railway auto-deploys to development environment
4. Test on development URL
5. When ready, merge `develop` → `main` for production deployment
