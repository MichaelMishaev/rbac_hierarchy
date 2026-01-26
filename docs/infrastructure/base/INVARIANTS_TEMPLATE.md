# Project Invariants (Critical Guarantees)

**Purpose:** Document the 10-15 behaviors that MUST ALWAYS hold true in this system
**Audience:** Developers, AI assistants, QA engineers
**Rule:** ALL changes that affect these invariants MUST run full Tier 1 test suite

---

## 🎯 What is an Invariant?

An **invariant** is a system guarantee that:
- Must ALWAYS be true (no exceptions)
- If violated, causes serious bugs or security issues
- Is not obvious from code alone
- Requires explicit testing and runtime guards

**Examples:**
- "City Coordinators can only access their own city's data" (data isolation)
- "Activists are soft-deleted, never hard-deleted" (lifecycle)
- "All user mutations are logged to audit_logs" (audit trail)
- "UI is Hebrew-only with RTL layout" (localization)

---

## 🔒 System Invariants (Template - Adapt to Your Project)

### Category 1: Authentication & Authorization

#### INV-AUTH-001: Authentication Required
**Invariant:** All protected endpoints require valid authentication token
**Why critical:** Prevents unauthorized system access
**Test location:** `tests/e2e/auth/authentication.spec.ts`
**Runtime guard:** Middleware checks JWT token on all protected routes

#### INV-AUTH-002: [Add your auth invariant]
**Invariant:** [Description]
**Why critical:** [Impact if violated]
**Test location:** [File path]
**Runtime guard:** [Guard implementation]

---

### Category 2: Data Isolation (Multi-Tenant / RBAC)

#### INV-ISOLATION-001: Tenant Data Segregation
**Invariant:** User A cannot access User B's data (except SuperAdmin)
**Why critical:** Data leakage is a security and compliance violation
**Test location:** `tests/e2e/rbac/tenant-isolation.spec.ts`
**Runtime guard:** Prisma middleware injects `cityId`/`tenantId` filter automatically

#### INV-ISOLATION-002: [Add your isolation invariant]
**Invariant:** [Description]
**Why critical:** [Impact if violated]
**Test location:** [File path]
**Runtime guard:** [Guard implementation]

**Example for Election Campaign Project:**
```markdown
#### INV-ISOLATION-001: City Data Isolation
**Invariant:** City Coordinator can only access data for their assigned city
**Why critical:** Cross-city data access violates campaign data boundaries
**Test location:** `app/tests/e2e/rbac/city-isolation.spec.ts`
**Runtime guard:** `applyCityFilter()` middleware in all queries

#### INV-ISOLATION-002: Neighborhood Assignment
**Invariant:** Activist Coordinator can only manage activists in assigned neighborhoods
**Why critical:** Prevents unauthorized activist management
**Test location:** `app/tests/e2e/rbac/neighborhood-assignment.spec.ts`
**Runtime guard:** M2M table `activist_coordinator_neighborhoods` checked before operations
```

---

### Category 3: Lifecycle & State Management

#### INV-LIFECYCLE-001: Soft Deletes Only
**Invariant:** [Entity] records are soft-deleted (is_active = false), never hard-deleted
**Why critical:** Preserves audit trail and enables data recovery
**Test location:** `tests/integration/lifecycle/soft-delete.spec.ts`
**Runtime guard:** Prisma middleware blocks hard deletes on [Entity]

#### INV-LIFECYCLE-002: Valid State Transitions
**Invariant:** [Entity] can only transition between allowed states
**Why critical:** Invalid state transitions break business logic
**Test location:** `tests/integration/lifecycle/state-transitions.spec.ts`
**Runtime guard:** State machine validator in update methods

**Example for Election Campaign Project:**
```markdown
#### INV-LIFECYCLE-001: Activist Soft Deletes
**Invariant:** Activists are soft-deleted (is_active = false), never hard-deleted
**Why critical:** Preserves historical activist data for campaign analytics
**Test location:** `app/tests/integration/activists/soft-delete.spec.ts`
**Runtime guard:** Prisma middleware throws error if `activists.delete()` called

#### INV-LIFECYCLE-002: Attendance Record Immutability
**Invariant:** Attendance records cannot be modified after creation (only read)
**Why critical:** Audit trail for field activist attendance must be tamper-proof
**Test location:** `app/tests/integration/attendance/immutability.spec.ts`
**Runtime guard:** Update/delete operations on attendance_records rejected
```

