# 🎯 AI Development Rules - Election Campaign System

**Status:** ACTIVE - Single Source of Truth
**Purpose:** Prevent RBAC data leakage, Hebrew/RTL violations, and regression bugs
**Audience:** AI assistants and developers
**Last Updated:** 2025-12-21

> **If any rule below is violated, the solution is considered INVALID, even if it works.**

---

## 1. WHY THESE RULES EXIST

This campaign management system has **3 critical failure modes:**

1. **RBAC data leakage** → City Coordinator sees Tel Aviv + Jerusalem data
2. **Hebrew/RTL violations** → English text appears, layout breaks for activists
3. **Known bugs recurring** → Same RBAC mistake happens 3 times

**These rules prevent those failures.** Speed without control creates regressions that destroy campaign operations.

---

## 2. CORE PRINCIPLES

- **Behavior > implementation** - User flows are sacred, code is replaceable
- **Tests are public API** - Breaking tests = breaking contracts
- **Refactors must not change behavior** - If flow changes, it's not a refactor
- **Predictability beats elegance** - Boring, stable code wins during campaign season

---

## 3. SYSTEM INVARIANTS (NEVER VIOLATE)

### 3.1 RBAC Data Isolation (CRITICAL)

**INV-RBAC-001: City Data Isolation**
- **Rule:** City Coordinator ONLY sees their assigned city's data
- **Why critical:** Cross-city data access violates campaign boundaries (election disaster)
- **Test:** `app/tests/e2e/rbac/city-isolation.spec.ts`
- **Code:** ALL queries MUST filter by `city_id` (except SuperAdmin)

**INV-RBAC-002: Activist Coordinator Neighborhood Assignment**
- **Rule:** Activist Coordinator ONLY manages activists in assigned neighborhoods (M2M)
- **Why critical:** Prevents unauthorized activist management
- **Test:** `app/tests/e2e/rbac/neighborhood-assignment.spec.ts`
- **Code:** Validate against `activist_coordinator_neighborhoods` M2M table

**INV-RBAC-003: SuperAdmin Seed-Only**
- **Rule:** SuperAdmin ONLY created via database/seed (`is_super_admin = true`)
- **Why critical:** Prevents privilege escalation
- **Test:** API endpoints reject SuperAdmin creation attempts
- **Code:** NEVER expose `is_super_admin` flag in UI/API

**INV-RBAC-004: Area Manager Scope**
- **Rule:** Area Manager ONLY sees cities in their assigned area
- **Why critical:** Regional data isolation
- **Test:** `app/tests/e2e/rbac/area-isolation.spec.ts`
- **Code:** Filter by `areaManagerId` in cities queries

### 3.2 Hebrew/RTL Invariants (CRITICAL)

**INV-I18N-001: Hebrew-Only UI**
- **Rule:** ALL UI text is Hebrew with NO English fallbacks
- **Why critical:** System designed for Hebrew-speaking campaign workers
- **Test:** E2E tests fail if English text detected
- **Code:** All i18n keys MUST have Hebrew translations

**INV-I18N-002: RTL Layout**
- **Rule:** ALL components use `dir="rtl"` and `lang="he"`
- **Why critical:** LTR layout breaks usability for Hebrew users
- **Test:** Visual regression tests for RTL
- **Code:** Use `marginInlineStart/End` (NOT `marginLeft/Right`)

**INV-I18N-003: Locale Consistency**
- **Rule:** Default locale `he-IL`, timezone `Asia/Jerusalem`, NO locale switching
- **Why critical:** System is Hebrew-only, not multilingual
- **Code:** Hard-coded in config files

### 3.3 Data Integrity Invariants

**INV-DATA-001: Activist Soft Deletes**
- **Rule:** Activists are soft-deleted (`is_active = false`), NEVER hard-deleted
- **Why critical:** Preserves historical data for campaign analytics
- **Test:** `app/tests/integration/activists/soft-delete.spec.ts`
- **Code:** Block `activists.delete()` in Prisma middleware

**INV-DATA-002: Activist Uniqueness**
- **Rule:** `(neighborhood_id, full_name, phone)` must be unique
- **Why critical:** Prevents duplicate activist registrations
- **Test:** Database constraint validation
- **Code:** Unique constraint enforced at DB level

**INV-DATA-003: Attendance Immutability**
- **Rule:** Attendance records cannot be modified after creation (read-only)
- **Why critical:** Audit trail for field activist attendance must be tamper-proof
- **Test:** Update/delete operations rejected
- **Code:** Block update/delete in server actions

