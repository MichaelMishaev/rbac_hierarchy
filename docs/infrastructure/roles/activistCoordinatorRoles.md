# 🎯 Activist Coordinator Rights Specification
### Version 2.0 — Election Campaign Management System

> **Source of truth for what an Activist Coordinator can see and do in the system.**
> Aligned with v2.0 Election Campaign System.

---

## 1. Role Definition

The **Activist Coordinator** is a **neighborhood-level campaign organizer**.

They are responsible for:

- Managing **field activists in their assigned neighborhoods**
- **On-the-ground coordination** of daily campaign activities
- **Check-in/check-out** tracking for activists
- **Task distribution** to field volunteers
- **Direct communication** with activists
- **Reporting** to City Coordinator

They have **access ONLY to assigned neighborhoods** (via M2M relationship), with **no visibility outside**.

---

## 2. Scope & Visibility

### 2.1 Neighborhood Scope (M2M Relationship)

An Activist Coordinator can only access data where:

```sql
activist.neighborhood_id IN (
  SELECT neighborhood_id
  FROM activist_coordinator_neighborhoods
  WHERE activist_coordinator_id = current_user.activist_coordinator_id
)
```

**⚠️ CRITICAL:** Activist Coordinators have a **Many-to-Many (M2M)** relationship with neighborhoods via the junction table `activist_coordinator_neighborhoods`.

This means:
- **One Activist Coordinator** can manage **MULTIPLE neighborhoods**
- **One neighborhood** can have **MULTIPLE Activist Coordinators**

**All visibility and permissions are derived from this M2M relationship.**

### 2.2 What an Activist Coordinator Can See

For *their assigned neighborhoods*, an Activist Coordinator can view:

* **Activists** in their assigned neighborhoods ONLY
* **Tasks** assigned to activists in their neighborhoods
* **Attendance Records** for activists in their neighborhoods
* **Neighborhood details** (name, address, GPS, contact info)
* **Audit log entries** for activists they manage

They **cannot see**:

* Other neighborhoods (not assigned to them)
* Neighborhoods in other cities
* Other Activist Coordinators
* City-wide data or statistics
* Areas page (blocked)
* Cities page (blocked)
* System-wide configuration

---

## 3. Rights by Entity (CRUD Matrix)

Legend:
✅ Allowed    ❌ Not Allowed    (M2M) = only in assigned neighborhoods

### 3.1 Neighborhoods

**Can:**

* ✅ View neighborhoods assigned to them (M2M)
* ✅ View neighborhood details (name, address, GPS, contact)

**Cannot:**

* ❌ Create new neighborhoods
* ❌ Edit neighborhood details
* ❌ Delete or deactivate neighborhoods
* ❌ Assign other Activist Coordinators to neighborhoods
* ❌ View neighborhoods not assigned to them

**Database Reference:**
```sql
activist_coordinator_neighborhoods (
  activist_coordinator_id UUID REFERENCES activist_coordinators(id),
  neighborhood_id UUID REFERENCES neighborhoods(id),
  assigned_at TIMESTAMP,
  PRIMARY KEY (activist_coordinator_id, neighborhood_id)
)
```

---

### 3.2 Activists

**Can:**

* ✅ Create activists in their assigned neighborhoods ONLY
* ✅ View all activists in their assigned neighborhoods
* ✅ Update activist details:
  * full_name, phone, email
  * is_active
  * metadata
* ✅ Deactivate activists (soft delete: `is_active = false`)
* ✅ Assign tasks to activists

**Cannot:**

* ❌ Create activists in neighborhoods not assigned to them
* ❌ View activists in other neighborhoods
* ❌ Move activists to other neighborhoods
* ❌ Permanently delete activists (must use soft delete)
* ❌ View activists from other cities

**Validation Rule:**
```typescript
// Before creating activist, verify neighborhood assignment
const hasAccess = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    activist_coordinator_id: user.activistCoordinatorId,
    neighborhood_id: targetNeighborhoodId
  }
});

if (!hasAccess) {
  throw new Error('Access denied: Neighborhood not assigned to you');
}
```

---

### 3.3 Tasks

**Can:**

* ✅ Create tasks for activists in their assigned neighborhoods
* ✅ View all tasks assigned to activists in their neighborhoods
* ✅ Update task status and details
* ✅ Assign/reassign tasks to activists they manage
* ✅ Mark tasks as completed

**Cannot:**

