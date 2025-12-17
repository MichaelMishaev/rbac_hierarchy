# Regression Prevention Protocol - Election Campaign System

> **📌 STATUS: PRODUCTION READY v3.0 - 2025-12-17**
>
> **This document is THE SINGLE SOURCE OF TRUTH for preventing regression bugs.**
> **Tailored specifically for Hebrew-only, RTL-only Election Campaign Management System.**
> **Going to production: ZERO TOLERANCE for regression bugs.**

---

**Project:** Election Campaign Management System (Multi-City Hebrew RTL Platform)
**Audience:** Claude Code, AI assistants, developers
**Philosophy:** Multi-tenant security first, Hebrew/RTL always, no regressions ever
**Version:** 3.0 (Production-Ready)
**Last Updated:** 2025-12-17

---

## 🎯 Critical System Invariants (MUST NEVER BREAK)

### 🔒 INV-001: Multi-City Data Isolation
**CRITICAL SECURITY INVARIANT**

```typescript
// MUST ALWAYS BE TRUE:
// 1. SuperAdmin sees all cities
// 2. Area Manager sees only their assigned cities
// 3. City Coordinator sees only their single city
// 4. Activist Coordinator sees only their single city
// 5. NO cross-city data leakage EVER

// ✅ CORRECT:
const activists = await prisma.activist.findMany({
  where: {
    cityId: session.user.cityId, // ALWAYS filter by cityId
    isActive: true
  }
});

// ❌ WRONG (DATA LEAKAGE):
const activists = await prisma.activist.findMany({
  where: { isActive: true } // NO cityId filter!
});
```

**Tests Required:**
- ✅ E2E test: City Coordinator A cannot see City B data (`tests/e2e/multi-tenant/isolation-v1.3.spec.ts`)
- ✅ Integration test: DB queries auto-filter by cityId (except SuperAdmin)
- ✅ Negative test: Cross-city access rejected with 403
- ✅ Runtime guard: Prisma middleware enforces cityId filter

---

### 🔐 INV-002: RBAC Boundaries Enforcement

**Role hierarchy (most powerful → least powerful):**
```
SUPERADMIN (system-wide)
  └── AREA_MANAGER (multi-city region)
      └── CITY_COORDINATOR (single city)
          └── ACTIVIST_COORDINATOR (assigned neighborhoods only)
```

**Locked Pages:**
- `/cities` → ONLY SuperAdmin & Area Manager ([LOCKED 2025-12-15])
- `/areas` → ONLY SuperAdmin & Area Manager
- ALL pages → filter by cityId (except SuperAdmin)

**Tests Required:**
- ✅ E2E test: Activist Coordinator gets 403 on `/cities` page
- ✅ E2E test: City Coordinator sees only their city in dropdowns
- ✅ Negative test: Lower role cannot perform higher role actions
- ✅ Runtime guard: Middleware rejects unauthorized page access

---

### 🇮🇱 INV-003: Hebrew/RTL-Only System

**CRITICAL: NO English, NO LTR, NO locale switching**

```tsx
// ✅ CORRECT:
<Box dir="rtl" lang="he">
  <Typography sx={{ marginInlineStart: 2 }}>טקסט עברי</Typography>
</Box>

// ❌ WRONG:
<Box> {/* Missing dir="rtl" */}
  <Typography sx={{ marginLeft: 2 }}> {/* Should use marginInlineStart */}
    Hebrew text
  </Typography>
</Box>
```

**Tests Required:**
- ✅ Visual regression test: All pages render correctly in RTL
- ✅ E2E test: All text is Hebrew (no English)
- ✅ Unit test: All UI labels use Hebrew i18n keys
- ✅ Behavior lock: `<html dir="rtl" lang="he">` on all pages

---

### 🗂️ INV-004: Composite Foreign Keys Integrity

**CRITICAL: All M2M relationships MUST include cityId for isolation**

```typescript
// ✅ CORRECT (v2.0 compliance):
model ActivistCoordinatorNeighborhood {
  cityId String
  activistCoordinatorId String
  neighborhoodId String

  activistCoordinator ActivistCoordinator @relation(
    fields: [activistCoordinatorId, cityId],
    references: [id, cityId]
  )

  neighborhood Neighborhood @relation(
    fields: [neighborhoodId, cityId],
    references: [id, cityId]
  )

  @@unique([activistCoordinatorId, neighborhoodId])
}
```

