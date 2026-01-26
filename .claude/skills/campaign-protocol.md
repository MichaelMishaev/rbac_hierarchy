---
name: campaign-protocol
description: Enforce Election Campaign 5-step task flow, RBAC-aware bug fixing, and regression prevention. Use BEFORE any code changes.
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
---

# Campaign Development Protocol

Enforce the Election Campaign Management System's strict development protocols from `baseRules.md`.

## Usage

```bash
/protocol [command]
```

**Commands:**
- `validate` - Validate current changes against protocol
- `bug-fix` - Guide through RBAC-safe bug fix (5-step)
- `task-flow` - Enforce 5-step task flow
- `pre-commit` - Run all pre-commit checks
- `risk-check` - Classify change risk level

---

## 5-Step Task Flow (MANDATORY)

**Every task MUST follow this sequence:**

### Step 1: Read Files FIRST
```bash
# Before coding, read affected files
# Check: Prisma schema, existing patterns, RBAC logic
```
**Rule:** Never guess file contents. Read `/CLAUDE.md`, `baseRules.md`, and relevant source files.

### Step 2: Declare Change Boundary
```markdown
**CHANGE BOUNDARY:**
✅ Allowed: app/actions/activists.ts, app/components/ActivistForm.tsx
❌ Forbidden: Auth flows, RBAC middleware, Locked screens
```
**Rule:** Changes outside declared boundary = INVALID.

### Step 3: Classify Risk Level
```
🔴 HIGH RISK: RBAC, auth, data filters, city scoping
🔸 MEDIUM RISK: Voter management, tasks, attendance
🔹 LOW RISK: UI styling, Hebrew translations
```

### Step 4: Implement Minimal Diffs
- Change ONLY what's necessary
- No "while I was here" refactors
- No unrelated formatting changes

### Step 5: Summarize Results
```markdown
**Files Modified:**
- app/actions/activists.ts (L42-47) - Added city filter

**Commands Run:**
- npm run build ✅
- npm run test:e2e ✅

**Invariants Checked:**
- INV-RBAC-001 (City Isolation) ✅
```

---

## RBAC-Safe Bug Fix Protocol (5 Steps)

### Step 1: Root Cause Analysis (1-3 bullets)
```markdown
**Bug:** City Coordinator sees activists from other cities
**Cause:** Missing `city_id` filter in `getActivists()`
**Affected Invariant:** INV-RBAC-001
```

### Step 2: Write Regression Test FIRST
```typescript
// Test MUST fail before fix, pass after
test('City Coordinator cannot see other city activists', async () => {
  // Login as Tel Aviv coordinator
  // Try to access Jerusalem activist
  // Expect: 403 or empty result
});
```

### Step 3: Minimal Fix
```typescript
// BEFORE (broken)
const activists = await prisma.activist.findMany({
  where: { is_active: true }
});

// AFTER (fixed)
const activists = await prisma.activist.findMany({
  where: {
    is_active: true,
    neighborhood: { city_id: session.user.cityId } // FIX
  }
});
```

### Step 4: Run Tests
```bash
npm run test:e2e -- rbac/city-isolation.spec.ts
npm run build
```

### Step 5: Document in bugs folder
```markdown
## BUG-2026-01-CITY-LEAK
**What:** City coordinator saw activists from different city
**Cause:** Missing `city_id` filter in `activist.findMany()`
**Fix:** Added `where: { neighborhood: { city_id } }`
**Prevention:** ALL queries must filter by city (INV-RBAC-001)
**Test Added:** city-coordinator-cross-city.spec.ts
```

---

## Risk Classification Matrix

### 🔴 HIGH RISK (Requires explicit plan)
- RBAC permissions or data isolation
- Auth flows (login, session, JWT)
- City/area filtering logic
- Data deletion (soft delete only!)
- Organization hierarchy
- Locked screens (see CLAUDE.md)

**Requirements:**
- Read PERMISSIONS_MATRIX.md first
- Check bugs-current.md for similar issues
- Negative tests (verify access DENIED)
- Full RBAC test suite

### 🔸 MEDIUM RISK
- Voter management
- Task assignments
- Attendance features
- Neighborhood operations

**Requirements:**
- E2E tests for affected flows
- Integration tests
- Data integrity checks

### 🔹 LOW RISK
- UI styling (colors, spacing)
- Hebrew translations
- Mobile responsive tweaks

**Requirements:**
- Visual regression check
- RTL layout verification

---

## Stop Conditions

**STOP and ASK if:**
- Required file/command doesn't exist
- Schema change implied but not specified
- 3+ files need large edits (regression risk)
- Request conflicts with CLAUDE.md
- Locked screen modification needed
- RBAC rules unclear

---

## Pre-Commit Checklist

```bash
# Run before every commit
npm run build           # ✅ Must pass
npm run test:e2e        # ✅ Must pass (or specific tests)
/invariant all          # ✅ No violations
/rtl-check              # ✅ Hebrew/RTL compliant
```

**Also verify:**
- [ ] Change boundary respected
- [ ] Risk level declared
- [ ] No locked screen modifications (without approval)
- [ ] RBAC filters present (non-SuperAdmin queries)
- [ ] Hebrew-only text (no English)
- [ ] data-testid on interactive elements

---

## Integration with Other Skills

- `/invariant all` - Check all system invariants
- `/rbac-check` - Validate RBAC in queries
- `/rtl-check` - Validate Hebrew/RTL
- `/test-rbac` - Generate negative tests

---

**Protocol violations = Invalid solutions, even if they work.**
