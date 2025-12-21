# 🔴 CRITICAL: Similar M2M Query Bugs Found

## Overview

Found **9 additional functions** across 2 files with the SAME bug pattern as Bug #60.

All use `legacyActivistCoordinatorUserId: currentUser.id` instead of properly querying via `activistCoordinatorId`.

---

## Files Affected

### 1. `/app/actions/dashboard.ts` (2 bugs)

#### Bug #60a: `getSupervisorStatsUncached` (Line 481-485)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
  where: { legacyActivistCoordinatorUserId: userId },
  select: { neighborhoodId: true },
});
```

**Impact**: Dashboard stats incorrect for Activist Coordinators

#### Bug #60b: Dashboard stats query (Line 912-916)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
  where: { legacyActivistCoordinatorUserId: currentUser.id },
  select: { neighborhoodId: true },
});
```

**Impact**: Role-based dashboard filtering broken

---

### 2. `/app/actions/activists.ts` (7 bugs)

#### Bug #60c: `createActivist` (Line 166-169)
```typescript
// ❌ WRONG - CRITICAL SECURITY ISSUE
const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    legacyActivistCoordinatorUserId: currentUser.id,
    neighborhoodId: data.neighborhoodId,
  },
});
```

**Impact**: Activist Coordinators might be able to create activists in UNASSIGNED neighborhoods!
**Severity**: 🔴 CRITICAL SECURITY - RBAC violation, potential privilege escalation

#### Bug #60d: `listActivists` (Line 348-351)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
  where: { legacyActivistCoordinatorUserId: currentUser.id },
  select: { neighborhoodId: true },
});
```

**Impact**: Activists list incorrect/empty for Activist Coordinators

#### Bug #60e: `getActivistById` (Line 570-573)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    legacyActivistCoordinatorUserId: currentUser.id,
    neighborhoodId: activist.neighborhoodId,
  },
});
```

**Impact**: Cannot view activist details

#### Bug #60f: `updateActivist` (Line 639-642)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    legacyActivistCoordinatorUserId: currentUser.id,
    neighborhoodId: existingActivist.neighborhoodId,
  },
});
```

**Impact**: Cannot update activists

#### Bug #60g: `deleteActivist` (Line 869-872)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    legacyActivistCoordinatorUserId: currentUser.id,
    neighborhoodId: activistToDelete.neighborhoodId,
  },
});
```

**Impact**: Cannot delete activists

#### Bug #60h: `toggleActivistStatus` (Line 974-977)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    legacyActivistCoordinatorUserId: currentUser.id,
    neighborhoodId: activist.neighborhoodId,
  },
});
```

**Impact**: Cannot toggle activist active status

#### Bug #60i: `listActivistsByFilters` (Line 1115-1118)
```typescript
// ❌ WRONG
const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
  where: { legacyActivistCoordinatorUserId: currentUser.id },
  select: { neighborhoodId: true },
});
```

**Impact**: Filtered activists list incorrect/empty

---

## Summary Statistics

| File | Functions Affected | Lines Affected |
|------|-------------------|----------------|
| `neighborhoods.ts` | 3 | 295-318, 456-488, 744-776 |
| `dashboard.ts` | 2 | 481-485, 912-916 |
| `activists.ts` | 7 | 166-169, 348-351, 570-573, 639-642, 869-872, 974-977, 1115-1118 |
| **TOTAL** | **12** | **12 locations** |

---

## Critical Security Issue

**Bug #60c in `createActivist` is CRITICAL**:

The validation check uses the wrong field, which means:
- Query might return NULL (no match found)
- Validation check fails
- But error message says "Access denied"

**However**, if the legacy field happens to match, it could allow:
- Creation of activists in neighborhoods NOT assigned via M2M
- RBAC violation
- Potential privilege escalation

---

## Correct Fix Pattern

```typescript
// ✅ CORRECT: 2-step process
// Step 1: Get ActivistCoordinator record
const activistCoordinator = await prisma.activistCoordinator.findFirst({
  where: { userId: currentUser.id, isActive: true },
  select: { id: true },
});

if (!activistCoordinator) {
  return { success: false, error: 'Access denied' };
}

// Step 2: Query M2M table using activistCoordinator.id
const assignment = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    activistCoordinatorId: activistCoordinator.id, // ✅ CORRECT
    neighborhoodId: targetNeighborhoodId,
  },
});
```

---

## Impact Assessment

### Neighborhoods (Fixed ✅)
- ✅ listNeighborhoods - FIXED
- ✅ getNeighborhoodById - FIXED
- ✅ getNeighborhoodStats - FIXED

### Dashboard (Not Fixed ❌)
- ❌ getSupervisorStatsUncached - BUG #60a
- ❌ Dashboard stats query - BUG #60b

### Activists (Not Fixed ❌)
- ❌ createActivist - BUG #60c (CRITICAL SECURITY)
- ❌ listActivists - BUG #60d
- ❌ getActivistById - BUG #60e
- ❌ updateActivist - BUG #60f
- ❌ deleteActivist - BUG #60g
- ❌ toggleActivistStatus - BUG #60h
- ❌ listActivistsByFilters - BUG #60i

---

## Severity

| Bug | Severity | Reason |
|-----|----------|--------|
| #60c (createActivist) | 🔴 CRITICAL | Potential RBAC violation, privilege escalation |
| #60d (listActivists) | 🔴 CRITICAL | Core functionality broken |
| #60a-b (dashboard) | 🟠 HIGH | Dashboard data incorrect |
| #60e-i (other activist operations) | 🟠 HIGH | CRUD operations broken |

---

## Recommendation

**IMMEDIATE ACTION REQUIRED**:

1. **Fix all 9 bugs** using the same pattern as Bug #60
2. **Priority**: Fix Bug #60c (createActivist) FIRST - security issue
3. **Test**: Comprehensive testing of Activist Coordinator role
4. **Audit**: Review ALL uses of `legacyActivistCoordinatorUserId` in codebase

---

## Files to Fix

1. `/app/actions/dashboard.ts` - 2 functions
2. `/app/actions/activists.ts` - 7 functions

**Total**: 9 functions across 2 files (in addition to the 3 already fixed)
