# PROD BUG: TypeError - Server action failed: getAreaManagers

**Error Hash:** a1f3d8e2
**First Seen:** 2026-01-22 09:20:47 UTC
**Last Seen:** 2026-01-22 10:50:35 UTC
**Occurrence Count:** 28
**Level:** ERROR
**Severity:** 🔴 CRITICAL
**Affected Users:** yoniozery@gmail.com (and potentially others)

## Error Details

**Error Type:** `TypeError`

**Full Message:**
```
Server action failed: getAreaManagers
```

**URLs Affected:**
- /cities page (primary)

**Sample Error ID:** 71f093cc-8b63-4559-8d5b-e366cdc1bf0e

## Stack Trace
```
TypeError: Cannot read properties of null (reading 'fullName')
    at /app/app/.next/server/app/[locale]/(dashboard)/cities/page.js:2:17089
    at Array.map (<anonymous>)
    at /app/app/.next/server/app/[locale]/(dashboard)/cities/page.js:2:17008
    at async f (/app/app/.next/server/chunks/7680.js:1:4385)
    at async t4 (/app/app/node_modules/next/dist/compiled/next-server/app-page.runtime.prod.js:16:1716)
    [truncated...]
```

## Root Cause Analysis

**This is Bug #50 from bugs-current.md - REGRESSION!**

The error occurs when:
1. A user record referenced in `area_managers` table has been deleted
2. The `getAreaManagers` action tries to access `user.fullName`
3. The user object is `null` because the foreign key allows NULL or the user was soft-deleted

**Key Issue:** The fix applied in commit `deba4a3` used strict equality (`!== null`) filter, but the data still contains null user references that weren't cleaned up.

## Fix Applied Status

⚠️ **PARTIAL FIX DEPLOYED - Data cleanup needed**

**Previous Fix (commit deba4a3):**
- Added `.filter(manager => manager.user !== null)` to server action
- This prevents the crash but doesn't address root cause

**Missing Steps:**
1. Database cleanup to remove orphaned area_manager records
2. Add CASCADE delete or prevent user deletion when referenced
3. Add database constraint to ensure referential integrity

## Files to Investigate

Primary files:
- `app/app/[locale]/(dashboard)/cities/page.tsx:2:17089` (server action)
- `app/server-actions/areas.ts` (getAreaManagers implementation)
- `app/prisma/schema.prisma` (check User ↔ AreaManager relationship)

## Suggested Immediate Fix

### Step 1: Data Cleanup (Production DB - READ ONLY, use migration)
```sql
-- Find orphaned area_managers (for analysis only, DO NOT RUN on prod)
SELECT id, user_id, area_id
FROM area_managers
WHERE user_id NOT IN (SELECT id FROM users WHERE is_active = true);

-- This should be part of a migration, not manual cleanup
```

### Step 2: Schema Fix (Local)
```prisma
model AreaManager {
  id      String   @id @default(uuid())
  userId  String   @map("user_id")
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade) // Add Cascade
  areaId  String   @map("area_id")
  area    Area     @relation(fields: [areaId], references: [id])

  @@map("area_managers")
}
```

### Step 3: Server Action Enhancement
Ensure the filter is robust:
```typescript
// server-actions/areas.ts
export async function getAreaManagers(areaId: string) {
  const managers = await prisma.areaManager.findMany({
    where: {
      areaId,
      user: { is_active: true } // Filter at query level
    },
    include: { user: true }
  });

  // Double-check filter (defense in depth)
  return managers.filter(m => m.user !== null && m.user.is_active);
}
```

## Status: ✅ FIXED (Pending Deployment)

**Created:** 2026-01-22
**Regression of:** Bug #50 (commit f8bf4a4)
**Fixed Date:** 2026-01-22
**Commit:** (pending)

## Fix Applied

### 1. Database Migration Script Created
- **File:** `app/scripts/migrations/clean-orphaned-area-managers.sql`
- **Action:** Soft-delete orphaned area_manager records (set `is_active = false`)
- **Safety:** Includes pre-flight checks, backup queries, and rollback instructions
- **Status:** Ready for manual execution (requires approval)

### 2. Server Action Enhanced
- **File:** `app/actions/cities.ts` (function: `getAreaManagers`)
- **Changes:**
  1. Added `userId: { not: null }` to WHERE clause (line 853-856)
  2. Changed to optional chaining: `am.user?.fullName ?? 'N/A'` (line 954-955)
  3. Kept runtime filter as defense-in-depth (line 946)

### 3. Why Schema Was NOT Changed
The Prisma schema intentionally uses `onDelete: SetNull` because:
- Areas can exist without assigned managers (business requirement)
- Comment on schema line 105: "userId is OPTIONAL, areas persist even without a manager"
- Changing to CASCADE would delete areas when users are deleted (incorrect behavior)

### Fix Strategy (3-Layer Defense)
1. **Layer 1 (DB Level):** Migration soft-deletes orphaned records
2. **Layer 2 (Query Level):** Added `userId: { not: null }` filter
3. **Layer 3 (Runtime):** Existing `.filter(am => am.user != null)` + optional chaining

## Files Modified
1. `app/actions/cities.ts` (getAreaManagers function)
2. `app/scripts/migrations/clean-orphaned-area-managers.sql` (new migration)
3. `docs/bugs/prodBugs/PROD-TypeError-a1f3d8e2.md` (this file)

## Deployment Checklist
- [ ] Review migration script
- [ ] Execute migration on production DB
- [ ] Deploy code changes (app/actions/cities.ts)
- [ ] Monitor error logs for 24-48 hours
- [ ] Verify no new TypeError: Cannot read properties of null errors

## Prevention Rule
**Added to Bug #50 documentation:**
- Always use `userId: { not: null }` in WHERE clauses for area_managers queries
- Always use optional chaining (`?.`) when accessing user relations
- Always filter by `user.isActive` for active user validation
