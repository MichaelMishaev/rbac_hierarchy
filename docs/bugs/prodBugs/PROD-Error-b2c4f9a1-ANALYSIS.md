# PROD BUG ANALYSIS: Server Components Render Error on /activists

**Error Hash:** b2c4f9a1
**Status:** 🔍 ROOT CAUSE IDENTIFIED
**Analysis Date:** 2026-01-22
**Affected URL:** https://app.rbac.shop/activists (35 errors)

---

## Executive Summary

**ROOT CAUSE:** Null reference error when accessing `a.activistCoordinator.user` properties on soft-deleted users.

**SIMILAR PATTERN TO:** Bug #50 (getAreaManagers null user after deletion) and Bug #52 (null filter using strict equality)

**SEVERITY:** 🔴 CRITICAL - Page completely broken for users, 35 production errors in 2 hours

**RISK ASSESSMENT:** Same pattern may exist on other pages that map activists/coordinators data.

---

## Root Cause Analysis

### The Problem: Soft-Deleted User Null References

The `/activists` page crashes during Server Component render when it tries to map activist data for client components. The error occurs at **line 131-132**:

```typescript
// app/app/[locale]/(dashboard)/activists/page.tsx:119-135
activists={activists.map(a => ({
  ...a,
  site: a.neighborhood ? {
    id: a.neighborhood.id,
    name: a.neighborhood.name,
    cityId: a.neighborhood.cityRelation?.id || '',
    cityRelation: a.neighborhood.cityRelation || undefined,
  } : undefined,
  activistCoordinator: a.activistCoordinator ? {  // ⚠️ EXISTS CHECK - but user might be null!
    id: a.activistCoordinator.id,
    user: {
      fullName: a.activistCoordinator.user.fullName,  // 💥 CRASH HERE if user is null
      email: a.activistCoordinator.user.email,        // 💥 CRASH HERE if user is null
    },
  } : undefined,
}))}
```

### Why This Happens

1. **Soft-delete flow:**
   - User account gets soft-deleted (`users.isActive = false`)
   - `ActivistCoordinator` record remains active with `userId` foreign key
   - Foreign key points to soft-deleted user

2. **Data fetch in `listWorkers()` server action:**
   ```typescript
   // app/app/actions/activists.ts:437-451
   const activistData = await prisma.activist.findMany({
     where,
     include: {
       activistCoordinator: {
         select: {
           id: true,
           user: {  // ⚠️ Includes soft-deleted users!
             select: {
               fullName: true,
               email: true,
             },
           },
         },
       },
     },
   });
   ```

   **Problem:** No `where: { isActive: true }` filter on the user relation!

3. **SSR render crash:**
   - Data arrives with `a.activistCoordinator.user = null`
   - Code checks `if (a.activistCoordinator)` → `true` (coordinator exists)
   - But `a.activistCoordinator.user` is `null` → accessing `.fullName` crashes

### Why Production Masks the Error

Next.js production builds hide the actual error for security (preventing data leakage):
```
[Client-Side Error] An error occurred in the Server Components render.
The specific message is omitted in production builds to avoid leaking sensitive details.
```

In development, you would see:
```
TypeError: Cannot read properties of null (reading 'fullName')
  at activists/page.tsx:131
```

---

## Similar Bugs in Codebase

This is the **THIRD occurrence** of the same pattern:

### Bug #50: getAreaManagers Null User Crash
- **Location:** `app/app/actions/cities.ts:923`
- **Pattern:** Accessing `areaManager.user.fullName` after soft-delete
- **Fix Applied:** Post-query filter `areaManagers.filter(am => am.user !== null)`

### Bug #52: Null Filter Using Strict Equality
- **Location:** `app/app/actions/cities.ts:946`
- **Pattern:** Used `am.user !== null` (strict) instead of `am.user != null` (loose)
- **Fix Applied:** Changed to `am.user != null` to catch both null AND undefined

### Bug #45: City Deletion 500 Error
- **Location:** `app/app/actions/cities.ts` (deleteCity)
- **Pattern:** `_count` queries not filtering soft-deleted entities
- **Fix Applied:** Added `where: { isActive: true }` to all `_count` queries

---