### 3.4 Mobile & GPS Invariants

**INV-MOBILE-001: Mobile-First Attendance**
- **Rule:** Attendance recording MUST work on mobile devices (320px+)
- **Why critical:** Field activists use phones, not desktops
- **Test:** Mobile viewport E2E tests
- **Code:** Responsive design with touch targets

**INV-GPS-001: GPS Required for Attendance** (Optional - if geofencing enabled)
- **Rule:** Attendance recorded with GPS coordinates
- **Why critical:** Prevents fraudulent remote attendance
- **Test:** Attendance creation without GPS rejected
- **Code:** GPS validation in `recordAttendance()` service

---

## 4. NEGATIVE TESTING REQUIREMENT (MANDATORY)

Every permission, validation, or boundary MUST have a **negative test** (test that access is DENIED).

**Required negative tests:**
- ❌ City Coordinator tries to access Jerusalem (assigned to Tel Aviv) → **403**
- ❌ Activist Coordinator edits non-assigned neighborhood → **403**
- ❌ API called without `city_id` filter (non-SuperAdmin) → **Query returns empty**
- ❌ UI component renders with English text → **Test fails**
- ❌ Component without `dir="rtl"` → **Test fails**
- ❌ Hard delete activist → **Prisma middleware blocks**

**Rule:** Fixing a bug without adding a negative test = protocol violation.

---

## 5. BUG KNOWLEDGE BASE DISCIPLINE

### 5.1 AI Must Read Bugs Before Coding

**Before implementing any change, AI MUST:**
1. Read `/docs/infrastructure/bugs.md` (scan for related issues)
2. If similar bug exists → mention it, avoid the pattern
3. After fixing a bug → document it (required for Definition of Done)

### 5.2 Bug Documentation Format (SHORT)

```markdown
## BUG-2025-12-CITY-LEAK
**What:** City coordinator saw activists from different city
**Cause:** Missing `city_id` filter in `activist.findMany()`
**Fix:** Added `where: { neighborhood: { city_id } }`
**Prevention:** ALL queries must filter by city (see INV-RBAC-001)
```

**Rules:**
- Be concise (5-10 lines max)
- No blame, no story, just facts
- Focus on cause + prevention

---

## 6. CHANGE BOUNDARY DECLARATION (MANDATORY)

Before coding, AI MUST declare:

**CHANGE BOUNDARY:**
```
✅ Allowed:
- app/manage-voters/VotersList.tsx
- app/manage-voters/components/ExcelUpload.tsx

❌ Forbidden:
- Auth flows
- RBAC middleware
- Other pages
- Locked flows (see GOLDEN_PATHS.md)
```

**Enforcement:**
- Changes outside declared boundary = INVALID
- "While I was here" refactors = FORBIDDEN
- One logical change per task

---

## 7. LOCKED FLOWS & GOLDEN PATHS

### 7.1 What Gets Locked?

Lock **5-8 CRITICAL flows** (not every button):
1. **Login → Dashboard** (auth flow)
2. **Record Attendance + GPS** (field activists depend on this)
3. **Assign Activist to Neighborhood** (RBAC creation)
4. **Create City** (SuperAdmin only)
5. **Excel Voter Import** (data integrity)
6. **Organization Tree** (hierarchy visualization)
7. **Cities Page** (`/cities`) - **LOCKED 2025-12-15** (SuperAdmin + Area Manager only)
8. **Manage Voters Page** (`/manage-voters`) - **LOCKED 2025-12-20** (Excel import stable)

### 7.2 What "Locked" Means

When a flow is LOCKED, AI MUST NOT:
- ❌ Change `data-testid` (breaks E2E tests)
- ❌ Change user flow (add/remove steps, change navigation)
- ❌ Change RBAC checks
- ❌ Change i18n keys or meaning

AI MAY:
- ✅ Refactor internals (if tests pass unchanged)
- ✅ Improve performance
- ✅ Fix bugs (with regression tests)

### 7.3 Unlock Protocol

To modify LOCKED behavior:
```
🔓 REQUEST UNLOCK: ATTENDANCE_RECORD_V1
Reason: Add GPS geofencing validation
Impact: Flow changes (new GPS validation step)
Files: app/attendance/RecordAttendance.tsx, server actions
Tests: Will update E2E tests for GPS flow
```

**No changes allowed until explicit approval.**

