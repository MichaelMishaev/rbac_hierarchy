# 🧭 Area Manager Rights Specification
### Version 2.0 — Election Campaign Management System

> **Source of truth for what an Area Manager can see and do in the system.**
> Aligned with v2.0 Election Campaign System (migrated from v1.3 Corporate System).

---

## 1. Role Definition

The **Area Manager** is a **region-level campaign director**.

They are responsible for:

- Managing **all cities in their region**
- Overseeing **all users and entities** inside those cities:
  - City Coordinators
  - Activist Coordinators
  - Neighborhoods
  - Activists
- **Cross-city campaign coordination**
- **Resource allocation** between cities
- **Regional performance reporting**

They have **full control within their region**, but **no access outside it**.

---

## 2. Scope & Visibility

### 2.1 Region Scope

An Area Manager can only access data where:

```sql
cities.area_manager_id = area_managers.id
```

**All visibility and permissions are derived from this rule.**

### 2.2 What an Area Manager Can See

For *their* region, an Area Manager can view:

* All **Cities** in the region
* All **City Coordinators** in those cities
* All **Activist Coordinators** in those cities
* All **Neighborhoods** belonging to those cities
* All **Activists** in those neighborhoods
* All **Activist Coordinator ↔ Neighborhood assignments** inside those cities
* All **Tasks** assigned within their region
* All **Attendance Records** for activists in their region
* All **Voters** assigned to cities in their region
* All **audit log entries** where `city_id` is in their region

They **cannot see**:

* Cities assigned to another Area Manager
* Users, neighborhoods, activists, or logs outside their region
* System-wide configuration or global settings

---

## 3. Rights by Entity (CRUD Matrix)

Legend:
✅ Allowed    ❌ Not Allowed    (scoped) = only inside their region

### 3.1 Cities

**Can:**

* ✅ Create a new city inside their region
* ✅ Update city details (name, description, email, phone, address, logo, settings)
* ✅ Activate/deactivate cities

**Cannot:**

* ❌ Change the city's `area_manager_id` to another Area Manager
* ❌ View or edit cities from other regions
* ❌ Permanently delete cities from the database (use soft-delete: `is_active = false`)

---

### 3.2 City Coordinators

**Can:**

* ✅ Invite new City Coordinators for cities in their region
* ✅ View all City Coordinators in their region
* ✅ Update City Coordinator metadata (title, status, etc.)
* ✅ Activate/deactivate City Coordinators (set `is_active`)

**Cannot:**

* ❌ Invite City Coordinator for a city outside their region
* ❌ Assign a City Coordinator to a city that does not belong to them
* ❌ Promote a City Coordinator to SuperAdmin or Area Manager

---

### 3.3 Activist Coordinators

**Can:**

* ✅ Create/invite Activist Coordinators within cities in their region
* ✅ View all Activist Coordinators in cities in their region
* ✅ Update Activist Coordinator properties (title, is_active, metadata)
* ✅ Assign Activist Coordinators to neighborhoods (M2M via `activist_coordinator_neighborhoods`)
* ✅ Remove Activist Coordinator ↔ Neighborhood assignments
* ✅ Activate/deactivate Activist Coordinators

**Cannot:**

* ❌ Create Activist Coordinators for cities in another region
* ❌ Move an Activist Coordinator to a city outside their region
* ❌ Escalate Activist Coordinator permissions beyond their city (e.g., to Area Manager or SuperAdmin)

---

### 3.4 Neighborhoods

**Can:**

* ✅ Create neighborhoods for any city in their region
* ✅ Update neighborhood data:
  * name, address, location
  * city (text field), country
  * latitude/longitude
  * phone, email
  * is_active
  * city_coordinator_id (assign to City Coordinator)
* ✅ Activate/deactivate neighborhoods
* ✅ View all neighborhoods in cities in their region

**Cannot:**

* ❌ Create neighborhoods for cities outside their region
* ❌ Move a neighborhood to a city outside their region (must stay in-region)
* ❌ Delete neighborhoods that are outside their scope (not possible via filters anyway)

---

### 3.5 Activists

**Can:**

* ✅ Create activists under any neighborhood in their region
* ✅ Update activists:
  * full_name, phone, email, position
  * is_active, metadata
* ✅ Deactivate activists (soft delete: `is_active = false`)
* ✅ View all activists in all neighborhoods in the region
* ✅ Assign tasks to activists
* ✅ Track attendance for activists

**Cannot:**

