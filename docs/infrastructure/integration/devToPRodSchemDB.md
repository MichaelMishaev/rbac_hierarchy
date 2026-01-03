# Development to Production Database Schema Migration Guide

**Automatic database migrations when merging `develop` → `main`**

---

## 🎯 Developer Workflow (TL;DR)

**Every schema change you make on `develop` will automatically apply to production when you merge to `main`.**

```bash
# 1️⃣ Work on develop branch
git checkout develop

# 2️⃣ Edit schema
vim app/prisma/schema.prisma
# (add/modify/remove fields)

# 3️⃣ Create migration
cd app
npx prisma migrate dev --name my_feature
# This creates: app/prisma/migrations/TIMESTAMP_my_feature/migration.sql

# 4️⃣ Test locally
npm run dev
# Verify changes work

# 5️⃣ Commit to develop
git add prisma/
git commit -m "feat: add my feature"
git push origin develop

# 6️⃣ Merge to main
git checkout main
git merge develop
git push origin main

# 7️⃣ Railway automatically applies migration! ✅
# No manual intervention needed
```

**That's it!** Railway detects the new migration files and runs them automatically before starting the app.

---

## ⚠️ Critical Rules

**ALWAYS follow these rules for safe schema changes:**

### ✅ DO:
1. **Always create migrations on `develop` branch** using `npx prisma migrate dev`
2. **Always commit migration files** (`app/prisma/migrations/*`) to git
3. **Test locally first** before pushing to develop
4. **Use descriptive migration names**: `add_user_avatar`, `fix_null_constraint`, etc.
5. **Merge develop → main** to trigger production deployment

### ❌ DON'T:
1. **Never edit migration files manually** after they're created (Prisma tracks checksums)
2. **Never run `prisma db push` on production** (bypasses migration history)
3. **Never push directly to main** with schema changes (always go through develop)
4. **Never delete old migration files** (breaks migration history)
5. **Never run `migrate dev` on production** (only `migrate deploy` runs in production)

### 🔴 IF YOU SEE ERRORS:
- **"Migration already applied"** → Check if migration exists in production DB
- **"Checksum mismatch"** → Migration file was edited after creation (recreate it)
- **"Cannot find migration"** → Migration files not committed to git

---