---

## 8. RISK-BASED CHANGE CLASSIFICATION (MANDATORY)

Before implementation, AI MUST classify the task:

### 🔴 HIGH RISK
**Affects:**
- RBAC permissions or data isolation
- Auth flows
- City/area filtering logic
- Data deletion
- Organization hierarchy

**Requirements:**
- Explicit plan before coding
- Negative tests (verify access is DENIED)
- Check all RBAC invariants (INV-RBAC-*)
- Run full RBAC test suite

### 🔸 MEDIUM RISK
**Affects:**
- Voter management
- Task assignments
- Attendance features
- Neighborhood operations

**Requirements:**
- E2E tests for affected flows
- Integration tests
- Check data integrity invariants

### 🔹 LOW RISK
**Affects:**
- UI styling (colors, spacing, borders)
- Hebrew translations (no new keys)
- Mobile responsive tweaks
- Non-behavioral changes

**Requirements:**
- Visual regression check
- RTL layout verification
- Mobile viewport test

**Enforcement:** If risk level not declared → AI MUST STOP AND ASK.

---

## 9. AUTOMATION & TESTABILITY (MANDATORY)

### 9.1 data-testid Required

**Every interactive element MUST have `data-testid`:**
- ✅ Buttons
- ✅ Inputs
- ✅ Forms
- ✅ Modals
- ✅ Menus
- ✅ Navigation links

**Example:**
```tsx
<Button data-testid="attendance-submit">רשום נוכחות</Button>
<TextField data-testid="activist-name" />
```

### 9.2 Selector Stability

- UI refactors MUST NOT break selectors
- Tests are part of the contract
- Visual change ≠ selector change

---

## 10. HEBREW/RTL DEVELOPMENT RULES

### 10.1 NO Hard-Coded Strings

**Not allowed:**
- ❌ `<Button>Submit</Button>` (hard-coded)
- ❌ `<Button>שלח</Button>` (hard-coded Hebrew)
- ❌ Placeholder text in components

**Allowed:**
- ✅ `<Button>{t('common.submit')}</Button>` (i18n key)
- ✅ Database-driven content
- ✅ Zod error messages from i18n

### 10.2 RTL CSS Rules

**Use logical properties:**
```css
/* ✅ CORRECT */
marginInlineStart: '16px'  /* Becomes margin-right in RTL */
marginInlineEnd: '16px'    /* Becomes margin-left in RTL */

/* ❌ WRONG */
marginLeft: '16px'   /* Breaks RTL layout */
marginRight: '16px'  /* Breaks RTL layout */
```

**Always include:**
```tsx
<Box dir="rtl" lang="he">
  {/* content */}
</Box>
```

---

## 11. BUG FIX DISCIPLINE (MANDATORY)

When fixing a bug, AI MUST:

1. **Identify root cause** (not symptoms - 1-3 bullets)
2. **Add regression test** (must fail before fix, pass after)
3. **Apply minimal fix** (smallest change that fixes root cause)
4. **Verify invariants** (check all affected INV-* rules)
5. **Document in bugs.md** (5-10 lines)

**A bug fix without documentation or regression test is INCOMPLETE.**

---

## 12. ASSUMPTION DECLARATION (MANDATORY)

AI must explicitly state assumptions before coding:

**Examples:**
- "I assume this query is city-scoped (not SuperAdmin)"
- "I assume user is authenticated (protected route)"
- "I assume this is mobile-first (activists use phones)"
- "I assume Hebrew-only (no i18n fallbacks)"
- "I assume soft delete (activist.is_active = false)"

**If assumption is unclear → ASK FIRST.**

---

## 13. REGRESSION PREVENTION RULES

- ❌ No refactoring outside task scope
- ❌ No silent behavior changes
- ❌ No "while I was here" improvements
- ✅ One logical change per task
- ✅ Additive changes preferred

**If behavior changes:**
- Explain what changed
- Explain why
- Explain impact
- Update tests

---

## 14. DEFINITION OF DONE

A task is DONE only if:

- ✅ Code builds (`npm run build` passes)
- ✅ Tests pass (`npm run test:e2e` passes)
- ✅ No RBAC data leakage (invariants respected)
- ✅ Hebrew/RTL compliant (no English, dir="rtl")
- ✅ No hard-coded values (i18n keys used)
- ✅ Automation selectors exist (`data-testid`)
- ✅ Golden Paths respected (no locked flow changes)
- ✅ Change boundary respected (no out-of-scope changes)
- ✅ Bug documented (if applicable)
- ✅ Negative tests added (for RBAC/permissions)
- ✅ Risk classification declared