---

### Category 4: Data Integrity

#### INV-DATA-001: Required Fields
**Invariant:** [Entity] MUST have [field1, field2, field3] populated
**Why critical:** Missing required data breaks business logic
**Test location:** `tests/integration/data-integrity/required-fields.spec.ts`
**Runtime guard:** DB constraints + ORM validation

#### INV-DATA-002: Foreign Key Integrity
**Invariant:** Referenced entities must exist (no orphaned records)
**Why critical:** Broken references cause query failures
**Test location:** `tests/integration/data-integrity/foreign-keys.spec.ts`
**Runtime guard:** Database foreign key constraints

**Example for Election Campaign Project:**
```markdown
#### INV-DATA-001: Activist Required Fields
**Invariant:** All activists MUST have full_name, phone, and neighborhood_id
**Why critical:** Activists without neighborhoods break assignment logic
**Test location:** `app/tests/integration/activists/required-fields.spec.ts`
**Runtime guard:** Prisma middleware validates fields on create/update

#### INV-DATA-002: Unique Activist per Neighborhood
**Invariant:** (neighborhood_id, full_name, phone) must be unique
**Why critical:** Prevents duplicate activist registrations
**Test location:** `app/tests/integration/activists/uniqueness.spec.ts`
**Runtime guard:** Database unique constraint on (neighborhood_id, full_name, phone)
```

---

### Category 5: Business Logic (Domain-Specific)

#### INV-BUSINESS-001: [Domain Rule]
**Invariant:** [Description of business rule]
**Why critical:** [Impact if violated]
**Test location:** [File path]
**Runtime guard:** [Guard implementation]

**Example for Election Campaign Project:**
```markdown
#### INV-BUSINESS-001: GPS Geofencing
**Invariant:** Attendance can only be recorded within 100m of site location
**Why critical:** Prevents fraudulent attendance marking from remote locations
**Test location:** `app/tests/integration/attendance/geofencing.spec.ts`
**Runtime guard:** GPS distance validation in `recordAttendance()` service

#### INV-BUSINESS-002: Organization Tree Visibility
**Invariant:** Users only see their subtree (not above their level)
**Why critical:** RBAC hierarchy must be enforced in UI
**Test location:** `app/tests/e2e/org-tree/visibility.spec.ts`
**Runtime guard:** Tree filtering logic in `getOrganizationTree()` service
```

---

### Category 6: Localization & Internationalization

#### INV-I18N-001: [Locale Requirement]
**Invariant:** [Description]
**Why critical:** [Impact if violated]
**Test location:** [File path]
**Runtime guard:** [Guard implementation]

**Example for Election Campaign Project:**
```markdown
#### INV-I18N-001: Hebrew-Only UI
**Invariant:** All UI text is Hebrew with RTL layout (no English fallbacks)
**Why critical:** System designed for Hebrew-speaking campaign workers
**Test location:** `app/tests/e2e/i18n/hebrew-only.spec.ts`
**Runtime guard:** Build-time i18n validation checks for missing translations

#### INV-I18N-002: RTL Layout
**Invariant:** All components use dir="rtl" and logical CSS properties
**Why critical:** LTR layout breaks usability for Hebrew users
**Test location:** `app/tests/e2e/i18n/rtl-layout.spec.ts`
**Runtime guard:** Visual regression tests for RTL layout
```

---

### Category 7: API Contracts

#### INV-API-001: Response Shape Stability
**Invariant:** API response shape matches schema (no unexpected fields/types)
**Why critical:** Breaking changes break client applications
**Test location:** `tests/integration/api/contracts.spec.ts`
**Runtime guard:** Zod schema validation on all API responses

**Example for Election Campaign Project:**
```markdown
#### INV-API-001: User Response Shape
**Invariant:** GET /api/users returns { id, email, role, cityId, createdAt }
**Why critical:** Frontend depends on this structure
**Test location:** `app/tests/integration/api/users-contract.spec.ts`
**Runtime guard:** Zod schema validation in API route handler
```

