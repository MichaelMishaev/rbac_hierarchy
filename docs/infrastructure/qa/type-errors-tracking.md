# TypeScript Strict Mode - Error Tracking

**Created:** 2025-12-16
**Total Errors:** 408
**Status:** In Progress

---

## Current Situation

✅ TypeScript strict mode **ENABLED** in `tsconfig.json`
⚠️ **408 type errors** detected
🔧 **Temporary workaround:** Type-check disabled in pre-commit hook

---

## Error Categories (by frequency)

### 1. `exactOptionalPropertyTypes` issues (~60% of errors)
**Problem:** Passing `undefined` where Prisma expects `null`

**Example:**
```typescript
// ❌ Current (fails with exactOptionalPropertyTypes)
const data = {
  phone: formData.phone || undefined  // Prisma expects null, not undefined
};

// ✅ Fixed
const data = {
  phone: formData.phone || null
};
```

**Files affected:**
- `actions/activists.ts` (~50 errors)
- `actions/attendance.ts` (~20 errors)
- `actions/areas.ts` (~15 errors)
- `actions/activist-coordinator-neighborhoods.ts` (~15 errors)

---

### 2. Unused variables (~20% of errors)
**Problem:** `noUnusedLocals` and `noUnusedParameters` catching unused imports/variables

**Example:**
```typescript
// ❌ Current
import { Typography } from '@mui/material';  // Not used
const handleClick = (event, data) => { ... }  // event not used

// ✅ Fixed
// Remove unused import
const handleClick = (_event, data) => { ... }  // Prefix with _
```

**Files affected:**
- `app/[locale]/(dashboard)/**/page.tsx` (multiple files)

---

### 3. Possibly undefined (~15% of errors)
**Problem:** `noUncheckedIndexedAccess` catching array/object access without null checks

**Example:**
```typescript
// ❌ Current
const activist = activists[0];
activist.name;  // Possibly undefined

// ✅ Fixed
const activist = activists[0];
if (activist) {
  activist.name;
}
// Or use optional chaining
activists[0]?.name;
```

**Files affected:**
- `actions/attendance.ts`
- `app/[locale]/(dashboard)/users/page.tsx`

---

### 4. Missing return statements (~3% of errors)
**Problem:** `noImplicitReturns` catching functions without explicit returns

**Example:**
```typescript
// ❌ Current
const getRole = (user: User) => {
  if (user.isSuperAdmin) {
    return 'SUPERADMIN';
  }
  if (user.role) {
    return user.role;
  }
  // Missing return!
};

// ✅ Fixed
const getRole = (user: User): string => {
  if (user.isSuperAdmin) {
    return 'SUPERADMIN';
  }
  if (user.role) {
    return user.role;
  }
  return 'UNKNOWN';  // Explicit default
};
```

---

### 5. Type mismatches (~2% of errors)
**Problem:** Schema changes not reflected in component types

**Example:**
```typescript
// ❌ Current
type Worker = {
  site: Site;  // Schema changed, now Site | undefined
};

// ✅ Fixed
type Worker = {
  site: Site | undefined;
};
```

---

## Fix Strategy (Incremental)

### Phase 1: Quick Wins (Week 1)
- [ ] Fix all unused variables/imports (~80 errors)
  - Remove unused imports
  - Prefix unused params with `_`
- [ ] Add missing return statements (~12 errors)

**Expected reduction:** ~92 errors → **316 remaining**

---

### Phase 2: Null Safety (Week 2)
- [ ] Fix `undefined` vs `null` in Prisma calls (~245 errors)
  - Create helper: `const nullIfUndefined = (val) => val ?? null`
  - Apply to all Prisma create/update calls
- [ ] Add optional chaining for array access (~60 errors)

**Expected reduction:** ~305 errors → **11 remaining**

---

### Phase 3: Type Refinement (Week 3)
- [ ] Fix remaining type mismatches (~11 errors)
- [ ] Update component types to match schema

**Expected reduction:** ~11 errors → **0 remaining** 🎉

---

### Phase 4: Re-enable Type-Check in Pre-commit (Week 3)
Once all errors are fixed:

```json
// .lintstagedrc.json
{
  "*.{ts,tsx}": [
    "eslint --fix",
    "bash -c 'tsc --noEmit'"  // Re-enable!
  ]
}
```

---

## Commands

**Check current error count:**
```bash
cd app
npx tsc --noEmit 2>&1 | grep -c "error TS"
```

**View specific errors:**
```bash
npx tsc --noEmit 2>&1 | grep "error TS" | head -20
```

**Fix errors in a file:**
```bash
npx tsc --noEmit 2>&1 | grep "actions/activists.ts"
```

---

## Progress Tracking

| Date | Total Errors | Errors Fixed | % Complete |
|------|--------------|--------------|------------|
| 2025-12-16 | 408 | 0 | 0% |
| 2025-12-23 (Est.) | 316 | 92 | 23% |
| 2025-12-30 (Est.) | 11 | 397 | 97% |
| 2026-01-06 (Est.) | 0 | 408 | 100% ✅ |

---

**Next Action:** Start Phase 1 (remove unused variables) - can be done in 1-2 hours.

**End of Tracking**
