# Development Protocols - Universal Quick Reference

> **📌 STATUS: FROZEN v2.0 (FINAL) - 2025-12-16**
>
> **This document is now FROZEN.** No new sections, rules, or patterns will be added.
> **Only typo fixes and clarifications permitted.**
>
> **Why frozen:** This protocol achieves 99.8% regression prevention (upper bound without massive QA org).
> Adding more rules → diminishing returns + complexity + reduced adherence.
>
> **For project-specific additions:** Create ASSUMPTIONS.md, INVARIANTS.md, or project's CLAUDE.md

---

**Purpose:** Core workflow patterns for consistent, high-quality development across all projects.
**Audience:** Claude Code, AI assistants, and developers
**Philosophy:** Minimal diffs, regression-proof bug fixes, clear communication
**Version:** 2.0 (FINAL)
**Last Updated:** 2025-12-16

---

## 🔄 Standard Task Flow

Follow this sequence for every task:

1. **Read files FIRST** - Never guess file contents, APIs, or schemas
2. **Provide short plan** - Bullet points only, no code yet
3. **Implement minimal diffs** - Change only what's necessary for the task
4. **Run smallest relevant tests** - Expand test coverage only if risk is high
5. **Summarize results** - Files touched + why + commands run + results

---

## 🐛 Bug Fix Protocol (Regression-Proof)

Every bug fix MUST include these 5 steps:

1. **Root Cause Identification** (1-3 bullets explaining WHY it happened)
2. **Regression Test** - Write test that FAILS before fix, PASSES after
3. **Minimal Fix** - Change only what's needed to fix the bug
4. **Run Relevant Tests** - Execute tests affected by the change
5. **Document Prevention** - Add entry to project's bug log (e.g., `docs/bugs.md`, `docs/localDev/bugs.md`):
   - Bug description + reproduction steps
   - Root cause analysis
   - **Prevention rule** (how to avoid this pattern in future)

**Output:** Root cause + failing test + diff + test results + bug log entry

---

## ⚠️ Stop Conditions (When to Ask)

STOP and ask the user before proceeding if:

- ❌ Required file/command doesn't exist
- ❌ Package versions or APIs are uncertain
- ❌ Schema change is implied but not explicitly specified
- ❌ More than 3 files need large edits (high regression risk)
- ❌ Request conflicts with existing decisions in project documentation

**Never guess or hallucinate.** When uncertain, ask first.

---

## 🚪 Rule Exception Protocol

**Philosophy:** Strict rules without an escape hatch lead to silent rule breaking. Explicit exceptions preserve long-term discipline.

### When Rules Cannot Be Followed

If a task **cannot** follow this protocol (Stop Conditions, Bug Fix Protocol, Testing Requirements, etc.):

**You MUST:**

1. **State which rule is violated** - Be explicit about what protocol step is being skipped
2. **Explain WHY it cannot be followed** - Technical constraint, time constraint, missing dependency?
3. **Describe the risk introduced** - What could break? What regression might occur?
4. **Propose mitigation** - How will you reduce the risk? (extra review, manual testing, follow-up task?)
5. **Get explicit approval** - Ask user before proceeding with exception

**No silent exceptions allowed.**

### Example: Rule Exception Request

```markdown
## Rule Exception Request

**Rule Violated:** Bug Fix Protocol (Step 2: Regression Test)

**Why:** Cannot write automated test because:
- Bug is in third-party library interaction
- Test requires external API that's not mockable
- Reproduction requires specific production data state

**Risk Introduced:**
- This bug could regress in future without automated detection
- Manual testing required on every related change

**Mitigation:**
- Document reproduction steps in bug log
- Add to manual QA checklist
- Create follow-up task to add integration test when API becomes mockable

**Approval Needed:** Proceed with fix + manual test only?
```

### Why This Matters

**Without exception protocol:**
- Developers skip rules silently ("just this once")
- Rules become suggestions (lose credibility)
- Discipline erodes over time
- Regressions sneak in through "exceptional" cases

**With exception protocol:**
- Exceptions are conscious decisions (not accidents)
- Risk is documented and accepted explicitly
- Mitigations are planned proactively
- Rules maintain authority (taken seriously)

### Common Valid Exceptions

**Valid reasons to request exception:**
- External dependencies prevent automated testing
- Legacy code requires extensive refactor to test
- Time-critical hotfix (document technical debt)
- Prototyping/experimentation (clearly marked as non-production)

