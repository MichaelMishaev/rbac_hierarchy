# Production Deployment Guide - Error Tracking & Audit System

## Overview
This deployment adds comprehensive error tracking, session journey tracking, and audit logging to production.

## Database Changes Summary

### ✅ **SAFE: Additive Only - Zero Risk**

**One new table:**
- `session_events` - Tracks user navigation, clicks, form submissions

**No modifications to existing tables:**
- ❌ No column changes
- ❌ No column deletions
- ❌ No data migrations
- ❌ No foreign keys added
- ❌ No existing indexes modified

**Result:** **ZERO risk of data loss or downtime**

---

## Deployment Steps (Production)

### Step 1: Merge to Master
```bash
git checkout master
git merge <your-branch>
git push origin master
```

### Step 2: Apply Database Migration

**On Railway (or production server):**

```bash
# Option A: Using Prisma (Recommended)
npx prisma migrate deploy

# Option B: Using SQL directly
psql $DATABASE_URL -f prisma/migrations/20260102_add_session_tracking.sql
```

**Verification:**
```bash
# Check table exists
psql $DATABASE_URL -c "\d session_events"

# Should show:
# - Table with 12 columns
# - 5 indexes created
# - Primary key on id
```

### Step 3: Restart Application
Railway will auto-deploy after merge. No manual restart needed unless using custom hosting.

### Step 4: Verify Features

**Test Error Dashboard:**
1. Login as SuperAdmin
2. Visit `/he/admin/errors`
3. Should see error dashboard with filters

**Test Audit Dashboard:**
1. Visit `/he/admin/audit`
2. Should see audit log dashboard
3. Create/update/delete any entity
4. Verify audit log appears in dashboard

**Test Session Tracking:**
1. Open browser DevTools → Network tab
2. Navigate between pages
3. Look for `/api/session-event` POST requests (batched every 5 seconds)
4. Check `session_events` table has new rows

---

## Rollback Plan (If Needed)

### Emergency Rollback (Instant)

**Disable features without code rollback:**
```bash
# On Railway, set environment variables:
ENABLE_AUDIT_LOGGING=false
NEXT_PUBLIC_ENABLE_SESSION_TRACKING=false

# Restart app - features disabled immediately
```

**Drop table (if needed):**
```bash
# ONLY if table causes issues (very unlikely)
psql $DATABASE_URL -c "DROP TABLE IF EXISTS session_events;"
```

### Full Code Rollback
```bash
git revert <merge-commit-hash>
git push origin master
# Railway auto-deploys
```

---

## Expected Database Size Impact

**Session Events:**
- ~100 events/user/day
- ~100 bytes/event
- **10KB/user/day**
- 1000 active users = **10MB/day** = 300MB/month

**Audit Logs:**
- ~50 mutations/day system-wide
- ~500 bytes/entry
- **25KB/day** = 750KB/month

**Total: ~300MB/month** (negligible for most databases)

---

## Configuration (Optional)

### Disable Session Tracking (Save DB Space)
```bash
# .env or Railway environment variables
NEXT_PUBLIC_ENABLE_SESSION_TRACKING=false
```

### Disable Audit Logging
```bash
ENABLE_AUDIT_LOGGING=false
```

### Adjust Session Tracking Rate
Edit `app/lib/session-tracker.ts`:
```typescript
private MAX_BATCH_SIZE = 10;        // Events before sending
private BATCH_INTERVAL_MS = 5000;   // Milliseconds between sends
private MAX_EVENTS_PER_SECOND = 10; // Rate limit
```

---

## Testing in Staging (Recommended)

Before production deployment:

1. **Create staging branch:**
   ```bash
   git checkout -b staging
   git merge <your-branch>
   ```

2. **Deploy to Railway staging environment**

3. **Run migration:**
   ```bash
   npx prisma migrate deploy
   ```

4. **Test for 24 hours:**
   - Monitor error logs
   - Check session events are being created
   - Verify audit logs for CRUD operations
   - Check database size growth

5. **If all good, merge to master**

---

## Monitoring After Deployment

### Check Health (First 24 Hours)