* ❌ Assign an activist to a neighborhood outside their region
* ❌ Move an activist to a cross-region neighborhood
* ❌ View activists from other regions
* ❌ Permanently delete activists (use soft delete)

**DB integrity rule:**
Activists have both `neighborhood_id` and `city_id`.
Composite FK ensures activist cannot exist cross-city.

---

### 3.6 Activist Coordinator ↔ Neighborhood Assignments (M2M)

**Can:**

* ✅ Assign an Activist Coordinator to a neighborhood within the same city in their region
* ✅ Remove an Activist Coordinator ↔ Neighborhood assignment
* ✅ View all assignments in their region

**Cannot:**

* ❌ Create an assignment where Activist Coordinator and neighborhood belong to different cities
* ❌ Create an assignment for cities outside their region
* ❌ Create circular or invalid cross-tenant mappings (blocked by DB constraints)

---

### 3.7 Invitations

**Can:**

* ✅ Create invitations for:
  * City Coordinators (for cities in their region)
  * Activist Coordinators (for cities in their region)
* ✅ Set expiration time, metadata, and city context
* ✅ View invitations they created (or scoped to their region)

**Cannot:**

* ❌ Create invitations for cities in other regions
* ❌ Use invitations to create SuperAdmin or Area Manager accounts
* ❌ Modify or reuse expired tokens

---

### 3.8 Tasks

**Can:**

* ✅ Create tasks for activists in their region
* ✅ View all tasks assigned to activists in their region
* ✅ Update task status and details
* ✅ Assign/reassign tasks across cities in their region

**Cannot:**

* ❌ Create tasks for activists in other regions
* ❌ View tasks from other regions

---

### 3.9 Attendance Records

**Can:**

* ✅ View all attendance records for their region
* ✅ Check in/out activists at neighborhoods in their region
* ✅ Edit attendance records for their region
* ✅ Generate region-level attendance reports

**Cannot:**

* ❌ View attendance records from other regions
* ❌ Modify attendance records from other regions

---

### 3.10 Voters

**Can:**

* ✅ View voters assigned to cities in their region
* ✅ Create/edit voters in cities in their region
* ✅ Import voters via Excel upload for their cities
* ✅ View duplicate voter reports for their region

**Cannot:**

* ❌ View voters from other regions
* ❌ Move voters to cities in other regions

---

## 4. Audit & Logging Rights

### 4.1 What Area Manager Can See

An Area Manager can view **only region-scoped logs**, i.e.:

```sql
audit_logs.city_id IN (all cities in their region)
```

They can:

* ✅ Filter logs by:
  * city
  * entity type (neighborhood, activist, coordinator, etc.)
  * action (create/update/delete)
  * user (actor)
  * date range
* ✅ Use logs for incident analysis, local compliance, and history

They cannot:

* ❌ View logs where `city_id` belongs to another Area Manager
* ❌ View system-global logs with `city_id IS NULL` (restricted to SuperAdmin only)
* ❌ Delete or rewrite logs (append-only policy)

---

## 5. UI-Level Rights (Screens & Sections)

In the dashboard, an Area Manager should have access to:

* **Areas Page (Region-Scoped)** (`/areas`)
  * View own area only
  * Cannot see other areas
  * Cannot create new areas (SuperAdmin only)

* **Cities List (Region-Scoped)** (`/cities`)
  * View/Create/Edit/Deactivate cities in region

* **Users > City Coordinators**
  * View/Create/Edit/Deactivate City Coordinators in region

* **Users > Activist Coordinators**
  * View/Create/Edit/Deactivate Activist Coordinators in region

* **Neighborhoods**
  * View/Create/Edit/Deactivate neighborhoods in region

* **Activists**
  * View/Create/Edit/Deactivate activists for region's neighborhoods

* **Assignments**
  * Manage Activist Coordinator ↔ Neighborhood mappings (within region)

* **Tasks**
  * Create/assign tasks for activists in region

* **Attendance**
  * View/manage attendance for activists in region

* **Voters**
  * Manage voters assigned to cities in region

* **Audit Logs (Region)**
  * View activities limited to region's cities

Hidden sections (Area Manager must NOT see):

* Global System Settings
* SuperAdmin-only pages
* Other regions' cities, users, or logs

---

## 6. Security & Constraints

### 6.1 Region Boundary

The **primary security rule** for Area Manager:

```typescript
// All queries MUST filter by area_manager_id
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

This must be enforced by:

* Backend guards/middleware
* Server Actions validation
* All list and detail queries
* Prisma middleware (auto-inject area filters)

### 6.2 No Cross-Region Writes

An Area Manager **must not** be able to:

* Create/update any entity belonging to another region
* Reassign cities to a different Area Manager
* Perform any write that affects another Area Manager's scope

---

## 7. Explicit "Cannot" List (Summary)

Area Manager cannot:

* ❌ Create or modify SuperAdmin users
* ❌ Create or modify Area Managers
* ❌ View or modify cities outside their region
* ❌ Change `area_manager_id` of a city to another Area Manager
* ❌ Access global system settings or technical configuration
* ❌ View global audit logs not tied to their cities
* ❌ Assign Activist Coordinators to neighborhoods of other regions
* ❌ Create cross-region activists or neighborhoods

---

## 8. Example Scenarios

### Scenario 1 — Valid Action

> Area Manager of Region A creates a new neighborhood under Tel Aviv (which belongs to Region A).

✅ Allowed.
Tel Aviv is in Region A → Neighborhood is in scope.

---

### Scenario 2 — Blocked Action

> Area Manager of Region A tries to assign an Activist Coordinator (from Tel Aviv) to a neighborhood in Jerusalem, which belongs to Region B.

❌ Must be blocked:

* Cross-region and cross-city mapping.
* DB composite FKs + backend checks prevent this.

---

### Scenario 3 — View Logs

> Area Manager opens Audit Logs and filters by Tel Aviv.

✅ Allowed.

> Same Area Manager tries to filter by Jerusalem (Region B).

❌ No results / 403 — outside their region.

---

## 9. Superior User Relationship

**Area Manager reports to:**
- **SuperAdmin** (system administrator)

In the UI, Area Managers can see SuperAdmin contact information:
- SuperAdmin's full name
- SuperAdmin's email
- Used for escalation and system-wide coordination

---

## 10. Real-World Use Case

### Example: Sarah (Area Manager - Tel Aviv District)

**Profile:**
- Region: Tel Aviv District (IL-CENTER)
- Cities: Tel Aviv-Yafo, Ramat Gan, Givatayim, Holon, Bat Yam (5 cities)
- Total activists: 500+ field volunteers

**Daily Operations:**

**Morning (8:00 AM):**
- Review cross-city attendance dashboard
- Check task completion rates for all 5 cities
- Identify underperforming neighborhoods

**Midday (12:00 PM):**
- Reallocate activists from Holon to Tel Aviv (election day surge)
- Create city-wide task for voter outreach
- Meet with City Coordinators via video conference

**Evening (6:00 PM):**
- Generate regional performance report for SuperAdmin
- Approve new City Coordinator invitation for Ramat Gan
- Review voter duplicate reports across all cities

**What Sarah CAN do:**
- ✅ Manage 500+ activists across 5 cities
- ✅ Create tasks for all cities in Tel Aviv District
- ✅ Allocate resources between cities
- ✅ Generate regional analytics

**What Sarah CANNOT do:**
- ❌ View activists in Jerusalem (different region)
- ❌ Create cities in other regions
- ❌ Modify Area Managers
- ❌ Access system-wide settings

---

## 11. Short Summary

**Area Manager = Regional Campaign Director.**

They can:

* Manage all **Cities, City Coordinators, Activist Coordinators, Neighborhoods, Activists** in their region.
* Assign Activist Coordinators to neighborhoods (within same city/region).
* Create tasks and track attendance region-wide.
* See all relevant audit logs for their region.
* Allocate resources between cities.

They cannot:

* Touch anything outside their region.
* Change global configuration or SuperAdmin-level entities.
* Modify their own area assignment.

This document defines the **exact boundaries** of those powers.

---

## 12. Related Documentation

- **SuperAdmin Roles**: `./superAdminRoles.md`
- **City Coordinator Roles**: `./cityCoordinatorRoles.md`
- **Activist Coordinator Roles**: `./activistCoordinatorRoles.md`
- **Permissions Matrix**: `./PERMISSIONS_MATRIX.md` (Single Source of Truth)
- **Hierarchy Overview**: `./hierarchy.md`
- **Database Schema**: `../../app/prisma/schema.prisma`
- **RBAC Implementation**: `../../app/lib/auth.ts`
- **Areas Page**: `../../app/app/[locale]/(dashboard)/areas/page.tsx`
- **Cities Page**: `../../app/app/[locale]/(dashboard)/cities/page.tsx`

---

**Last Updated:** 2025-12-21
**Version:** 2.0 (Election Campaign System)
**Status:** ✅ Active - Current System
**Migration Note:** Migrated from v1.3 Corporate System
