# 🔐 Railway Production Database Password Rotation Guide

**Status:** URGENT - Production credentials exposed in git history
**Exposed Password:** `WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH`
**Exposed Host:** `switchyard.proxy.rlwy.net:20055`
**Date:** 2026-01-04

---

## ⚠️ Critical Information

**Exposed credentials from deleted script:**
```bash
# From app/scripts/delete-prod-users.js (DELETED)
postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@switchyard.proxy.rlwy.net:20055/railway
```

**Current development database:**
```bash
# Current active (development environment)
postgresql://postgres:XRidHEhunbNauSqiTXGFZUKCyzyzvGQU@tramway.proxy.rlwy.net:37235/railway
```

**Key Observations:**
- ✅ Development database uses DIFFERENT password (`XRidHEh...`)
- ✅ Development database uses DIFFERENT proxy (`tramway` vs `switchyard`)
- ⚠️ Need to verify if `switchyard` database is still active in production
- ⚠️ If active, credentials MUST be rotated immediately

---

## 🔍 Step 1: Verify Which Databases Are Active

### Option A: Railway Dashboard (Recommended)

1. Open Railway dashboard: https://railway.app/dashboard
2. Navigate to project: **rbac_proj**
3. Check all environments:
   - Development
   - Production (if exists)
   - Staging (if exists)
4. For each environment, click on the **Postgres** service
5. Check the connection details:
   - Look for `switchyard.proxy.rlwy.net:20055` (EXPOSED)
   - If found → **IMMEDIATE ACTION REQUIRED**
   - If not found → Password likely from old/deleted database

### Option B: Railway CLI (Interactive)

```bash
# Login to Railway
railway login

# Link to project
cd /path/to/project
railway link

# Check current environment
railway status

# List variables for current environment
railway variables

# Switch to production (if exists)
railway link -e production

# Check production variables
railway variables | grep DATABASE
```

---

## 🔄 Step 2: Rotate Database Password (If Exposed Database Found)

### Method 1: Create New Database Service (RECOMMENDED)

**This method ensures complete credential rotation with minimal downtime.**

#### 2.1. Create New Database

1. **In Railway Dashboard:**
   - Open project: **rbac_proj**
   - Click **+ New** → **Database** → **Add PostgreSQL**
   - Name it: `postgres-new` or similar
   - Wait for provisioning (1-2 minutes)

2. **Get New Credentials:**
   - Click on the new Postgres service
   - Go to **Variables** tab
   - Copy the following variables:
     - `DATABASE_URL`
     - `DATABASE_PUBLIC_URL`
     - `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE`

#### 2.2. Migrate Data to New Database

**Option A: Using pg_dump/pg_restore (Recommended)**

```bash
# Set old database URL (READ-ONLY)
export OLD_DB="postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@switchyard.proxy.rlwy.net:20055/railway"

# Set new database URL (from Railway dashboard)
export NEW_DB="postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway"

# Dump old database
pg_dump "$OLD_DB" -Fc -f production_backup.dump

# Restore to new database
pg_restore -d "$NEW_DB" --clean --if-exists production_backup.dump

# Verify data migrated
psql "$NEW_DB" -c "SELECT COUNT(*) FROM users;"
psql "$NEW_DB" -c "SELECT COUNT(*) FROM cities;"
```

**Option B: Using Railway Connect (Simpler)**

```bash
# Connect to OLD database and dump
railway connect postgres-old
\copy (SELECT * FROM users) TO 'users.csv' CSV HEADER;
\copy (SELECT * FROM cities) TO 'cities.csv' CSV HEADER;
\q

# Connect to NEW database and restore
railway connect postgres-new
\copy users FROM 'users.csv' CSV HEADER;
\copy cities FROM 'cities.csv' CSV HEADER;
\q
```

#### 2.3. Update Application Environment Variables

**In Railway Dashboard:**

1. Go to your application service (e.g., `rbac_hierarchy_dev`)
2. Click **Variables** tab
3. Update the following variables with NEW database credentials:
   ```
   DATABASE_URL=postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway
   DATABASE_URL_POOLED=postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway?pgbouncer=true
   DATABASE_PUBLIC_URL=postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway
   ```
4. Click **Save Changes**

**Via Railway CLI:**

```bash
# Set new database URL
railway variables set DATABASE_URL="postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway"

# Set pooled URL
railway variables set DATABASE_URL_POOLED="postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway?pgbouncer=true"

# Set public URL
railway variables set DATABASE_PUBLIC_URL="postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway"
```

#### 2.4. Redeploy Application

```bash
# Trigger redeployment
railway up --detach

# Or via dashboard: Click "Deploy" button
```

#### 2.5. Verify New Database Works

```bash
# Test connection
psql "$NEW_DB" -c "SELECT version();"

# Test application health
curl https://your-app.railway.app/api/health

# Check logs
railway logs
```

#### 2.6. Delete Old Database Service

**⚠️ ONLY AFTER VERIFYING NEW DATABASE WORKS!**

1. In Railway Dashboard
2. Click on old Postgres service (`switchyard`)
3. Go to **Settings** tab
4. Scroll to **Danger Zone**
5. Click **Delete Service**
6. Confirm deletion

---

### Method 2: Regenerate Credentials (If Supported)

**Note:** Railway may not support credential regeneration for managed Postgres. If this option is not available in the dashboard, use Method 1.

1. In Railway Dashboard
2. Click on Postgres service with exposed credentials
3. Look for **Settings** → **Credentials** or **Regenerate Password**
4. If available, click **Regenerate**
5. Copy new credentials
6. Update environment variables in application service
7. Redeploy application