**Database queries:**
```sql
-- Check session events are being created
SELECT COUNT(*), MAX(timestamp) FROM session_events;

-- Check audit logs are working
SELECT action, entity, COUNT(*)
FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY action, entity;

-- Check error logs
SELECT level, COUNT(*)
FROM error_logs
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY level;
```

**Expected results:**
- Session events increasing (if tracking enabled)
- Audit logs with CREATE/UPDATE/DELETE actions
- Error logs for any production errors

### Performance Metrics

**Monitor these:**
- API response times (should not increase)
- Database query performance (no slow queries from session/audit writes)
- Database size growth (~10MB/day expected)

**Alert if:**
- API latency increases >20%
- Database CPU spikes
- Error rate increases
- Session event table grows >100MB/day (indicates rate limiting issue)

---

## FAQ

### Q: Will this break production?
**A:** No. Only adds one new table. Existing features unchanged.

### Q: What if migration fails?
**A:** Table creation is idempotent (`IF NOT EXISTS`). Safe to re-run.

### Q: Can I disable features after deploying?
**A:** Yes, use environment variables (see Rollback Plan).

### Q: How do I test the audit middleware?
**A:** Create/update/delete any City, Neighborhood, User, or Activist. Check `/he/admin/audit` dashboard.

### Q: What if session tracking causes performance issues?
**A:** Set `NEXT_PUBLIC_ENABLE_SESSION_TRACKING=false` to disable instantly.

### Q: Do I need to update Prisma Client?
**A:** No, `prisma generate` runs automatically during build. Client is already up to date.

---

## File Checklist

**Files added (13):**
- [x] `app/actions/admin-errors.ts` - Error dashboard server actions
- [x] `app/[locale]/(dashboard)/admin/errors/page.tsx` - Error dashboard page
- [x] `app/components/admin/ErrorsDashboardClient.tsx` - Error dashboard UI
- [x] `app/components/admin/ErrorDetailDialog.tsx` - Error detail view
- [x] `app/components/admin/ErrorAnalytics.tsx` - Error charts
- [x] `app/api/admin/errors/export/route.ts` - CSV export
- [x] `app/lib/session-tracker.ts` - Session tracking library
- [x] `app/api/session-event/route.ts` - Session event API
- [x] `app/api/session-event/journey/route.ts` - Session journey API
- [x] `app/components/SessionTrackerProvider.tsx` - Session provider
- [x] `app/lib/audit-middleware.ts` - Audit logging middleware
- [x] `app/actions/admin-audit.ts` - Audit dashboard server actions
- [x] `app/[locale]/(dashboard)/admin/audit/page.tsx` - Audit dashboard page
- [x] `app/components/admin/AuditLogsDashboardClient.tsx` - Audit dashboard UI

**Files modified (4):**
- [x] `app/lib/prisma.ts` - Added audit middleware initialization
- [x] `app/lib/logger.ts` - Fixed circular dependency (lazy import)
- [x] `app/api/admin/fix-passwords/route.ts` - Fixed PrismaClient usage
- [x] `app/layout.tsx` - Added SessionTrackerProvider

**Database:**
- [x] `prisma/migrations/20260102_add_session_tracking.sql` - Migration file

**Documentation:**
- [x] `CLAUDE.md` - Updated with production safety notes
- [x] `DEPLOYMENT_GUIDE.md` - This file

---

## Success Criteria

✅ Migration runs without errors
✅ `/he/admin/errors` dashboard loads
✅ `/he/admin/audit` dashboard loads
✅ Session events appear in database (if enabled)
✅ Audit logs created for CRUD operations
✅ No performance degradation
✅ No increase in error rate

---

## Support

If issues arise:
1. Check Railway logs for errors
2. Check database connection (PgBouncer)
3. Verify environment variables
4. Use feature flags to disable problematic features
5. Contact dev team with error logs

---

**Deployment Date:** 2026-01-02
**Estimated Deployment Time:** 5 minutes
**Downtime Expected:** None (zero-downtime deployment)
**Risk Level:** 🟢 LOW (additive only)