**Tests Required:**
- ✅ DB integrity test: No cityId mismatches (`scripts/qa-integrity-tests.ts`)
- ✅ Integration test: Cannot create assignment with mismatched cityId
- ✅ Runtime guard: DB constraints reject FK violations

---

### 🗑️ INV-005: Soft Deletes Only

**CRITICAL: NO hard deletes on user-facing data**

```typescript
// ✅ CORRECT:
await prisma.activist.update({
  where: { id: activistId },
  data: { isActive: false } // Soft delete
});

// ❌ WRONG:
await prisma.activist.delete({
  where: { id: activistId } // Hard delete!
});
```

**Tests Required:**
- ✅ Integration test: `delete()` throws error on activists
- ✅ Runtime guard: Prisma middleware blocks hard deletes
- ✅ Behavior lock: Deleted activists still in DB with `isActive: false`

---

### 🌳 INV-006: Organization Tree Visibility

**CRITICAL: Each role sees only their subtree as ROOT**

```typescript
// SuperAdmin → Full hierarchy
// Area Manager → Their area as root (NO SuperAdmin visible)
// City Coordinator → Their city as root (NO Area Manager/SuperAdmin)
// Activist Coordinator → Their city with assigned neighborhoods only
```

**Tests Required:**
- ✅ E2E test: Area Manager does NOT see SuperAdmin in org tree
- ✅ E2E test: City Coordinator sees only their city as root
- ✅ Behavior lock: Tree structure varies by role (not just filtering)

---

### 📍 INV-007: GPS Geofencing for Attendance

**CRITICAL: Attendance check-ins MUST validate location**

```typescript
// ✅ CORRECT:
if (distance > geofenceRadius) {
  throw new Error('User is not within site geofence');
}

await prisma.attendanceRecord.create({
  data: {
    activistId,
    neighborhoodId,
    cityId,
    checkedInLatitude: lat,
    checkedInLongitude: lng,
    distanceFromSite: distance,
    isWithinGeofence: distance <= geofenceRadius
  }
});
```

**Tests Required:**
- ✅ Integration test: Check-in inside geofence accepted
- ✅ Negative test: Check-in outside geofence rejected
- ✅ Edge case test: GPS accuracy ±50m tolerance

---

### 📋 INV-008: Task Deletion Behavior

**CRITICAL: Sender delete → grey-out for recipients (NOT full delete)**

```typescript
// ✅ CORRECT:
// Sender deletes task
await prisma.task.update({
  where: { id: taskId },
  data: { deletedBySenderAt: new Date() }
});

// Recipients see greyed-out task
const tasks = await prisma.taskAssignment.findMany({
  include: {
    task: true // task.deletedBySenderAt !== null → show greyed
  }
});
```

**Tests Required:**
- ✅ E2E test: Deleted task appears greyed for recipients
- ✅ Behavior lock: Recipients can still see deleted tasks
- ✅ Negative test: Recipients cannot un-delete sender's deletion

---

### 📱 INV-009: Mobile-First Responsive Design

**CRITICAL: Must work perfectly on iPhone 14 (390x844)**

```tsx
// ✅ CORRECT:
<Box sx={{
  width: '100%',
  [theme.breakpoints.down('sm')]: {
    padding: 2,
    fontSize: '0.875rem'
  }
}}>
```

**Tests Required:**
- ✅ Visual regression test: Screenshots match on mobile (`tests/e2e/responsive/`)
- ✅ E2E test: All pages accessible on mobile viewport
- ✅ Behavior lock: Mobile navigation works (bottom nav, FAB)

---

## 🐛 5-Step Bug Fix Protocol (MANDATORY)

**Every bug fix MUST include ALL 5 steps:**

### Step 1: Root Cause Identification
Write 1-3 bullets explaining **WHY** it happened (not just what broke).

**Example:**
```markdown
**Root Cause:**
1. City dropdown filter was checking `role === 'CITY_COORDINATOR'`
2. Should have checked `role !== 'SUPERADMIN' && role !== 'AREA_MANAGER'`
3. Activist Coordinators couldn't see cities because condition was wrong
```

### Step 2: Regression Test (FAILS before fix)
Write test that reproduces bug and FAILS before your fix.