---

## 15. AI ENFORCEMENT CLAUSE

- **If a request violates this document** → AI must refuse
- **If rules conflict** → Ask for clarification
- **If assumption unclear** → Ask before coding
- **If locked flow affected** → Request unlock approval
- **Never assume exceptions**

---

## 16. CAMPAIGN SEASON CONTEXT

This system runs during **active election campaigns:**

- **Speed matters** - but not at the cost of RBAC violations
- **Mobile matters** - activists are in the field, not at desks
- **Hebrew matters** - no English fallbacks allowed
- **Data isolation matters** - cross-city leaks are election disasters

**Balance speed with safety:**
- 🟢 Safe to iterate quickly: UI styling, mobile responsiveness, Hebrew translations
- 🔴 Slow down and test: RBAC changes, data filters, auth flows, locked pages

---

## 17. QUICK REFERENCE CARD

```
╔═══════════════════════════════════════════════╗
║  BEFORE CODING - ALWAYS ASK:                  ║
╠═══════════════════════════════════════════════╣
║  1. Which invariants does this affect?        ║
║  2. What's my change boundary?                ║
║  3. What's the risk level (🔴🔸🔹)?          ║
║  4. Are any flows LOCKED?                     ║
║  5. Do I need negative tests?                 ║
║  6. Is this Hebrew/RTL compliant?             ║
╚═══════════════════════════════════════════════╝
```

**Critical Invariants:**
- **RBAC:** Filter by city/area (INV-RBAC-001 to 004)
- **Hebrew/RTL:** No English, dir="rtl" (INV-I18N-001 to 003)
- **Data:** Soft deletes, uniqueness (INV-DATA-001 to 003)
- **Mobile:** 320px+ viewport support (INV-MOBILE-001)

**Locked Pages:**
- `/cities` (SuperAdmin + Area Manager only)
- `/manage-voters` (Excel import stable)

**Risk Levels:**
- 🔴 RBAC/Auth/Filters → Full test suite
- 🔸 Features/Forms → E2E tests
- 🔹 UI/Styling → Visual regression

---

## 18. RELATED DOCUMENTS

### Critical References (READ FIRST)
- **RBAC Single Source of Truth:** `/docs/infrastructure/roles/PERMISSIONS_MATRIX.md`
- **Project Instructions:** `/CLAUDE.md`
- **Bug Knowledge Base:** `/docs/infrastructure/bugs.md`

### Role-Specific Documentation
- SuperAdmin: `/docs/infrastructure/roles/superAdminRoles.md`
- Area Manager: `/docs/infrastructure/roles/areManagerRoles.md`
- City Coordinator: `/docs/infrastructure/roles/cityCoordinatorRoles.md`
- Activist Coordinator: `/docs/infrastructure/roles/activistCoordinatorRoles.md`
- Hierarchy: `/docs/infrastructure/roles/hierarchy.md`

### Test Documentation
- QA Instructions: `/docs/infrastructure/qa/qaInstructions.md`
- Automation Plan: `/docs/infrastructure/qa/automations/QUICK_START.md`
- Critical Scenarios: `/docs/infrastructure/qa/critical-test-scenarios.md`

---

## 19. INVARIANT VIOLATIONS (RECENT)

### Example Entry (DELETE THIS, ADD REAL VIOLATIONS)
```markdown
### 2025-12-15: INV-RBAC-001 Violated
**Description:** City Coordinator accessed activists from Jerusalem (assigned to Tel Aviv)
**Root Cause:** Missing `city_id` filter in `getActivists()` server action
**Fix:** Added `where: { neighborhood: { city_id: session.user.cityId } }`
**Prevention:** Added negative test `city-coordinator-cross-city.spec.ts`
```

---

## FINAL NOTE

This document exists because:
- AI is fast
- Fast without rules creates RBAC violations
- RBAC violations during campaigns are **election disasters**

**This is not bureaucracy. This is damage control.**

When in doubt:
1. Read the invariants (section 3)
2. Check PERMISSIONS_MATRIX.md
3. Ask the user

**Hebrew-only. RTL-only. City-scoped. Mobile-first. Campaign-focused.**

---

**Last Updated:** 2025-12-21
**Version:** 2.0 - Campaign System
**Status:** ✅ Active - Single Source of Truth
