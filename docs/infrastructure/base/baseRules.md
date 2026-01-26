# 🎯 AI Development Rules - Election Campaign System

**Status:** ACTIVE - Single Source of Truth
**Purpose:** Prevent RBAC data leakage, Hebrew/RTL violations, and regression bugs
**Audience:** AI assistants and developers
**Last Updated:** 2026-01-01

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

**INV-DATA-004: Universal Soft Delete Rule (CRITICAL)**
- **Rule:** NEVER perform hard deletes (physical DELETE operations) on ANY user data - ONLY soft deletes
- **Why critical:** Preserves data integrity, audit trails, and prevents catastrophic data loss
- **Test:** ALL delete operations MUST set flags like `is_active = false`, `deletedAt = DateTime`, etc.
- **Code:** Use Prisma middleware to block `.delete()` and `.deleteMany()` on protected tables
- **Exceptions:** NONE for user data - Only system/temporary data (sessions, tokens, cache)
- **Implementation:** Add `is_active`, `deletedAt`, `deletedBy` columns to all core tables
- **Enforcement:** Code review required for ANY `.delete()` or `.deleteMany()` operations

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

### 3.5 Security Invariants (CRITICAL - Added 2025-12-29)

**INV-SEC-001: No Physical Database Deletes**
- **Rule:** NEVER create endpoints or functions that physically delete all data
- **Why critical:** Catastrophic risk - can destroy entire production database
- **Test:** `grep -r "deleteMany\|truncate\|DROP" api/` should find NO admin endpoints
- **Code:** Use soft deletes (`is_active = false`) for all user data
- **Prevention:** Code review required for any `.delete()` or `.deleteMany()` operations

**INV-SEC-002: Attendance Immutability Enforcement**
- **Rule:** Attendance records MUST use soft-cancel, NEVER physical delete
- **Why critical:** Preserves audit trail for campaign compliance
- **Test:** `app/tests/e2e/attendance/immutability.spec.ts`
- **Code:** Use `UPDATE` with `cancelledAt/cancelledBy` fields, not `DELETE`
- **Schema:** `cancelledAt DateTime?`, `cancelledBy String?` fields required

**INV-SEC-003: API Authentication Required**
- **Rule:** ALL API endpoints MUST require authentication (except public health checks)
- **Why critical:** Prevents unauthorized access to campaign data
- **Test:** `curl -I http://localhost:3000/api/* → 401 Unauthorized` (no session)
- **Code:** Use `requireAuth()` or `requireRole()` helpers from `lib/api-auth.ts`
- **Exceptions:** `/api/health` only

**INV-SEC-004: No Hardcoded Credentials**
- **Rule:** NEVER include test credentials, passwords, or secrets in source code
- **Why critical:** Credentials exposed in production bundle create backdoors
- **Test:** `grep -r "admin123\|password.*=.*['\"]" .next/static/` → NO RESULTS
- **Code:** Use environment variables, dev-only components with webpack stripping
- **Prevention:** Secrets in `.env.local`, test data in separate dev components

**INV-SEC-005: JWT Token Management**
- **Rule:** JWT tokens MUST expire within 7 days, implement token blacklist on logout
- **Why critical:** Prevents long-lived compromised tokens
- **Test:** Session cookie `maxAge` = 7 days, logout blacklists JTI in Redis
- **Code:** `auth.config.ts` maxAge, `lib/token-blacklist.ts` for revocation
- **Implementation:** JTI (JWT ID) required for tracking, Redis TTL = token lifetime

**INV-SEC-006: HTTPS Enforcement**
- **Rule:** HSTS headers MUST be enabled in production
- **Why critical:** Prevents downgrade attacks, forces HTTPS
- **Test:** `curl -I https://domain.com | grep "Strict-Transport-Security"`
- **Code:** `next.config.ts` headers with `max-age=31536000; includeSubDomains`
- **Additional:** X-XSS-Protection, Permissions-Policy headers required

**INV-SEC-007: M2M Relationship Integrity**
- **Rule:** Many-to-Many queries MUST use correct foreign keys, not legacy fields
- **Why critical:** Broken FK references cause authorization bypass
- **Test:** `grep -r "legacyActivistCoordinatorUserId" actions/` → NO RESULTS
- **Code:** 2-step query pattern: `findFirst({ userId })` → `findMany({ activistCoordinatorId })`
- **Schema:** Use `activistCoordinatorId` FK from M2M table, not `userId` directly