---

### Category 8: Audit & Compliance

#### INV-AUDIT-001: Mutation Logging
**Invariant:** All data mutations (create/update/delete) are logged to audit_logs
**Why critical:** Compliance requirement for change tracking
**Test location:** `tests/integration/audit/mutation-logging.spec.ts`
**Runtime guard:** Prisma middleware logs all mutations automatically

**Example for Election Campaign Project:**
```markdown
#### INV-AUDIT-001: Activist Changes Logged
**Invariant:** All activist create/update/soft-delete operations logged
**Why critical:** Campaign needs audit trail of activist management
**Test location:** `app/tests/integration/audit/activist-audit.spec.ts`
**Runtime guard:** Prisma middleware logs to audit_logs table
```

---

## 🎯 How to Use This Document

### When Writing Code
1. **Check invariants** affected by your change
2. **Run Tier 1 tests** for affected invariants
3. **Add behavior lock tests** if invariant could regress

### When Reviewing PRs
1. **Identify affected invariants** in PR description
2. **Verify tests run** for affected invariants
3. **Check runtime guards** are still in place

### When Adding New Features
1. **Document new invariants** if introducing critical guarantees
2. **Write explicit tests** for new invariants
3. **Add runtime guards** for security-critical invariants

---

## 📊 Invariant Status Dashboard

| ID | Invariant | Test Coverage | Runtime Guard | Last Verified |
|----|-----------|---------------|---------------|---------------|
| AUTH-001 | Authentication required | ✅ 100% | ✅ Middleware | 2025-12-15 |
| ISOLATION-001 | Tenant segregation | ✅ 98% | ✅ ORM middleware | 2025-12-15 |
| LIFECYCLE-001 | Soft deletes only | ✅ 95% | ✅ ORM middleware | 2025-12-14 |
| DATA-001 | Required fields | ✅ 100% | ✅ DB + ORM | 2025-12-14 |
| BUSINESS-001 | [Domain rule] | ⚠️ 75% | ❌ Missing | [Date] |

**Legend:**
- ✅ Green: Full coverage + runtime guard
- ⚠️ Yellow: Partial coverage or missing guard
- ❌ Red: No coverage or no guard (URGENT)

---

## 🚨 Invariant Violations (Recent)

### [YYYY-MM-DD] INV-ISOLATION-001 Violated
**Description:** City Coordinator accessed another city's data
**Root Cause:** Middleware bypassed in refactor
**Fix:** Re-added middleware check in PR #123
**Prevention:** Added negative test for cross-city access

---

## 📝 Adding New Invariants

**Template for new invariants:**

```markdown
#### INV-[CATEGORY]-[NUMBER]: [Short Name]
**Invariant:** [Clear, testable statement of what must always be true]
**Why critical:** [Impact if violated - security, data integrity, compliance, UX]
**Test location:** [Path to test file]
**Runtime guard:** [Description of guard implementation]
**Added:** [Date]
**Owner:** [Team/person responsible]
```

**Review process:**
1. Propose new invariant in team discussion
2. Write tests that validate invariant
3. Implement runtime guards (if applicable)
4. Document in this file
5. Add to CI/CD Tier 1 test suite

---

## 🔗 Related Documents

- `baseRules.md` - Universal development protocols
- `EXECUTION_CHECKLIST.md` - AI enforcement checklist
- `CRITICAL_TESTS.md` - List of critical test scenarios
- Project's `CLAUDE.md` - Project-specific architecture

---

**Instructions for Your Project:**

1. **Copy this template** to your project's docs folder (e.g., `docs/infrastructure/INVARIANTS.md`)
2. **Delete the examples** and fill in your project's actual invariants
3. **Start with 10-15 invariants** (most critical ones)
4. **Update regularly** as you discover new invariants or fix bugs
5. **Reference in CLAUDE.md** so AI assistants check this file

**Example location:** `docs/infrastructure/qa/INVARIANTS.md`

---

**Last Updated:** 2025-12-16
**Version:** 1.0 (Template for baseRules.md v2.0)
