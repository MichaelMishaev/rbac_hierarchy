# ✅ SuperAdmin — Complete Permissions (v2.0)

**Complete, precise list of roles and entities that a SuperAdmin can create**, based on v2.0 Election Campaign System and actual Prisma schema.

> **📝 Note:** This document uses exact field names from `app/prisma/schema.prisma`.
> **Terminology:** v2.0 Election Campaign System (migrated from v1.3 Corporate System)

---

## Role Definition

**SuperAdmin** is the **only** role with full system-wide creation capabilities.

> **⚠️ Critical:** SuperAdmin users themselves can ONLY be created via database/bootstrap scripts, NOT through the UI or API.

---

# ⭐ 1. Roles SuperAdmin Can Create

## ✔ Area Manager

* Create a new Area Manager user
* Assign the Area Manager to a region
* Invite Area Manager via email token

**User fields:**
* `user.fullName`
* `user.email`
* `user.phone` (optional)
* `user.passwordHash` (hashed)
* `user.role` = `AREA_MANAGER`

**AreaManager table fields:**
* `area_managers.regionName` (required, human-readable)
* `area_managers.regionCode` (required, unique, e.g., "IL-CENTER")
* `area_managers.userId` (optional, areas can exist without assigned manager)
* `area_managers.metadata` (JSON)

---

## ✔ City Coordinator

SuperAdmin can create or invite City Coordinators for **any city**.

**User fields:**
* `user.fullName`
* `user.email`
* `user.phone` (optional)
* `user.passwordHash` (hashed)
* `user.role` = `CITY_COORDINATOR`

**CityCoordinator table fields:**
* `city_coordinators.cityId` (required)
* `city_coordinators.title` (optional, e.g., "City Campaign Manager")
* `city_coordinators.metadata` (JSON)

---

## ✔ Activist Coordinator

SuperAdmin can create Activist Coordinators in any city.

**User fields:**
* `user.fullName`
* `user.email`
* `user.phone` (optional)
* `user.passwordHash` (hashed)
* `user.role` = `ACTIVIST_COORDINATOR`

**ActivistCoordinator table fields:**
* `activist_coordinators.cityId` (required)
* `activist_coordinators.title` (optional, e.g., "Neighborhood Organizer")
* `activist_coordinators.metadata` (JSON)

**M2M Assignments:**
* Can assign Activist Coordinators to neighborhoods via `activist_coordinator_neighborhoods`

---

# ⭐ 2. Entities SuperAdmin Can Create

## ✔ Area Manager (role entity)

* Specifies region ownership and management.
* Links cities to regional campaigns.

---

## ✔ City

Full system-wide permission to create cities.

**City table fields:**
* `cities.name` (required, e.g., "Tel Aviv-Yafo")
* `cities.code` (required, unique, e.g., "TLV")
* `cities.description` (optional)
* `cities.logoUrl` (optional, URL to uploaded image)
* `cities.areaManagerId` (optional, links to AreaManager)
* `cities.email` (optional)
* `cities.phone` (optional)
* `cities.address` (optional)
* `cities.settings` (JSON, city-level config)
* `cities.metadata` (JSON)

---

## ✔ Neighborhood

SuperAdmin can create neighborhoods inside **any city**.

**Neighborhood table fields:**
* `neighborhoods.cityId` (required)
* `neighborhoods.name` (required, e.g., "Florentin")
* `neighborhoods.address` (optional)
* `neighborhoods.city` (optional, text field for display)
* `neighborhoods.country` (optional, defaults to "Israel")
* `neighborhoods.latitude` (optional, decimal degrees)
* `neighborhoods.longitude` (optional, decimal degrees)
* `neighborhoods.phone` (optional)
* `neighborhoods.email` (optional)
* `neighborhoods.cityCoordinatorId` (optional, assigned City Coordinator)
* `neighborhoods.metadata` (JSON)

---

## ✔ Activists

SuperAdmin can create activists under **any neighborhood** in any city.

> **📝 Note:** Activists are data entities only, they do NOT have login capability.

**Activist table fields:**
* `activists.cityId` (required, for data integrity)
* `activists.neighborhoodId` (required)
* `activists.activistCoordinatorId` (optional, managing coordinator)
* `activists.fullName` (required)
* `activists.phone` (optional)
* `activists.email` (optional)
* `activists.position` (optional, role description)
* `activists.avatarUrl` (optional, URL to image)
* `activists.startDate` (optional)
* `activists.endDate` (optional)
* `activists.notes` (optional, coordinator notes)
* `activists.tags` (optional, JSON array of skills/certifications)
* `activists.metadata` (JSON)

---

## ✔ Activist Coordinator ↔ Neighborhood Assignments (M2M)

SuperAdmin can create ANY M2M link between activist coordinators and neighborhoods.

> **📝 Note:** The junction table is `activist_coordinator_neighborhoods` in the database.

```
activist_coordinator_id ↔ neighborhood_id (in same city)
```

SuperAdmin can:
* Assign activist coordinators to neighborhoods
* Remove assignments
* Assign multiple coordinators to one neighborhood
* Assign one coordinator to multiple neighborhoods

**ActivistCoordinatorNeighborhood table fields:**
* `activist_coordinator_neighborhoods.activistCoordinatorId` (required)
* `activist_coordinator_neighborhoods.neighborhoodId` (required)
* `activist_coordinator_neighborhoods.assignedAt` (timestamp, auto-generated)

---

## ✔ Invitations (for all role types)

SuperAdmin can create invitations for:

| Target Role             |
| ----------------------- |
| AREA_MANAGER            |
| CITY_COORDINATOR        |
| ACTIVIST_COORDINATOR    |