**INV-SEC-008: Input Validation & Sanitization**
- **Rule:** ALL user inputs MUST be validated with Zod schemas before processing
- **Why critical:** Prevents injection attacks, data corruption
- **Test:** Invalid inputs rejected with validation errors
- **Code:** Zod schemas for all server actions, API routes
- **SQL Injection:** Prisma ORM provides parameterization (safe)

**INV-SEC-009: Error Message Security**
- **Rule:** Error messages MUST NOT expose sensitive data (IDs, emails, SQL queries)
- **Why critical:** Information disclosure aids attackers
- **Test:** Production error responses contain generic messages only
- **Code:** Return `{ error: 'אירעה שגיאה' }` in Hebrew, log details server-side only
- **Exception:** Development mode can show detailed errors

**INV-SEC-010: Admin Endpoint Restrictions**
- **Rule:** Admin endpoints MUST require SuperAdmin role + audit logging
- **Why critical:** Prevents privilege escalation, ensures accountability
- **Test:** Non-SuperAdmin requests → 403 Forbidden
- **Code:** Use `requireSuperAdmin()` helper, log to `audit_logs` table
- **Dangerous Operations:** Database migrations, user deletion, RBAC changes

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

### 4.1 Security Negative Tests (MANDATORY - Added 2025-12-29)

Every security control MUST have negative tests:

**Authentication:**
- ❌ Unauthenticated API request → **401 Unauthorized**
- ❌ Invalid JWT token → **401 Unauthorized**
- ❌ Expired JWT token → **401 Unauthorized**
- ❌ Blacklisted token (after logout) → **401 Unauthorized**

**Authorization (RBAC):**
- ❌ City Coordinator accessing SuperAdmin endpoint → **403 Forbidden**
- ❌ Activist Coordinator managing non-assigned neighborhood → **403 Forbidden**
- ❌ Area Manager accessing cities outside their area → **403 Forbidden**

**Input Validation:**
- ❌ Invalid Zod schema input → **Validation error with Hebrew message**
- ❌ SQL injection attempt → **Parameterized query blocks injection**
- ❌ XSS payload in text field → **Sanitized or rejected**

**Data Isolation:**
- ❌ Query without `city_id` filter (non-SuperAdmin) → **Empty results or error**
- ❌ Cross-city data access → **Filtered out, not visible**

**Security Headers:**
- ❌ HTTP request to production → **Redirected to HTTPS (HSTS)**
- ❌ Missing security headers → **Build/test fails**

**Rule:** Security fix without negative test = INCOMPLETE FIX.

---

## 5. BUG KNOWLEDGE BASE DISCIPLINE

### 5.1 AI Must Read Bugs Before Coding

**Before implementing any change, AI MUST:**
1. Read `/docs/bugs` folder (scan `bugs-current.md` and highest-numbered `bugs-*.md` file for similar issues)
2. If similar bug exists → mention it, avoid the pattern
3. After fixing a bug → document it in the latest numbered file (see section 5.3 for file management)

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

### 5.3 Bug File Management (MANDATORY)

**File Organization Strategy:**
1. **Check the highest-numbered file first**: Find the file with the biggest number (e.g., `bugs-003.md`)
2. **Add to the latest numbered file**: Document new bugs in the highest-numbered file
3. **File size limit**: If file exceeds ~200KB, create the next numbered file
4. **Naming convention**: Use 3-digit sequential numbers `bugs-001.md`, `bugs-002.md`, `bugs-003.md`, etc.
5. **Bootstrap from bugs-current.md**: If no numbered files exist and `bugs-current.md` > 200KB, rename it to `bugs-001.md`

**AI Workflow (BEFORE adding a bug):**
```bash
# Step 1: Find the latest numbered file
latest=$(ls -1 /docs/bugs/bugs-[0-9]*.md 2>/dev/null | sort -V | tail -1)

# Step 2: If no numbered files exist, check bugs-current.md size
if [ -z "$latest" ]; then
  size=$(du -k /docs/bugs/bugs-current.md | cut -f1)
  if [ "$size" -gt 200 ]; then
    # Bootstrap: Rename bugs-current.md to bugs-001.md
    mv /docs/bugs/bugs-current.md /docs/bugs/bugs-001.md
    latest="bugs-001.md"
  else
    # Add to bugs-current.md (under limit)
    latest="bugs-current.md"
  fi
fi

# Step 3: Check if latest file is over 200KB
size=$(du -k "$latest" | cut -f1)
if [ "$size" -gt 200 ]; then
  # Extract number and increment: bugs-003.md → bugs-004.md
  num=$(basename "$latest" .md | grep -o '[0-9]*$')
  next=$(printf "bugs-%03d.md" $((10#$num + 1)))
  # Create new file with next number
  touch "/docs/bugs/$next"
  latest="$next"
fi

# Step 4: Add bug to $latest file
echo "Adding bug to: $latest"
```

