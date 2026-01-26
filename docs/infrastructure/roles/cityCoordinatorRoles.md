# 🏛️ City Coordinator Rights Specification
### Version 2.0 — Election Campaign Management System

> **Source of truth for what a City Coordinator can see and do in the system.**
> Aligned with v2.0 Election Campaign System.

---

## 1. Role Definition

The **City Coordinator** is a **city-level campaign manager**.

They are responsible for:

- Managing **all campaign operations within their assigned city**
- Overseeing **all users and entities** inside their city:
  - Activist Coordinators
  - Neighborhoods
  - Activists
- Coordinating **daily campaign activities**
- Tracking **attendance and task completion**
- Reporting to Area Manager

They have **full control within their city**, but **no access outside it**.

---

## 2. Scope & Visibility

### 2.1 City Scope

A City Coordinator can only access data where:

```sql
neighborhoods.city_id = city_coordinators.city_id
activists.neighborhood.city_id = city_coordinators.city_id
```

**All visibility and permissions are derived from this rule.**

### 2.2 What a City Coordinator Can See

For *their* city, a City Coordinator can view:

* All **Neighborhoods** in their city
* All **Activist Coordinators** in their city
* All **Activists** in all neighborhoods of their city
* All **Tasks** assigned within their city
* All **Attendance Records** for their city
* All **Voters** assigned to their city (if voter management enabled)
* All **Activist ↔ Neighborhood assignments** inside their city
* All **audit log entries** where `city_id` matches their city

They **cannot see**:

* Other cities
* Users, neighborhoods, or activists outside their city
* Areas page (blocked - see section 5.1)
* Cities page (blocked - see section 5.1)
* System-wide configuration or global settings

---

## 3. Rights by Entity (CRUD Matrix)

Legend:
✅ Allowed    ❌ Not Allowed    (scoped) = only inside their city

### 3.1 City

**Can:**

* ✅ View their own city details
* ✅ View city-level statistics

**Cannot:**

* ❌ Create new cities
* ❌ Edit city details (name, code, description, area assignment)
* ❌ Delete or deactivate cities
* ❌ View other cities
* ❌ Access the Cities page (`/cities`) - **LOCKED** (see cities/page.tsx:35)

---

### 3.2 Neighborhoods

**Can:**

* ✅ Create new neighborhoods in their city
* ✅ View all neighborhoods in their city
* ✅ Update neighborhood details:
  * name, address, city (text field)
  * latitude/longitude (GPS coordinates)
  * phone, email
  * is_active
* ✅ Activate/deactivate neighborhoods
* ✅ Assign neighborhoods to Activist Coordinators (M2M)

**Cannot:**

* ❌ Create neighborhoods in other cities
* ❌ Move neighborhoods to other cities (must stay in their city)
* ❌ View neighborhoods outside their city
* ❌ Delete neighborhoods (use soft delete: `is_active = false`)

**Database Integrity:**
Neighborhoods have `city_id` foreign key → ensures they cannot exist cross-city.

---

### 3.3 Activist Coordinators

**Can:**

* ✅ Create/invite Activist Coordinators within their city
* ✅ View all Activist Coordinators in their city
* ✅ Update Activist Coordinator properties (title, is_active, metadata)
* ✅ Assign Activist Coordinators to neighborhoods (M2M via `activist_coordinator_neighborhoods`)
* ✅ Remove Activist Coordinator ↔ Neighborhood assignments
* ✅ Activate/deactivate Activist Coordinators

**Cannot:**

* ❌ Create Activist Coordinators for other cities
* ❌ View Activist Coordinators from other cities
* ❌ Promote Activist Coordinators to City Coordinator or Area Manager
* ❌ Assign Activist Coordinators to neighborhoods in other cities

---

### 3.4 Activists

**Can:**

* ✅ Create activists under any neighborhood in their city
* ✅ Update activists:
  * full_name, phone, email
  * is_active, metadata
* ✅ Deactivate activists (soft delete: `is_active = false`)
* ✅ View all activists in all neighborhoods in their city
* ✅ Assign tasks to activists
* ✅ Track attendance for activists

**Cannot:**

* ❌ Create activists in neighborhoods outside their city
* ❌ Move activists to cross-city neighborhoods
* ❌ View activists from other cities
* ❌ Permanently delete activists (must use soft delete)

