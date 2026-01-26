---
name: campaign-invariant
description: Validate code against all 19 Election Campaign invariants (RBAC, Security, Hebrew/RTL, Data). Use BEFORE commits and after code changes.
allowed-tools: [Read, Bash, Glob, Grep]
---

# Campaign Invariant Checker

Validate code changes against Election Campaign System invariants from `baseRules.md`.

## Usage

```bash
/invariant [check-type]
```

**Check Types:**
- `all` - Check all invariants (recommended)
- `rbac` - RBAC data isolation (INV-RBAC-001 to 004)
- `security` - Security invariants (INV-SEC-001 to 010)
- `i18n` - Hebrew/RTL invariants (INV-I18N-001 to 003)
- `data` - Data integrity invariants (INV-DATA-001 to 004)
- `deploy` - Deployment invariants (INV-DEPLOY-001 to 010)

---

## RBAC Invariants (CRITICAL)

### INV-RBAC-001: City Data Isolation
**Rule:** City Coordinator ONLY sees their assigned city's data

```bash
# AUDIT: Find queries without city filter
grep -rn "prisma.activist.findMany" app/app --include="*.ts" | grep -v "city_id"
grep -rn "prisma.neighborhood.findMany" app/app --include="*.ts" | grep -v "city_id"
grep -rn "prisma.task.findMany" app/app --include="*.ts" | grep -v "city_id"
```

**Violation Example:**
```typescript
// ❌ VIOLATION - No city filter
const activists = await prisma.activist.findMany({
  where: { is_active: true }
});

// ✅ CORRECT - City filtered
const activists = await prisma.activist.findMany({
  where: {
    is_active: true,
    neighborhood: { city_id: session.user.cityId }
  }
});
```

### INV-RBAC-002: Activist Coordinator Neighborhood Assignment
**Rule:** Activist Coordinator ONLY manages activists in assigned neighborhoods (M2M)

```bash
# AUDIT: Find Activist Coordinator queries
grep -rn "ACTIVIST_COORDINATOR" app/app --include="*.ts" -A 10 | grep -v "neighborhood_id.*in"
```

**Required Pattern:**
```typescript
const coordinator = await prisma.activistCoordinator.findUnique({
  where: { user_id: session.user.id },
  include: { neighborhoods: true }
});
const neighborhoodIds = coordinator.neighborhoods.map(n => n.neighborhood_id);

const activists = await prisma.activist.findMany({
  where: { neighborhood_id: { in: neighborhoodIds } }
});
```

### INV-RBAC-003: SuperAdmin Seed-Only
**Rule:** SuperAdmin ONLY created via database/seed (`is_super_admin = true`)

```bash
# AUDIT: Find SuperAdmin creation attempts
grep -rn "is_super_admin.*true" app/app --include="*.ts" | grep -v "seed\|test"
grep -rn "isSuperAdmin" app/app --include="*.ts" | grep "create\|update"
```

### INV-RBAC-004: Area Manager Scope
**Rule:** Area Manager ONLY sees cities in their assigned area

```bash
# AUDIT: Find Area Manager queries
grep -rn "AREA_MANAGER" app/app --include="*.ts" -A 10 | grep -v "areaManagerId\|area_id"
```

---

## Security Invariants (CRITICAL)

### INV-SEC-001: No Physical Database Deletes
**Rule:** NEVER use `.delete()` or `.deleteMany()` on user data

```bash
# AUDIT: Find hard deletes
grep -rn "\.delete(" app/app --include="*.ts" | grep -v "test\|spec"
grep -rn "\.deleteMany(" app/app --include="*.ts" | grep -v "test\|spec"
```

**Allowed:** Soft deletes only (`is_active = false`, `deletedAt`)

### INV-SEC-002: Attendance Immutability
**Rule:** Attendance records cannot be modified after creation

```bash
# AUDIT: Find attendance updates
grep -rn "attendance.*update\|attendanceRecord.*update" app/app --include="*.ts"
```

**Allowed:** Only `cancelledAt/cancelledBy` soft-cancel pattern

### INV-SEC-003: API Authentication Required
**Rule:** ALL API endpoints MUST require authentication

```bash
# AUDIT: Find routes without auth
grep -rn "export async function GET\|POST\|PUT\|DELETE" app/app/api --include="*.ts" -A 5 | grep -v "auth()\|getSession\|requireAuth"
```

### INV-SEC-004: No Hardcoded Credentials
**Rule:** NEVER include passwords/secrets in source code

```bash
# AUDIT: Find hardcoded credentials
grep -rn "password.*=.*['\"]" app/ --include="*.ts" --include="*.tsx" | grep -v "test\|spec\|example"
grep -rn "admin123\|secret\|apiKey" app/ --include="*.ts" --include="*.tsx"
```

### INV-SEC-005: JWT Token Management
**Rule:** JWT tokens expire within 7 days, blacklist on logout

```bash
# AUDIT: Check auth config
grep -rn "maxAge" app/auth.config.ts
```