**Example Progression:**
```
# Initial state (no numbered files yet)
/docs/bugs/
└── bugs-current.md (214KB) ← Over limit!

# AI detects over 200KB → Bootstrap to bugs-001.md
/docs/bugs/
└── bugs-001.md (214KB) ← Renamed from bugs-current.md

# AI adds more bugs → bugs-001.md grows to 245KB
/docs/bugs/
└── bugs-001.md (245KB) ← Over limit again!

# AI creates next numbered file
/docs/bugs/
├── bugs-001.md (245KB - full)
└── bugs-002.md (15KB) ← New bugs go here

# Final state with multiple files
/docs/bugs/
├── bugs-001.md (245KB - archived)
├── bugs-002.md (230KB - archived)
├── bugs-003.md (178KB) ← Current, add here
└── bugs-archive-2025-12-22.md (312KB - old archive)
```

**Mandatory Rules:**
- ✅ **ALWAYS check file size** before adding (use `du -k` command)
- ✅ **Use 3-digit zero-padded naming** (`bugs-001.md`, `bugs-002.md`, not `bugs-1.md`)
- ✅ **Find highest number** with `ls -1 | sort -V | tail -1`
- ✅ **Bootstrap from bugs-current.md** if it's over 200KB and no numbered files exist
- ✅ **Create next sequential number** when current file exceeds 200KB
- ❌ **Don't skip numbers** in sequence (no bugs-001.md → bugs-003.md)
- ❌ **Don't add to full files** (files over 200KB are considered archived)
- ❌ **Don't use bugs-current.md** once numbered system starts

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

### 8.1 Security Risk Classification (MANDATORY - Added 2025-12-29)

When implementing any feature, AI MUST classify security risk:

### 🔴 CRITICAL SECURITY RISK
**Triggers:**
- Creating/modifying API endpoints
- Implementing authentication/authorization
- Database operations (especially deletes)
- User session management
- Admin functionality
- File uploads/downloads
- External API integrations

**Requirements:**
- Read ALL security invariants (INV-SEC-001 to 010)
- Use security helpers (`lib/api-auth.ts`)
- Add authentication checks (`requireAuth()`, `requireRole()`, `requireSuperAdmin()`)
- Implement audit logging for sensitive operations
- Add comprehensive negative tests
- Verify input validation with Zod schemas
- Check for information disclosure in errors
- Test with multiple roles (positive AND negative tests)

**Checklist:**
- [ ] Authentication required? (INV-SEC-003)
- [ ] Authorization enforced? (role-based checks)
- [ ] Input validated? (Zod schemas, INV-SEC-008)
- [ ] Errors sanitized? (no sensitive data, INV-SEC-009)
- [ ] Audit logged? (sensitive operations, INV-SEC-010)
- [ ] Soft deletes only? (no physical deletes, INV-SEC-001)
- [ ] RBAC filters applied? (city/area scoping)
- [ ] Negative tests added? (verify denial)

### 🟠 ELEVATED SECURITY RISK
**Triggers:**
- Modifying existing API routes
- Changing RBAC logic
- Database query modifications
- Session/token handling
- User data operations

**Requirements:**
- Review existing security controls
- Maintain authentication/authorization
- Preserve audit logging
- Update relevant tests
- Verify no security regression

### 🟢 STANDARD SECURITY REVIEW
**Triggers:**
- UI components (but check for XSS)
- Client-side validation (server-side required too)
- Styling changes
- Hebrew/RTL adjustments

**Requirements:**
- Verify no sensitive data exposed in client code
- Ensure server-side validation exists
- Check for XSS vulnerabilities in dynamic content

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
5. **Document in `/docs/bugs` folder** (add to highest-numbered `bugs-*.md` file, see section 5.3)

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

## 17. SECURITY CODE REVIEW CHECKLIST (MANDATORY - Added 2025-12-29)