* ❌ Create tasks for activists in other neighborhoods
* ❌ View tasks from other neighborhoods
* ❌ Create city-wide or system-wide tasks

---

### 3.4 Attendance Records

**Can:**

* ✅ Check in/out activists at their assigned neighborhoods
* ✅ View attendance records for activists they manage
* ✅ Edit attendance records for their activists
* ✅ Generate neighborhood-level attendance reports

**Cannot:**

* ❌ View attendance records from other neighborhoods
* ❌ Modify attendance records for activists not in their neighborhoods
* ❌ View city-wide attendance statistics (unless shared by City Coordinator)

---

### 3.5 Voters (if enabled)

**Can:**

* ✅ View voters assigned to their neighborhoods
* ✅ Add/edit voter information for their neighborhoods
* ✅ Track voter outreach progress

**Cannot:**

* ❌ View voters from other neighborhoods
* ❌ Move voters to other neighborhoods
* ❌ Access city-wide voter statistics

---

### 3.6 Users

**Can:**

* ✅ View their own user profile
* ✅ Update their own profile (name, phone, avatar)

**Cannot:**

* ❌ Create new users
* ❌ View other Activist Coordinators
* ❌ View City Coordinators or Area Managers
* ❌ Modify other users
* ❌ Change their own role or permissions

---

## 4. Audit & Logging Rights

### 4.1 What Activist Coordinator Can See

An Activist Coordinator can view **only neighborhood-scoped logs** for their assigned neighborhoods:

```sql
audit_logs
WHERE entity_type = 'activist'
  AND entity_id IN (
    SELECT id FROM activists
    WHERE neighborhood_id IN (assigned_neighborhoods)
  )
```

They can:

* ✅ Filter logs by:
  * activist
  * action (create/update/delete)
  * date range
* ✅ Use logs for tracking activist changes

They cannot:

* ❌ View logs for activists in other neighborhoods
* ❌ View logs for neighborhoods, cities, or areas
* ❌ Delete or rewrite logs (append-only policy)

---

## 5. UI-Level Rights (Screens & Sections)

### 5.1 Pages Activist Coordinator CAN Access

* **Dashboard** (`/dashboard`)
  * Neighborhood-level KPIs (activists count, tasks, attendance)
  * Recent activities in assigned neighborhoods

* **Neighborhoods** (`/neighborhoods`) - **Limited View**
  * View ONLY assigned neighborhoods
  * Cannot create/edit/delete neighborhoods

* **Activists** (via neighborhoods)
  * View/Create/Edit activists in assigned neighborhoods
  * Check in/out activists
  * Assign tasks

* **Tasks** (`/tasks`)
  * Create/assign tasks to activists in assigned neighborhoods
  * View task completion status

* **Attendance** (`/attendance`)
  * Track attendance for activists in assigned neighborhoods
  * Generate neighborhood-level reports

* **Voters** (`/manage-voters`) - **Limited View**
  * View/edit voters in assigned neighborhoods only

* **Users** (`/users`) - **Limited View**
  * View users in their city (read-only)
  * Edit their own profile only

### 5.2 Pages Activist Coordinator CANNOT Access

* **Areas** (`/areas`) ❌
  * Access denied - area management is SuperAdmin/Area Manager only

* **Cities** (`/cities`) ❌ **LOCKED**
  * Access denied - see `cities/page.tsx:35`
  * Reason: Activist Coordinators work within neighborhoods

* **System Settings** ❌
  * Global configuration restricted to SuperAdmin

---

## 6. Security & Constraints

### 6.1 Neighborhood Assignment Boundary

The **primary security rule** for Activist Coordinator:

```typescript
// ALWAYS validate M2M relationship before any operation
const assignedNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
  where: { activist_coordinator_id: user.activistCoordinatorId },
  select: { neighborhood_id: true }
});

const neighborhoodIds = assignedNeighborhoods.map(n => n.neighborhood_id);

// Then filter all queries
const activists = await prisma.activist.findMany({
  where: {
    neighborhood_id: { in: neighborhoodIds } // ✅ M2M boundary enforced
  }
});
```

This must be enforced by:

* Backend guards/middleware
* Server Actions validation
* All list and detail queries
* Prisma middleware (auto-inject M2M filters)

### 6.2 No Cross-Neighborhood Access

An Activist Coordinator **must not** be able to:

* Create/update any entity in neighborhoods not assigned to them
* View data from other neighborhoods
* Assign themselves to new neighborhoods (must be done by City Coordinator)
* Perform any write that affects other neighborhoods

---

## 7. Explicit "Cannot" List (Summary)

Activist Coordinator cannot:

* ❌ Create or modify users (any role)
* ❌ Create or modify neighborhoods
* ❌ View or modify cities (cannot access Cities page)
* ❌ View or modify areas (cannot access Areas page)
* ❌ Access global system settings
* ❌ View activists in neighborhoods not assigned to them
* ❌ Assign other Activist Coordinators to neighborhoods
* ❌ View city-wide or system-wide statistics (unless shared)
* ❌ Create cross-neighborhood tasks
* ❌ Modify their own neighborhood assignments

---

## 8. Example Scenarios

### Scenario 1 — Valid Action (Single Neighborhood)

> Activist Coordinator Rachel (assigned to "Florentin") creates a new activist "Yossi" in Florentin.

✅ Allowed.
Rachel is assigned to Florentin → within scope.

---

### Scenario 2 — Valid Action (Multiple Neighborhoods)

> Activist Coordinator Rachel (assigned to "Florentin" AND "Neve Tzedek") creates activists in both neighborhoods.

✅ Allowed.
Rachel is assigned to both neighborhoods via M2M table → both within scope.

---

### Scenario 3 — Blocked Action

> Activist Coordinator Rachel (assigned to "Florentin") tries to create an activist in "Old Jaffa".

❌ Must be blocked:

* Rachel is not assigned to Old Jaffa.
* M2M validation fails.
* Backend prevents this action.

---

### Scenario 4 — Blocked Cross-City Action

> Activist Coordinator Rachel (assigned to Tel Aviv neighborhoods) tries to view activists in Jerusalem.

❌ Must be blocked:

* Cross-city data access violation.
* Activist Coordinators are scoped to one city.
* Backend filters prevent this.

---

## 9. Superior User Relationship

**Activist Coordinator reports to:**
- **City Coordinator** (their city coordinator)

In the UI, Activist Coordinators can see their superior's contact information:
- City Coordinator's full name
- City Coordinator's email
- Used for escalation and reporting

---

## 10. Database Schema Reference

### Key Tables

```sql
-- Activist Coordinator record
activist_coordinators (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  city_id UUID REFERENCES cities(id),
  title TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(city_id, user_id)
)

-- M2M Junction Table (CRITICAL)
activist_coordinator_neighborhoods (
  activist_coordinator_id UUID REFERENCES activist_coordinators(id) ON DELETE CASCADE,
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (activist_coordinator_id, neighborhood_id)
)

-- Neighborhoods assigned to them
neighborhoods (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  city_id UUID REFERENCES cities(id),
  is_active BOOLEAN DEFAULT true,
  ...
)

-- Activists they manage
activists (
  id UUID PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  neighborhood_id UUID REFERENCES neighborhoods(id),
  is_active BOOLEAN DEFAULT true,
  ...
)
```

### Key Constraints

* `UNIQUE (city_id, user_id)` - User can be activist coordinator once per city
* **M2M Primary Key** `(activist_coordinator_id, neighborhood_id)` - Prevents duplicate assignments
* `activists.neighborhood_id` → Enforces neighborhood boundary

---

## 11. Code Examples

### Get Assigned Neighborhoods

```typescript
// Fetch Activist Coordinator with assigned neighborhoods
const activistCoordinator = await prisma.activistCoordinator.findUnique({
  where: { userId: session.user.id },
  include: {
    neighborhoodAssignments: {
      include: {
        neighborhood: true
      }
    }
  }
});

const assignedNeighborhoods = activistCoordinator.neighborhoodAssignments.map(
  assignment => assignment.neighborhood
);
```

### Query Activists (with M2M Filter)

```typescript
// Get neighborhood IDs from M2M table
const assignments = await prisma.activistCoordinatorNeighborhood.findMany({
  where: { activist_coordinator_id: user.activistCoordinatorId },
  select: { neighborhood_id: true }
});

const neighborhoodIds = assignments.map(a => a.neighborhood_id);

// Query activists with M2M filter
const activists = await prisma.activist.findMany({
  where: {
    neighborhood_id: { in: neighborhoodIds }, // ✅ M2M boundary
    is_active: true
  }
});
```

### Create Activist (with Validation)