**Example:**
```typescript
test('Activist Coordinator can see city dropdown', async () => {
  const session = { user: { role: 'ACTIVIST_COORDINATOR', cityId: 'city-1' } };
  const cities = await getCitiesForUser(session);

  expect(cities.length).toBeGreaterThan(0); // ❌ FAILS before fix
});
```

### Step 3: Minimal Fix
Change ONLY what's needed to fix the bug.

**Example:**
```typescript
// Before:
if (session.user.role === 'CITY_COORDINATOR') { /* ... */ }

// After:
if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AREA_MANAGER') {
  /* ... */
}
```

### Step 4: Run Relevant Tests
Execute tests affected by the change.

**Example:**
```bash
npm run test:e2e -- --grep "city dropdown"
npm run test:integration -- --grep "getCitiesForUser"
```

### Step 5: Document Prevention
Add to `/docs/localDev/bugs.md`:

**Format:**
```markdown
## Bug #XX: [Title] (YYYY-MM-DD)

**Problem:** [What broke]

**Root Cause:** [Why it happened - 1-3 bullets]

**Solution:** [What was changed]

**Prevention Rule:** [How to avoid this in future]

**Files Changed:**
- `path/to/file.ts:123` - [why]

**Tests Added:**
- `tests/e2e/test-name.spec.ts` - [regression test]
```

---

## 🚨 Stop Conditions (When to Ask)

**STOP and ask user before proceeding if:**

1. ❌ **Schema change implied** - Any DB schema modification needs explicit approval
2. ❌ **RBAC change implied** - Any permission/role change is HIGH RISK
3. ❌ **3+ files need large edits** - High regression risk, break into smaller tasks
4. ❌ **Breaking change to API** - Might break existing integrations
5. ❌ **Uncertain about invariant** - If unsure whether change violates INV-001 to INV-009

**Never guess. When uncertain, ask first.**

---

## 🧪 Testing Strategy (Risk-Based)

### 🔴 HIGH RISK (Full Tier 1 Suite Required)

**These changes affect critical invariants:**
- Multi-city data isolation logic
- RBAC permission checks
- Authentication/authorization
- Composite FK relationships
- Soft delete behavior
- Hebrew/RTL rendering
- GPS geofencing logic

**Required Tests:**
- ✅ Full Tier 1 critical suite (`npm run test:tier1`)
- ✅ Multi-tenant isolation tests (`tests/e2e/multi-tenant/`)
- ✅ RBAC permission tests (`tests/e2e/rbac/`)
- ✅ Negative tests (unauthorized access blocked)
- ✅ Runtime guard verification

**Example:**
```typescript
// 🔴 HIGH RISK: Changing city filter logic
function getActivists(cityId: string) {
  return prisma.activist.findMany({
    where: {
      cityId, // ⚠️ CRITICAL: Multi-city isolation
      isActive: true
    }
  });
}
```

---

### 🔸 MEDIUM RISK (Integration Tests)

**These changes touch services/queries but not invariants:**
- New API endpoints (non-critical)
- UI component updates
- Form validation logic
- Non-critical database queries
- Localization updates (Hebrew text changes)

**Required Tests:**
- ✅ Integration tests for affected services
- ✅ E2E tests for affected UI flows
- ✅ Visual regression for UI changes

**Example:**
```typescript
// 🔸 MEDIUM RISK: Adding new field to form
function createActivist(data: ActivistInput) {
  return prisma.activist.create({
    data: {
      ...data,
      newField: data.newField // New field, not critical
    }
  });
}
```

---

### 🔹 LOW RISK (Unit Tests Only)

**These changes are isolated and have no side effects:**
- Pure functions (formatters, helpers)
- Constants
- Type definitions
- Comments/documentation
- CSS styling (non-RTL)

**Required Tests:**
- ✅ Unit tests for changed function

**Example:**
```typescript
// 🔹 LOW RISK: Pure helper function
function formatPhone(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
}
```

---

## ❌ Negative Testing (CRITICAL for Security)

**For every permission/validation, test the forbidden path.**

### Pattern 1: RBAC Negative Tests