## Identified Code Locations with Same Issue

### 1. Primary Issue: Activists Page (HIGHEST PRIORITY)

**File:** `app/app/[locale]/(dashboard)/activists/page.tsx`

**Lines 119-135:** Mapping activists data
```typescript
activistCoordinator: a.activistCoordinator ? {
  id: a.activistCoordinator.id,
  user: {
    fullName: a.activistCoordinator.user.fullName,  // 💥 NULL CRASH
    email: a.activistCoordinator.user.email,        // 💥 NULL CRASH
  },
} : undefined,
```

**Fix Required:** Add nested null check for `user`:
```typescript
activistCoordinator: a.activistCoordinator?.user ? {
  id: a.activistCoordinator.id,
  user: {
    fullName: a.activistCoordinator.user.fullName,
    email: a.activistCoordinator.user.email,
  },
} : undefined,
```

### 2. Data Source: listWorkers Server Action

**File:** `app/app/actions/activists.ts`

**Lines 437-451:** Missing soft-delete filter
```typescript
include: {
  activistCoordinator: {
    select: {
      id: true,
      user: {  // ❌ NO FILTER - includes soft-deleted users
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
},
```

**Fix Required:** Add `isActive` filter to user relation:
```typescript
include: {
  activistCoordinator: {
    where: {
      user: {
        isActive: true,  // ✅ Filter soft-deleted users at DB level
      },
    },
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
},
```

### 3. Other Affected Server Actions (Potential)

Search revealed similar patterns in:

**getWorkerById (Line 541-557):**
```typescript
include: {
  activistCoordinator: {
    select: {
      id: true,
      user: {  // ⚠️ Potential null user
        select: {
          fullName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
},
```

**updateWorker (Line 840-882):**
```typescript
include: {
  activistCoordinator: {
    select: {
      id: true,
      user: {  // ⚠️ Potential null user
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
},
```

**getWorkerStats (Line 1257-1283):**
```typescript
activistCoordinator: {
  select: {
    id: true,
    user: {  // ⚠️ Potential null user
      select: {
        fullName: true,
      },
    },
  },
},
```

---

## Recommended Fixes (Priority Order)

### FIX #1: Add Null Check in Activists Page (IMMEDIATE - Prevents Crash)

**File:** `app/app/[locale]/(dashboard)/activists/page.tsx`

**Lines to modify:** 128-134

**Before:**
```typescript
activistCoordinator: a.activistCoordinator ? {
  id: a.activistCoordinator.id,
  user: {
    fullName: a.activistCoordinator.user.fullName,
    email: a.activistCoordinator.user.email,
  },
} : undefined,
```

**After (Option A - Preferred):**
```typescript
activistCoordinator: a.activistCoordinator?.user ? {
  id: a.activistCoordinator.id,
  user: {
    fullName: a.activistCoordinator.user.fullName,
    email: a.activistCoordinator.user.email,
  },
} : undefined,
```

**After (Option B - More defensive):**
```typescript
activistCoordinator: a.activistCoordinator && a.activistCoordinator.user ? {
  id: a.activistCoordinator.id,
  user: {
    fullName: a.activistCoordinator.user.fullName,
    email: a.activistCoordinator.user.email,
  },
} : undefined,
```

### FIX #2: Filter at Database Level (BEST PRACTICE - Prevents Data Leakage)

**File:** `app/app/actions/activists.ts`

**Function:** `listWorkers()`

**Lines to modify:** 437-451

**Add `where` clause to filter soft-deleted users:**
```typescript
include: {
  activistCoordinator: {
    where: {
      user: {
        isActive: true,  // ✅ CRITICAL: Only include active users
      },
    },
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
},
```

### FIX #3: Add Post-Query Filter (FALLBACK - Following Bug #50 Pattern)

**File:** `app/app/actions/activists.ts`

**Function:** `listWorkers()`

