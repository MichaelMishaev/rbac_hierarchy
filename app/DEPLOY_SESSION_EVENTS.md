# Deploy Session Events Table via GitHub → Railway

## ✅ What I've Created

1. **SQL Migration Script** (Idempotent)
   - `prisma/migrations/manual/create_session_events_table.sql`
   - Safe to run multiple times (uses `IF NOT EXISTS`)
   - Creates `session_events` table + 5 indexes

2. **Railway Auto-Migration Script**
   - `railway-migrate.sh`
   - Runs automatically before every Railway deployment
   - Checks if table exists before creating it

3. **Updated Railway Config**
   - `railway.json` - preDeployCommand updated
   - `railway.toml` - preDeployCommand updated
   - Now runs: `bash railway-migrate.sh && npx prisma migrate deploy`

## 🚀 How to Deploy (GitHub Only)

### Step 1: Commit All Files

```bash
cd /Users/michaelmishayev/Desktop/Projects/corporations/app

git status
# Should show:
#   modified: railway.json
#   modified: railway.toml
#   new file: railway-migrate.sh
#   new file: prisma/migrations/manual/create_session_events_table.sql
#   new file: prisma/migrations/manual/README.md
#   new file: scripts/migrate-session-events-railway.sh
#   new file: DEPLOY_SESSION_EVENTS.md

git add .
git commit -m "feat: add session_events table auto-migration for Railway

- Add idempotent SQL migration script
- Add Railway pre-deploy hook to create session_events table
- Update Railway config to run migrations before deploy
- Table creation is safe (uses IF NOT EXISTS)

Fixes: Session tracking 500 errors on Railway
Related: Bug #38 - Session Events infrastructure"
```

### Step 2: Push to GitHub

```bash
# Push to develop branch (Railway auto-deploys from develop)
git push origin develop
```

### Step 3: Railway Auto-Deploys

Railway will automatically:
1. Detect new commit on `develop` branch
2. Pull latest code
3. Run `bash railway-migrate.sh` (creates session_events table if missing)
4. Run `npx prisma migrate deploy` (runs any Prisma migrations)
5. Build the app
6. Deploy

### Step 4: Verify Deployment

Check Railway logs for:
```
🚂 Railway: Running database migrations...
📊 Checking if session_events table exists...
⚠️  session_events table not found, creating it...
✅ session_events table created
✅ All migrations completed
```

Or if table already exists:
```
✅ session_events table already exists, skipping
```

### Step 5: Enable Session Tracking (Optional)

If you want session tracking enabled:
```bash
# Via Railway Dashboard
railway variables --set NEXT_PUBLIC_ENABLE_SESSION_TRACKING=true

# Then redeploy
git commit --allow-empty -m "chore: trigger Railway redeploy"
git push origin develop
```

## 🔍 What Happens Next

Once deployed:
- ✅ `/api/session-event/journey` → 200 OK (no more 500 errors)
- ✅ `/api/session-event` → 200 OK
- ✅ User deletion works without errors
- ✅ Error tracking includes session journey context

## 🛡️ Safety Features

- **Idempotent**: Script can run multiple times safely
- **Check before create**: Only creates table if missing
- **Rollback safe**: If migration fails, Railway aborts deployment
- **No data loss**: Existing data untouched
- **Feature flagged**: Session tracking disabled by default

## 📝 Files Changed

| File | Change | Purpose |
|------|--------|---------|
| `railway.json` | Modified | Run migration before deploy |
| `railway.toml` | Modified | Run migration before deploy |
| `railway-migrate.sh` | New | Auto-migration script |
| `create_session_events_table.sql` | New | SQL migration (idempotent) |
| `migrate-session-events-railway.sh` | New | Manual migration helper |
| `prisma/migrations/manual/README.md` | New | Migration docs |

## 🎯 Testing Locally First (Optional)

If you want to test before pushing to Railway:

```bash
# Test the SQL migration locally
psql "postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform" -f prisma/migrations/manual/create_session_events_table.sql

# Should see:
# NOTICE:  ✅ session_events table exists
# NOTICE:  ✅ 5 indexes created
```

## 🚨 Troubleshooting

**If deployment fails:**

1. Check Railway logs for error message
2. Verify `railway-migrate.sh` has execute permissions
3. Check DATABASE_URL is set in Railway

**If table already exists:**

Script will skip creation (safe). Check logs:
```
✅ session_events table already exists, skipping
```

**If you need to manually run migration:**

```bash
railway run --environment development psql $DATABASE_URL -f prisma/migrations/manual/create_session_events_table.sql
```

## ✅ Next Steps

After successful deployment:
1. ✅ Verify no 500 errors in Railway logs
2. ✅ Test `/users` page (delete user should work)
3. ✅ Enable session tracking (optional)
4. ✅ Monitor for any issues