**Database Integrity:**
Activists have `neighborhood_id` → `neighborhoods.city_id` ensures city boundary.

---

### 3.5 Tasks

**Can:**

* ✅ Create tasks for activists in their city
* ✅ View all tasks assigned to activists in their city
* ✅ Update task status and details
* ✅ Assign/reassign tasks to activists

**Cannot:**

* ❌ Create tasks for activists in other cities
* ❌ View tasks from other cities

---

### 3.6 Attendance Records

**Can:**

* ✅ View all attendance records for their city
* ✅ Check in/out activists at neighborhoods
* ✅ Edit attendance records for their city
* ✅ Generate city-level attendance reports

**Cannot:**

* ❌ View attendance records from other cities
* ❌ Modify attendance records from other cities

---

### 3.7 Invitations

**Can:**

* ✅ Create invitations for:
  * Activist Coordinators (for their city)
* ✅ Set expiration time, metadata, and city context
* ✅ View invitations they created (or scoped to their city)

**Cannot:**

* ❌ Create invitations for City Coordinators or Area Managers
* ❌ Create invitations for other cities
* ❌ Use invitations to create SuperAdmin accounts

---

### 3.8 Voters (if enabled)

**Can:**

* ✅ View voters assigned to their city
* ✅ Create/edit voters in their city
* ✅ Import voters via Excel upload
* ✅ View duplicate voter reports for their city

**Cannot:**

* ❌ View voters from other cities
* ❌ Move voters to other cities

---

## 4. Audit & Logging Rights

### 4.1 What City Coordinator Can See

A City Coordinator can view **only city-scoped logs**, i.e.:

```sql
audit_logs.city_id = city_coordinators.city_id
```

They can:

* ✅ Filter logs by:
  * neighborhood
  * activist coordinator
  * activist
  * action (create/update/delete)
  * user (actor)
  * date range
* ✅ Use logs for incident analysis and history

They cannot:

* ❌ View logs where `city_id` belongs to another city
* ❌ View system-global logs with `city_id IS NULL`
* ❌ Delete or rewrite logs (append-only policy)

---

## 5. UI-Level Rights (Screens & Sections)

### 5.1 Pages City Coordinator CAN Access

* **Dashboard** (`/dashboard`)
  * City-level KPIs and statistics
  * Recent activities in their city

* **Neighborhoods** (`/neighborhoods`)
  * View/Create/Edit/Deactivate neighborhoods in their city
  * Assign Activist Coordinators to neighborhoods

* **Users** (`/users`)
  * View/Create/Edit Activist Coordinators in their city
  * Cannot see users from other cities

* **Activists** (implicitly via neighborhoods)
  * Manage activists in their city's neighborhoods

* **Tasks** (`/tasks`)
  * Create/assign tasks to activists in their city

* **Attendance** (`/attendance`)
  * Track attendance for activists in their city

* **Voters** (`/manage-voters`)
  * Manage voters assigned to their city

### 5.2 Pages City Coordinator CANNOT Access

* **Areas** (`/areas`) ❌
  * Access denied - area management is SuperAdmin/Area Manager only

* **Cities** (`/cities`) ❌ **LOCKED**
  * Access denied - see `cities/page.tsx:35`
  * Reason: City Coordinators manage ONE city, they don't need to see the list
  * Locked Date: 2025-12-15

* **System Settings** ❌
  * Global configuration restricted to SuperAdmin

---

## 6. Security & Constraints

### 6.1 City Boundary

The **primary security rule** for City Coordinator:

```typescript
// All queries MUST filter by city_id
where: {
  neighborhood: {
    city_id: cityCoordinator.cityId
  }
}
```

This must be enforced by:

* Backend guards/middleware
* Server Actions validation
* All list and detail queries
* Prisma middleware (auto-inject filters)

### 6.2 No Cross-City Access

A City Coordinator **must not** be able to:

* Create/update any entity belonging to another city
* View data from other cities
* Reassign their city to a different Area Manager
* Perform any write that affects another city's scope

---

## 7. Explicit "Cannot" List (Summary)

City Coordinator cannot:

* ❌ Create or modify SuperAdmin users
* ❌ Create or modify Area Managers
* ❌ Create or modify City Coordinators
* ❌ View or modify cities (cannot access Cities page)
* ❌ View or modify neighborhoods outside their city
* ❌ Access Areas page
* ❌ Access global system settings
* ❌ View global audit logs not tied to their city
* ❌ Assign Activist Coordinators to neighborhoods of other cities
* ❌ Create cross-city activists or tasks

---

## 8. Example Scenarios

### Scenario 1 — Valid Action

> City Coordinator of Tel Aviv creates a new neighborhood "Florentin" in Tel Aviv.

✅ Allowed.
Neighborhood is in Tel Aviv → within scope.

---

### Scenario 2 — Blocked Action

> City Coordinator of Tel Aviv tries to view activists in Jerusalem.

❌ Must be blocked:

* Cross-city data access violation.
* Backend filters + middleware prevent this.

---

### Scenario 3 — Valid Assignment

> City Coordinator of Tel Aviv assigns Activist Coordinator Rachel to "Florentin" neighborhood (both in Tel Aviv).

✅ Allowed.
Both entities in Tel Aviv → within scope.

---

### Scenario 4 — Blocked Assignment

> City Coordinator of Tel Aviv tries to assign Activist Coordinator from Jerusalem to a Tel Aviv neighborhood.

❌ Must be blocked:

* Activist Coordinator must belong to the same city.
* DB constraint: `activist_coordinators.city_id` must match.

---

## 9. Superior User Relationship

**City Coordinator reports to:**
- **Area Manager** (their city's area manager)

In the UI, City Coordinators can see their superior's contact information:
- Area Manager's full name
- Area Manager's email
- Used for escalation and reporting

---

## 10. Database Schema Reference

### Key Tables

```sql
-- City Coordinator record
city_coordinators (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  city_id UUID REFERENCES cities(id),
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(city_id, user_id)
)

-- City they manage
cities (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  area_manager_id UUID REFERENCES area_managers(id),
  ...
)

-- Neighborhoods in their city
neighborhoods (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  city_id UUID REFERENCES cities(id),
  city_coordinator_id UUID REFERENCES city_coordinators(id),
  is_active BOOLEAN DEFAULT true,
  ...
)
```

### Key Constraints

* `UNIQUE (city_id, user_id)` - User can be coordinator once per city
* `neighborhood.city_id` → Enforces city boundary
* `activist.neighborhood_id` → Inherits city boundary through neighborhood

---

## 11. Code Examples

### Query Activists (with City Filter)

```typescript
// City Coordinator querying activists
const user = await getCurrentUser();
const cityId = user.coordinatorOf[0]?.cityId;

const activists = await prisma.activist.findMany({
  where: {
    neighborhood: {
      city_id: cityId // ✅ City boundary enforced
    }
  }
});
```

### Create Neighborhood (with Validation)

```typescript
// City Coordinator creating neighborhood
const user = await getCurrentUser();
const cityId = user.coordinatorOf[0]?.cityId;

const neighborhood = await prisma.neighborhood.create({
  data: {
    name: "Florentin",
    city_id: cityId, // ✅ Must be their city
    is_active: true
  }
});
```

---

## 12. Short Summary

**City Coordinator = City Campaign Manager.**

They can:

* Manage all **Neighborhoods, Activist Coordinators, Activists** in their city.
* Assign Activist Coordinators to neighborhoods (within same city).
* Create tasks and track attendance for their city.
* See all relevant audit logs for their city.

They cannot:

* Touch anything outside their city.
* Access Areas or Cities pages.
* Change global configuration or Area Manager-level entities.

This document defines the **exact boundaries** of those powers.

---

## 13. Related Documentation

- **SuperAdmin Roles**: `./superAdminRoles.md`
- **Area Manager Roles**: `./areManagerRoles.md`
- **Activist Coordinator Roles**: `./activistCoordinatorRoles.md`
- **Permissions Matrix**: `./PERMISSIONS_MATRIX.md` (Single Source of Truth)
- **Database Schema**: `../../app/prisma/schema.prisma`
- **RBAC Implementation**: `../../app/lib/auth.ts`
- **Cities Page Lock**: `../../app/app/[locale]/(dashboard)/cities/page.tsx:35`

---

**Last Updated:** 2025-12-21
**Version:** 2.0
**Status:** ✅ Active - Current System