```typescript
// ✅ Positive test: Authorized access works
test('City Coordinator can view their city activists', async () => {
  const session = { user: { role: 'CITY_COORDINATOR', cityId: 'tel-aviv' } };
  const activists = await getActivists({ cityId: 'tel-aviv' }, session);
  expect(activists).toBeDefined();
});

// ✅ Negative test: Unauthorized access blocked
test('City Coordinator CANNOT view other city activists', async () => {
  const session = { user: { role: 'CITY_COORDINATOR', cityId: 'tel-aviv' } };

  await expect(
    getActivists({ cityId: 'jerusalem' }, session)
  ).rejects.toThrow('Access denied');
});

// ✅ Negative test: Insufficient permissions
test('Activist Coordinator CANNOT access /cities page', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'activist.coordinator@test.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  await page.goto('/cities');
  await expect(page.locator('text=אין הרשאה')).toBeVisible(); // 403
});
```

### Pattern 2: Input Validation Negative Tests

```typescript
// ✅ Negative tests: Invalid input rejected
test('rejects activist with missing required fields', async () => {
  await expect(
    createActivist({ fullName: 'יוסי' }) // Missing phone, neighborhoodId
  ).rejects.toThrow('חסרים שדות חובה');
});

test('rejects activist with invalid phone format', async () => {
  await expect(
    createActivist({
      fullName: 'יוסי כהן',
      phone: 'invalid',
      neighborhoodId: 'neighborhood-1'
    })
  ).rejects.toThrow('פורמט טלפון לא תקין');
});
```

### Pattern 3: State Transition Negative Tests

```typescript
// ✅ Negative test: Cannot transition from active to deleted via API
test('CANNOT hard delete activist via API', async () => {
  await expect(
    deleteActivist('activist-1') // Should soft delete only
  ).rejects.toThrow('Hard deletes not allowed');
});
```

---

## 🛡️ Runtime Invariant Guards (Last Line of Defense)

**Add runtime assertions for critical invariants.**

### Guard 1: Prisma Middleware - Multi-City Isolation

```typescript
// app/lib/prisma-middleware.ts
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Guard: Activists MUST have cityId
  if (params.model === 'Activist' && params.action === 'create') {
    if (!result.cityId) {
      logger.error('INVARIANT VIOLATION: Activist created without cityId', {
        activistId: result.id
      });
      throw new Error('Data integrity violation: Activist missing cityId');
    }
  }

  // Guard: No hard deletes on activists
  if (params.model === 'Activist' && params.action === 'delete') {
    logger.error('INVARIANT VIOLATION: Hard delete attempted on Activist', {
      params
    });
    throw new Error('Hard deletes not allowed. Use isActive = false');
  }

  return result;
});
```

### Guard 2: API Route - RBAC Check

```typescript
// app/api/cities/route.ts
export async function GET(req: Request) {
  const session = await auth();

  // Guard: Only SuperAdmin and Area Manager can access /cities
  if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AREA_MANAGER') {
    logger.error('INVARIANT VIOLATION: Unauthorized /cities access', {
      userId: session.user.id,
      role: session.user.role
    });
    return new Response('Access denied', { status: 403 });
  }

  // ... rest of logic
}
```

### Guard 3: Composite FK Validation

```typescript
// Guard: Ensure cityId matches for composite FK relationships
async function createActivistCoordinatorAssignment(data: AssignmentInput) {
  const coordinator = await prisma.activistCoordinator.findUnique({
    where: { id: data.activistCoordinatorId }
  });

  const neighborhood = await prisma.neighborhood.findUnique({
    where: { id: data.neighborhoodId }
  });

  // INVARIANT: Both must have same cityId
  if (coordinator.cityId !== neighborhood.cityId) {
    logger.error('INVARIANT VIOLATION: cityId mismatch in assignment', {
      coordinatorCityId: coordinator.cityId,
      neighborhoodCityId: neighborhood.cityId
    });
    throw new Error('Data integrity violation: cityId mismatch');
  }

  return prisma.activistCoordinatorNeighborhood.create({
    data: {
      activistCoordinatorId: data.activistCoordinatorId,
      neighborhoodId: data.neighborhoodId,
      cityId: coordinator.cityId // Explicit cityId
    }
  });
}
```

---

## 🐤 Golden Path Canaries (Production Health Checks)

**Run these in production HOURLY to catch issues immediately.**

### Canary 1: Authentication Flow

```typescript
// tests/canary/auth-flow.canary.ts
test('GP-1: User can login and access dashboard', async ({ page }) => {
  // Use read-only production account
  await page.goto('https://app.example.com/login');
  await page.fill('[name="email"]', process.env.CANARY_USER_EMAIL);
  await page.fill('[name="password"]', process.env.CANARY_USER_PASSWORD);
  await page.click('button[type="submit"]');

  // Verify dashboard loads
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('html')).toHaveAttribute('dir', 'rtl'); // Hebrew RTL
  await expect(page.locator('html')).toHaveAttribute('lang', 'he');
});
```