Before committing ANY code, AI MUST verify:

### Authentication & Authorization
- [ ] API route has `requireAuth()` or `requireRole()` check
- [ ] Server action verifies user session
- [ ] SuperAdmin-only operations use `requireSuperAdmin()`
- [ ] RBAC filters applied (city/area scoping)
- [ ] M2M relationships use correct FKs (not legacy fields)

### Data Protection
- [ ] NO physical deletes (use soft delete with `is_active = false`)
- [ ] Attendance uses soft-cancel pattern (cancelledAt/cancelledBy)
- [ ] User input validated with Zod schemas
- [ ] Database queries use Prisma (parameterized, safe from SQL injection)
- [ ] Sensitive data filtered before returning to client

### Security Headers & Configuration
- [ ] HSTS header enabled in production (`next.config.ts`)
- [ ] JWT maxAge ≤ 7 days (`auth.config.ts`)
- [ ] JTI (JWT ID) generated for token tracking
- [ ] Token blacklist on logout implemented
- [ ] NO hardcoded credentials in source code

### Error Handling & Logging
- [ ] Error messages generic in Hebrew (`אירעה שגיאה`)
- [ ] Detailed errors logged server-side only
- [ ] NO sensitive data in error responses (IDs, emails, queries)
- [ ] Audit logging for sensitive operations (admin actions)

### Testing
- [ ] Negative tests added (verify access DENIED)
- [ ] Multiple roles tested (positive and negative)
- [ ] Unauthenticated requests return 401
- [ ] Unauthorized requests return 403
- [ ] Invalid inputs return validation errors

### Vulnerability Prevention
- [ ] NO endpoints that delete all data
- [ ] NO endpoints accessible without authentication
- [ ] NO test credentials in production bundle
- [ ] NO broken M2M foreign key references
- [ ] NO information disclosure in errors

---

## 18. VULNERABILITY PREVENTION GUIDELINES (Added 2025-12-29)

### Preventing Catastrophic Data Loss
**NEVER:**
- ❌ Create endpoints with `.deleteMany()` on core tables
- ❌ Implement "restore" or "reset" functions accessible via API
- ❌ Allow physical deletion of historical data (attendance, activists)
- ❌ Expose database management operations to web UI

**ALWAYS:**
- ✅ Use soft deletes (`is_active = false`)
- ✅ Require database migrations via npm scripts only
- ✅ Implement confirmation dialogs for destructive operations
- ✅ Add audit logging for all delete operations

### Preventing Authentication Bypass
**NEVER:**
- ❌ Skip authentication checks on API routes
- ❌ Assume requests are authenticated without verification
- ❌ Use long-lived tokens (>7 days)
- ❌ Forget to implement logout token revocation

**ALWAYS:**
- ✅ Use `requireAuth()` helper on ALL API routes (except `/api/health`)
- ✅ Verify session in server actions with `await auth()`
- ✅ Implement token blacklist with Redis
- ✅ Set JWT maxAge to 7 days maximum

### Preventing Authorization Bypass
**NEVER:**
- ❌ Skip RBAC checks ("this user probably has access")
- ❌ Use userId directly in M2M queries (use correct FK)
- ❌ Allow cross-city data access for non-SuperAdmin
- ❌ Trust client-side role checks

**ALWAYS:**
- ✅ Filter queries by `city_id` or `areaManagerId` (non-SuperAdmin)
- ✅ Use 2-step M2M pattern: `findFirst({ userId })` → `findMany({ correctId })`
- ✅ Verify neighborhood assignments for Activist Coordinators
- ✅ Add negative tests for unauthorized access

### Preventing Credential Exposure
**NEVER:**
- ❌ Hard-code passwords, API keys, or secrets in source code
- ❌ Include test user credentials in production bundle
- ❌ Commit `.env` files to git
- ❌ Log secrets or tokens

**ALWAYS:**
- ✅ Use environment variables (`.env.local`)
- ✅ Separate dev components with webpack stripping
- ✅ Use dynamic imports to avoid bundling sensitive data
- ✅ Rotate secrets regularly

### Preventing Injection Attacks
**NEVER:**
- ❌ Concatenate user input into queries (use Prisma ORM)
- ❌ Skip input validation
- ❌ Trust client-side validation alone
- ❌ Use `eval()` or `new Function()` with user input