**After line 514 (before return):**
```typescript
// CRITICAL FIX (Bug #b2c4f9a1): Filter out activists with null/deleted users
// Prisma's relation filter doesn't exclude orphaned foreign keys (deleted users)
// Use loose equality (!=) to catch both null AND undefined (Bug #52 pattern)
const activists = activistData
  .map((activist) => {
    const neighborhood = neighborhoodMap.get(`${activist.neighborhoodId}:${activist.cityId}`);

    return {
      ...activist,
      // Serialize Date objects to ISO strings for Server Action compatibility
      createdAt: activist.createdAt?.toISOString(),
      updatedAt: activist.updatedAt?.toISOString(),
      startDate: activist.startDate?.toISOString() || null,
      endDate: activist.endDate?.toISOString() || null,
      // Explicitly serialize neighborhood to avoid Prisma object issues
      neighborhood: neighborhood ? {
        id: neighborhood.id,
        name: neighborhood.name,
        // ... rest of neighborhood fields
      } : null,
      // ✅ CRITICAL FIX: Only include activistCoordinator if user exists
      activistCoordinator: activist.activistCoordinator?.user != null
        ? activist.activistCoordinator
        : null,
    };
  })
  .filter((activist) => {
    // ✅ OPTIONAL: Completely remove activists with deleted coordinators
    // return activist.activistCoordinator == null || activist.activistCoordinator.user != null;
    return true; // Keep all activists, just nullify deleted coordinator references
  });
```

### FIX #4: Apply Same Pattern to Other Server Actions

**Files to update:**
- `app/app/actions/activists.ts` (getWorkerById, updateWorker, getWorkerStats)
- Any other action that includes `activistCoordinator.user`

**Pattern to apply:**
```typescript
// In all Prisma queries that include activistCoordinator.user:
include: {
  activistCoordinator: {
    where: {
      user: {
        isActive: true,  // ✅ Standard soft-delete filter
      },
    },
    select: {
      id: true,
      user: {
        select: {
          fullName: true,
          email: true,
        },
      },
    },
  },
},
```

---

## Testing Strategy

### Reproduction Steps

1. **Create test scenario:**
   ```sql
   -- Soft-delete a user who is an activist coordinator
   UPDATE users SET is_active = false WHERE id = 'coordinator-user-id';
   ```