### Canary 2: Multi-City Isolation

```typescript
// tests/canary/isolation.canary.ts
test('GP-2: City Coordinator sees only their city', async ({ page }) => {
  await page.goto('https://app.example.com/login');
  await page.fill('[name="email"]', process.env.CANARY_CITY_COORDINATOR_EMAIL);
  await page.fill('[name="password"]', process.env.CANARY_PASSWORD);
  await page.click('button[type="submit"]');

  // Navigate to neighborhoods
  await page.click('text=שכונות');

  // Verify only assigned city visible
  const pageContent = await page.textContent('body');
  expect(pageContent).not.toContain('ירושלים'); // Should NOT see Jerusalem if user is in Tel Aviv
});
```

### Canary 3: Hebrew/RTL Rendering

```typescript
// tests/canary/rtl.canary.ts
test('GP-3: All pages render in Hebrew RTL', async ({ page }) => {
  await page.goto('https://app.example.com');

  const html = page.locator('html');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'he');

  // Visual regression
  await expect(page).toHaveScreenshot('dashboard-rtl.png', {
    maxDiffPixels: 100
  });
});
```

**Deploy as GitHub Action:**

```yaml
# .github/workflows/golden-path-canary.yml
name: Golden Path Canary
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:

jobs:
  canary:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:canary
        env:
          CANARY_USER_EMAIL: ${{ secrets.CANARY_USER_EMAIL }}
          CANARY_PASSWORD: ${{ secrets.CANARY_PASSWORD }}

      # Alert on failure
      - name: Notify on failure
        if: failure()
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_MESSAGE: '🚨 Golden Path FAILED - Production may be broken'
```

---

## 📋 Test Ownership (Accountability)

**Every test file MUST declare owner at the top.**

```typescript
/**
 * INVARIANT: City Coordinators can only access their own city's data
 * INTENT: Prevent cross-city data leakage (security-critical)
 * @owner backend-security
 * @created 2025-12-17
 */

describe('City data isolation', () => {
  test('City Coordinator CANNOT access other city data', async () => {
    // Test implementation
  });
});
```

**Owner responsibilities:**
1. Keep tests meaningful
2. Update intent when behavior changes
3. Fix flaky tests within 48 hours
4. Respond to test failures

---

## 🚫 Flaky Test Zero Tolerance

**Flaky test = Production-severity bug.**

**When detected:**
1. ✅ Quarantine immediately (`test.skip()`)
2. ✅ Create P1 incident
3. ✅ Fix or delete within **48 hours**
4. ✅ Document root cause in bug log

**CI/CD Rules:**
- ❌ No retry logic in CI (fail on first failure)
- ❌ Block all merges while flaky tests exist
- ❌ Alert on >0.1% failure rate

---

## 📊 Current Test Coverage

**What we already have:**
- ✅ **40+ E2E tests** (RBAC, multi-tenant, mobile, PWA, gestures, responsive)
- ✅ **DB integrity tests** (`scripts/qa-integrity-tests.ts`)
- ✅ **80+ documented bugs** (`docs/localDev/bugs.md`)
- ✅ **Multi-tenant isolation tests** (`tests/e2e/multi-tenant/isolation-v1.3.spec.ts`)
- ✅ **RBAC permission tests** (`tests/e2e/rbac/permissions-v1.3.spec.ts`)

**What we need to add:**
- ⚠️ Runtime guards (Prisma middleware)
- ⚠️ Golden Path canaries (hourly production checks)
- ⚠️ Behavior locks (explicit "must not change" tests)
- ⚠️ Negative tests (unauthorized paths blocked)
- ⚠️ Test ownership headers

---

## ✅ Pre-Production Checklist

**Before deploying to production:**

### Security & RBAC
- [ ] Multi-city isolation tests passing (`npm run test:e2e -- multi-tenant`)
- [ ] RBAC permission tests passing (`npm run test:e2e -- rbac`)
- [ ] Negative tests passing (unauthorized access blocked)
- [ ] Runtime guards deployed (Prisma middleware active)
- [ ] SuperAdmin cannot be created via API (DB/bootstrap only)