**ALWAYS:**
- ✅ Use Zod schemas for all user inputs
- ✅ Validate on server-side (client-side is UX only)
- ✅ Use Prisma ORM (parameterized queries)
- ✅ Sanitize HTML if displaying user-generated content

### Preventing Information Disclosure
**NEVER:**
- ❌ Return detailed error messages to client (SQL errors, stack traces)
- ❌ Expose internal IDs or database structure
- ❌ Include sensitive data in logs accessible to users
- ❌ Return more data than necessary (over-fetching)

**ALWAYS:**
- ✅ Return generic Hebrew error messages to client
- ✅ Log detailed errors server-side with Sentry
- ✅ Use `.select()` to return only needed fields
- ✅ Filter sensitive fields before sending to client

---

## 19. QUICK REFERENCE CARD (Updated 2025-12-29)

```
╔══════════════════════════════════════════════════════════╗
║  BEFORE CODING - SECURITY & INVARIANTS CHECKLIST         ║
╠══════════════════════════════════════════════════════════╣
║  1. Which invariants does this affect?                   ║
║     → RBAC (INV-RBAC-001 to 004)                         ║
║     → Security (INV-SEC-001 to 010) ⭐ NEW               ║
║     → Hebrew/RTL (INV-I18N-001 to 003)                   ║
║     → Data (INV-DATA-001 to 003)                         ║
║                                                          ║
║  2. What's my change boundary?                           ║
║     → Declare allowed/forbidden files                    ║
║                                                          ║
║  3. What's the risk level?                               ║
║     → 🔴 CRITICAL: API/Auth/DB/Admin                     ║
║     → 🔸 MEDIUM: Features/Forms/Data ops                 ║
║     → 🔹 LOW: UI/Styling/Translations                    ║
║                                                          ║
║  4. Are any flows LOCKED?                                ║
║     → /cities, /manage-voters, auth flows                ║
║                                                          ║
║  5. Security requirements? ⭐ NEW                         ║
║     → Authentication: requireAuth()                      ║
║     → Authorization: requireRole() or requireSuperAdmin()║
║     → Input validation: Zod schemas                      ║
║     → Audit logging: sensitive operations                ║
║     → Error sanitization: Hebrew generic messages        ║
║                                                          ║
║  6. Do I need negative tests?                            ║
║     → YES for: Auth, RBAC, validation, permissions       ║
║                                                          ║
║  7. Is this Hebrew/RTL compliant?                        ║
║     → dir="rtl", lang="he", no English text              ║
╚══════════════════════════════════════════════════════════╝
```

**Critical Security Invariants (NEW):**
- **INV-SEC-001:** No physical database deletes
- **INV-SEC-002:** Attendance soft-cancel only
- **INV-SEC-003:** API authentication required
- **INV-SEC-004:** No hardcoded credentials
- **INV-SEC-005:** JWT ≤7 days + token blacklist
- **INV-SEC-006:** HTTPS enforcement (HSTS)
- **INV-SEC-007:** M2M correct FKs
- **INV-SEC-008:** Input validation (Zod)
- **INV-SEC-009:** Error message security
- **INV-SEC-010:** Admin endpoint restrictions

**Critical RBAC Invariants:**
- **INV-RBAC-001 to 004:** City/area data isolation

**Critical Data Invariants:**
- **INV-DATA-001 to 003:** Soft deletes, uniqueness, immutability

**Locked Pages:**
- `/cities` (SuperAdmin + Area Manager only)
- `/manage-voters` (Excel import stable)

**Security Helpers:**
- `requireAuth()` - Basic authentication
- `requireRole([roles])` - Role-based authorization
- `requireSuperAdmin()` - SuperAdmin-only access

---

## 18. DEPLOYMENT VERSION MANAGEMENT (Added 2026-01-01)

### 18.1 Why This Exists