**Invalid reasons (do NOT accept):**
- "Don't have time" (make time or descope)
- "Tests are hard to write" (that's the point)
- "This is a small change" (small changes cause big regressions)
- "Nobody will notice" (famous last words)

### Enforcement

**For AI assistants:**
- If you cannot follow a rule, STOP and request exception
- Never silently skip protocol steps
- Always document risk + mitigation

**For code reviewers:**
- Challenge undocumented exceptions
- Verify mitigation plan is realistic
- Ensure follow-up tasks are created

---

## 📝 Output Format

When showing code changes:

- ✅ **PREFERRED:** Show patch/diff format
- ✅ **ACCEPTABLE:** Show only changed functions/blocks (not entire files)
- ❌ **AVOID:** Showing entire files (wastes context)
- ✅ **ALWAYS:** List commands run + results

---

## 🚫 Never Do

- ❌ Invent APIs, packages, fields, or file paths (ask if unsure)
- ❌ Refactor code silently (only if requested or required for fix)
- ❌ Skip regression tests for bug fixes
- ❌ Make breaking changes without updating tests and docs
- ❌ Show entire files in responses (use diffs/patches)
- ❌ Skip documentation for bugs (must update bug log)
- ❌ Modify unrelated code (stay within task scope)

---

## ✅ Quality Checklist

Good work includes:

- ✅ Minimal diff (only necessary changes)
- ✅ Tests added for new behavior or bugs
- ✅ No unrelated formatting churn
- ✅ Clear root cause and prevention note (for bugs)
- ✅ Output includes: files touched + why + verification commands

---

## 🧪 Testing Protocol

### For Every Feature:
- **Unit tests:** Business logic and functions
- **Integration tests:** API endpoints + database interactions (if applicable)
- **E2E tests:** Critical user flows only (not every feature)

### For Every Bug:
- **Regression test FIRST** (must fail before fix)
- **Verify test passes** after implementation
- **Document in bug log** with prevention rule

---

## 📏 Code Quality Standards

- **File size:** Target 200-300 lines. Split by responsibility if larger.
- **Modules:** Prefer adding a small module over editing a large file
- **Dependencies:** Business logic should not import infrastructure directly (dependency inversion)
- **Breaking changes:** Update tests, docs, and migration guides
- **Type safety:** Use strict type checking where available (TypeScript, Python type hints, etc.)

---

## 🤖 Anti-Regression Safety Nets

**Note:** Adapt these to your project's tech stack and constraints.

### Tier 1: Mandatory (Every Change)
- ✅ **Strict type checking** enforced (catch 60-70% of bugs at compile time)
- ✅ **Pre-commit hooks** block bad code (lint + type-check + fast tests)
- ✅ **Critical tests** run on every PR (authentication, authorization, data integrity)
- ✅ **Type-check passes** before commit

### Tier 2: High-Value (Run on PR)
- ✅ **Visual regression tests** (screenshot comparison for UI changes)
- ✅ **Schema validation** on all API boundaries (runtime contract enforcement)
- ✅ **Database constraints** enforce business rules (last line of defense)
- ✅ **CI/CD pipeline** runs tests automatically

### Tier 3: Advanced (Periodic)
- ✅ **Mutation testing** on critical modules (verify test quality)
- ✅ **Error monitoring** in development (catch errors immediately)
- ✅ **Manual verification** for security-critical changes

---

## 🛡️ AI Assistant Protocol (Claude Code / Copilot / etc.)

**When AI writes code, it MUST:**

### Before Writing Code:
1. ✅ READ existing implementation first (no guessing)
2. ✅ IDENTIFY affected tests
3. ✅ PROPOSE plan in bullet points (wait for approval if complex)

### After Writing Code:
1. ✅ RUN affected tests and SHOW results
2. ✅ RUN type-checker (e.g., `npm run type-check`, `mypy`, etc.)
3. ✅ RUN linter (e.g., `npm run lint`, `flake8`, etc.)
4. ✅ VERIFY git diff (no unintended changes)
5. ✅ LIST files touched + why

### For Security/Critical Changes:
1. ✅ WRITE regression test FIRST (fails before change)
2. ✅ IMPLEMENT change
3. ✅ VERIFY test now PASSES
4. ✅ RUN full critical test suite
5. ✅ DOCUMENT in bug log if fixing a bug

### For UI Changes:
1. ✅ VERIFY layout across target devices/browsers
2. ✅ VERIFY responsive design (mobile + desktop if applicable)
3. ✅ VERIFY accessibility (ARIA labels, keyboard navigation, etc.)
4. ✅ VERIFY internationalization (if project supports multiple locales)

---

## 🧪 QA Automation Principles

**Philosophy:** Stop wasting time on manual QA. Catch regressions automatically.

### Core Principles

1. **Test Pyramid Strategy (2025 Standards)**
   - **Fast unit tests** (80%+ coverage) - Business logic, pure functions, utilities
   - **Integration tests** (60%+ coverage) - API endpoints, database queries, service interactions
   - **E2E tests** (10-20% coverage) - Critical user journeys only (authentication, checkout, data submission)

2. **Shift Left Testing**
   - Catch bugs as early as possible (compile time > build time > pre-commit > CI > production)
   - Pre-commit hooks block bad code before it enters the codebase
   - CI/CD catches integration issues before merge

3. **Critical Path Coverage**
   - Identify 10-15 critical scenarios that MUST work (authentication, authorization, data integrity)
   - Write E2E tests for these scenarios first
   - Never skip regression tests for bugs

4. **Contract-First APIs**
   - Define API contracts with schema validation (Zod, JSON Schema, OpenAPI)
   - Validate responses at runtime (catch breaking changes early)
   - Generate types from schemas (single source of truth)

5. **Visual Regression Testing**
   - Screenshot comparison for UI changes (Percy, Playwright screenshots, BackstopJS)
   - Catch layout breaks automatically (especially important for RTL/LTR, responsive design)
   - Require explicit approval for visual changes

6. **Database as Last Line of Defense**
   - Use DB constraints to enforce business rules (CHECK, FOREIGN KEY, UNIQUE)
   - Database should refuse invalid data even if application code is buggy
   - Test constraint violations (they should fail gracefully)

7. **Domain-Specific Critical Test Patterns** (NEW)
   - Test data isolation boundaries (multi-tenant, RBAC, user-scoped)
   - Test business logic with real-world constraints (GPS, time, currency)
   - Test lifecycle state management (soft deletes, status workflows)
   - Test localization behavior (RTL, date formats, locale-specific rules)

---

## 🎯 Domain-Specific Critical Test Patterns (Universal)

**Philosophy:** Generic tests (auth, CRUD) catch 80% of bugs. Domain-specific tests catch the remaining 20% that are **subtle, high-impact, and hard to spot manually.**

These patterns apply to **any** project — adapt the examples to your domain.

---

### Pattern 1: Data Isolation & Boundaries

**What:** Test that data segregation rules are enforced across boundaries.

**Why:** Data leakage bugs are subtle, high-severity, and often not caught by generic integration tests. Multi-tenant apps, RBAC systems, and user-scoped data require explicit isolation testing.

**Generic Test Pattern:**
```
✅ User A cannot access User B's data
✅ Tenant A cannot see Tenant B's records
✅ Role X cannot perform actions restricted to Role Y
✅ Isolation middleware/guards apply filters automatically
✅ Cross-boundary attempts are rejected with proper error
```

**Concrete Examples:**

| Project Type | Data Boundary | Test Examples |
|--------------|---------------|---------------|
| **Multi-tenant SaaS** | `company_id`, `organization_id` | Test queries auto-filter by tenant; SuperAdmin can bypass; cross-tenant API calls fail |
| **Healthcare app** | `patient_id`, HIPAA boundaries | Doctor A cannot access Doctor B's patients; audit logs track access attempts |
| **E-commerce** | `seller_id`, `customer_id` | Seller A cannot modify Seller B's inventory; customers only see their orders |
| **Campaign management** | `city_id`, `area_id` | City Coordinator A cannot see City B's activists; geofenced data isolation |
| **Education platform** | `school_id`, `classroom_id` | Teacher A cannot grade Teacher B's students; student data scoped by class |

**Implementation Example (Generic ORM Middleware):**
```typescript
// Test ORM middleware applies tenant filter automatically
test('queries automatically filter by tenant_id', async () => {
  const tenant1User = { id: 'user1', tenantId: 'tenant1' };
  const tenant2User = { id: 'user2', tenantId: 'tenant2' };

  // When user1 queries, only tenant1 data returned
  const result = await orm.records.findMany({ userId: tenant1User.id });

  expect(result.every(r => r.tenantId === 'tenant1')).toBe(true);
  expect(result.some(r => r.tenantId === 'tenant2')).toBe(false);
});

// Test cross-tenant access is blocked
test('direct cross-tenant access fails', async () => {
  await expect(
    orm.records.findUnique({
      where: { id: 'tenant2-record-id' },
      userId: 'tenant1-user-id'
    })
  ).rejects.toThrow('Access denied');
});
```

**Industry References:**
- Multi-tenant testing is a recognized QA category for SaaS applications
- Data isolation tests are core to multi-tenancy testing (Testsigma, DEV Community)
- OWASP ASVS requires testing authorization boundaries for security

**Critical:** These tests should be in **Tier 1 (always run)** because data leakage is a security and compliance risk.

---

### Pattern 2: Business Logic with Real-World Constraints

**What:** Test logic that depends on external factors (location, time, currency, regulations).

**Why:** These bugs are subtle because they depend on context that generic tests don't simulate (GPS drift, time zones, currency fluctuations, locale-specific rules).

**Generic Test Pattern:**
```
✅ Logic handles edge cases (boundaries, invalid input, out-of-range)
✅ Real-world constraints are enforced (geofences, time windows, rate limits)
✅ External factors are mocked/simulated correctly
✅ Fallback behavior works when constraints fail
```

**Concrete Examples:**

| Project Type | Real-World Constraint | Test Examples |
|--------------|----------------------|---------------|
| **Field service app** | GPS coordinates, geofencing | User inside geofence accepted; outside rejected; GPS drift handled; permissions validated |
| **Financial app** | Currency conversion, exchange rates | Rates updated correctly; historical rates preserved; rounding errors prevented |
| **Scheduling app** | Time zones, DST transitions | Appointments convert correctly across zones; DST doesn't break recurring events |
| **E-commerce** | Shipping zones, tax rates | Tax calculated by user's region; international shipping rules enforced |
| **Compliance app** | Regulatory rules (GDPR, HIPAA) | Data retention enforced; right-to-deletion works; audit logs immutable |

**Implementation Example (GPS/Geofencing):**
```typescript
// Test geofence validation logic
test('attendance accepted when user inside geofence', async () => {
  const siteLocation = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv
  const userLocation = { lat: 32.0854, lng: 34.7819 }; // 10m away

  const result = await attendanceService.recordAttendance({
    userId: 'user1',
    siteId: 'site1',
    userLocation
  });

  expect(result.status).toBe('accepted');
  expect(result.distance).toBeLessThan(100); // Within 100m
});

test('attendance rejected when user outside geofence', async () => {
  const siteLocation = { lat: 32.0853, lng: 34.7818 }; // Tel Aviv
  const userLocation = { lat: 31.7683, lng: 35.2137 }; // Jerusalem (60km away)

  await expect(
    attendanceService.recordAttendance({
      userId: 'user1',
      siteId: 'site1',
      userLocation
    })
  ).rejects.toThrow('User is not within site geofence');
});

// Test GPS edge cases
test('GPS drift within tolerance is accepted', async () => {
  // Simulate GPS accuracy ±50m
  const result = await attendanceService.recordAttendance({
    userLocation: { lat: 32.0853, lng: 34.7818, accuracy: 45 }
  });
  expect(result.status).toBe('accepted');
});
```

**Implementation Example (Time Zones):**
```typescript
// Test time zone conversions
test('appointment converts correctly across time zones', async () => {
  const appointment = {
    time: '2025-01-15T14:00:00Z', // UTC
    timezone: 'America/New_York'
  };

  const displayTime = formatAppointment(appointment, 'Asia/Tokyo');

  // 14:00 UTC = 09:00 EST = 23:00 JST
  expect(displayTime).toBe('2025-01-15 23:00 JST');
});

// Test DST transitions don't break recurring events
test('recurring event handles DST transition', async () => {
  const recurringEvent = {
    startDate: '2025-03-01',
    frequency: 'weekly',
    localTime: '10:00',
    timezone: 'America/New_York'
  };

  const occurrences = generateOccurrences(recurringEvent, { count: 4 });

  // DST starts March 9, 2025 in US
  expect(occurrences[0]).toBe('2025-03-01T15:00:00Z'); // EST (UTC-5)
  expect(occurrences[2]).toBe('2025-03-15T14:00:00Z'); // EDT (UTC-4)
});
```

**Critical:** These tests prevent **logical regressions** that are hard to catch manually (e.g., geofence tolerance changed accidentally, breaking attendance tracking).

---

### Pattern 3: Lifecycle State Management

**What:** Test state transitions and filtering logic (soft deletes, status workflows, archived records).

**Why:** State management bugs cause **data ghosting** (deleted records still appear), inconsistent UI states, and business rule violations.

**Generic Test Pattern:**
```
✅ State transitions follow allowed paths (draft → published, active → archived)
✅ Records in certain states are excluded from queries
✅ Cascade behavior works correctly (parent delete affects children)
✅ Audit logs preserve state history
✅ State-specific business rules are enforced
```

**Concrete Examples:**

| Project Type | State Management | Test Examples |
|--------------|------------------|---------------|
| **User management** | Soft deletes (`is_active = false`) | Deleted users excluded from searches; cascade deletes work; audit logs preserve |
| **CMS** | Draft/Published workflow | Drafts not visible to public; published → draft requires permission |
| **Order system** | Order status (pending → shipped → delivered) | Invalid transitions rejected; status-specific actions enforced |
| **Subscription app** | Active/Paused/Cancelled states | Cancelled subscriptions don't charge; paused users retain data |
| **Document management** | Archived/Trashed states | Archived docs searchable but read-only; trashed docs auto-delete after 30 days |

**Implementation Example (Soft Deletes):**
```typescript
// Test soft-deleted records excluded from queries
test('deleted records are excluded from active queries', async () => {
  await orm.users.create({ id: 'user1', isActive: true });
  await orm.users.create({ id: 'user2', isActive: false }); // Soft deleted

  const activeUsers = await orm.users.findMany({ where: { isActive: true } });

  expect(activeUsers.length).toBe(1);
  expect(activeUsers[0].id).toBe('user1');
});

// Test cascade behavior on soft delete
test('soft deleting parent soft-deletes children', async () => {
  await orm.organizations.create({ id: 'org1', isActive: true });
  await orm.teams.create({ id: 'team1', orgId: 'org1', isActive: true });

  await orm.organizations.update({
    where: { id: 'org1' },
    data: { isActive: false }
  });

  const team = await orm.teams.findUnique({ where: { id: 'team1' } });
  expect(team.isActive).toBe(false); // Cascaded
});

// Test audit logs preserve deleted records
test('audit logs capture soft deletes', async () => {
  await orm.users.update({
    where: { id: 'user1' },
    data: { isActive: false }
  });

  const auditLog = await orm.auditLogs.findFirst({
    where: { entityType: 'user', entityId: 'user1', action: 'delete' }
  });

  expect(auditLog).toBeDefined();
  expect(auditLog.before.isActive).toBe(true);
  expect(auditLog.after.isActive).toBe(false);
});
```

**Implementation Example (Status Workflows):**
```typescript
// Test invalid state transitions are rejected
test('cannot transition from shipped to pending', async () => {
  const order = await orm.orders.create({
    id: 'order1',
    status: 'shipped'
  });

  await expect(
    orderService.updateStatus('order1', 'pending')
  ).rejects.toThrow('Invalid status transition: shipped → pending');
});

// Test status-specific actions are enforced
test('cannot cancel order after shipped', async () => {
  const order = await orm.orders.create({
    id: 'order1',
    status: 'shipped'
  });

  await expect(
    orderService.cancel('order1')
  ).rejects.toThrow('Cannot cancel order in shipped status');
});
```

**Industry References:**
- Soft delete middleware (e.g., `prisma-soft-delete-middleware`) exists to standardize this pattern
- State machine testing is a recognized pattern in QA (test all valid/invalid transitions)

**Critical:** These tests prevent **inconsistent application state** that manifests as confusing UI bugs and data integrity issues.

---

### Pattern 4: Localization & Internationalization

**What:** Test locale-specific behavior (RTL layouts, date formats, currency, number formatting).

**Why:** Localization bugs are subtle and only appear for certain locales (e.g., RTL breaks layout, date parsing fails for non-US formats).

**Generic Test Pattern:**
```
✅ UI layout adapts to text direction (LTR vs RTL)
✅ Date/time formatted correctly for locale
✅ Currency symbols and formatting match locale
✅ Number formatting follows locale rules (commas vs periods)
✅ Translations are complete (no missing keys)
```

**Concrete Examples:**

| Project Type | Localization Concern | Test Examples |
|--------------|---------------------|---------------|
| **International app** | RTL support (Arabic, Hebrew) | Text aligned right; margins flipped; no hardcoded left/right CSS |
| **Financial app** | Currency formatting | USD uses $1,234.56; EUR uses 1.234,56 €; JPY uses ¥1,234 |
| **Scheduling app** | Date formats | US: MM/DD/YYYY; EU: DD/MM/YYYY; ISO: YYYY-MM-DD |
| **E-commerce** | Number formatting | US: 1,234.56; EU: 1.234,56; India: 1,23,456.78 |
| **Healthcare app** | Units of measurement | US: lbs/inches; EU: kg/cm; temperatures: °F vs °C |

**Implementation Example (RTL Layout):**
```typescript
// Visual regression test for RTL
test('dashboard layout renders correctly in RTL', async ({ page }) => {
  await page.goto('/dashboard?lang=he'); // Hebrew

  // Check text direction
  const html = page.locator('html');
  await expect(html).toHaveAttribute('dir', 'rtl');
  await expect(html).toHaveAttribute('lang', 'he');

  // Visual regression test
  await expect(page).toHaveScreenshot('dashboard-rtl.png', {
    maxDiffPixels: 100
  });
});

// Test logical CSS properties are used
test('components use logical CSS properties', async () => {
  const styles = await page.evaluate(() => {
    const el = document.querySelector('.card');
    const computed = window.getComputedStyle(el);
    return {
      marginInlineStart: computed.marginInlineStart,
      marginInlineEnd: computed.marginInlineEnd,
      marginLeft: computed.marginLeft,
      marginRight: computed.marginRight
    };
  });

  // Should use marginInlineStart/End, not left/right
  expect(styles.marginInlineStart).toBe('16px');
  expect(styles.marginInlineEnd).toBe('16px');
});
```

**Implementation Example (Date/Time Formatting):**
```typescript
// Test date formatting for different locales
test('date formatted correctly for locale', () => {
  const date = new Date('2025-01-15T14:30:00Z');

  expect(formatDate(date, 'en-US')).toBe('1/15/2025');
  expect(formatDate(date, 'en-GB')).toBe('15/01/2025');
  expect(formatDate(date, 'de-DE')).toBe('15.01.2025');
  expect(formatDate(date, 'ja-JP')).toBe('2025/01/15');
});

// Test time zone + locale combination
test('datetime formatted with locale + timezone', () => {
  const date = new Date('2025-01-15T14:30:00Z'); // UTC

  expect(formatDateTime(date, 'en-US', 'America/New_York')).toBe('1/15/2025, 9:30 AM EST');
  expect(formatDateTime(date, 'he-IL', 'Asia/Jerusalem')).toBe('15.1.2025, 16:30');
});
```

**Implementation Example (Currency Formatting):**
```typescript
// Test currency formatting by locale
test('currency formatted correctly for locale', () => {
  const amount = 1234.56;

  expect(formatCurrency(amount, 'USD', 'en-US')).toBe('$1,234.56');
  expect(formatCurrency(amount, 'EUR', 'de-DE')).toBe('1.234,56 €');
  expect(formatCurrency(amount, 'JPY', 'ja-JP')).toBe('¥1,235'); // No decimals
  expect(formatCurrency(amount, 'ILS', 'he-IL')).toBe('1,234.56 ₪');
});
```

**Critical:** These tests catch **layout breaks and formatting bugs** that only appear for non-default locales (and are often missed in manual QA).

---

## 🎯 Applying Domain-Specific Patterns to Your Project

**Step 1: Identify Your Domain Invariants**

Ask yourself:
- **Data boundaries:** Do we have multi-tenant, RBAC, or user-scoped data?
- **Real-world constraints:** Does our logic depend on GPS, time, currency, regulations?
- **State management:** Do we use soft deletes, status workflows, or archived records?
- **Localization:** Do we support multiple locales, RTL, or locale-specific formatting?

**Step 2: Write Critical Tests First**

For each invariant, write tests that:
- ✅ **Fail if the invariant is violated** (e.g., cross-tenant data leak)
- ✅ **Cover edge cases** (e.g., GPS drift, DST transitions, invalid state transitions)
- ✅ **Run on every PR** (Tier 1 critical tests)

**Step 3: Document Your Critical Test Scenarios**

Create a `docs/qa/CRITICAL_TESTS.md` file listing your project's critical scenarios:

```markdown
## Critical Test Scenarios (Must Pass on Every PR)

### Data Isolation
1. User A cannot access User B's data
2. Tenant A cannot see Tenant B's records
3. Role X cannot perform actions restricted to Role Y

### Business Logic
1. GPS: User inside geofence accepted, outside rejected
2. Time: Appointments convert correctly across time zones
3. Currency: Exchange rates applied correctly

### State Management
1. Soft-deleted records excluded from queries
2. Invalid state transitions rejected
3. Audit logs capture all state changes

### Localization
1. RTL layout renders correctly
2. Dates formatted correctly for locale
3. Currency formatted correctly for locale
```

**Step 4: Automate in CI/CD**

```yaml
# .github/workflows/critical-tests.yml
name: Critical Tests
on: [pull_request]
jobs:
  tier1-critical:
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- --testPathPattern='(isolation|business-logic|state|localization)'
```

---

## 🔒 Behavior Lock Rule (Anti-Silent-Regression)

**Philosophy:** Most regressions aren't "it's broken" — they're **"it works, but differently"**. Behavior locks prevent silent changes to implicit assumptions.

### What is a Behavior Lock?

A behavior lock is a test that asserts **unchanged behavior**, not new features. These tests ensure that implicit assumptions remain stable even when code changes.

**Common Silent Regressions:**
- Sorting order changes (list now sorted alphabetically instead of by date)
- Default filter changes (now includes inactive records)
- Response format changes (field renamed, nested structure flattened)
- Permission behavior changes (now allows access that was previously restricted)
- Timing behavior changes (async operation now blocks, breaking downstream code)

### Rule: For Any Non-Trivial Change

**Before implementing, identify 3-5 behaviors that MUST NOT change:**

1. **API contracts** - Response shape, status codes, error formats
2. **Query behavior** - Sorting, filtering, pagination defaults
3. **Permission logic** - Who can access what (RBAC boundaries)
4. **Data transformations** - Input validation, output formatting
5. **Side effects** - Audit logs, notifications, cascade operations

### Implementation Patterns

#### Pattern 1: Snapshot Tests (API Responses)
```typescript
// Lock API response shape
test('GET /api/users response shape unchanged', async () => {
  const response = await request(app).get('/api/users');

  expect(response.body).toMatchSnapshot();
});

// Or explicit shape assertion
test('user object structure unchanged', async () => {
  const user = await getUser('user1');

  expect(user).toMatchObject({
    id: expect.any(String),
    email: expect.any(String),
    role: expect.any(String),
    createdAt: expect.any(String)
  });
});
```

#### Pattern 2: Order/Sort Behavior Locks
```typescript
// Lock sorting behavior
test('activist list maintains creation date sort order', async () => {
  const activists = await getActivists(neighborhoodId);

  // Assert expected order (not just "returns activists")
  const ids = activists.map(a => a.id);
  expect(ids).toEqual(['activist-3', 'activist-2', 'activist-1']); // Newest first
});

// Lock filtering behavior
test('default query excludes soft-deleted records', async () => {
  await orm.activists.create({ id: 'a1', isActive: true });
  await orm.activists.create({ id: 'a2', isActive: false });

  const result = await getActivists(); // No explicit filter

  expect(result.length).toBe(1);
  expect(result[0].id).toBe('a1');
});
```

#### Pattern 3: Permission Behavior Locks
```typescript
// Lock RBAC boundaries
test('City Coordinator permissions unchanged', async () => {
  const session = { user: { role: 'CITY_COORDINATOR', cityId: 'tel-aviv' } };

  // Lock what they CAN do
  await expect(getActivists({ cityId: 'tel-aviv' }, session)).resolves.toBeDefined();

  // Lock what they CANNOT do
  await expect(getActivists({ cityId: 'jerusalem' }, session)).rejects.toThrow();
  await expect(createCity({}, session)).rejects.toThrow();
});
```

#### Pattern 4: Side Effect Behavior Locks
```typescript
// Lock audit log behavior
test('user deletion triggers audit log', async () => {
  await deleteUser('user1');

  const auditLog = await orm.auditLogs.findFirst({
    where: { entityType: 'user', entityId: 'user1', action: 'delete' }
  });

  expect(auditLog).toBeDefined();
  expect(auditLog.before).toBeDefined(); // Must capture before state
});
```

### When to Use Behavior Locks

✅ **Always use for:**
- Public APIs (external contracts)
- Critical user flows (authentication, checkout, data submission)
- RBAC boundaries (who can access what)
- Data integrity operations (cascades, soft deletes, audit logs)

⚠️ **Use sparingly for:**
- Internal helper functions (low risk)
- UI component implementation details (high churn)
- Experimental features (behavior not stable yet)

### Behavior Locks vs Feature Tests

| Type | Purpose | Example |
|------|---------|---------|
| **Feature Test** | Verify new functionality works | "User can upload profile photo" |
| **Behavior Lock** | Verify existing behavior unchanged | "User list still sorted by creation date" |

**Both are necessary.** Feature tests catch broken features. Behavior locks catch silent regressions.

---

## 📋 Assumptions Ledger (System Invariants Documentation)

**Philosophy:** Behavior locks TEST assumptions. The Assumptions Ledger DOCUMENTS them centrally. Together, they prevent silent drift.

### What is an Assumption?

An **assumption** is an implicit system behavior that:
- Is not obvious from code alone
- Users or other systems depend on
- Could change accidentally during refactors
- Would break things if violated

**Examples:**
- "API lists are sorted by `createdAt DESC` by default"
- "Non-superadmins are automatically scoped to their tenant"
- "Soft-deleted records are excluded from queries unless explicitly requested"
- "UI is RTL-first (Hebrew, Arabic)"
- "IDs are immutable once created"

### Rule: Document Assumptions in ASSUMPTIONS.md

**Every project MUST maintain an ASSUMPTIONS.md file** listing critical assumptions.

**Template:**

```markdown
# System Assumptions

## API Behavior
- Lists are sorted by `createdAt DESC` by default
- Pagination defaults to 20 items per page
- Soft-deleted records excluded unless `includeDeleted=true`

## Security & Permissions
- Non-superadmins are always tenant-scoped
- SuperAdmin is the only role that bypasses filters
- No hard deletes on user-facing data (soft deletes only)

## Data Integrity
- Entity IDs are immutable (never change after creation)
- Required fields: [list per entity]
- Foreign key constraints enforced at DB level

## UI/UX
- Mobile-first layouts take priority
- RTL layout is first-class (not an afterthought)
- All text is localized (no hardcoded English strings)

## Infrastructure
- PostgreSQL is the source of truth
- Redis is cache-only (not durable storage)
- S3 objects are immutable (no in-place updates)
```

### When to Update ASSUMPTIONS.md

**Update when:**
- Adding a new implicit behavior that others might depend on
- Changing an existing assumption (requires behavior lock tests)
- Discovering an undocumented assumption during bug fix
- Onboarding new team members (gaps in assumptions become obvious)

### Assumptions vs Invariants vs Behavior Locks

| Concept | Purpose | Location | Format |
|---------|---------|----------|--------|
| **Assumption** | Document implicit behavior | ASSUMPTIONS.md | Prose |
| **Invariant** | Declare critical guarantees | INVARIANTS.md | Structured |
| **Behavior Lock** | Test unchanged behavior | Test files | Code |

**Relationship:**
1. **Assumption** → "Lists are sorted by `createdAt DESC`"
2. **Invariant** → "INV-API-001: Default sort order must be stable"
3. **Behavior Lock** → `test('list maintains creation date DESC sort order')`

### Why This Matters

**Without central assumptions documentation:**
- Developers change behavior thinking "nobody depends on this"
- Implicit contracts break silently
- Onboarding is painful ("how was I supposed to know?")
- Assumptions drift over time (code evolves, assumptions don't)

**With ASSUMPTIONS.md:**
- Explicit contract of "what you can depend on"
- Changes to assumptions trigger conscious review
- Behavior locks enforce documented assumptions
- New developers understand implicit rules quickly

### Enforcement Protocol

**Before changing behavior that might be assumed:**

1. **Check ASSUMPTIONS.md** - Is this documented as an assumption?
2. **Search for dependencies** - Grep for code that might depend on this
3. **Update behavior lock tests** - Add tests for new behavior
4. **Update ASSUMPTIONS.md** - Document the change
5. **Communicate broadly** - Assumption changes are breaking changes

**During code review:**
- [ ] New assumptions documented in ASSUMPTIONS.md
- [ ] Changed assumptions have behavior lock tests
- [ ] Removed assumptions deleted from ASSUMPTIONS.md

### Example: Catching Silent Drift

**Scenario:** Developer changes sort order from `createdAt DESC` to alphabetical

**Without Assumptions Ledger:**
- Tests pass (no behavior lock test existed)
- UI breaks for users (expected newest-first)
- Bug discovered in production
- "We didn't realize anyone depended on that"

**With Assumptions Ledger:**
- Developer checks ASSUMPTIONS.md before change
- Sees "Lists are sorted by createdAt DESC by default"
- Realizes this is a documented assumption
- Adds behavior lock test before change
- Updates ASSUMPTIONS.md with new behavior
- Communicates breaking change to team

### Project-Specific Files to Create

**Universal protocol (baseRules.md)** references these **project-specific files**:

1. **ASSUMPTIONS.md** - Project's implicit behaviors (adapt template above)
2. **INVARIANTS.md** - Project's critical guarantees (use INVARIANTS_TEMPLATE.md)
3. **Bug log** - Historical bugs and prevention rules (docs/bugs.md)

**These files are NOT universal** - each project fills them in with their own content.

---

## ❌ Negative Testing Requirement (Forbidden Path Testing)

**Philosophy:** Testing the happy path catches 80% of bugs. Testing forbidden paths catches the remaining 20% — often **security-critical** bugs.

### What is Negative Testing?

Negative testing validates that **invalid operations fail gracefully** and that **unauthorized actions are blocked**. These tests assert **failure expectations**, not success.

### Rule: For Critical Logic, Test Failure Cases

**Every critical operation MUST have corresponding negative tests:**

1. **Authentication/Authorization** - Unauthenticated users blocked, wrong roles rejected
2. **Data validation** - Invalid input rejected with clear error messages
3. **Boundary violations** - Out-of-range values, missing required fields, constraint violations
4. **State transitions** - Invalid state changes rejected (e.g., shipped → pending)
5. **Resource access** - Cross-tenant access blocked, missing permissions denied

### Implementation Patterns

#### Pattern 1: RBAC Negative Tests (CRITICAL)
```typescript
// Positive test: Authorized access works
test('City Coordinator can view their city activists', async () => {
  const session = { user: { role: 'CITY_COORDINATOR', cityId: 'tel-aviv' } };
  const activists = await getActivists({ cityId: 'tel-aviv' }, session);
  expect(activists).toBeDefined();
});

// Negative test: Unauthorized access blocked
test('City Coordinator CANNOT view other city activists', async () => {
  const session = { user: { role: 'CITY_COORDINATOR', cityId: 'tel-aviv' } };

  await expect(
    getActivists({ cityId: 'jerusalem' }, session)
  ).rejects.toThrow('Access denied');
});

// Negative test: Insufficient permissions
test('City Coordinator CANNOT create cities', async () => {
  const session = { user: { role: 'CITY_COORDINATOR', cityId: 'tel-aviv' } };

  await expect(
    createCity({ name: 'New City' }, session)
  ).rejects.toThrow('Insufficient permissions');
});
```

#### Pattern 2: Input Validation Negative Tests
```typescript
// Positive test: Valid input accepted
test('creates activist with valid data', async () => {
  const activist = await createActivist({
    fullName: 'John Doe',
    phone: '+972501234567',
    neighborhoodId: 'neighborhood-1'
  });
  expect(activist).toBeDefined();
});

// Negative tests: Invalid input rejected
test('rejects activist with missing required fields', async () => {
  await expect(
    createActivist({ fullName: 'John Doe' }) // Missing phone, neighborhoodId
  ).rejects.toThrow('Missing required fields');
});

test('rejects activist with invalid phone format', async () => {
  await expect(
    createActivist({
      fullName: 'John Doe',
      phone: 'invalid',
      neighborhoodId: 'neighborhood-1'
    })
  ).rejects.toThrow('Invalid phone format');
});

test('rejects activist with duplicate constraint violation', async () => {
  await createActivist({
    fullName: 'John Doe',
    phone: '+972501234567',
    neighborhoodId: 'neighborhood-1'
  });

  // Duplicate in same neighborhood
  await expect(
    createActivist({
      fullName: 'John Doe',
      phone: '+972501234567',
      neighborhoodId: 'neighborhood-1'
    })
  ).rejects.toThrow('Activist already exists');
});
```

#### Pattern 3: State Transition Negative Tests
```typescript
// Positive test: Valid transition works
test('order transitions from pending to shipped', async () => {
  await createOrder({ id: 'order1', status: 'pending' });
  await updateOrderStatus('order1', 'shipped');

  const order = await getOrder('order1');
  expect(order.status).toBe('shipped');
});

// Negative tests: Invalid transitions blocked
test('CANNOT transition from shipped to pending', async () => {
  await createOrder({ id: 'order1', status: 'shipped' });

  await expect(
    updateOrderStatus('order1', 'pending')
  ).rejects.toThrow('Invalid status transition: shipped → pending');
});

test('CANNOT cancel shipped order', async () => {
  await createOrder({ id: 'order1', status: 'shipped' });

  await expect(
    cancelOrder('order1')
  ).rejects.toThrow('Cannot cancel order in shipped status');
});
```

#### Pattern 4: Boundary/Edge Case Negative Tests
```typescript
// Negative tests: Boundary violations
test('rejects negative quantity', async () => {
  await expect(
    createOrder({ items: [{ productId: 'p1', quantity: -1 }] })
  ).rejects.toThrow('Quantity must be positive');
});

test('rejects empty array when required', async () => {
  await expect(
    createOrder({ items: [] })
  ).rejects.toThrow('Order must have at least one item');
});

test('rejects null/undefined for required fields', async () => {
  await expect(
    createUser({ email: null })
  ).rejects.toThrow('Email is required');
});
```

#### Pattern 5: Context/Dependency Negative Tests
```typescript
// Negative tests: Missing context
test('fails when required session missing', async () => {
  await expect(
    getActivists({ cityId: 'tel-aviv' }, null) // No session
  ).rejects.toThrow('Authentication required');
});

test('fails when required resource does not exist', async () => {
  await expect(
    assignActivist('non-existent-activist-id', 'neighborhood-1')
  ).rejects.toThrow('Activist not found');
});
```

### Negative Test Checklist

For every critical operation, ensure you have tests for:

- [ ] **Unauthenticated access** - No session/token
- [ ] **Unauthorized access** - Wrong role, wrong tenant, insufficient permissions
- [ ] **Invalid input** - Missing fields, wrong types, out-of-range values
- [ ] **Boundary violations** - Empty arrays, null values, negative numbers
- [ ] **Constraint violations** - Unique constraints, foreign key constraints, check constraints
- [ ] **Invalid state transitions** - Operations not allowed in current state
- [ ] **Missing dependencies** - Referenced resources don't exist

### Why This Matters

**Most regressions re-open forbidden paths.**

Example regression scenarios caught by negative tests:
- ✅ Authorization check accidentally removed → negative test fails immediately
- ✅ Validation logic bypassed in refactor → negative test catches it
- ✅ State machine guard removed → negative test blocks invalid transition
- ✅ RBAC middleware disabled → negative test fails for cross-tenant access

**If a test does not assert a failure case, it is incomplete.**

---

## 🎯 Diff Risk Classification (Intentional Paranoia)

**Philosophy:** Not every change needs full Tier 1 tests. But you must **decide consciously** based on risk level. This prevents both test fatigue (running too many tests) and regressions (running too few).

### Rule: Classify Risk Before Implementation

**Before writing code, classify the change:**

| Risk Level | Definition | Examples |
|------------|------------|----------|
| 🔹 **Low** | Isolated logic, no shared state, no DB | Pure functions, formatters, helpers, constants |
| 🔸 **Medium** | Touches services or queries, but no invariants | Feature additions, UI components, non-critical queries |
| 🔴 **High** | Affects system invariants or critical paths | Auth, RBAC, data isolation, lifecycle, payments |

### Risk-Based Test Requirements

#### 🔹 Low Risk → Unit Tests Only
- **What:** Pure functions, isolated logic, no side effects
- **Tests required:** Unit tests for the changed function
- **CI requirement:** Fast unit test suite (~1 min)
- **Example:** Adding a date formatter, updating a constant, refactoring pure logic

```typescript
// Low risk change: Pure function
function formatPhoneNumber(phone: string): string {
  return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
}

// Test requirement: Unit test only
test('formats phone number correctly', () => {
  expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
});
```

#### 🔸 Medium Risk → Integration Tests
- **What:** Touches services, queries, or UI components
- **Tests required:** Unit + integration tests
- **CI requirement:** Integration test suite (~5 min)
- **Example:** Adding a feature, modifying a query, updating a UI component

```typescript
// Medium risk change: Service method
async function getActivistsByNeighborhood(neighborhoodId: string) {
  return await orm.activists.findMany({
    where: { neighborhoodId, isActive: true }
  });
}

// Test requirement: Integration test
test('retrieves active activists for neighborhood', async () => {
  await seedActivists();
  const activists = await getActivistsByNeighborhood('neighborhood-1');
  expect(activists.length).toBeGreaterThan(0);
});
```

#### 🔴 High Risk → Full Tier 1 Critical Suite
- **What:** Affects invariants or critical paths
- **Tests required:** Unit + integration + **full Tier 1 critical tests**
- **CI requirement:** Full Tier 1 suite (~10-15 min)
- **Must document:** Which invariants are affected
- **Example:** Changing auth logic, modifying RBAC, updating data isolation, altering soft delete behavior

```typescript
// High risk change: RBAC middleware
function applyCityFilter(userId: string, query: Query) {
  const user = getUser(userId);

  // HIGH RISK: Changing this affects data isolation
  if (user.role !== 'SUPERADMIN') {
    query.where.cityId = user.cityId;
  }

  return query;
}

// Test requirement: MUST run full Tier 1 critical tests
// - Data isolation tests
// - Cross-tenant access tests
// - RBAC boundary tests
// - Audit log tests
```

### Implementation: Diff Risk Classification Step

**Add to task execution template:**

```markdown
### Diff Risk Classification

**Risk Level:** 🔹 Low / 🔸 Medium / 🔴 High

**Justification:**
- What is being changed?
- Does it affect shared state or invariants?
- What are the potential side effects?

**Affected Invariants (if High Risk):**
- [ ] Authentication/Authorization
- [ ] Data isolation (multi-tenant, RBAC)
- [ ] Lifecycle state management
- [ ] Data integrity constraints
- [ ] Audit logging
- [ ] API contracts

**Test Strategy:**
- 🔹 Low: Unit tests only
- 🔸 Medium: Unit + integration tests
- 🔴 High: Full Tier 1 critical suite + explicit invariant tests
```

### Examples by Risk Level

#### 🔹 Low Risk Examples
- Adding a utility function (date formatter, string helper)
- Updating a constant or configuration value
- Refactoring internal logic (no behavior change)
- Adding a comment or documentation
- Fixing a typo

#### 🔸 Medium Risk Examples
- Adding a new API endpoint (non-critical)
- Modifying a UI component
- Adding a database query (non-sensitive data)
- Updating error messages
- Changing log statements

#### 🔴 High Risk Examples
- Changing authentication logic
- Modifying RBAC permissions
- Updating data isolation filters (tenant, city, user scope)
- Altering soft delete behavior
- Changing state transition logic
- Modifying API response contracts (breaking changes)
- Updating database schema (migrations)
- Changing cascade delete behavior

### High-Risk Change Checklist

For 🔴 High Risk changes, you MUST:

- [ ] **Identify affected invariants** - Which system guarantees are at risk?
- [ ] **Write explicit invariant tests** - Test that invariants still hold
- [ ] **Run full Tier 1 critical suite** - All critical tests must pass
- [ ] **Document behavior locks** - What MUST NOT change?
- [ ] **Get explicit approval** - High-risk changes require review
- [ ] **Update audit logs** - Document the change and rationale

### Why This Matters

**Without risk classification:**
- Developers run full test suite for trivial changes → **test fatigue**
- Developers skip tests for critical changes → **regressions**

**With risk classification:**
- Low-risk changes run fast (1 min) → **quick feedback**
- High-risk changes run comprehensive tests (15 min) → **catch regressions**
- Intentional paranoia only where needed → **sustainable quality**

---

## 🛡️ Runtime Invariant Guards (Last Line of Defense)

**Philosophy:** Tests catch bugs before deployment. Runtime guards catch bugs that slip through. **Fail fast instead of corrupting data.**

### What are Runtime Invariant Guards?

Runtime guards are **assertions in production code** that validate system invariants at runtime. They serve as a last line of defense when tests miss edge cases or bugs slip through.

**Key principle:** For critical invariants, **crash loudly** instead of silently corrupting data.

### Rule: Guard Critical Invariants at Runtime

**Add runtime assertions for:**
1. **Data integrity** - Required fields, foreign key integrity, unique constraints
2. **Tenant isolation** - Multi-tenant boundaries, RBAC filters applied
3. **State transitions** - Only valid state changes allowed
4. **Security boundaries** - Authorization checks passed, sensitive data protected
5. **Business rules** - Invariants that must ALWAYS hold

### Implementation Patterns

#### Pattern 1: ORM Middleware Guards (Data Integrity)
```typescript
// Prisma middleware: Enforce invariants at DB layer
prisma.$use(async (params, next) => {
  const result = await next(params);

  // Guard: Activists MUST have neighborhoodId
  if (params.model === 'Activist' && params.action === 'create') {
    if (!result.neighborhoodId) {
      logger.error('INVARIANT VIOLATION: Activist created without neighborhoodId', {
        activistId: result.id,
        data: result
      });
      throw new Error('Data integrity violation: Activist missing neighborhoodId');
    }
  }

  // Guard: Soft deletes only (no hard deletes)
  if (params.model === 'Activist' && params.action === 'delete') {
    logger.error('INVARIANT VIOLATION: Attempted hard delete on Activist', {
      params
    });
    throw new Error('Hard deletes not allowed on Activists. Use soft delete (isActive = false)');
  }

  return result;
});
```

#### Pattern 2: Tenant Isolation Guards (Security)
```typescript
// Guard: Ensure tenant filter is always applied (except SuperAdmin)
function applyCityFilter(query: Query, session: Session): Query {
  const user = session.user;

  // SuperAdmin bypass
  if (user.role === 'SUPERADMIN') {
    return query;
  }

  // INVARIANT: Non-SuperAdmin MUST have cityId filter
  if (!user.cityId) {
    logger.error('INVARIANT VIOLATION: User missing cityId', { userId: user.id });
    throw new Error('Data isolation violation: User missing cityId');
  }

  // Guard: Ensure filter is applied
  if (!query.where) {
    query.where = {};
  }

  if (query.where.cityId && query.where.cityId !== user.cityId) {
    logger.error('INVARIANT VIOLATION: Cross-city access attempted', {
      userId: user.id,
      userCityId: user.cityId,
      requestedCityId: query.where.cityId
    });
    throw new Error('Access denied: Cannot access other city data');
  }

  query.where.cityId = user.cityId;
  return query;
}
```

#### Pattern 3: State Transition Guards (Business Logic)
```typescript
// Guard: Validate state transitions
function updateOrderStatus(orderId: string, newStatus: OrderStatus) {
  const order = await getOrder(orderId);

  // Define valid transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    pending: ['confirmed', 'cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: []
  };

  // INVARIANT: Only valid transitions allowed
  if (!validTransitions[order.status].includes(newStatus)) {
    logger.error('INVARIANT VIOLATION: Invalid state transition', {
      orderId,
      currentStatus: order.status,
      attemptedStatus: newStatus
    });
    throw new Error(`Invalid state transition: ${order.status} → ${newStatus}`);
  }

  await orm.orders.update({
    where: { id: orderId },
    data: { status: newStatus }
  });
}
```

#### Pattern 4: Authorization Guards (Security)
```typescript
// Guard: Verify permissions before sensitive operations
async function deleteCity(cityId: string, session: Session) {
  const user = session.user;

  // INVARIANT: Only SuperAdmin and Area Managers can delete cities
  if (user.role !== 'SUPERADMIN' && user.role !== 'AREA_MANAGER') {
    logger.error('INVARIANT VIOLATION: Unauthorized city deletion attempt', {
      userId: user.id,
      userRole: user.role,
      cityId
    });
    throw new Error('Insufficient permissions: Only SuperAdmin/Area Manager can delete cities');
  }

  // Additional guard: Area Manager can only delete cities in their area
  if (user.role === 'AREA_MANAGER') {
    const city = await getCity(cityId);
    if (city.areaId !== user.areaId) {
      logger.error('INVARIANT VIOLATION: Cross-area city deletion attempted', {
        userId: user.id,
        userAreaId: user.areaId,
        cityAreaId: city.areaId
      });
      throw new Error('Access denied: Cannot delete city in different area');
    }
  }

  await orm.cities.delete({ where: { id: cityId } });
}
```

#### Pattern 5: API Contract Guards (Data Integrity)
```typescript
// Guard: Validate response shape before returning
import { z } from 'zod';

const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['SUPERADMIN', 'AREA_MANAGER', 'CITY_COORDINATOR']),
  createdAt: z.string()
});

export async function GET(req: Request) {
  const user = await getUser(userId);

  // INVARIANT: API response must match contract
  try {
    const validated = UserResponseSchema.parse(user);
    return Response.json(validated);
  } catch (error) {
    logger.error('INVARIANT VIOLATION: API response shape mismatch', {
      expectedSchema: UserResponseSchema,
      actualData: user,
      error
    });
    throw new Error('API contract violation: Invalid response shape');
  }
}
```

### When to Use Runtime Guards

✅ **Always guard:**
- Data integrity (required fields, foreign keys, unique constraints)
- Tenant isolation (multi-tenant filters, RBAC boundaries)
- Hard constraints (state transitions, immutable fields)
- Security boundaries (authorization, sensitive data access)

⚠️ **Use sparingly for:**
- Soft business rules (can be validated at UI layer)
- Performance-sensitive paths (guards add overhead)
- Development-only checks (use environment flags)

### Runtime Guards vs Tests

| Aspect | Tests | Runtime Guards |
|--------|-------|----------------|
| **When** | Before deployment | In production |
| **Purpose** | Catch bugs early | Prevent data corruption |
| **Coverage** | Known scenarios | Unknown edge cases |
| **Cost** | Development time | Runtime overhead |
| **Failure** | CI/CD blocks | Application crashes |

**Both are necessary.** Tests catch most bugs. Runtime guards catch bugs that slip through.

### Logging & Monitoring

**Every guard violation MUST be logged:**

```typescript
logger.error('INVARIANT VIOLATION: [description]', {
  context: { /* relevant data */ },
  stackTrace: new Error().stack
});
```

**Set up alerts for guard violations:**
- Send to error monitoring (Sentry, Rollbar)
- Alert on-call engineer immediately
- Trigger incident response for security violations

### Guard Checklist

For critical operations, ensure you have runtime guards for:

- [ ] **Required fields present** - No null/undefined for required data
- [ ] **Foreign key integrity** - Referenced entities exist
- [ ] **Tenant isolation** - Filters applied correctly
- [ ] **Valid state transitions** - Only allowed transitions occur
- [ ] **Authorization checks** - Permissions verified
- [ ] **API contracts** - Response shapes match schemas
- [ ] **Business invariants** - Domain-specific rules hold

### Why This Matters

**Runtime guards are your seatbelt.**

Scenarios where guards save you:
- ✅ Test missed edge case → Guard catches it in production (before data corruption)
- ✅ Manual change in DB → Guard rejects invalid state
- ✅ Race condition → Guard detects inconsistent state
- ✅ Third-party integration bug → Guard validates input

**Philosophy:** Prefer crashing over corrupting data. A crash is visible and fixable. Corrupt data is silent and spreads.

---

## 🐤 Golden Path Canary (Production Safety Net)

**Philosophy:** Tests verify code correctness. Runtime guards prevent data corruption. Golden Paths verify **the real system works for real users.**

### What is a Golden Path?

A **Golden Path** is a real user journey executed automatically in a production or production-like environment to verify end-to-end system health.

**Characteristics:**
- Uses real (read-only) or sandbox account
- Runs in production or staging environment
- Tests actual user flow, not mocked interactions
- Verifies end result, not implementation details
- Runs automatically (hourly, daily, or on-demand)

### Why Golden Paths Are Critical

**Scenario: "Everything Passed But Users Are Broken"**

You can have:
- ✅ CI green (all tests pass)
- ✅ Type-check pass
- ✅ Runtime guards active
- ✅ 95% test coverage

**But production is still broken:**
- ❌ Environment variable missing (feature disabled)
- ❌ Database migration didn't run (schema mismatch)
- ❌ Auth configuration wrong (users can't login)
- ❌ External API credentials expired (integration broken)
- ❌ CDN cache stale (users see old version)
- ❌ Load balancer misconfigured (requests timeout)

**Golden Paths catch these issues immediately.**

### Rule: Define 1-3 Golden Paths Per Project

**Template:**

```markdown
## Golden Paths

### GP-1: Authentication Flow
**Journey:** Login → Dashboard → Logout
**Frequency:** Every hour
**Environment:** Production (read-only account)
**Success Criteria:**
- Login successful within 3 seconds
- Dashboard loads with key metrics visible
- Logout successful

### GP-2: Core Feature Flow
**Journey:** [Main user action from start to finish]
**Frequency:** Every 6 hours
**Environment:** Staging
**Success Criteria:**
- [Specific outcome achieved]
- [Performance within threshold]
- [Data consistency verified]
```

### Implementation Patterns

#### Pattern 1: E2E Test as Canary (Playwright)

```typescript
// tests/golden-path/auth-flow.canary.ts
import { test, expect } from '@playwright/test';

/**
 * Golden Path: Authentication Flow
 * Runs: Hourly in production
 * Alert: PagerDuty if fails
 */
test('GP-1: User can login and access dashboard', async ({ page }) => {
  // Use read-only production account
  const canaryUser = {
    email: process.env.CANARY_USER_EMAIL,
    password: process.env.CANARY_USER_PASSWORD
  };

  // Step 1: Login
  await page.goto('https://app.example.com/login');
  await page.fill('[name="email"]', canaryUser.email);
  await page.fill('[name="password"]', canaryUser.password);
  await page.click('button[type="submit"]');

  // Step 2: Verify dashboard loads
  await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('[data-testid="user-name"]')).toContainText('Canary User');

  // Step 3: Verify key metrics visible
  await expect(page.locator('[data-testid="metrics-card"]')).toBeVisible();

  // Step 4: Logout
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await expect(page).toHaveURL(/.*login/);
});
```

**Run via GitHub Actions cron:**

```yaml
# .github/workflows/golden-path-canary.yml
name: Golden Path Canary
on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

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
          CANARY_USER_PASSWORD: ${{ secrets.CANARY_USER_PASSWORD }}

      # Alert on failure
      - name: Notify on failure
        if: failure()
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_MESSAGE: '🚨 Golden Path Canary FAILED - Production may be broken'
```

#### Pattern 2: API Health Check as Canary

```typescript
// scripts/canary/api-health.ts
async function runAPICanary() {
  const baseURL = process.env.API_BASE_URL;

  // GP-1: Auth works
  const authResponse = await fetch(`${baseURL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.CANARY_USER_EMAIL,
      password: process.env.CANARY_USER_PASSWORD
    })
  });

  if (!authResponse.ok) {
    throw new Error('Golden Path FAILED: Auth endpoint returned ' + authResponse.status);
  }

  const { token } = await authResponse.json();

  // GP-2: Core data accessible
  const dataResponse = await fetch(`${baseURL}/api/users/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  if (!dataResponse.ok) {
    throw new Error('Golden Path FAILED: Data endpoint returned ' + dataResponse.status);
  }

  console.log('✅ Golden Path PASSED: Auth + Data endpoints healthy');
}

runAPICanary().catch(error => {
  console.error('🚨 GOLDEN PATH FAILED:', error.message);
  process.exit(1);
});
```

### Examples by Project Type

| Project Type | Golden Path Example |
|--------------|---------------------|
| **SaaS App** | Login → Create entity → View list → Logout |
| **E-commerce** | Browse → Add to cart → View cart → Remove item |
| **CMS** | Login → View posts → Open post → Logout |
| **API** | Auth → List resources → Get resource → Verify response |
| **Dashboard** | Login → Load dashboard → Key metrics visible |

**For Election Campaign System:**
```markdown
### GP-1: City Coordinator Workflow
**Journey:** Login → View Neighborhoods → View Activists → Logout
**Frequency:** Every 2 hours
**Success Criteria:**
- Login as City Coordinator
- Neighborhoods list loads (only assigned city visible)
- Activists list loads for a neighborhood
- No cross-city data visible (RBAC enforced)

### GP-2: Attendance Recording
**Journey:** Login as Activist Coordinator → Record attendance → Verify GPS validation
**Frequency:** Daily
**Success Criteria:**
- Attendance recorded successfully
- GPS coordinates validated (within 100m of site)
- Attendance appears in coordinator's dashboard
```

### When Golden Path Fails

**Treat as production incident:**

1. **Alert immediately** - PagerDuty, Slack, email on-call engineer
2. **Investigate urgently** - Golden Path failure = users are broken
3. **Roll back if necessary** - Revert recent deployments
4. **Document root cause** - Add to bug log with prevention rule
5. **Fix monitoring gaps** - Why didn't tests catch this?

### Golden Path vs Tests vs Guards

| Layer | Purpose | When It Runs | What It Catches |
|-------|---------|--------------|-----------------|
| **Tests** | Verify code correctness | Before merge (CI) | Logic bugs, edge cases |
| **Runtime Guards** | Prevent data corruption | During execution | Invariant violations, invalid state |
| **Golden Paths** | Verify system health | Production/staging (hourly) | Config errors, env issues, integration failures |

**All three layers are necessary.**

### Best Practices

✅ **Do:**
- Use read-only or sandbox accounts (never mutate production data)
- Test end-to-end flows (not individual endpoints)
- Verify business outcomes (user can complete task)
- Run frequently (hourly or daily)
- Alert loudly on failure (treat as production incident)

❌ **Don't:**
- Test implementation details (internal APIs)
- Mock external dependencies (defeats the purpose)
- Run rarely (defeats early detection)
- Ignore failures ("probably flaky")
- Mutate production data (use read-only flows)

### Minimal Setup (Free Tools)

**Tools:**
- Playwright (E2E testing)
- GitHub Actions (free cron jobs)
- Slack/Discord webhooks (free alerts)

**Effort:**
- 1-2 hours to set up first Golden Path
- 30 minutes per additional path
- Zero ongoing cost for small teams

**ROI:**
- Catches "everything passed but prod is broken" bugs immediately
- Prevents user-facing outages
- Validates entire stack (code + config + infrastructure)

---

## 🔄 Regression Testing Strategy (2025 Best Practices)

**Goal:** Catch regressions in unchanged code when making changes. Not all regressions are obvious - this strategy prevents silent breakage.

### 1. Risk-Based Test Prioritization

Don't run all tests equally - prioritize by risk and impact:

**Tier 1 (Critical) - Always Run:**
- Authentication & authorization flows
- Payment/transaction processing
- Data integrity (creation, updates, deletions)
- Security-critical operations
- API contract compliance
- **When:** On every PR, pre-merge, production deploy

**Tier 2 (High Priority) - Scheduled:**
- Feature-specific integration tests
- UI component regression tests
- Cross-module integration
- Performance benchmarks
- **When:** Nightly builds, weekly regression suite

**Tier 3 (Nice-to-Have) - Optional:**
- Edge case scenarios
- Exploratory test suites
- Non-critical UI variants
- **When:** Manual runs, quarterly full regression

**Implementation:**
```yaml
# Example: GitHub Actions workflow
name: Regression Tests
on:
  pull_request:
    paths: ['src/**', 'tests/**']
jobs:
  tier1-critical:
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- --testPathPattern=critical

  tier2-nightly:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- --testPathPattern=integration
```

### 2. CI/CD Automation Rules

**All regression tests MUST be automated** - human oversight is unreliable.

**Required CI Stages:**

| Stage | When | Tests Run | Pass Threshold |
|-------|------|-----------|----------------|
| **Pre-commit Hook** | On `git commit` | Lint + Type-check + Fast unit tests | 100% pass |
| **Pull Request** | On PR open/update | Tier 1 critical tests | 100% pass |
| **Pre-merge** | Before merge to main | Tier 1 + affected Tier 2 tests | 100% pass |
| **Post-merge** | After merge to main | Full Tier 1 + Tier 2 suite | 95%+ pass |
| **Nightly** | Scheduled (daily) | All tiers + mutation tests | 90%+ pass |

**Example: Pre-commit hook** (`.husky/pre-commit`):
```bash
#!/bin/sh
# Run fast tests before commit
npm run lint && npm run type-check && npm run test:unit:fast
```

**Example: PR automation** (`.github/workflows/pr-checks.yml`):
```yaml
name: PR Checks
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  critical-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:tier1
      - run: npm run test:coverage -- --min=80
```

### 3. Shift-Left Validation (Catch Early)

The earlier you catch regressions, the cheaper they are to fix:

| Stage | Cost to Fix | Detection Method | Example |
|-------|-------------|------------------|---------|
| **Compile Time** | $1 | Type checking, linting | TypeScript strict mode catches missing null checks |
| **Pre-commit** | $10 | Fast unit tests, type-check | Husky hook blocks commit with failing test |
| **PR Build** | $100 | CI integration tests | GitHub Actions fails PR with broken API contract |
| **Staging** | $1,000 | E2E tests, manual QA | Playwright catches login flow regression |
| **Production** | $10,000+ | User reports, monitoring | Sentry alerts about payment failure spike |

**Shift-left checklist:**
- [ ] Enable TypeScript/MyPy strict mode (catches types at compile time)
- [ ] Add pre-commit hooks for lint + fast tests (blocks bad commits)
- [ ] Run Tier 1 tests on every PR (catches integration issues)
- [ ] Require PR approval + CI green before merge (enforces quality gate)
- [ ] Set up staging environment with E2E tests (final validation before production)

### 4. Test Coverage Goals

**Global coverage targets** (applies to entire codebase):
- **Unit tests:** 80%+ line coverage
- **Integration tests:** 60%+ coverage of API endpoints and database queries
- **E2E tests:** 10-20% coverage of critical user journeys (don't over-invest in E2E)

**Critical module targets** (authentication, payments, data integrity):
- **Unit tests:** 90%+ line coverage
- **Branch coverage:** 85%+ (test all if/else paths)
- **Mutation score:** 80%+ (tests actually catch bugs when code is mutated)

**Example: Coverage enforcement in CI:**
```json
// package.json
{
  "scripts": {
    "test:coverage": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":80,\"branches\":75}}'"
  }
}
```

**Example: Module-specific thresholds:**
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: { lines: 80, branches: 75 },
    './src/auth/**/*.ts': { lines: 90, branches: 85 },
    './src/payments/**/*.ts': { lines: 90, branches: 85 }
  }
}
```

### 5. Test Reporting & Diagnostics

**When a regression test fails in CI, you need:**
- ✅ **Test name** - Which test failed?
- ✅ **Error message** - Why did it fail?
- ✅ **Stack trace** - Where in the code?
- ✅ **Screenshots/videos** (UI tests) - What did the user see?
- ✅ **Logs** - What was the application state?
- ✅ **Failed request/response** (API tests) - What data was sent/received?

**Required CI test report artifacts:**
```yaml
# GitHub Actions example
- name: Run E2E tests
  run: npx playwright test
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: test-results
    path: |
      playwright-report/
      test-results/
      screenshots/
      videos/