### Data Integrity
- [ ] DB integrity tests passing (`npm run db:check-integrity`)
- [ ] Composite FK tests passing
- [ ] Soft delete behavior verified
- [ ] No hard deletes on activists

### Hebrew/RTL
- [ ] All pages `dir="rtl" lang="he"`
- [ ] All text in Hebrew (no English)
- [ ] Logical CSS properties used (`marginInlineStart`, not `marginLeft`)
- [ ] Visual regression tests passing (`npm run test:e2e -- responsive`)

### Mobile
- [ ] Mobile navigation works (bottom nav, FAB)
- [ ] All pages accessible on iPhone 14 (390x844)
- [ ] Touch gestures work (swipe, tap, long-press)
- [ ] PWA installable and offline-capable

### Monitoring
- [ ] Golden Path canaries deployed (hourly GitHub Action)
- [ ] Error monitoring active (Sentry/similar)
- [ ] Audit logs capturing all mutations
- [ ] Performance metrics tracked

---

## 🚀 Task Execution Template

**Use this for every development task:**

```markdown
## Task: [Brief Description]

### 1. Risk Classification
**Risk Level:** 🔹 Low / 🔸 Medium / 🔴 High

**Justification:**
- What is being changed?
- Does it affect INV-001 to INV-009?
- What are side effects?

**Affected Invariants (if High Risk):**
- [ ] INV-001: Multi-city data isolation
- [ ] INV-002: RBAC boundaries
- [ ] INV-003: Hebrew/RTL-only
- [ ] INV-004: Composite FK integrity
- [ ] INV-005: Soft deletes only
- [ ] INV-006: Org tree visibility
- [ ] INV-007: GPS geofencing
- [ ] INV-008: Task deletion behavior
- [ ] INV-009: Mobile-first responsive

### 2. Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### 3. Implementation
**Files modified:**
- `path/to/file.ts:123` - [reason]

### 4. Testing
**Tests run:**
```bash
npm run test:tier1 # If high risk
npm run test:integration # If medium risk
npm run test:unit # If low risk
```

**Results:**
- ✅ All tests passed
- ✅ No flaky tests
- ✅ Type-check passed
- ✅ Lint passed

**Negative Tests Added (if applicable):**
- [ ] Unauthorized access blocked
- [ ] Invalid input rejected
- [ ] Forbidden state transitions prevented

### 5. Bug Documentation (if fixing bug)
- [ ] Root cause identified (1-3 bullets)
- [ ] Regression test added (fails before fix)
- [ ] Documented in `/docs/localDev/bugs.md`
- [ ] Prevention rule added

### 6. Summary
[1-2 sentence summary]
```

---

## 📖 Quick Reference

### Critical Commands

```bash
# Development
npm run dev                      # Start dev server
npm run db:generate             # After schema changes
npm run db:push                 # Push schema to DB
npm run db:check-integrity      # Verify data integrity

# Testing
npm run test:tier1              # Critical tests (high risk changes)
npm run test:integration        # Integration tests (medium risk)
npm run test:unit               # Unit tests (low risk)
npm run test:e2e                # All E2E tests
npm run test:e2e -- multi-tenant  # Multi-tenant isolation
npm run test:e2e -- rbac        # RBAC permissions

# Production
npm run build                   # Build for production
npm run start                   # Production server
```

### Critical Files

- `/docs/localDev/bugs.md` - Bug log (80+ documented bugs)
- `/app/prisma/schema.prisma` - Database schema (single source of truth)
- `/app/middleware.ts` - Authentication middleware
- `/scripts/qa-integrity-tests.ts` - DB integrity checks
- `/tests/e2e/multi-tenant/` - Multi-city isolation tests
- `/tests/e2e/rbac/` - RBAC permission tests

---

## 🎯 Production Readiness

**Target Metrics:**
- ✅ **99.8% regression prevention** (via tests + guards + canaries)
- ✅ **Zero data leakage** (multi-city isolation perfect)
- ✅ **Zero RBAC violations** (permissions enforced)
- ✅ **100% Hebrew RTL** (no English, no LTR)
- ✅ **Mobile-first always** (works on iPhone 14)

**If these are met:** System is production-ready ✅

**If any fail:** DO NOT DEPLOY ❌

---

**End of Regression Prevention Protocol v3.0**

**Last Updated:** 2025-12-17
**Status:** Production-Ready
**Next Review:** After first production deployment

**Remember: Regression bugs are NOT ALLOWED in production.**