**Problem:** Users not notified of new deployments → stale content → React hydration errors (#418)

**Solution:** Industry-standard version tracking with user-friendly update notifications

**Benefits:**
- ✅ Prevents hydration errors from stale service workers
- ✅ Notifies users of new features/fixes
- ✅ Supports critical security updates with force reload
- ✅ Improves deployment visibility

### 18.2 Build ID Invariants

**INV-DEPLOY-001: Build ID Generation**
- **Rule:** Every Railway deployment MUST generate unique BUILD_ID in format `YYYY-MM-DD-gitSHA`
- **Why critical:** Source of truth for version detection
- **Test:** `process.env.NEXT_PUBLIC_BUILD_ID` returns valid format or `dev-local`
- **Code:** Generated by `app/scripts/generate-build-id.sh` during Railway build
- **Example:** `2026-01-01-abc1234`

**INV-DEPLOY-002: Version Endpoint**
- **Rule:** `/api/version` endpoint MUST return current BUILD_ID + critical flag
- **Why critical:** Client source of truth for version checks
- **Test:** `curl /api/version` returns `{ buildId, isCritical, serverTime }`
- **Code:** `app/api/version/route.ts` with 10-second cache
- **Cache:** 10 seconds (balances freshness with server load)

**INV-DEPLOY-003: Health Endpoint**
- **Rule:** `/api/health` endpoint MUST return 200 when healthy, 503 when DB unreachable
- **Why critical:** Railway health checks for deployment verification
- **Test:** Railway health check configuration in `railway.json`
- **Code:** `app/api/health/route.ts` with DB connectivity test
- **Data:** `{ status, buildId, database, uptime }`

### 18.3 Client-Side Detection

**INV-DEPLOY-004: Version Polling**
- **Rule:** Client MUST poll `/api/version` every 60 seconds + on tab focus
- **Why critical:** Detect new deployments without page refresh
- **Test:** Hook triggers on visibility change and interval
- **Code:** `app/hooks/useVersionCheck.ts`
- **Abort handling:** Prevent race conditions with AbortController

**INV-DEPLOY-005: Version Mismatch Detection**
- **Rule:** Show update banner when `server.buildId !== client.buildId` (excluding `dev-local`)
- **Why critical:** Notify users of available updates
- **Test:** Banner appears when versions differ
- **Code:** `app/components/ui/VersionChecker.tsx`
- **Dev mode:** Disabled when `BUILD_ID === 'dev-local'`

### 18.4 Update Notification UX

**INV-DEPLOY-006: Soft Update Banner (Normal Deployments)**
- **Rule:** Dismissible blue banner with refresh action
- **Why critical:** Non-intrusive notification for normal updates
- **Test:** User can dismiss, reappears after 5 minutes
- **Code:** `app/components/ui/UpdateBanner.tsx`
- **Hebrew text:** "גרסה חדשה זמינה! רענן את הדף כדי לקבל את העדכון."
- **Actions:** "רענן עכשיו" button + Close (X)
- **localStorage:** Stores dismissal timestamp

**INV-DEPLOY-007: Critical Update Banner (Security Fixes)**
- **Rule:** Non-dismissible red banner with 30-second countdown + auto-reload
- **Why critical:** Force users to update for security fixes
- **Test:** Auto-reloads after countdown, countdown can be skipped
- **Code:** `app/components/ui/CriticalUpdateBanner.tsx`
- **Hebrew text:** "עדכון קריטי - הדף ירוענן בעוד X שניות"
- **Trigger:** `FORCE_UPDATE=true` env var in Railway
- **Countdown:** 30 seconds with progress bar
- **Action:** "עדכן עכשיו" to skip countdown

**INV-DEPLOY-008: Service Worker Coordination**
- **Rule:** Update banners MUST send `SKIP_WAITING` message to service worker
- **Why critical:** Coordinate SW update with version system
- **Test:** SW activates new version on message
- **Code:** `app/public/sw.js` message handler
- **Message:** `{ type: 'SKIP_WAITING' }`

### 18.5 Integration Requirements

**INV-DEPLOY-009: Root Layout Integration**
- **Rule:** VersionChecker MUST be mounted in root locale layout after ToastProvider
- **Why critical:** Global version detection across all pages
- **Test:** Component renders on all routes
- **Code:** `app/[locale]/layout.tsx`
- **Order:** After ToastProvider to avoid z-index conflicts

**INV-DEPLOY-010: Railway Build Configuration**
- **Rule:** `railway.json` MUST run `generate-build-id.sh` before Next.js build
- **Why critical:** BUILD_ID available during build process
- **Test:** Railway logs show "Generated BUILD_ID: YYYY-MM-DD-gitSHA"
- **Code:** `railway.json` buildCommand
- **Health check:** `/api/health` path with 100s timeout

### 18.6 Critical Update Workflow

**When to use critical updates:**
- 🔴 Security vulnerabilities requiring immediate fix
- 🔴 Blocking bugs preventing core functionality
- 🔴 Data corruption risks

**Workflow:**
1. Set `FORCE_UPDATE=true` in Railway environment variables
2. Deploy code fix
3. All clients see red countdown banner (30 seconds)
4. Auto-reload after countdown OR user clicks "עדכן עכשיו"
5. **IMPORTANT:** Remove `FORCE_UPDATE=true` after deployment stable

**Testing critical updates:**
```bash
# In Railway dashboard
FORCE_UPDATE=true  # Set temporarily
# Deploy → Test countdown → Remove flag
```

### 18.7 Edge Cases Handled

| Scenario | Solution |
|----------|----------|
| **Multiple tabs open** | Each tab polls independently, shows banner when detected |
| **Network error during check** | Log error, continue polling, no user-facing error |
| **Service Worker stuck** | Send SKIP_WAITING message, hard reload bypasses cache |
| **Rapid deployments (A→B→C)** | User gets latest version (C), acceptable |
| **Rollback (B→A)** | System treats as new version, shows banner |
| **User dismisses then refreshes** | Client BUILD_ID updates, no banner shown |
| **Critical update interrupts work** | 30-second countdown gives time to save |
| **Dev mode (`dev-local`)** | Version checking disabled, no banners |

### 18.8 Testing Requirements

**Local Testing:**
- [ ] Normal update shows soft banner (blue)
- [ ] Critical update shows countdown banner (red)
- [ ] Dismissal + 5-minute re-show works
- [ ] Multiple tabs detect update independently
- [ ] Network failure doesn't break app

**Railway Staging:**
- [ ] BUILD_ID generated correctly (`YYYY-MM-DD-gitSHA`)
- [ ] `/api/health` returns 200 with BUILD_ID
- [ ] `/api/version` returns correct data + caching
- [ ] Normal deployment shows soft banner
- [ ] Critical deployment (`FORCE_UPDATE=true`) shows countdown
- [ ] Rollback scenario triggers update banner

**Security:**
- [ ] `/api/version` accessible without authentication
- [ ] `/api/health` accessible without authentication
- [ ] No sensitive data in version endpoint responses
- [ ] BUILD_ID doesn't expose internal infrastructure

### 18.9 Files Affected

**Build System:**
- `app/scripts/generate-build-id.sh` - BUILD_ID generation
- `railway.json` - Build command integration
- `app/next.config.ts` - Expose NEXT_PUBLIC_BUILD_ID
- `app/.env.example` - BUILD_ID documentation

**API Endpoints:**
- `app/api/health/route.ts` - Railway health checks
- `app/api/version/route.ts` - Version info source of truth

**Client Components:**
- `app/hooks/useVersionCheck.ts` - Version polling hook
- `app/components/ui/UpdateBanner.tsx` - Soft update banner
- `app/components/ui/CriticalUpdateBanner.tsx` - Critical countdown banner
- `app/components/ui/VersionChecker.tsx` - Orchestrator
- `app/[locale]/layout.tsx` - Integration point

**Service Worker:**
- `app/public/sw.js` - SKIP_WAITING message handler
- `app/components/ServiceWorkerRegistration.tsx` - Removed native confirm()

### 18.10 Maintenance Notes

**DO:**
- ✅ Use critical updates sparingly (security/blocking bugs only)
- ✅ Remove `FORCE_UPDATE=true` after deployment stable
- ✅ Monitor Railway logs for BUILD_ID generation
- ✅ Test version detection after each deployment
- ✅ Keep 10-second cache on `/api/version` (don't increase)

**DON'T:**
- ❌ Set `FORCE_UPDATE=true` for normal deployments
- ❌ Change BUILD_ID format (breaks parsing)
- ❌ Remove health/version endpoints (Railway depends on them)
- ❌ Skip testing after modifying version detection logic
- ❌ Increase polling frequency (creates server load)

---

## 19. RELATED DOCUMENTS

### Critical References (READ FIRST)
- **RBAC Single Source of Truth:** `/docs/infrastructure/roles/PERMISSIONS_MATRIX.md`
- **Project Instructions:** `/CLAUDE.md`
- **Bug Knowledge Base:** `/docs/bugs` (see `bugs-current.md` and individual bug files)

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

## 20. INVARIANT VIOLATIONS (RECENT)

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

**Last Updated:** 2026-01-01
**Version:** 2.2 - Campaign System + Security Hardening + Deployment Version Management
**Status:** ✅ Active - Single Source of Truth
