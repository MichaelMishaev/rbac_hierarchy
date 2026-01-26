# 🔐 RBAC Permissions Matrix - v2.0 Election Campaign System

**⚠️ SINGLE SOURCE OF TRUTH - Last Updated: 2025-12-21**

This document is the **authoritative reference** for all role-based access control (RBAC) permissions in the Election Campaign Management System.

---

## 📋 Table of Contents

1. [Role Hierarchy](#role-hierarchy)
2. [Page Access Matrix](#page-access-matrix)
3. [Entity CRUD Permissions](#entity-crud-permissions)
4. [Data Isolation Rules](#data-isolation-rules)
5. [Creation Permissions Matrix](#creation-permissions-matrix)
6. [Navigation Visibility](#navigation-visibility)
7. [Security Rules & Constraints](#security-rules--constraints)
8. [Code Implementation Guide](#code-implementation-guide)
9. [Validation Checklist](#validation-checklist)

---

## 1. Role Hierarchy

```
SuperAdmin (is_super_admin = true)
  ↓ creates/manages
Area Manager (area_managers table)
  ↓ manages region
Cities (cities table)
  ↓ contains
City Coordinator (city_coordinators table)
  ↓ manages city
Activist Coordinator (activist_coordinators table)
  ↓ assigned to (M2M)
Neighborhoods (neighborhoods table)
  ↓ contains
Activists (activists table)
```

### Role Database Mapping

| Role Name | DB Table | DB Enum Value | Special Flags |
|-----------|----------|---------------|---------------|
| SuperAdmin | `users` | `SUPERADMIN` | `is_super_admin = true` |
| Area Manager | `area_managers` | `AREA_MANAGER` | - |
| City Coordinator | `city_coordinators` | `CITY_COORDINATOR` | - |
| Activist Coordinator | `activist_coordinators` | `ACTIVIST_COORDINATOR` | M2M via `activist_coordinator_neighborhoods` |
| Activist | `activists` | `ACTIVIST` | Data entity only (no login) |

---

## 2. Page Access Matrix

| Page URL | SuperAdmin | Area Manager | City Coord | Activist Coord |
|----------|-----------|--------------|------------|----------------|
| `/dashboard` | ✅ System-wide | ✅ Area-scoped | ✅ City-scoped | ✅ Neighborhood-scoped |
| `/areas` | ✅ All areas | ✅ Own area only | ❌ **DENIED** | ❌ **DENIED** |
| `/cities` | ✅ All cities | ✅ Own area | ❌ **LOCKED** | ❌ **LOCKED** |
| `/neighborhoods` | ✅ All | ✅ Own area | ✅ Own city | ✅ Assigned only |
| `/users` | ✅ All | ✅ Own area | ✅ Own city | ✅ Own city (read-only) |
| `/manage-voters` | ✅ All | ✅ Own area | ✅ Own city | ✅ Assigned neighborhoods |
| `/tasks` | ✅ All | ✅ Own area | ✅ Own city | ✅ Assigned neighborhoods |
| `/attendance` | ✅ All | ✅ Own area | ✅ Own city | ✅ Assigned neighborhoods |
| `/system-rules` | ✅ Full access | ❌ **DENIED** | ❌ **DENIED** | ❌ **DENIED** |

### Page Lock Documentation

**🔒 Cities Page** (`/cities`) - **LOCKED 2025-12-15**
- **File:** `app/app/[locale]/(dashboard)/cities/page.tsx:35`
- **Access:** SuperAdmin & Area Manager ONLY
- **Reason:** City Coordinators manage ONE city, Activist Coordinators work within neighborhoods
- **Lock Status:** ⚠️ DO NOT MODIFY WITHOUT APPROVAL

---

## 3. Entity CRUD Permissions

### Legend
- ✅ = Full CRUD (Create, Read, Update, Delete/Deactivate)
- 👁️ = Read-only
- 🔧 = Create/Update only (no delete)
- ❌ = No access
- (scoped) = Access limited to role's scope

### 3.1 Areas

| Entity → | SuperAdmin | Area Manager | City Coord | Activist Coord |
|----------|-----------|--------------|------------|----------------|
| **Area Managers** | ✅ Full | 👁️ Own area | ❌ | ❌ |

### 3.2 Cities

| Entity → | SuperAdmin | Area Manager | City Coord | Activist Coord |
|----------|-----------|--------------|------------|----------------|
| **Cities** | ✅ All | ✅ Own area | 👁️ Own city | 👁️ Own city |
| **City Coordinators** | ✅ All | ✅ Own area | ❌ | ❌ |

### 3.3 Neighborhoods & Activists

| Entity → | SuperAdmin | Area Manager | City Coord | Activist Coord |
|----------|-----------|--------------|------------|----------------|
| **Neighborhoods** | ✅ All | ✅ Own area | ✅ Own city | 👁️ Assigned only |
| **Activist Coordinators** | ✅ All | ✅ Own area | ✅ Own city | ❌ |
| **Activist ↔ Neighborhood (M2M)** | ✅ All | ✅ Own area | ✅ Own city | ❌ |
| **Activists** | ✅ All | ✅ Own area | ✅ Own city | ✅ Assigned neighborhoods |

### 3.4 Tasks & Attendance

| Entity → | SuperAdmin | Area Manager | City Coord | Activist Coord |
|----------|-----------|--------------|------------|----------------|
| **Tasks** | ✅ All | ✅ Own area | ✅ Own city | 🔧 Assigned neighborhoods |
| **Task Assignments** | ✅ All | ✅ Own area | ✅ Own city | 🔧 Assigned neighborhoods |
| **Attendance Records** | ✅ All | ✅ Own area | ✅ Own city | 🔧 Assigned neighborhoods |

### 3.5 Voters

| Entity → | SuperAdmin | Area Manager | City Coord | Activist Coord |
|----------|-----------|--------------|------------|----------------|
| **Voters** | ✅ All | ✅ Own area | ✅ Own city | 🔧 Assigned neighborhoods |
| **Excel Import** | ✅ All | ✅ Own area | ✅ Own city | ❌ |
| **Duplicate Detection** | ✅ All | ✅ Own area | ✅ Own city | 👁️ |

### 3.6 Invitations

| Entity → | SuperAdmin | Area Manager | City Coord | Activist Coord |
|----------|-----------|--------------|------------|----------------|
| **Invitations (Area Manager)** | ✅ | ❌ | ❌ | ❌ |
| **Invitations (City Coord)** | ✅ | ✅ Own area | ❌ | ❌ |
| **Invitations (Activist Coord)** | ✅ | ✅ Own area | ✅ Own city | ❌ |

---

## 4. Data Isolation Rules

### 4.1 SuperAdmin
```typescript
// NO FILTER - Full system access
const data = await prisma.activist.findMany();
```

### 4.2 Area Manager
```typescript
// Filter by area_manager_id
const areaManager = await prisma.areaManager.findUnique({
  where: { userId: user.id }
});

const data = await prisma.activist.findMany({
  where: {
    neighborhood: {
      cityRelation: {
        areaManagerId: areaManager.id
      }
    }
  }
});
```

### 4.3 City Coordinator
```typescript
// Filter by city_id
const cityCoordinator = await prisma.cityCoordinator.findFirst({
  where: { userId: user.id }
});

const data = await prisma.activist.findMany({
  where: {
    neighborhood: {
      cityId: cityCoordinator.cityId
    }
  }
});
```

### 4.4 Activist Coordinator (M2M)
```typescript
// Filter by M2M assigned neighborhoods
const assignments = await prisma.activistCoordinatorNeighborhood.findMany({
  where: {
    activistCoordinator: {
      userId: user.id
    }
  },
  select: { neighborhood_id: true }
});

const neighborhoodIds = assignments.map(a => a.neighborhood_id);

const data = await prisma.activist.findMany({
  where: {
    neighborhood_id: { in: neighborhoodIds }
  }
});
```

---

## 5. Creation Permissions Matrix

### Who Can Create What?

| Can Create ↓ | SuperAdmin | Area Manager | City Coord | Activist Coord |
|--------------|-----------|--------------|------------|----------------|
| **SuperAdmin** | ❌ DB only | ❌ | ❌ | ❌ |
| **Area Manager** | ✅ | ❌ | ❌ | ❌ |
| **City** | ✅ | ✅ In area | ❌ | ❌ |
| **City Coordinator** | ✅ | ✅ In area | ❌ | ❌ |
| **Neighborhood** | ✅ | ✅ In area | ✅ In city | ❌ |
| **Activist Coordinator** | ✅ | ✅ In area | ✅ In city | ❌ |
| **Activist** | ✅ | ✅ In area | ✅ In city | ✅ In assigned neighborhoods |
| **Task** | ✅ | ✅ In area | ✅ In city | ✅ For assigned activists |
| **Voter** | ✅ | ✅ In area | ✅ In city | ✅ In assigned neighborhoods |

### Critical Rules

1. **SuperAdmin Creation**: ONLY via database/seed script (`is_super_admin = true`)
2. **Area Manager**: Only SuperAdmin can create
3. **City**: Only SuperAdmin or Area Manager (in their area)
4. **Activist**: All roles can create (within their scope)
5. **Cross-Scope Creation**: ❌ NEVER allowed (enforced by DB constraints)

---

## 6. Navigation Visibility

### 6.1 SuperAdmin Navigation
```
- Dashboard
- Areas
- Cities
- Neighborhoods
- Users
- Tasks
- Attendance
- Manage Voters
- System Rules
```

### 6.2 Area Manager Navigation
```
- Dashboard
- Areas (own area only)
- Cities (own area only)
- Neighborhoods (own area)
- Users (own area)
- Tasks (own area)
- Attendance (own area)
- Manage Voters (own area)
```

### 6.3 City Coordinator Navigation
```
- Dashboard
- Neighborhoods (own city)
- Users (own city)
- Tasks (own city)
- Attendance (own city)
- Manage Voters (own city)
```
**Hidden:** Areas, Cities, System Rules

### 6.4 Activist Coordinator Navigation
```
- Dashboard
- Neighborhoods (assigned only)
- Users (own city, read-only)
- Tasks (assigned neighborhoods)
- Attendance (assigned neighborhoods)
- Manage Voters (assigned neighborhoods)
```
**Hidden:** Areas, Cities, System Rules

---

## 7. Security Rules & Constraints

### 7.1 Critical Security Rules

1. **ALWAYS filter by scope** (except SuperAdmin)
2. **NEVER expose cross-city data** without authorization
3. **Validate M2M relationships** for Activist Coordinators
4. **Test data isolation** in E2E tests thoroughly
5. **Use Prisma middleware** to auto-inject filters
6. **Log all RBAC violations** to audit logs
7. **Never trust client-side role checks** - always validate server-side

### 7.2 Database Constraints

```sql
-- City Coordinators: One user per city
UNIQUE (city_id, user_id) ON city_coordinators

-- Activist Coordinators: One user per city
UNIQUE (city_id, user_id) ON activist_coordinators

-- Activists: Unique per neighborhood
UNIQUE (neighborhood_id, full_name, phone) ON activists

-- M2M: Prevent duplicate assignments
PRIMARY KEY (activist_coordinator_id, neighborhood_id) ON activist_coordinator_neighborhoods

-- Referential Integrity
neighborhood_id → neighborhoods(id) → city_id → cities(id) → area_manager_id → area_managers(id)
```

### 7.3 Forbidden Operations

**ALL Roles (including SuperAdmin):**
- ❌ Create SuperAdmin via UI/API (DB/seed only)
- ❌ Expose `is_super_admin` flag in public APIs
- ❌ Skip RBAC validation
- ❌ Allow cross-tenant data leakage
- ❌ Permanently delete production data (use soft deletes: `is_active = false`)

**Area Manager:**
- ❌ Access other areas
- ❌ Create other Area Managers
- ❌ Promote users to SuperAdmin

**City Coordinator:**
- ❌ Access other cities
- ❌ View/modify Cities page
- ❌ Create cities or area managers

**Activist Coordinator:**
- ❌ Access neighborhoods not assigned to them
- ❌ Create neighborhoods or modify assignments
- ❌ View city-wide statistics

---

## 8. Code Implementation Guide

### 8.1 Server Action Template

```typescript
// app/app/actions/example-action.ts
'use server';

import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function exampleAction() {
  const user = await getCurrentUser();

  // Build WHERE clause based on role
  let whereClause: any = {};

  if (user.role === 'SUPERADMIN') {
    // No filter - full access
  } else if (user.role === 'AREA_MANAGER') {
    const areaManager = user.areaManager;
    if (!areaManager) throw new Error('Area Manager record not found');

    whereClause = {
      neighborhood: {
        cityRelation: {
          areaManagerId: areaManager.id
        }
      }
    };
  } else if (user.role === 'CITY_COORDINATOR') {
    const cityId = user.coordinatorOf[0]?.cityId;
    if (!cityId) throw new Error('City Coordinator has no city assignment');

    whereClause = {
      neighborhood: {
        cityId: cityId
      }
    };
  } else if (user.role === 'ACTIVIST_COORDINATOR') {
    const neighborhoodIds = user.activistCoordinatorNeighborhoods.map(
      n => n.neighborhood_id
    );

    whereClause = {
      neighborhood_id: { in: neighborhoodIds }
    };
  }

  // Execute query with filter
  const activists = await prisma.activist.findMany({
    where: whereClause
  });

  return { success: true, activists };
}
```

### 8.2 Page Component Template

```typescript
// app/app/[locale]/(dashboard)/example/page.tsx
import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';

export default async function ExamplePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: Define allowed roles
  const allowedRoles = ['SUPERADMIN', 'AREA_MANAGER', 'CITY_COORDINATOR'];

  if (!allowedRoles.includes(session.user.role)) {
    return <AccessDenied />;
  }

  // Fetch data via server action (filtering happens there)
  const result = await exampleAction();

  return <ExampleClient data={result.activists} />;
}
```

### 8.3 Prisma Middleware (Auto-Inject Filters)

```typescript
// app/lib/prisma-middleware.ts
import { getCurrentUser } from './auth';

prisma.$use(async (params, next) => {
  // Only apply to Activist model
  if (params.model === 'Activist' && params.action === 'findMany') {
    const user = await getCurrentUser();

    if (user.role === 'SUPERADMIN') {
      // No filter
      return next(params);
    }

    if (user.role === 'CITY_COORDINATOR') {
      params.args.where = {
        ...params.args.where,
        neighborhood: {
          cityId: user.coordinatorOf[0]?.cityId
        }
      };
    }

    if (user.role === 'ACTIVIST_COORDINATOR') {
      const neighborhoodIds = user.activistCoordinatorNeighborhoods.map(
        n => n.neighborhood_id
      );
      params.args.where = {
        ...params.args.where,
        neighborhood_id: { in: neighborhoodIds }
      };
    }
  }

  return next(params);
});
```

---

## 9. Validation Checklist

Use this checklist when implementing or reviewing any feature:

### Data Isolation
- [ ] SuperAdmin bypass works correctly (no scope filters)
- [ ] Area Manager sees only their area's cities
- [ ] City Coordinator cannot access other cities
- [ ] Activist Coordinator validated against M2M `activist_coordinator_neighborhoods` table
- [ ] Cross-city data leakage tests pass
- [ ] Cross-area data leakage tests pass

### RBAC Enforcement
- [ ] Page-level access control enforced (see Page Access Matrix)
- [ ] Entity-level CRUD permissions enforced (see Entity CRUD Permissions)
- [ ] Creation permissions enforced (see Creation Permissions Matrix)
- [ ] Navigation visibility matches role (see Navigation Visibility)

### Code Quality
- [ ] Prisma middleware enforces filters automatically
- [ ] API endpoints validate scope on every request
- [ ] Server Actions validate scope before mutations
- [ ] Client-side role checks are cosmetic only (never trusted)
- [ ] Audit logs capture all role-based operations

### Testing
- [ ] E2E tests cover all isolation scenarios
- [ ] Unit tests verify RBAC guards
- [ ] Integration tests verify cross-role boundaries
- [ ] Manual testing performed for each role

### Documentation
- [ ] Changes documented in relevant role documentation
- [ ] PERMISSIONS_MATRIX.md updated if needed
- [ ] Code comments explain RBAC logic
- [ ] Locked pages marked with warnings

---

## 10. Related Documentation

### Role-Specific Documentation
- **SuperAdmin Roles**: `./superAdminRoles.md`
- **Area Manager Roles**: `./areManagerRoles.md`
- **City Coordinator Roles**: `./cityCoordinatorRoles.md`
- **Activist Coordinator Roles**: `./activistCoordinatorRoles.md`
- **Hierarchy Overview**: `./hierarchy.md`

### Implementation Files
- **Database Schema**: `../../app/prisma/schema.prisma`
- **RBAC Helpers**: `../../app/lib/auth.ts`
- **Cities Page Lock**: `../../app/app/[locale]/(dashboard)/cities/page.tsx:35`
- **E2E Tests**: `../../app/tests/e2e/rbac/`

### Other Documentation
- **Project CLAUDE.md**: `/CLAUDE.md`
- **Bug Tracking**: `../bugs.md`
- **QA Automations**: `../qa/automations/`

---

## 11. Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 2.0 | 2025-12-21 | Initial v2.0 documentation - migrated from corporate system to election campaign system | System |
| 1.3 | (legacy) | Corporate hierarchy system (deprecated) | - |

---

## 12. Emergency Contacts

If you find RBAC violations or security issues:

1. **Document in bugs.md**: `/docs/infrastructure/bugs.md`
2. **Create regression test**: Immediately
3. **Fix and verify**: All affected roles
4. **Update this matrix**: If permissions changed

---

**📌 REMEMBER:** This document is the **SINGLE SOURCE OF TRUTH** for RBAC permissions.

**⚠️ Before modifying permissions:**
1. Check this document first
2. Update this document if changes needed
3. Get approval for locked pages
4. Run full RBAC test suite
5. Update role-specific documentation

---

**Last Updated:** 2025-12-21 by Claude Code
**Version:** 2.0
**Status:** ✅ Active - Authoritative Reference