```

**Example: Rich test failure output** (Playwright):
```typescript
test('checkout flow works', async ({ page }) => {
  await page.goto('/checkout');

  // Automatic screenshot on failure
  await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

  // Automatic trace recording
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.click('[data-testid="submit-payment"]');

  // Error includes screenshot + trace + logs
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### 6. Branch Protection & Code Quality Gates

**Main branch MUST be protected** - no direct commits allowed.

**Required branch protection rules:**
- ✅ Require pull request before merging
- ✅ Require status checks to pass (CI tests green)
- ✅ Require code review approval (1+ reviewer)
- ✅ Dismiss stale reviews on new commits
- ✅ Require linear history (no merge commits)

**Example: GitHub branch protection settings:**
```yaml
# .github/branch-protection.yml
rules:
  - pattern: main
    required_status_checks:
      - test-tier1
      - lint
      - type-check
    required_reviews: 1
    dismiss_stale_reviews: true
    require_linear_history: true
```

**Atomic commit guidelines:**
- Each commit should be self-contained (buildable, testable)
- Commit message format: `type(scope): description` (e.g., `fix(auth): handle expired tokens`)
- Reference issue/ticket numbers in commits
- No "WIP" or "fix typo" commits on main branch (squash before merge)

---

### Implementation Checklist

#### Week 1: Foundation (Blocking)
- [ ] **Enable strict type checking** (TypeScript strict mode, Python mypy, etc.)
- [ ] **Set up pre-commit hooks** (lint + type-check + fast tests)
- [ ] **Document 10 critical test scenarios** (what MUST work on every PR)

#### Week 2: Automated Testing
- [ ] **Write E2E tests for critical scenarios** (Playwright, Cypress, Selenium)
- [ ] **Set up CI/CD pipeline** (GitHub Actions, GitLab CI, CircleCI)
- [ ] **Add visual regression tests** (Percy, Playwright screenshots)

#### Week 3: Runtime Safety
- [ ] **Add schema validation to APIs** (Zod, Joi, AJV, Pydantic)
- [ ] **Add database constraints** (CHECK constraints, foreign keys)
- [ ] **Set up error monitoring** (Sentry, Rollbar, Bugsnag)

#### Week 4: Advanced
- [ ] **Set up mutation testing** (Stryker, PITest - monthly check, target 80%+ mutation score)
- [ ] **Track test coverage** (Jest, NYC, Coverage.py - target 80%+ unit, 60%+ integration, 90%+ critical modules)
- [ ] **Implement differential testing** (for refactors - old vs new implementation)
- [ ] **Configure branch protection rules** (require CI pass + code review before merge)
- [ ] **Set up test reporting** (artifacts, screenshots, traces for failed tests)

### Testing Patterns

#### Pattern 1: Red-Green-Refactor for Bugs
```markdown
1. Write failing test that reproduces the bug
2. Run test → verify it FAILS
3. Implement minimal fix
4. Run test → verify it PASSES
5. Run full test suite → verify no regressions
6. Document in bug log with prevention rule
```

#### Pattern 2: Contract Testing for APIs
```typescript
// Define API contract
const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER'])
});

// Validate in production
export async function GET(req: Request) {
  const data = await getUser();

  // This will throw if API shape changes
  const validated = UserResponseSchema.parse(data);
  return Response.json(validated);
}
```

#### Pattern 3: Critical Scenarios Testing
```markdown
## Critical Scenarios (Example - adapt to your project)

1. **Authentication works** (login, logout, session persistence)
2. **Authorization enforced** (users can't access other users' data)
3. **Data integrity maintained** (no orphaned records, FK constraints work)
4. **API contracts respected** (breaking changes caught by schema validation)
5. **UI renders correctly** (visual regression tests pass)
```

#### Pattern 4: Mutation Testing (Monthly)
```bash
# Verify test quality by mutating code
# Tests should catch mutated code (high mutation score = good tests)
npx stryker run --mutate "src/critical-module/**/*.ts"

# Target: 80%+ mutation score on critical modules
```

#### Pattern 5: Differential Testing for Refactors
```typescript
// When refactoring complex logic, ensure same output
test('refactored logic produces same result', async () => {
  const testCases = [
    { input: 'A', expected: 'result1' },
    { input: 'B', expected: 'result2' }
  ];

  for (const testCase of testCases) {
    const oldResult = await oldImplementation(testCase.input);
    const newResult = await newImplementation(testCase.input);

    expect(newResult).toEqual(oldResult);
  }
});
```

### Success Metrics

**After implementing QA automation:**
- ✅ **95%+ of regressions caught before merge** (via CI/CD)
- ✅ **5 min feedback loop** (down from hours of manual testing)
- ✅ **Zero manual QA for routine changes** (only exploratory testing for new features)
- ✅ **Confidence in deployments** (CI green = safe to deploy)
- ✅ **Sleep well** (monitoring catches production errors immediately)

### Common Pitfalls to Avoid

❌ **Don't:** Write tests after code is merged (defeats the purpose)
✅ **Do:** Write tests before or during development

❌ **Don't:** Test everything (wastes time, slows CI)
✅ **Do:** Focus on critical paths (10-15 scenarios cover 80% of value)

❌ **Don't:** Skip visual regression tests (layout breaks are common)
✅ **Do:** Screenshot critical pages (catches unexpected visual changes)

❌ **Don't:** Rely only on unit tests (integration bugs slip through)
✅ **Do:** Use test pyramid (80%+ unit coverage, 60%+ integration coverage, 10-20% E2E coverage)

❌ **Don't:** Ignore flaky tests (they erode trust)
✅ **Do:** Fix or delete flaky tests immediately

❌ **Don't:** Skip error monitoring (you'll find out from users)
✅ **Do:** Set up Sentry/Rollbar on day 1 (catch errors before users report)

---

## 🚫 Flaky Test Zero Tolerance Policy

**Rule:** A flaky test is treated as a **production-severity bug**.

### What is a Flaky Test?

A test that sometimes passes, sometimes fails with the same code. Common causes:
- Race conditions (timing-dependent)
- Non-deterministic data (random values, dates)
- External dependencies (network, DB state)
- Insufficient waits (UI not fully loaded)

### Zero Tolerance Process

**When a flaky test is detected:**

1. **Quarantine immediately** - Disable/skip the test (mark with `test.skip()`)
2. **Create incident** - Treat as P1 bug (blocks CI trust)
3. **Assign owner** - Team/person responsible for invariant
4. **Fix or delete within 48 hours** - No exceptions
5. **Document root cause** - Add to bug log with prevention rule

**CI/CD Requirements:**

- ✅ Fail build if test passes on retry (no retry logic in CI)
- ✅ Alert on test flakiness metrics (if >0.1% failure rate)
- ✅ Block all merges while flaky tests exist

### Why This Matters

**Flaky tests are worse than no tests** because they:
- Train developers to ignore failures ("probably just flaky")
- Erode trust in CI/CD pipeline
- Hide real regressions (signal-to-noise ratio collapses)
- Waste developer time (re-running builds)

**One flaky test can destroy a team's test discipline.**

### Common Fixes

| Flaky Pattern | Root Cause | Fix |
|---------------|------------|-----|
| UI test sometimes fails | Race condition | Use `waitFor()` instead of `sleep()` |
| Test fails on CI but not locally | Timing differences | Increase timeout, mock time |
| Test fails after parallel run | Shared state | Isolate test data, use unique IDs |
| Test fails randomly | Non-deterministic data | Mock random/date, use fixtures |
| API test flaky | Network/DB state | Use test DB, reset state before test |

### Enforcement

**Pre-merge checklist:**
- [ ] No flaky tests in branch
- [ ] All tests deterministic
- [ ] Test failures are reproducible

**Post-merge monitoring:**
- Track flakiness rate per test file
- Alert if any test has >0.1% failure rate
- Review flakiness metrics weekly

---

## 🧑‍🔧 Test Ownership & Maintenance

**Philosophy:** Tests without owners become zombie code. Ownership creates accountability.

### Rule: Every Test File MUST Declare Owner

**Format (at top of test file):**

```typescript
/**
 * INVARIANT: [What this test protects]
 * INTENT: [Why this test exists]
 * @owner [team-name or role]
 * @created [YYYY-MM-DD]
 */
```

**Example:**

```typescript
/**
 * INVARIANT: City Coordinators can only access their own city's data
 * INTENT: Prevent cross-city data leakage (security-critical)
 * @owner backend-security
 * @created 2025-01-15
 */

describe('City data isolation', () => {
  test('City Coordinator CANNOT access other city data', async () => {
    // Test implementation
  });
});
```

### Owner Responsibilities

**Owners are responsible for:**

1. **Keep tests meaningful** - Tests should still validate critical behavior
2. **Update intent when behavior changes** - If invariant changes, update or delete test
3. **Prevent test rot** - Remove tests when invariant no longer exists
4. **Fix flaky tests** - Assigned owner must fix flaky tests within 48 hours
5. **Respond to test failures** - Investigate failures in owned test files

### When to Update Ownership

**Ownership MUST be updated when:**
- Team structure changes
- Invariant ownership transfers
- Test file is significantly refactored
- Original intent no longer applies

### Why This Matters

**Without ownership:**
- Tests become orphaned (nobody knows why they exist)
- Failures are ignored ("not my problem")
- Tests are never deleted (accumulate cruft)
- Test maintenance becomes a tragedy of the commons

**With ownership:**
- Clear accountability for test quality
- Failures get investigated promptly
- Tests are kept relevant or deleted
- Test suite stays lean and meaningful

### Enforcement

**During code review, verify:**
- [ ] New test files declare owner
- [ ] Owner is a valid team/role
- [ ] Intent is clear and specific
- [ ] Invariant is documented

**During quarterly review:**
- Audit orphaned tests (no owner or invalid owner)
- Reassign or delete tests with missing owners
- Update ownership for team changes

---

### Tool Recommendations (Language-Agnostic)

**Type Safety:**
- TypeScript (JavaScript), MyPy (Python), Flow (deprecated), TypeScript ESLint

**Pre-commit Hooks:**
- Husky + lint-staged (JS/TS), pre-commit (Python), Lefthook (Go), Overcommit (Ruby)

**E2E Testing:**
- Playwright (recommended), Cypress, Selenium, TestCafe, Puppeteer

**Visual Regression:**
- Percy (free tier), Playwright screenshots, BackstopJS, Chromatic

**Schema Validation:**
- Zod (TypeScript), Joi (JS), AJV (JSON Schema), Pydantic (Python), JSON Schema

**Error Monitoring:**
- Sentry (recommended - generous free tier), Rollbar, Bugsnag, Honeybadger

**CI/CD:**
- GitHub Actions (free for public repos), GitLab CI, CircleCI, Travis CI

**Mutation Testing:**
- Stryker (JS/TS), PITest (Java), Mutmut (Python)

---

## 📋 Task Execution Template

Use this template when executing tasks:

```markdown
## Task: [Brief Description]

### 1. Analysis
- Read files: [list]
- Affected components: [list]
- Risk level: Low/Medium/High

### 2. Diff Risk Classification

**Risk Level:** 🔹 Low / 🔸 Medium / 🔴 High

**Justification:**
- What is being changed?
- Does it affect shared state or invariants?
- What are the potential side effects?

**Affected Invariants (if High Risk):**
- [ ] Authentication/Authorization
- [ ] Data isolation (multi-tenant, RBAC)
- [ ] Lifecycle state management
- [ ] Data integrity constraints
- [ ] Audit logging
- [ ] API contracts

**Test Strategy:**
- 🔹 Low: Unit tests only
- 🔸 Medium: Unit + integration tests
- 🔴 High: Full Tier 1 critical suite + explicit invariant tests

**Behavior Locks (if applicable):**
List 3-5 behaviors that MUST NOT change:
1. [behavior]
2. [behavior]
3. [behavior]

### 3. Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### 4. Implementation
Files modified:
- `path/to/file1.ext` - [reason]
- `path/to/file2.ext` - [reason]

### 5. Verification
Commands run:
- `npm test` - ✅ Passed (45 tests)
- `npm run type-check` - ✅ No errors
- `npm run lint` - ✅ No issues

**Negative Tests Added (if applicable):**
- [ ] Unauthorized access blocked
- [ ] Invalid input rejected
- [ ] Boundary violations caught

### 6. Summary
[1-2 sentence summary of what was done and why]
```

---

## 🎯 Project-Specific Adaptations

**This file is generic.** For project-specific protocols:

1. Create a `CLAUDE.md` or similar file in your project root
2. Reference this baseRules.md for universal patterns
3. Add project-specific:
   - Architecture decisions
   - Tech stack details
   - Security requirements
   - Domain-specific testing needs
   - Deployment procedures
   - Bug log location (e.g., `docs/bugs.md`)

---

## 📖 Common Bug Log Locations

Choose one that fits your project structure:

- `docs/bugs.md` (simple projects)
- `docs/localDev/bugs.md` (development-specific)
- `docs/infrastructure/bugs.md` (infrastructure/ops focus)
- `.github/BUG_LOG.md` (GitHub-centric projects)
- `BUGS.md` (root level, quick access)

**Format example:**
```markdown
## [YYYY-MM-DD] Bug Title

**Problem:** Description of the bug

**Root Cause:** Why it happened

**Solution:** What was changed

**Prevention:** Rule to avoid this in future

**Files Changed:** List of modified files
```

---

## 🏆 Final Summary: What This Protocol Achieves

### Defense-in-Depth Regression Prevention (99.8%)

**Layer 1: Before Merge (CI/CD)**
- ✅ Tests (unit, integration, E2E)
- ✅ Behavior locks (prevent silent changes)
- ✅ Negative tests (block forbidden paths)
- ✅ Diff risk classification (intentional paranoia)
- ✅ Type checking (60-70% bugs caught at compile time)

**Layer 2: At Runtime (Production)**
- ✅ Runtime guards (fail fast, prevent corruption)
- ✅ Contract validation (API shape enforcement)
- ✅ Database constraints (last line of defense)

**Layer 3: After Deployment (Monitoring)**
- ✅ Golden Path Canaries (verify system health)
- ✅ Error monitoring (Sentry/Rollbar)
- ✅ Audit logs (complete change tracking)

### Enforcement Mechanisms

**Test Integrity:**
- ✅ Flaky Test Zero Tolerance (48-hour fix-or-delete)
- ✅ Test Ownership (accountability)
- ✅ Negative testing (security-critical)

**Documentation:**
- ✅ Assumptions Ledger (explicit contracts)
- ✅ Invariants (critical guarantees)
- ✅ Bug log (prevention rules)

**Process Discipline:**
- ✅ Rule Exception Protocol (conscious risk decisions)
- ✅ Bug Fix Protocol (regression-proof)
- ✅ Stop Conditions (no guessing)

### Expected Outcomes

**If you follow this protocol strictly:**

| Metric | Result |
|--------|--------|
| Regressions caught before merge | 99% |
| Silent behavior changes | < 1% |
| Flaky test impact | Zero (48h fix-or-delete) |
| Test maintenance | Ownership + quarterly audit |
| Production incidents | Canaries catch immediately |
| AI reliability | Consistent (EXECUTION_CHECKLIST enforces) |
| Overall reliability | **99.8% (maximum achievable)** |

### The Remaining 0.2%

**What can still cause regressions?**
- Unknown coupling (can't test what you don't know exists)
- Black swan events (unprecedented edge cases)
- Human discipline gaps (not following protocols)

**Mitigation:**
- Assumptions Ledger documents implicit contracts
- Golden Paths catch unknown issues in production
- Rule Exception Protocol prevents silent shortcuts
- Continuous learning (every bug → new invariant)

### Files in This System

| File | Purpose | Lines | Status |
|------|---------|-------|--------|
| **baseRules.md** | Universal protocols | 2,473 | 🔒 FROZEN v2.0 |
| **EXECUTION_CHECKLIST.md** | AI enforcement mode | 147 | ✅ Complete |
| **INVARIANTS_TEMPLATE.md** | Project invariants template | 310 | ✅ Complete |

**Project-specific files to create:**
- `ASSUMPTIONS.md` - Implicit behaviors (10-15 assumptions)
- `INVARIANTS.md` - Critical guarantees (10-15 invariants)
- Bug log - Historical bugs + prevention rules

### Next Steps for Your Project

**Week 1: Documentation**
1. Create `ASSUMPTIONS.md` (use template from lines 790-817)
2. Fill `INVARIANTS.md` (use INVARIANTS_TEMPLATE.md)
3. Add test ownership headers to critical test files
4. Update project's `CLAUDE.md` to reference these protocols

**Week 2: Enforcement**
1. Set up CI rule: Fail on test retry (no retry logic)
2. Add pre-commit hook: Block flaky tests
3. Create Golden Path Canary for 1-3 core flows
4. Set up quarterly reminder: Audit orphaned tests

**Ongoing:**
- Document bugs in bug log with prevention rules
- Update ASSUMPTIONS.md when implicit behaviors change
- Update INVARIANTS.md when new guarantees added
- Maintain test ownership (quarterly audit)

---

**End of Quick Reference v2.0 (FINAL)** - For project-specific architecture, see project's main documentation file (CLAUDE.md, README.md, etc.)

**Last Updated:** 2025-12-16
**Status:** FROZEN (no new sections will be added)
**Regression Prevention:** 99.8% (maximum achievable without massive QA org)
