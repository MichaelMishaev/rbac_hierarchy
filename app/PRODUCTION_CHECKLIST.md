# Production Deployment Checklist ✅

## Pre-Merge Verification

- [x] Build succeeds locally (`npm run build`)
- [x] Migration file created (`20260102_add_session_tracking.sql`)
- [x] Migration tested locally (idempotent, safe to re-run)
- [x] No existing tables modified
- [x] All new fields nullable/optional
- [x] Documentation created (DEPLOYMENT_GUIDE.md, MERGE_TO_MASTER.md)

## Database Migration

**File:** `prisma/migrations/20260102_add_session_tracking.sql`

**What it does:**
```
✅ Creates session_events table
✅ Creates 5 indexes for fast queries
✅ Adds verification check
✅ Idempotent (safe to re-run)
```

**What it does NOT do:**
```
❌ Modify existing tables
❌ Delete data
❌ Add foreign keys
❌ Modify existing columns
❌ Require downtime
```

## Merge to Master Steps

### 1. Final Review
```bash
# Check all changes
git status

# Review migration file
cat prisma/migrations/20260102_add_session_tracking.sql

# Verify build
npm run build
```

### 2. Commit Changes
```bash
# Add all files
git add .

# Commit with descriptive message
git commit -m "feat: add error tracking, session journey, and audit logging

- Error dashboard for SuperAdmin at /admin/errors
- Session event tracking (navigation, clicks, forms)
- Comprehensive audit logging for CRUD operations
- Database: Add session_events table (migration included)
- Production-safe: No existing data modified, additive only
- Feature flags for instant rollback if needed

Migration: 20260102_add_session_tracking.sql"
```

### 3. Merge to Master
```bash
# Switch to master
git checkout master
git pull origin master

# Merge your branch
git merge develop  # or your feature branch name

# Push to remote
git push origin master
```

### 4. Monitor Railway Deployment

**Railway will automatically:**
1. Detect the push to master
2. Run `npm run build`
3. Run `npx prisma generate`
4. Deploy the new build
5. **YOU need to run migration manually** (Railway doesn't auto-run migrations)

**Manual step required:**
```bash
# SSH to Railway or use Railway CLI
railway run npx prisma migrate deploy

# OR run SQL directly
railway run psql $DATABASE_URL -f prisma/migrations/20260102_add_session_tracking.sql
```

### 5. Verify Deployment

**Check migration:**
```bash
railway run psql $DATABASE_URL -c "\d session_events"
```

Expected output:
```
Table "public.session_events"
- 12 columns
- 6 indexes (including primary key)
```

**Check app is running:**
```bash
# Visit your production URL
curl https://your-app.railway.app/api/health
```

**Check dashboards:**
1. Login as SuperAdmin
2. Visit `/he/admin/errors` → Should load
3. Visit `/he/admin/audit` → Should load
4. Create/update an entity → Should see audit log

### 6. Monitor for 1 Hour

**Watch for:**
- [ ] Error rate (should not increase)
- [ ] API response times (should be unchanged)
- [ ] Database queries (no slow queries)
- [ ] Session events being created (if tracking enabled)

**Check database:**
```bash
# Session events created
railway run psql $DATABASE_URL -c "SELECT COUNT(*) FROM session_events;"

# Audit logs created
railway run psql $DATABASE_URL -c "
  SELECT action, COUNT(*)
  FROM audit_logs
  WHERE created_at > NOW() - INTERVAL '1 hour'
  GROUP BY action;
"
```

## Rollback Plan (If Needed)

### Option 1: Disable Features (Instant)
```bash
# On Railway dashboard, set environment variables:
ENABLE_AUDIT_LOGGING=false
NEXT_PUBLIC_ENABLE_SESSION_TRACKING=false

# Click "Redeploy" → Features disabled in <1 minute
```

### Option 2: Rollback Code
```bash
git revert <merge-commit-hash>
git push origin master
# Railway auto-deploys reverted code
```

### Option 3: Drop Table (Extreme)
```bash
# ONLY if table causes issues (very unlikely)
railway run psql $DATABASE_URL -c "DROP TABLE session_events;"
```

## Success Criteria

After 24 hours in production:

- [ ] No increase in error rate
- [ ] API response times normal
- [ ] Database size increased by <50MB
- [ ] Session events table has rows (if tracking enabled)
- [ ] Audit logs show CREATE/UPDATE/DELETE operations
- [ ] Error dashboard accessible to SuperAdmin
- [ ] Audit dashboard accessible to SuperAdmin
- [ ] No user complaints about performance

## Post-Deployment Tasks

### Week 1
- [ ] Monitor database size growth
- [ ] Check audit logs are capturing all CRUD operations
- [ ] Verify session tracking is working
- [ ] Review error dashboard with team

### Week 2
- [ ] Analyze error patterns from dashboard
- [ ] Review session journey data for debugging
- [ ] Optimize queries if needed
- [ ] Document any findings

### Month 1
- [ ] Audit log retention policy (keep last 6 months?)
- [ ] Session event cleanup (keep last 30 days?)
- [ ] Performance review
- [ ] Team feedback session

## Environment Variables

**Default (recommended):**
```bash
ENABLE_AUDIT_LOGGING=true                      # Audit middleware
NEXT_PUBLIC_ENABLE_SESSION_TRACKING=true       # Session tracking
```

**To disable:**
```bash
ENABLE_AUDIT_LOGGING=false
NEXT_PUBLIC_ENABLE_SESSION_TRACKING=false
```

## Files to Commit

**Migration:**
- [x] `prisma/migrations/20260102_add_session_tracking.sql`

**Schema:**
- [x] `prisma/schema.prisma` (SessionEvent model)

**New Features (13 files):**
- [x] Error dashboard (5 files)
- [x] Session tracking (5 files)
- [x] Audit logging (3 files)

**Modified (4 files):**
- [x] `lib/prisma.ts`
- [x] `lib/logger.ts`
- [x] `api/admin/fix-passwords/route.ts`
- [x] `app/layout.tsx`

**Documentation:**
- [x] `DEPLOYMENT_GUIDE.md`
- [x] `MERGE_TO_MASTER.md`
- [x] `PRODUCTION_CHECKLIST.md` (this file)
- [x] `CLAUDE.md` (updated)

## Contact & Support

**If deployment fails:**
1. Check Railway logs
2. Check database connection
3. Verify migration ran successfully
4. Use rollback plan if needed
5. Contact team lead

**Emergency contacts:**
- Dev Team: [Your contact info]
- Railway Support: [Support channel]
- Database Admin: [Contact info]

---

**Deployment Date:** 2026-01-02
**Estimated Time:** 10 minutes (including monitoring)
**Risk Level:** 🟢 **LOW** (additive only, no data modifications)
**Rollback Time:** <2 minutes (via environment variables)

---

## Final Sign-Off

- [ ] Code review completed
- [ ] Tests pass locally
- [ ] Build succeeds
- [ ] Migration tested
- [ ] Documentation reviewed
- [ ] Team notified
- [ ] Rollback plan understood

**Ready to deploy?** ✅ **YES!**