---

## 🔍 Step 3: Verify Exposed Password Is Not In Use

**Check all environments to ensure the exposed password is nowhere active:**

```bash
# Development
railway link -e development
railway variables | grep "WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH"
# Expected: No output (not found)

# Production (if exists)
railway link -e production
railway variables | grep "WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH"
# Expected: No output (not found)

# Staging (if exists)
railway link -e staging
railway variables | grep "WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH"
# Expected: No output (not found)
```

**If the exposed password IS found in any environment → IMMEDIATE ROTATION REQUIRED (use Method 1 above)**

---

## 📋 Step 4: Update Local Development Environment

**After rotating production credentials, update local `.env.local`:**

```bash
cd app

# Backup existing .env.local
cp .env.local .env.local.backup

# Update with NEW production credentials (if needed for local prod testing)
# Note: For regular development, use local database
echo "DATABASE_URL=postgresql://postgres:NEW_PASSWORD@NEW_PROXY.rlwy.net:PORT/railway" >> .env.local
```

**Or use local database for development:**

```bash
# Recommended: Use local Docker database for development
make up  # Start Docker containers

# Local database (from docker-compose.yml)
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform"
DATABASE_URL_POOLED="postgresql://postgres:postgres_dev_password@localhost:6433/hierarchy_platform?pgbouncer=true"
```

---

## ✅ Step 5: Verify Security

### 5.1. Check No Hardcoded Credentials Remain

```bash
cd /path/to/project

# Search for exposed password
grep -r "WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH" app/
# Expected: No results (only in git history)

# Search for any production database URLs
grep -r "switchyard.proxy.rlwy.net" app/
# Expected: No results

# Search for any Railway database credentials
grep -r "postgresql://.*:.*@.*railway" app/scripts/
# Expected: No results (except README files)
```

### 5.2. Verify Application Health

```bash
# Check production application
curl https://your-production-app.railway.app/api/health

# Expected response:
# {
#   "status": "ok",
#   "database": "connected",
#   "buildId": "2026-01-04-abc1234",
#   "uptime": 12345
# }

# Check database connectivity
railway connect postgres
\dt  # List tables
SELECT COUNT(*) FROM users;  # Verify data exists
\q
```

### 5.3. Review Audit Logs

```bash
# Check for any suspicious database access during exposure period
psql "$NEW_DB" -c "SELECT * FROM audit_logs WHERE created_at > '2026-01-03' ORDER BY created_at DESC LIMIT 100;"

# Check for any unauthorized user creations
psql "$NEW_DB" -c "SELECT * FROM users WHERE created_at > '2026-01-03' ORDER BY created_at DESC;"

# Check error logs for failed authentication attempts
railway logs --filter="authentication failed" --since="24h"
```

---

## 🔐 Step 6: Implement Prevention Measures

### 6.1. Enable Two-Factor Authentication

1. Go to Railway Account Settings
2. Enable 2FA for your account
3. Save backup codes securely

### 6.2. Set Up Pre-Commit Hooks

**Already documented in:** `app/SECURITY_FIX_SUMMARY.md`

```bash
cd app

# Install husky
npm install -D husky

# Initialize husky
npx husky install

# Create pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

echo "🔍 Checking for hardcoded credentials..."

# Check for database URLs
if git diff --cached | grep -E "postgresql://.*:.*@|mysql://.*:.*@"; then
  echo "❌ BLOCKED: Hardcoded database credentials detected!"
  echo "Use environment variables instead."
  exit 1
fi

# Check for Railway proxy URLs
if git diff --cached | grep -E "\.proxy\.rlwy\.net|switchyard|tramway"; then
  echo "❌ BLOCKED: Railway database URL detected!"
  echo "Use environment variables instead."
  exit 1
fi

echo "✅ Security checks passed"
EOF

chmod +x .husky/pre-commit
```

### 6.3. Implement Secret Scanning

**Use GitHub Secret Scanning (if using GitHub):**

1. Go to repository Settings → Security → Code security and analysis
2. Enable **Secret scanning**
3. Enable **Push protection**

**Or use GitGuardian:**

```bash
# Install ggshield
pip install ggshield

# Initialize
ggshield auth login

# Scan current repository
ggshield secret scan repo .

# Set up pre-commit hook
ggshield install -m local
```

---

## 📊 Current Status Summary

| Item | Status | Action Required |
|------|--------|-----------------|
| Exposed Password | 🔴 In git history | Rotate if still in use |
| Development DB | 🟢 Different password | No action needed |
| Deleted Scripts | ✅ Removed | Complete |
| Safe Alternatives | ✅ Created | Use going forward |
| User Password | ✅ Updated | Complete |
| Audit Logs | ✅ Created | Monitor for suspicious activity |

---

## 🆘 Emergency Contacts

**If you discover unauthorized access:**

1. **Immediately revoke all database credentials**
2. **Contact Railway Support:** https://railway.app/help
3. **Review all audit logs for suspicious activity**
4. **Notify affected users if data breach occurred**
5. **File incident report**

---

## 📝 Checklist

- [ ] Verified which databases use the exposed password
- [ ] Created new database service (if exposed password found)
- [ ] Migrated data to new database
- [ ] Updated environment variables
- [ ] Redeployed application
- [ ] Verified application health
- [ ] Deleted old database service
- [ ] Checked for hardcoded credentials in codebase
- [ ] Reviewed audit logs for suspicious activity
- [ ] Enabled 2FA on Railway account
- [ ] Set up pre-commit hooks for credential detection
- [ ] Documented incident

---

**Last Updated:** 2026-01-04
**Next Review:** After password rotation complete
