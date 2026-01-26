---
name: campaign-rbac
description: Validate RBAC city/area scoping in Prisma queries and server actions. Use when writing backend code or auditing security.
allowed-tools: [Read, Bash, Glob, Grep]
---

# Campaign RBAC Validator

Validate Role-Based Access Control in Election Campaign queries and actions.

## Usage

```bash
/rbac-check [target]
```

**Targets:**
- `queries` - Audit all Prisma queries for scope filtering
- `actions` - Audit server actions for RBAC
- `api` - Audit API routes for auth/RBAC
- `file [path]` - Audit specific file
- `all` - Full RBAC audit

---

## Role Hierarchy Reference

```
SuperAdmin (is_super_admin = true)
└── NO FILTER - sees all data

Area Manager (area_managers table)
└── FILTER BY: areaManagerId or cities in area

City Coordinator (city_coordinators table)
└── FILTER BY: city_id (single city)

Activist Coordinator (activist_coordinators table)
└── FILTER BY: neighborhood_id (M2M assigned only)
```

---

## Query Patterns by Role

### SuperAdmin - No Filter
```typescript
// SuperAdmin bypasses all filters
if (session.user.isSuperAdmin) {
  return await prisma.activist.findMany({
    where: { is_active: true }
  });
}
```

### Area Manager - Area Filter
```typescript
// Area Manager sees multiple cities in their area
if (session.user.role === 'AREA_MANAGER') {
  const areaManager = await prisma.areaManager.findUnique({
    where: { userId: session.user.id }
  });

  return await prisma.activist.findMany({
    where: {
      is_active: true,
      neighborhood: {
        cityRelation: {
          areaManagerId: areaManager.id  // REQUIRED FILTER
        }
      }
    }
  });
}
```

### City Coordinator - City Filter
```typescript
// City Coordinator sees ONE city only
if (session.user.role === 'CITY_COORDINATOR') {
  const cityCoord = await prisma.cityCoordinator.findFirst({
    where: { userId: session.user.id }
  });

  return await prisma.activist.findMany({
    where: {
      is_active: true,
      neighborhood: {
        city_id: cityCoord.cityId  // REQUIRED FILTER
      }
    }
  });
}
```

### Activist Coordinator - M2M Neighborhood Filter
```typescript
// Activist Coordinator sees ONLY assigned neighborhoods
if (session.user.role === 'ACTIVIST_COORDINATOR') {
  // Step 1: Get coordinator record
  const actCoord = await prisma.activistCoordinator.findFirst({
    where: { userId: session.user.id }
  });

  // Step 2: Get assigned neighborhood IDs from M2M table
  const assignments = await prisma.activistCoordinatorNeighborhood.findMany({
    where: { activist_coordinator_id: actCoord.id },
    select: { neighborhood_id: true }
  });

  const neighborhoodIds = assignments.map(a => a.neighborhood_id);

  // Step 3: Filter by assigned neighborhoods
  return await prisma.activist.findMany({
    where: {
      is_active: true,
      neighborhood_id: { in: neighborhoodIds }  // REQUIRED FILTER
    }
  });
}
```

---

## Audit Commands

### Find Unfiltered Queries
```bash
# Activist queries without city filter
grep -rn "prisma.activist.findMany" app/app --include="*.ts" -A 5 | grep -v "city_id\|neighborhood_id"

# Neighborhood queries without city filter
grep -rn "prisma.neighborhood.findMany" app/app --include="*.ts" -A 5 | grep -v "city_id"

# Task queries without scope filter
grep -rn "prisma.task.findMany" app/app --include="*.ts" -A 5 | grep -v "city_id\|neighborhood_id"

# Attendance queries without scope filter
grep -rn "prisma.attendanceRecord.findMany" app/app --include="*.ts" -A 5 | grep -v "city_id\|neighborhood_id"
```

### Find Missing Role Checks
```bash
# Server actions without role validation
grep -rn "'use server'" app/app/actions --include="*.ts" -A 15 | grep -v "session.user.role\|isSuperAdmin"

# API routes without auth check
grep -rn "export async function" app/app/api --include="*.ts" -A 10 | grep -v "auth()\|getSession"
```

### Find M2M Violations
```bash
# Activist Coordinator queries not using M2M table
grep -rn "ACTIVIST_COORDINATOR" app/app --include="*.ts" -A 15 | grep -v "activistCoordinatorNeighborhood\|neighborhood_id.*in"
```

---

## Common Violations

### Violation 1: Missing City Filter
```typescript
// ❌ VIOLATION - City Coordinator sees ALL cities
export async function getActivists() {
  return await prisma.activist.findMany({
    where: { is_active: true }
  });
}

// ✅ FIX - Add city filter
export async function getActivists() {
  const session = await auth();
  const cityId = session.user.cityId;

  return await prisma.activist.findMany({
    where: {
      is_active: true,
      neighborhood: { city_id: cityId }
    }
  });
}
```