## Table of Contents
1. [Developer Workflow](#-developer-workflow-tldr)
2. [How It Works](#how-it-works)
3. [Prerequisites](#prerequisites)
4. [Real-World Example](#real-world-example)
5. [Troubleshooting](#troubleshooting)
6. [Quick Reference](#quick-reference)

---

## How It Works

### Visual Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    DEVELOPER MACHINE                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Edit schema.prisma                                      │
│     ↓                                                       │
│  2. npx prisma migrate dev --name my_change                 │
│     ↓                                                       │
│  3. Creates: prisma/migrations/TIMESTAMP_my_change/         │
│     └─ migration.sql (SQL commands)                         │
│     └─ migration_lock.toml (metadata)                       │
│     ↓                                                       │
│  4. git add prisma/ && git commit                           │
│     ↓                                                       │
│  5. git push origin develop                                 │
│     ↓                                                       │
│  6. git merge develop → main                                │
│     ↓                                                       │
│  7. git push origin main                                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ (push detected)
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    RAILWAY (Production)                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. Detects push to main branch                             │
│     ↓                                                       │
│  2. npm ci (install dependencies)                           │
│     ↓                                                       │
│  3. prisma generate (create Prisma Client)                  │
│     ↓                                                       │
│  4. npm run build (build Next.js app)                       │
│     ↓                                                       │
│  5. 🔥 npx prisma migrate deploy (preDeployCommand)         │
│     ├─ Reads: prisma/migrations/*                           │
│     ├─ Compares with DB _prisma_migrations table            │
│     ├─ Applies new migrations only                          │
│     └─ If fails → ABORT deployment ❌                       │
│     ↓                                                       │
│  6. npm start (start app) ✅                                │
│     └─ Only if migration succeeded                          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### What This Does

Automatically runs database migrations **before** each deployment to Railway.

**Result:** Every schema change committed to `develop` → automatically applied when merged to `main`!

---

## Prerequisites

### 1. Verify Configuration Files

```bash
# Check railway.toml exists in ROOT directory
cat railway.toml

# Should show:
# [deploy]
# preDeployCommand = "npx prisma migrate deploy"

# IMPORTANT: Only ONE railway.toml should exist (in root)
# If app/railway.toml exists, delete it (Railway reads root first)
```

### 2. Verify Package.json

```bash
# Check prisma CLI in production dependencies
cd app && grep -A 5 '"dependencies"' package.json | grep '"prisma"'

# Should show in dependencies section (not devDependencies):
# "prisma": "^5.22.0"

# Verify postinstall hook exists
grep '"postinstall"' package.json
# Should show: "postinstall": "prisma generate"
```

---

## Step-by-Step Setup

The configuration is already set up in this project. To verify:

1. ✅ `railway.toml` has `preDeployCommand` (root directory)
2. ✅ `prisma` is in `dependencies` (app/package.json)
3. ✅ `postinstall` script runs `prisma generate`

**If setting up from scratch:**
- Add `"prisma": "^5.22.0"` to dependencies (NOT devDependencies)
- Create `railway.toml` in project root with `preDeployCommand`
- Ensure `postinstall` script exists in package.json

---

## How to Verify It's Working

### Test 1: Create Test Migration

```bash
# Create test migration
mkdir -p prisma/migrations/20260102_test
cat > prisma/migrations/20260102_test/migration.sql << 'EOF'
CREATE TABLE IF NOT EXISTS test_migration (
  id TEXT PRIMARY KEY
);
EOF

# Test locally first
npx prisma migrate deploy
```

### Test 2: Push and Watch Railway

```bash
git add prisma/migrations/
git commit -m "test: verify auto-migration"
git push origin main
```

### Test 3: Check Railway Logs

1. Go to https://railway.app
2. Select your project
3. Click latest deployment
4. Look for "Pre-Deploy Command" section

**Expected output:**
```
━━━━ Pre-Deploy Command ━━━━
Running: npx prisma migrate deploy
✔ Applied migration: 20260102_test
✔ All migrations applied successfully
```

### Test 4: Verify Database

```bash
railway run psql $DATABASE_URL -c "\d test_migration"

# Should show table structure
```

---

## Common Scenarios

### Scenario 1: Add a New Column

```bash
# 1. Edit schema on develop
git checkout develop
vim app/prisma/schema.prisma

# Add field:
# model User {
#   ...
#   avatar String?  ← NEW FIELD
# }

# 2. Create migration
cd app
npx prisma migrate dev --name add_user_avatar

# 3. Test locally
npm run dev
# Verify app works with new field

# 4. Push to develop
git add prisma/
git commit -m "feat: add user avatar field"
git push origin develop

# 5. Merge to main
git checkout main
git merge develop
git push origin main

# ✅ Railway automatically adds column to production DB
```

### Scenario 2: Remove a Column (SAFE)

```bash
# 1. Edit schema on develop
git checkout develop
vim app/prisma/schema.prisma

# Remove or comment out field:
# model User {
#   ...
#   // oldField String?  ← REMOVED
# }

# 2. Create migration
cd app
npx prisma migrate dev --name remove_old_field
# Prisma will warn about data loss - confirm if safe

# 3. Test locally
npm run dev

# 4. Push to develop → merge to main
git add prisma/
git commit -m "refactor: remove unused field"
git push origin develop
git checkout main && git merge develop && git push

# ✅ Railway automatically drops column from production
```

### Scenario 3: Rename a Column (TWO-STEP)

**⚠️ WARNING: Renaming requires two migrations to avoid data loss**

```bash
# Step 1: Add new column (keep old one)
git checkout develop
vim app/prisma/schema.prisma

# Add new field, keep old:
# model User {
#   oldName String?
#   newName String?  ← ADD THIS FIRST
# }

cd app
npx prisma migrate dev --name add_new_name_column
git add prisma/ && git commit -m "feat: add new name column"
git push origin develop
git checkout main && git merge develop && git push
# ✅ Railway adds new column

# Step 2: Copy data + remove old column (separate deployment)
# Update app code to copy oldName → newName
# Deploy code changes
# Then create migration to remove old column
```

### Scenario 4: Add New Table

```bash
# 1. Add model to schema
git checkout develop
vim app/prisma/schema.prisma

# model NewTable {
#   id String @id @default(cuid())
#   name String
#   createdAt DateTime @default(now())
# }

# 2. Create migration
cd app
npx prisma migrate dev --name add_new_table

# 3. Test
npm run dev

# 4. Deploy
git add prisma/
git commit -m "feat: add new table"
git push origin develop
git checkout main && git merge develop && git push

# ✅ Railway creates table in production
```

### Scenario 5: Multiple Schema Changes

```bash
# You can combine multiple changes in ONE migration:

# 1. Edit schema with multiple changes
git checkout develop
vim app/prisma/schema.prisma

# - Add User.avatar
# - Remove User.oldField
# - Add new table Settings
# - Add index on User.email

# 2. Create single migration for all changes
cd app
npx prisma migrate dev --name multiple_improvements

# 3. Deploy
git add prisma/
git commit -m "feat: multiple schema improvements"
git push origin develop
git checkout main && git merge develop && git push

# ✅ Railway applies all changes atomically
```

---

## Troubleshooting

### Issue: "prisma: command not found"

**Cause:** Prisma CLI is in `devDependencies` but Railway doesn't install dev dependencies in production

**Fix:**
```bash
cd app
npm install --save-prod prisma
npm uninstall --save-dev prisma
git commit -am "fix: move prisma to production dependencies"
```

### Issue: "Pre-deploy command not running"

**Causes:**
1. `railway.toml` not committed to git
2. Multiple `railway.toml` files (Railway reads root first)
3. `preDeployCommand` not in `[deploy]` section

**Fix:**
```bash
# Ensure only ONE railway.toml exists (in project root)
ls -la railway.toml app/railway.toml

# If both exist, delete app/railway.toml
rm app/railway.toml

# Verify root railway.toml has preDeployCommand
grep "preDeployCommand" railway.toml

# Commit and push
git add railway.toml
git commit -m "fix: consolidate railway.toml"
git push origin main
```

### Issue: "Cannot connect to database"

**Fix:** Check `DATABASE_URL` in Railway environment variables

### Issue: "Migration failed: Migration already applied"

**Cause:** Trying to run `migrate dev` in production (use `migrate deploy` instead)

**Fix:** Ensure `preDeployCommand` uses `prisma migrate deploy` (NOT `migrate dev`)

---

## Quick Reference

```bash
# Workflow: develop → main triggers auto-migration
git checkout develop
# ... make changes to schema ...
cd app && npx prisma migrate dev --name my_change
git add prisma/
git commit -m "feat: add my change"
git push origin develop

# Merge to main (triggers Railway deployment with auto-migration)
git checkout main
git merge develop
git push origin main
# ✅ Railway automatically runs: npx prisma migrate deploy

# Test migration locally (simulate production)
cd app && npx prisma migrate deploy

# Watch Railway deployment logs
railway logs --follow

# Check production database
railway run psql $DATABASE_URL

# Force redeploy (if needed)
git commit --allow-empty -m "chore: trigger redeploy"
git push origin main
```

---

**Setup Complete!** Migrations will now run automatically when you merge `develop` → `main`.