```typescript
// Validate neighborhood assignment BEFORE creating activist
const hasAccess = await prisma.activistCoordinatorNeighborhood.findFirst({
  where: {
    activist_coordinator_id: user.activistCoordinatorId,
    neighborhood_id: targetNeighborhoodId
  }
});

if (!hasAccess) {
  throw new Error('Access denied: Neighborhood not assigned to you');
}

// Create activist
const activist = await prisma.activist.create({
  data: {
    full_name: "Yossi Mizrahi",
    phone: "050-1234567",
    neighborhood_id: targetNeighborhoodId, // ✅ Validated
    is_active: true
  }
});
```

---

## 12. M2M Relationship Deep Dive

### Why M2M is Critical

Unlike other roles, Activist Coordinators have a **Many-to-Many** relationship with neighborhoods:

| Scenario | Example |
|----------|---------|
| **1 Coordinator → Multiple Neighborhoods** | Rachel manages Florentin + Neve Tzedek |
| **1 Neighborhood → Multiple Coordinators** | Florentin has Rachel + David as coordinators |

### M2M Table Structure

```sql
activist_coordinator_neighborhoods
├── activist_coordinator_id (FK → activist_coordinators.id)
├── neighborhood_id (FK → neighborhoods.id)
├── assigned_at (TIMESTAMP)
└── PRIMARY KEY (activist_coordinator_id, neighborhood_id)
```

### Assignment Flow

1. **City Coordinator** assigns Activist Coordinator to neighborhood
2. Record inserted into `activist_coordinator_neighborhoods`
3. **Activist Coordinator** can now access that neighborhood
4. All queries MUST check this M2M table

### Removal Flow

1. **City Coordinator** removes assignment
2. Record deleted from `activist_coordinator_neighborhoods`
3. **Activist Coordinator** immediately loses access to that neighborhood
4. Orphaned activists remain in neighborhood (managed by other coordinators or city coordinator)

---

## 13. Real-World Use Case

### Example: Rachel (Activist Coordinator)

**Profile:**
- City: Tel Aviv
- Assigned Neighborhoods: Florentin (30 activists), Neve Tzedek (25 activists)
- Total activists managed: 55

**Daily Operations:**

**Morning (8:00 AM):**
- Check in activists arriving at Florentin campaign office
- Assign canvassing routes for the day
- Review task completion from previous day

**Midday (12:00 PM):**
- Travel to Neve Tzedek neighborhood
- Check in afternoon shift activists
- Distribute phone banking tasks

**Evening (6:00 PM):**
- Check out activists from both neighborhoods
- Update attendance records
- Report statistics to City Coordinator David

**What Rachel CAN do:**
- ✅ Manage 55 activists across 2 neighborhoods
- ✅ Create tasks for both Florentin and Neve Tzedek
- ✅ Track attendance for both neighborhoods
- ✅ Generate combined reports for both neighborhoods

**What Rachel CANNOT do:**
- ❌ View activists in Old Jaffa (not assigned)
- ❌ Create neighborhoods
- ❌ Assign other Activist Coordinators
- ❌ View city-wide statistics

---

## 14. Short Summary

**Activist Coordinator = Neighborhood Organizer (M2M).**

They can:

* Manage **activists in assigned neighborhoods ONLY** (M2M relationship).
* Assign tasks and track attendance for their activists.
* Generate neighborhood-level reports.
* Check in/out activists at campaign locations.

They cannot:

* Touch neighborhoods not assigned to them.
* Access Areas or Cities pages.
* Create users, neighborhoods, or modify assignments.
* View city-wide or system-wide data.

**Critical:** Access is validated via M2M `activist_coordinator_neighborhoods` table.

---

## 15. Related Documentation

- **SuperAdmin Roles**: `./superAdminRoles.md`
- **Area Manager Roles**: `./areManagerRoles.md`
- **City Coordinator Roles**: `./cityCoordinatorRoles.md`
- **Permissions Matrix**: `./PERMISSIONS_MATRIX.md` (Single Source of Truth)
- **Database Schema**: `../../app/prisma/schema.prisma`
- **RBAC Implementation**: `../../app/lib/auth.ts`
- **M2M Validation**: `../../app/app/actions/activist-coordinator-neighborhoods.ts`

---

**Last Updated:** 2025-12-21
**Version:** 2.0
**Status:** ✅ Active - Current System
**Critical Feature:** M2M Neighborhood Assignment