2. **Visit affected page:**
   - Navigate to `/activists`
   - Check browser console for error
   - Verify page renders (shouldn't crash)

3. **Verify fix:**
   - Activists with deleted coordinators should display without coordinator info
   - OR activists with deleted coordinators should be filtered out
   - No console errors
   - No 500 server errors

### Test Cases

**Test Case #1: Activist with Active Coordinator**
- ✅ Should display coordinator name and email
- ✅ Should render without errors

**Test Case #2: Activist with Soft-Deleted Coordinator User**
- ✅ Should display activist without coordinator info
- ✅ Should NOT crash the page
- ✅ Coordinator field should be `undefined` or `null`

**Test Case #3: Activist with No Coordinator**
- ✅ Should display activist without coordinator info
- ✅ Should render normally

**Test Case #4: Empty Activists List**
- ✅ Should show "No activists" message
- ✅ Should NOT crash

### E2E Test to Add

```typescript
// tests/e2e/activists.spec.ts

test('Activists page handles soft-deleted coordinator users gracefully', async ({ page }) => {
  // Soft-delete coordinator user
  await deleteUserViaSql('coordinator-user-id', { softDelete: true });

  // Navigate to activists page
  await page.goto('/activists');

  // Page should load without errors
  await expect(page.locator('[data-testid="activists-grid"]')).toBeVisible();

  // Should not show coordinator info for activists with deleted coordinators
  const firstActivist = page.locator('[data-testid^="activist-card-"]').first();
  await expect(firstActivist).toBeVisible();

  // Verify no console errors
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  await page.waitForTimeout(1000); // Let page settle
  expect(consoleErrors).toHaveLength(0);
});
```

---

## Prevention Rules

### RULE 1: Always Check Nested Relations for Null

When accessing nested relations in data mapping, use optional chaining:

**❌ WRONG:**
```typescript
user: {
  fullName: a.activistCoordinator.user.fullName,
}
```

**✅ CORRECT:**
```typescript
user: a.activistCoordinator?.user ? {
  fullName: a.activistCoordinator.user.fullName,
} : undefined
```

### RULE 2: Filter Soft-Deleted Users at Database Level

Always add `isActive: true` filters to user relations:

**❌ WRONG:**
```typescript
include: {
  activistCoordinator: {
    select: {
      user: { select: { fullName: true } }
    }
  }
}
```

**✅ CORRECT:**
```typescript
include: {
  activistCoordinator: {
    where: {
      user: { isActive: true }  // ✅ Filter at DB level
    },
    select: {
      user: { select: { fullName: true } }
    }
  }
}
```

### RULE 3: Post-Query Null Filtering (Fallback)

If DB-level filtering isn't possible, filter after query:

```typescript
const validData = rawData.filter(item => item.relation?.user != null);
```

**Note:** Use loose equality (`!=`) to catch both `null` and `undefined` (Bug #52 pattern)

### RULE 4: Codebase-Wide Pattern Search

Before deploying, search for this pattern:
```bash
# Find potential null reference risks
grep -r "\.user\.fullName" app/app
grep -r "\.user\.email" app/app
grep -r "activistCoordinator\\.user\\." app/app
```

---

## Impact Assessment

### Production Impact

**Affected Users:** ALL users accessing `/activists` page
**Error Count:** 35 errors in ~2 hours (high frequency)
**User Experience:** Complete page failure (white screen or error boundary)

### Business Impact

**CRITICAL:** Main activist management page is completely broken
- Cannot view activist list
- Cannot add new activists
- Cannot edit existing activists
- Campaign coordinators blocked from core workflow

**URGENT FIX REQUIRED** - This is blocking daily operations

---

## Deployment Plan

### Phase 1: Emergency Hotfix (Deploy ASAP)

**Files to modify:**
1. `app/app/[locale]/(dashboard)/activists/page.tsx` (Add null check)

**Changes:**
- Add optional chaining to `a.activistCoordinator?.user` check
- Deploy immediately to unblock users

**Estimated Time:** 10 minutes
**Risk:** LOW (defensive change)

### Phase 2: Data Layer Fix (Deploy Next)

**Files to modify:**
1. `app/app/actions/activists.ts` (listWorkers, getWorkerById, updateWorker, getWorkerStats)

**Changes:**
- Add `where: { user: { isActive: true } }` to all activistCoordinator includes
- Add post-query filter as fallback

**Estimated Time:** 30 minutes
**Risk:** LOW (filtering only)

### Phase 3: Systematic Audit (Next Sprint)

**Files to audit:**
- All files that include `activistCoordinator.user`
- All files that include user relations with soft-deletes
- All data mapping operations in page components

**Estimated Time:** 2-3 hours
**Risk:** LOW (comprehensive fix)

---

## Monitoring

After deployment, monitor:

1. **Error rate for b2c4f9a1:** Should drop to zero
2. **New error patterns:** Watch for similar issues on other pages
3. **Performance:** Check if additional filters impact query performance

**Success Criteria:**
- Zero `b2c4f9a1` errors for 24 hours
- No new null reference errors on `/activists`
- Page load time remains < 1s

---

## Related Documentation

- **Bug #50:** getAreaManagers null user crash
- **Bug #52:** Null filter using strict equality
- **Bug #45:** Soft-deleted entities counted in queries
- **INV-DATA-001:** Soft delete conversion strategy
- **baseRules.md:** RBAC and data filtering rules

---

## Status Timeline

- **2026-01-22 09:20:** First error occurred
- **2026-01-22 11:13:** Last error (35 total occurrences)
- **2026-01-22 [TIME]:** Root cause identified
- **2026-01-22 [TIME]:** Fix proposed (this document)
- **TBD:** Fix deployed (Phase 1)
- **TBD:** Data layer fix deployed (Phase 2)
- **TBD:** Systematic audit completed (Phase 3)

---

**APPROVAL REQUIRED BEFORE MODIFYING LOCKED SCREEN**

Page `/activists` is marked as LOCKED in CLAUDE.md. User approval is required before applying fixes to:
- `app/app/[locale]/(dashboard)/activists/page.tsx`

**Question for User:**
> The `/activists` page is locked per CLAUDE.md. I've identified the root cause as a null reference error when accessing soft-deleted user data. Should I proceed with the emergency hotfix (adding null checks), or would you prefer to review the analysis first?