### Violation 2: Direct userId in M2M
```typescript
// ❌ VIOLATION - Using userId directly (wrong FK)
const activists = await prisma.activist.findMany({
  where: {
    neighborhood: {
      activistCoordinatorNeighborhoods: {
        some: { userId: session.user.id }  // WRONG!
      }
    }
  }
});

// ✅ FIX - Use correct FK chain
const actCoord = await prisma.activistCoordinator.findFirst({
  where: { userId: session.user.id }
});

const activists = await prisma.activist.findMany({
  where: {
    neighborhood: {
      activistCoordinatorNeighborhoods: {
        some: { activist_coordinator_id: actCoord.id }  // CORRECT
      }
    }
  }
});
```

### Violation 3: No Session Check
```typescript
// ❌ VIOLATION - No authentication
export async function deleteActivist(id: string) {
  await prisma.activist.update({
    where: { id },
    data: { is_active: false }
  });
}

// ✅ FIX - Auth + scope validation
export async function deleteActivist(id: string) {
  const session = await auth();
  if (!session?.user) throw new Error('Unauthorized');

  // Verify user can access this activist
  const activist = await prisma.activist.findUnique({
    where: { id },
    include: { neighborhood: true }
  });

  if (activist.neighborhood.city_id !== session.user.cityId) {
    throw new Error('Forbidden');
  }

  await prisma.activist.update({
    where: { id },
    data: { is_active: false }
  });
}
```

---

## Scope Validation Helper

**Recommended pattern for all queries:**

```typescript
// lib/rbac-helpers.ts
export async function getScopeFilter(session: Session) {
  if (session.user.isSuperAdmin) {
    return {}; // No filter
  }

  if (session.user.role === 'AREA_MANAGER') {
    const am = await prisma.areaManager.findUnique({
      where: { userId: session.user.id }
    });
    return {
      neighborhood: {
        cityRelation: { areaManagerId: am.id }
      }
    };
  }

  if (session.user.role === 'CITY_COORDINATOR') {
    const cc = await prisma.cityCoordinator.findFirst({
      where: { userId: session.user.id }
    });
    return {
      neighborhood: { city_id: cc.cityId }
    };
  }

  if (session.user.role === 'ACTIVIST_COORDINATOR') {
    const ac = await prisma.activistCoordinator.findFirst({
      where: { userId: session.user.id }
    });
    const assignments = await prisma.activistCoordinatorNeighborhood.findMany({
      where: { activist_coordinator_id: ac.id },
      select: { neighborhood_id: true }
    });
    return {
      neighborhood_id: { in: assignments.map(a => a.neighborhood_id) }
    };
  }

  throw new Error('Unknown role');
}

// Usage
const filter = await getScopeFilter(session);
const activists = await prisma.activist.findMany({
  where: { is_active: true, ...filter }
});
```

---

## Negative Test Requirements

Every RBAC implementation MUST have negative tests:

```typescript
// tests/e2e/rbac/city-isolation.spec.ts

test('City Coordinator CANNOT see other city activists', async () => {
  // Login as Tel Aviv coordinator
  await loginAsCityCoordinator('tel-aviv');

  // Try to access Jerusalem activist
  const response = await page.request.get('/api/activists?city=jerusalem');

  // Should be empty or forbidden
  expect(response.status()).toBe(403);
  // OR
  const data = await response.json();
  expect(data.activists).toHaveLength(0);
});

test('Activist Coordinator CANNOT see unassigned neighborhoods', async () => {
  // Login as coordinator assigned to Florentin only
  await loginAsActivistCoordinator('florentin');

  // Try to access Neve Tzedek activist
  const response = await getActivists('neve-tzedek');

  expect(response.activists).toHaveLength(0);
});
```

---

## Output Format

```
🔐 CAMPAIGN RBAC CHECK

Scanning: app/app/actions/*.ts

✅ app/actions/activists.ts:getActivists
   → City filter present: neighborhood.city_id
   → Auth check present: await auth()

❌ app/actions/tasks.ts:getTasks
   → MISSING city_id filter for City Coordinator
   → Line 42: findMany({ where: { status: 'PENDING' }})
   → FIX: Add neighborhood: { city_id: cityId }

❌ app/actions/attendance.ts:recordAttendance
   → MISSING M2M validation for Activist Coordinator
   → Line 28: No neighborhood assignment check
   → FIX: Validate activist's neighborhood is in coordinator's assignments

Summary: 8/10 queries RBAC-compliant
```

---

## Integration

- Called by: `/protocol validate`, rbac-security-guard agent
- Reference: `/docs/infrastructure/roles/PERMISSIONS_MATRIX.md`
- Tests: `app/tests/e2e/rbac/`

---

**Cross-city data leakage = Election disaster. Always filter.**
