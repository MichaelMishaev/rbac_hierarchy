# Development to Production Database Schema Migration Guide

**Complete step-by-step guide for automatic database migrations using Railway Pre-Deploy Command**

---

## Table of Contents
1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Step-by-Step Setup](#step-by-step-setup)
4. [How to Verify It's Working](#how-to-verify-its-working)
5. [Real-World Example](#real-world-example)
6. [Testing the Setup](#testing-the-setup)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### What This Does

Automatically runs database migrations **before** each deployment to Railway.

### The Flow

```
1. git push origin main (or merge develop → main)
2. Railway: npm ci
3. Railway: prisma generate (postinstall hook)
4. Railway: npm run build
5. Railway: npx prisma migrate deploy ← AUTOMATIC! (preDeployCommand)
6. Railway: Start app (only if migration succeeded ✅)
```

**Result:** Schema changes deployed automatically, safely!

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

## Real-World Example

### Add Column to Table

```bash
# 1. Edit schema
# Add field to app/prisma/schema.prisma

# 2. Create migration in develop branch
cd app
npx prisma migrate dev --name add_new_field

# 3. Test locally
npm run dev

# 4. Commit to develop
git add prisma/
git commit -m "feat: add new field"
git push origin develop

# 5. Merge develop → main (via PR or direct merge)
git checkout main
git merge develop
git push origin main

# 6. Railway automatically runs migration when deploying main! ✅
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