**Invitation table fields:**
* `invitations.email` (required)
* `invitations.role` (required, enum: AREA_MANAGER, CITY_COORDINATOR, ACTIVIST_COORDINATOR)
* `invitations.token` (unique, auto-generated)
* `invitations.status` (enum: PENDING, ACCEPTED, EXPIRED, REVOKED)
* `invitations.cityId` (required for CITY_COORDINATOR/ACTIVIST_COORDINATOR, null for AREA_MANAGER)
* `invitations.targetNeighborhoodId` (optional, for neighborhood-specific coordinator invites)
* `invitations.createdById` (required, SuperAdmin user ID)
* `invitations.message` (optional, custom message to invitee)
* `invitations.expiresAt` (required, expiration timestamp)
* `invitations.metadata` (JSON, can store region info for Area Manager)

---

# ⭐ 3. Token-Based Entities SuperAdmin Can Create

## ✔ User Tokens

SuperAdmin can generate user tokens for password reset or email confirmation.

**UserToken table fields:**
* `user_tokens.userId` (required)
* `user_tokens.type` (required, enum: EMAIL_CONFIRMATION, PASSWORD_RESET)
* `user_tokens.token` (unique, auto-generated)
* `user_tokens.expiresAt` (required)
* `user_tokens.usedAt` (nullable, set when token is consumed)

---

# ⭐ 4. Campaign Features SuperAdmin Can Create

## ✔ Tasks

SuperAdmin can create tasks for any activist in any city.

**Task table fields:**
* `tasks.title` (required)
* `tasks.description` (optional)
* `tasks.senderUserId` (required, SuperAdmin user ID)
* `tasks.targetRole` (optional, role filter)
* `tasks.targetCityId` (optional, city filter)
* `tasks.targetNeighborhoodId` (optional, neighborhood filter)
* `tasks.dueDate` (optional)
* `tasks.metadata` (JSON)

---

## ✔ Task Assignments

SuperAdmin can assign tasks to any activist.

**TaskAssignment table fields:**
* `task_assignments.taskId` (required)
* `task_assignments.recipientUserId` (required)
* `task_assignments.status` (enum: PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
* `task_assignments.completedAt` (nullable)

---

## ✔ Attendance Records

SuperAdmin can create/edit attendance records for any activist.

**AttendanceRecord table fields:**
* `attendance_records.activistId` (required)
* `attendance_records.neighborhoodId` (required)
* `attendance_records.cityId` (required, for filtering)
* `attendance_records.checkedInAt` (required)
* `attendance_records.checkedOutAt` (optional)
* `attendance_records.checkedInBy` (userId)
* `attendance_records.lastEditedBy` (userId)

---

## ✔ Voters

SuperAdmin can create/import voters for any city.

**Voter table fields:**
* `voters.fullName` (required)
* `voters.idNumber` (optional, unique)
* `voters.phone` (optional)
* `voters.email` (optional)
* `voters.cityId` (required, assigned city)
* `voters.neighborhoodId` (optional, assigned neighborhood)
* `voters.metadata` (JSON)

---

# ⭐ 5. Admin-Only System Entities

SuperAdmin can also create/manage:

### ✔ Global System Settings

(Separate table or JSON config, restricted to SuperAdmin only)

### ✔ Global Audit Logs

(Inserted automatically but SuperAdmin can trigger admin-level corrective actions)

---

# 🔥 Final Checklist of What SuperAdmin Can Create

### **Roles**

* Area Managers
* City Coordinators
* Activist Coordinators

### **Entities**

* Cities
* Neighborhoods
* Activists

### **Relationships**

* Activist Coordinator ↔ Neighborhood (M2M assignments)

### **Campaign Features**

* Tasks
* Task Assignments
* Attendance Records
* Voters

### **Platform Mechanics**

* Invitations
* User tokens
* System settings

---

# 📚 Schema Reference

All field names in this document match exactly with the **Prisma schema** (`app/prisma/schema.prisma`).

**Key Model Names:**
- `User` - All user accounts
- `AreaManager` - Area Manager role data
- `CityCoordinator` - City Coordinator role data
- `ActivistCoordinator` - Activist Coordinator role data
- `City` - City entities
- `Neighborhood` - Neighborhood entities
- `Activist` - Activist data entities (no login)
- `ActivistCoordinatorNeighborhood` - M2M junction table for coordinator ↔ neighborhood assignments
- `Invitation` - Invitation system
- `UserToken` - Password reset and email confirmation tokens
- `Task` - Task system
- `TaskAssignment` - Task assignments
- `AttendanceRecord` - Attendance tracking
- `Voter` - Voter management
- `AuditLog` - System-wide audit logging (future feature)

**For implementation details, always refer to the actual Prisma schema file.**

---

# 🔒 Security Constraints

SuperAdmin **cannot** (or should not):

* ❌ Be created via UI/API (DB/bootstrap only)
* ❌ Have `is_super_admin` flag exposed in public APIs
* ❌ Delete production data (use soft deletes: `is_active = false`)
* ❌ Skip audit logging for sensitive operations
* ❌ Bypass validation rules (even with full access)

---

# 📋 Related Documentation

- **Area Manager Roles**: `./areManagerRoles.md`
- **City Coordinator Roles**: `./cityCoordinatorRoles.md`
- **Activist Coordinator Roles**: `./activistCoordinatorRoles.md`
- **Permissions Matrix**: `./PERMISSIONS_MATRIX.md` (Single Source of Truth)
- **Hierarchy Overview**: `./hierarchy.md`
- **Database Schema**: `../../app/prisma/schema.prisma`

---

**Last Updated:** 2025-12-21
**Version:** 2.0 (Election Campaign System)
**Status:** ✅ Active - Current System
**Migration Note:** Migrated from v1.3 Corporate System