### INV-SEC-007: M2M Correct Foreign Keys
**Rule:** Use correct FK references, not legacy fields

```bash
# AUDIT: Find legacy FK usage
grep -rn "legacyActivistCoordinatorUserId" app/app --include="*.ts"
```

### INV-SEC-008: Input Validation with Zod
**Rule:** ALL user inputs validated with Zod schemas

```bash
# AUDIT: Find server actions without Zod
grep -rn "'use server'" app/app -A 20 --include="*.ts" | grep -v "z\.\|zod\|schema"
```

### INV-SEC-009: Error Message Security
**Rule:** Error messages MUST NOT expose sensitive data

```bash
# AUDIT: Find detailed error returns
grep -rn "return.*error.*:" app/app --include="*.ts" | grep -v "אירעה שגיאה"
```

**Required:** Return `{ error: 'אירעה שגיאה' }` in Hebrew

### INV-SEC-010: Admin Endpoint Restrictions
**Rule:** Admin endpoints require SuperAdmin + audit logging

```bash
# AUDIT: Find admin endpoints
grep -rn "admin\|superAdmin" app/app/api --include="*.ts" -A 10 | grep -v "requireSuperAdmin\|audit"
```

---

## Hebrew/RTL Invariants (CRITICAL)

### INV-I18N-001: Hebrew-Only UI
**Rule:** ALL UI text is Hebrew with NO English fallbacks

```bash
# AUDIT: Find English text in components
grep -rn ">[A-Z][a-z].*[a-z]<" app/app --include="*.tsx" | grep -v "data-testid\|className"
grep -rn 'label="[A-Z]' app/app --include="*.tsx"
grep -rn 'placeholder="[A-Z]' app/app --include="*.tsx"
```

### INV-I18N-002: RTL Layout
**Rule:** ALL components use `dir="rtl"` and `lang="he"`

```bash
# AUDIT: Find missing RTL
grep -rn "<Box\|<Card\|<Paper\|<Dialog" app/app --include="*.tsx" | grep -v "direction\|dir="
```

### INV-I18N-003: Locale Consistency
**Rule:** Default locale `he-IL`, NO locale switching

```bash
# AUDIT: Find locale violations
grep -rn "toLocaleDateString()\|toLocaleString()" app/app --include="*.ts" --include="*.tsx"
grep -rn "en-US\|en_US" app/ --include="*.ts" --include="*.tsx"
```

---

## Data Integrity Invariants

### INV-DATA-001: Activist Soft Deletes
**Rule:** Activists are soft-deleted (`is_active = false`), NEVER hard-deleted

```bash
# AUDIT: Find activist hard deletes
grep -rn "activist.*delete\|Activist.*delete" app/app --include="*.ts" | grep -v "soft\|is_active"
```

### INV-DATA-002: Activist Uniqueness
**Rule:** `(neighborhood_id, full_name, phone)` must be unique

```bash
# AUDIT: Check Prisma schema
grep -n "@@unique" app/prisma/schema.prisma | grep -i activist
```

### INV-DATA-003: Attendance Immutability
**Rule:** Attendance records cannot be modified after creation

*(Same as INV-SEC-002)*

### INV-DATA-004: Universal Soft Delete
**Rule:** NEVER hard delete ANY user data

```bash
# AUDIT: Find all delete operations
grep -rn "\.delete\|\.deleteMany" app/app --include="*.ts" | wc -l
```

---

## Automation Invariant

### INV-AUTO-001: data-testid Required
**Rule:** Every interactive element MUST have `data-testid`

```bash
# AUDIT: Find buttons without data-testid
grep -rn "<Button\|<IconButton" app/app --include="*.tsx" | grep -v "data-testid"

# AUDIT: Find inputs without data-testid
grep -rn "<TextField\|<Input\|<Select" app/app --include="*.tsx" | grep -v "data-testid"
```

---

## Running Full Audit

```bash
/invariant all
```

**Output Format:**
```
📋 CAMPAIGN INVARIANT CHECK

✅ INV-RBAC-001 (City Isolation): PASS
✅ INV-RBAC-002 (Neighborhood Assignment): PASS
❌ INV-RBAC-003 (SuperAdmin Seed-Only): FAIL
   → Found: app/api/admin/route.ts:42 - Creates SuperAdmin via API

✅ INV-SEC-001 (No Hard Deletes): PASS
❌ INV-SEC-003 (API Auth Required): FAIL
   → Found: app/api/public/route.ts - No auth() check

✅ INV-I18N-001 (Hebrew-Only): PASS
❌ INV-I18N-002 (RTL Layout): FAIL
   → Found: app/components/StatsCard.tsx:15 - Missing direction="rtl"

Summary: 15/19 PASSED, 4 VIOLATIONS
```

---

## Integration

- Called by: `/protocol pre-commit`
- Used by: qa-tester, rbac-security-guard agents
- Reference: `/docs/infrastructure/base/baseRules.md`

---

**Invariant violations = Invalid code, even if it compiles.**
