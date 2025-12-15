# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 Quick Start for New Developers

**TL;DR - Get running in 5 minutes:**

```bash
# 1. Start Docker services (from project root)
make up && make health

# 2. Setup database (from app/ directory)
cd app
npm install
npm run db:generate && npm run db:push && npm run db:seed

# 3. Start dev server
npm run dev  # → http://localhost:3200

# 4. Login as SuperAdmin
# Email: superadmin@election.test
# Password: admin123
```

**What you're building:** Election Campaign Management System for politicians to coordinate field activists across cities and neighborhoods. Think "Monday.com meets political campaign field operations" with Hebrew UI and strict RBAC.

**Key facts:**
- 🇮🇱 **Hebrew-only, RTL-only** (no English support)
- 🎯 **Work in `/app` directory** (repository root is historical)
- 🗄️ **PostgreSQL + Redis** via Docker (use PgBouncer port 6433 for app)
- 🔐 **4 roles:** SuperAdmin → Area Manager → City Coordinator → Activist Coordinator
- 🧪 **Dev server:** Port 3200, **Tests:** Port 3000
- 📝 **Log all bugs** to `docs/localDev/bugs.md` (bug + solution)

---

## 🇮🇱 CRITICAL: HEBREW-FIRST SYSTEM

**THIS IS A HEBREW-ONLY APPLICATION**

- ✅ **ALL UI text MUST be in Hebrew**
- ✅ **ALL database records MUST be Hebrew**
- ✅ **RTL (Right-to-Left) is MANDATORY**
- ✅ **Default locale is `he-IL`, not `en`**
- ❌ **NO bilingual support**
- ❌ **NO English fallbacks**
- ❌ **NO locale switching**

**When creating any component:**
1. Use Hebrew labels ONLY
2. Set `direction="rtl"` on all containers
3. Use `marginInlineStart` / `marginInlineEnd` (not left/right)
4. Align text to the right for RTL

## ⚠️ CRITICAL: Single Source of Truth

**ALL development work happens in the `/app` directory.**

```
/corporations (repository name - historical)
├── app/                    ← 🎯 MAIN APPLICATION (WORK HERE)
│   ├── prisma/            ← Database schema & seed (SINGLE SOURCE OF TRUTH)
│   │   ├── schema.prisma  ← ONLY DATABASE SCHEMA
│   │   └── seed.ts        ← ONLY SEED SCRIPT
│   ├── app/               ← Next.js 15 App Router
│   │   ├── [locale]/      ← Internationalization routes (Hebrew primary)
│   │   ├── api/           ← API Routes
│   │   ├── actions/       ← Server Actions
│   │   └── components/    ← Shared components
│   ├── lib/               ← Utilities, auth, design system
│   ├── package.json       ← Dependencies & scripts
│   └── ...
└── docs/                  ← Documentation only (READ-ONLY)
```

**Working Directory:** ALWAYS `cd app/` before running commands.

**Database Commands:** Run from `app/` directory:
```bash
cd app
npm run db:generate  # Generate Prisma Client
npm run db:push      # Push schema to database
npm run db:seed      # Seed with test data
npm run db:studio    # Open Prisma Studio
```

---

## Project Overview

**🗳️ Election Campaign Management System (v2.0)** - A comprehensive field operations platform for politicians and campaign managers to coordinate election campaigns, track activist activity, and manage ground operations across cities and neighborhoods.

### 🎯 System Purpose

This system enables **politicians and campaign managers** to:
- **Track Campaign Ground Operations**: Monitor activist activity, attendance, and task completion in real-time
- **Coordinate Field Teams**: Organize activists across neighborhoods and cities with clear hierarchical management
- **Assign & Monitor Tasks**: Distribute campaign tasks to field activists and track their progress
- **Analyze Campaign Performance**: View analytics and reports on activist engagement, task completion rates, and attendance patterns
- **Manage Geographic Operations**: Organize campaign activities by area, city, and neighborhood (שכונות)
- **Real-time Communication**: Push notifications for urgent tasks and campaign updates

**Primary Users**: Politicians, Campaign Managers, Area Coordinators, Neighborhood Organizers

**IMPORTANT MIGRATION NOTE**: This system was migrated from a corporate hierarchy platform to an election campaign system. The repository name "corporations" is historical. The actual domain is now:
- **Election Campaign System** (formerly Corporations)
- **Activists** (formerly Workers) - Field volunteers and campaign workers
- **Neighborhoods** (formerly Sites) - Geographic campaign areas
- **City Coordinators** (formerly Managers) - City-level campaign managers
- **Activist Coordinators** (formerly Supervisors) - Neighborhood-level organizers

**Current State**:
- ✅ **Next.js 15 app** - Running at http://localhost:3200 (dev), http://localhost:3000 (tests)
- ✅ **Authentication** - NextAuth v5 with bcrypt password hashing
- ✅ **Database schema** - Election/Activism domain model (migrated from corporate)
- ✅ **Docker environment** - PostgreSQL, Redis, PgBouncer, Adminer, MailHog
- ✅ **Playwright E2E tests** - Auth, RBAC, multi-tenant isolation
- ✅ **Hebrew-first UI** - RTL support with next-intl
- ⏳ **Full CRUD operations** - In active development

**Tech Stack**:
- **Backend**: Next.js 15 API Routes + Server Actions, NextAuth v5, Prisma ORM
- **Frontend**: Next.js 15 App Router, Material-UI v6, React Hook Form + Zod, Framer Motion
- **Database**: PostgreSQL 15 (via PgBouncer connection pooling)
- **Infrastructure**: Docker Compose (local), Railway (planned production)
- **Testing**: Playwright E2E tests, integration tests for worker-supervisor integrity
- **i18n**: next-intl with Hebrew (he-IL) as primary locale
- **Design**: Monday.com-inspired design system with pastel colors

## Development Environment

### Quick Start (First Time Setup)

```bash
# 1. Start Docker services (from project root)
make up                 # Starts PostgreSQL, Redis, PgBouncer, Adminer, MailHog
make health             # Verify all services are running

# 2. Setup database (from app/ directory)
cd app
npm install             # Install dependencies
npm run db:generate     # Generate Prisma Client
npm run db:push         # Create database tables
npm run db:seed         # Seed with test data

# 3. Start development server
npm run dev             # Starts at http://localhost:3200
```

### Common Commands (from project root)

```bash
# Docker services
make up                 # Start all Docker containers
make down               # Stop all containers (data persists)
make clean              # Stop and remove volumes (⚠️ deletes data!)
make health             # Check service health
make logs               # View all container logs
make ps                 # List running containers

# Database operations
make db-shell           # Connect to PostgreSQL with psql
make db-backup          # Backup database to ./backups/
make db-reset           # Reset database (⚠️ deletes all data!)

# Redis operations
make redis-cli          # Connect to Redis CLI
make redis-flush        # Clear all Redis data

# Testing
make test               # Run Playwright E2E tests
make test-ui            # Run tests with Playwright UI
make test-headed        # Run tests in headed browser
```

### Application Commands (from app/ directory)

```bash
# Development
npm run dev             # Start dev server (port 3200)
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint

# Database
npm run db:generate     # Generate Prisma Client (after schema changes)
npm run db:push         # Push schema changes to database
npm run db:migrate      # Create migration files (production)
npm run db:seed         # Seed database with test data
npm run db:seed:prod    # Seed production database
npm run db:studio       # Open Prisma Studio (database GUI)

# Data integrity
npm run db:check-integrity    # Check worker-supervisor relationships
npm run db:fix-integrity      # Fix integrity issues

# Testing
npm run test:e2e              # Run all E2E tests (headless)
npm run test:e2e:ui           # Run with Playwright UI
npm run test:e2e:headed       # Run in headed browser
npm run test:e2e:debug        # Run in debug mode
npm run test:worker-supervisor # Run worker-supervisor integration tests
```

### Available Services

| Service | URL/Port | Credentials |
|---------|----------|-------------|
| PostgreSQL (direct) | `localhost:5434` | `postgres` / `postgres_dev_password` |
| PgBouncer (pooled) | `localhost:6433` | Use this for app connections |
| Redis | `localhost:6381` | Password: `redis_dev_password` |
| Adminer (DB UI) | http://localhost:8081 | Server: `postgres`, User: `postgres` |
| MailHog (Email testing) | http://localhost:8025 | No auth required |

### Database Connection Strings

```bash
# For application code (use PgBouncer pooling)
DATABASE_URL_POOLED="postgresql://postgres:postgres_dev_password@localhost:6433/hierarchy_platform?pgbouncer=true"

# For migrations and admin tasks (direct connection)
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform"
```

## Architecture

### Campaign Organizational Hierarchy

**The system reflects a typical political campaign structure:**

```
SuperAdmin (Platform Administrator - system-wide access)
└── Election Campaign System (multi-region coordination)
    ├── Area Managers (Regional Campaign Directors - oversee multiple cities)
    │   └── Manage regional strategy, cross-city analytics, resource allocation
    └── City Coordinators (City Campaign Managers - single city operations)
        └── Activist Coordinators (Neighborhood Organizers - on-the-ground leaders)
            └── Neighborhoods (Geographic Campaign Districts/Precincts)
                └── Activists (Field Volunteers & Campaign Workers)
                    ├── Door-to-door canvassing
                    ├── Phone banking
                    ├── Event coordination
                    └── Voter outreach
```

**Campaign Structure Example:**
- **SuperAdmin**: Platform administrator (technical role)
- **Area Manager**: Regional Campaign Director for Tel Aviv District (manages 5 cities)
- **City Coordinator**: Campaign Manager for Tel Aviv-Yafo (manages 12 neighborhoods)
- **Activist Coordinator**: Neighborhood Organizer for Florentin (leads 30 activists)
- **Activists**: Field volunteers doing canvassing, phone banking, voter registration

### Role-Based Access Control (RBAC)

**SuperAdmin**:
- System-wide access across all election systems
- Creates and manages area managers and cities
- Cannot be created via UI/API (database/seed script only)
- Flag: `users.is_super_admin = true`

**Area Manager** (DB: `area_managers`):
- Region-wide access (e.g., Tel Aviv region)
- Full CRUD: City Coordinators, Activist Coordinators, Neighborhoods, Activists
- Manages multiple cities within their area
- Can view cross-city analytics

**City Coordinator** (DB: `city_coordinators`):
- City-scoped access (single city)
- Full CRUD: Activist Coordinators, Neighborhoods, Activists within their city
- Cannot access other cities
- Manages task distribution and attendance

**Activist Coordinator** (DB: `activist_coordinators`):
- Neighborhood-scoped access (via M2M `activist_coordinator_neighborhoods`)
- Can manage activists in assigned neighborhoods only
- Track attendance, assign tasks
- Cannot manage neighborhoods or other coordinators

**Activist** (DB: `activists`):
- Tracked individual (not a system user)
- Assigned to one neighborhood
- Has attendance records and task assignments
- Soft-deleted via `is_active = false`

### Critical RBAC Rules

**Creation Permissions**:
- SuperAdmin → Only via database/seed script (never via UI/API)
- Area Manager → Only SuperAdmin can create
- City Coordinator → SuperAdmin or Area Manager
- Activist Coordinator → SuperAdmin, Area Manager, or City Coordinator (same city)
- Neighborhood → SuperAdmin, Area Manager, or City Coordinator (same city)
- Activist → SuperAdmin, Area Manager, City Coordinator, or Activist Coordinator (assigned neighborhoods only)

**Data Isolation**:
- All queries MUST filter by `city_id` or area scope except for SuperAdmin
- Activist Coordinators can only access neighborhoods in `activist_coordinator_neighborhoods` table
- Use Prisma middleware or API middleware to enforce data filters
- Test cross-city and cross-area isolation thoroughly

**Organization Tree Visibility (CRITICAL)**:
⚠️ **EACH USER SEES ONLY THEMSELVES AND WHAT'S UNDER THEM**

- **SuperAdmin**: Sees full hierarchy starting from SuperAdmin root
  ```
  Super Admin (ROOT)
  └── All Areas
      └── All Area Managers
          └── All Cities
              └── All Neighborhoods
                  └── All Activists
  ```

- **Area Manager**: Sees ONLY their area as ROOT (NO SuperAdmin visible!)
  ```
  [Their Area Name] (ROOT - e.g., "מחוז הצפון")
  └── [Their Name] (Area Manager)
      └── [Their Cities Only]
          └── Neighborhoods
              └── Activists
  ```

- **City Coordinator**: Sees ONLY their city as ROOT (NO SuperAdmin, NO Area Manager!)
  ```
  [Their City Name] (ROOT - e.g., "טבריה")
  └── Coordinators Group
  └── Activist Coordinators Group
  └── [Their Neighborhoods Only]
      └── Activists
  ```

- **Activist Coordinator**: Sees ONLY their city as ROOT (with assigned neighborhoods only)
  ```
  [Their City Name] (ROOT - e.g., "שפרעם")
  └── [Only Assigned Neighborhoods]
      └── [Only Their Activists]
  ```

**IMPLEMENTATION RULES**:
- ❌ Lower users NEVER see SuperAdmin node in tree
- ❌ Area Managers NEVER see other areas or SuperAdmin
- ❌ City Coordinators NEVER see SuperAdmin, Area Manager, or other cities
- ❌ Activist Coordinators NEVER see neighborhoods they don't manage
- ✅ Tree root changes based on role (not just data filtering)
- ✅ API endpoint: `GET /api/org-tree` enforces role-based tree root
- ✅ File: `app/app/api/org-tree/route.ts` - implements role-specific tree building

**Navigation & Data Filtering (CRITICAL)**:
⚠️ **NAVIGATION TABS SHOW BASED ON ROLE - DATA FILTERING HAPPENS IN EACH PAGE**

**Navigation Rules by Role:**
- **SuperAdmin**: Dashboard, Attendance, Map, Areas, Cities, Neighborhoods, Activists, Users, System Rules
- **Area Manager**: Dashboard, Attendance, Map, Areas, Cities, Neighborhoods, Activists, Users, System Rules
- **City Coordinator**: Dashboard, Attendance, Neighborhoods, Activists, Users (NO Cities tab)
- **Activist Coordinator**: Dashboard, Attendance, Neighborhoods, Activists, Users (NO Cities tab)

**🔒 LOCKED PAGES (DO NOT MODIFY - REGRESSION PROTECTION):**

### Cities Page - LOCKED to SuperAdmin & Area Manager ONLY
**File:** `app/app/[locale]/(dashboard)/cities/page.tsx`
**Access:** SuperAdmin, Area Manager ONLY
**Lock Date:** 2025-12-15
**Reason:** Cities are top-level organizational units
- City Coordinators manage ONE city (don't need to see list)
- Activist Coordinators work within neighborhoods (cities out of scope)

**LOCKED LOGIC:**
```typescript
// ⚠️ DO NOT MODIFY - LOCKED LOGIC
if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AREA_MANAGER') {
  return <AccessDenied />;
}
```

**Navigation:**
- Cities tab REMOVED from City Coordinator navigation
- Cities tab REMOVED from Activist Coordinator navigation
- Cities tab VISIBLE for SuperAdmin and Area Manager only

**Data Filtering:**
- **SuperAdmin**: Sees ALL cities
- **Area Manager**: Sees ONLY cities in their area (`whereClause.areaManagerId`)

**⚠️ CHANGING THIS LOGIC WILL CAUSE REGRESSION BUGS**

---

**Other Pages (Not Locked):**
- **Neighborhoods**: ALL roles can access, data filtered by assigned scope
- **Activists**: ALL roles can access, data filtered by assigned scope
- **Users**: SuperAdmin, Area Manager, City Coordinator only

**Files:**
- Navigation: `app/app/components/layout/NavigationV3.tsx`
- Cities Page: `app/app/[locale]/(dashboard)/cities/page.tsx` (LOCKED)
- Neighborhoods Page: `app/app/[locale]/(dashboard)/neighborhoods/page.tsx`
- Data filtering: Each page component + API routes MUST enforce scope filtering

**Campaign Management Features**:
- **Activist Attendance Tracking**: Monitor field volunteer check-ins/outs, track hours worked, GPS location verification
- **Campaign Task Management**: Assign canvassing routes, phone banking shifts, event coordination tasks with priority and deadlines
- **Real-time Push Notifications**: Instant updates for urgent campaign tasks, event changes, and coordination needs
- **Campaign Analytics & Reporting**:
  - Track activist engagement and productivity
  - Monitor task completion rates by neighborhood
  - Measure campaign reach and coverage
  - Generate reports for campaign managers and politicians
  - View real-time campaign activity across all regions

## Database Schema

**Schema Location**: `app/prisma/schema.prisma` (Single Source of Truth)

### Core Tables (Election/Activism Domain)

**User Management:**
- `users` - All user accounts with role and `is_super_admin` flag
- `user_tokens` - Password reset and email confirmation tokens

**Organizational Structure:**
- `area_managers` - Area manager role assignments
- `cities` - Cities within election system (geographic boundaries)
- `city_coordinators` - City coordinator role assignments
- `activist_coordinators` - Activist coordinator role assignments
- `activist_coordinator_neighborhoods` - M2M relationship (coordinator ↔ neighborhoods)
- `neighborhoods` - Physical locations/districts within cities
- `activists` - Tracked individuals (non-system users)

**Feature Tables:**
- `invitations` - User invitation system with tokens
- `tasks` - Task management system
- `task_assignments` - M2M relationship (tasks ↔ users/activists)
- `attendance_records` - Check-in/out tracking with GPS
- `push_subscriptions` - Web push notification subscriptions

### Important Constraints

- **Role Uniqueness**: `UNIQUE (city_id, user_id)` for city coordinators
- **Activist Uniqueness**: `UNIQUE (neighborhood_id, full_name, phone)`
- **M2M Junction**: References composite FKs with cascade deletes
- **Soft Deletes**: Use `is_active = false` for activists
- **Data Integrity**: Foreign key constraints with cascade/set null rules

### PostgreSQL Extensions (Auto-installed)

```sql
pg_trgm              -- Trigram matching for fuzzy search
btree_gin            -- GIN indexes for B-tree types
cube                 -- N-dimensional cube data type
earthdistance        -- Earth distance calculations
pg_stat_statements   -- Query performance statistics
citext               -- Case-insensitive text
uuid-ossp            -- UUID generation
pgcrypto             -- Cryptographic functions
```

## Testing

### Playwright E2E Tests

Tests are located in `tests/e2e/` with the following structure:

```
tests/e2e/
├── fixtures/
│   └── auth.fixture.ts          # Test users and login helpers
├── page-objects/
│   └── DashboardPage.ts         # Page object models
├── auth/
│   └── login.spec.ts            # Authentication tests
├── rbac/
│   └── permissions.spec.ts      # Permission boundary tests
├── multi-tenant/
│   └── isolation.spec.ts        # Corporation isolation tests
└── invitations/
    └── invitation-flow.spec.ts  # Invitation workflow tests
```

### Test Users (Fixtures)

```typescript
testUsers = {
  superAdmin: 'superadmin@election.test',
  areaManager: 'area.manager@election.test',
  cityCoordinator: 'city.coordinator@telaviv.test',
  activistCoordinator: 'activist.coordinator@telaviv.test'
}
```

**Note**: E2E tests verify:
- Authentication flows (login, logout, session)
- RBAC permission boundaries (role-specific access)
- Multi-tenant isolation (cross-city data leakage prevention)
- Attendance tracking workflow
- Task assignment and notification flow

### Running Tests

```bash
npm run test:e2e           # Run all tests headless
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:headed    # Run in headed browser mode
npm run test:e2e:debug     # Run in debug mode
```

### Test Configuration

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env)
- **RTL locale**: `he-IL` (Hebrew)
- **Timezone**: `Asia/Jerusalem`
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Web server**: Auto-starts in dev mode (when `npm run dev` is available)
- **Config file**: `app/playwright.config.ts`

## Campaign Management Workflows

### Campaign Team Onboarding

**Use Case**: City Coordinator invites neighborhood organizers to join the campaign team

1. Campaign manager creates invitation with role type (area_manager, city_coordinator, activist_coordinator)
2. System generates unique secure token → stored in `invitations` table
3. Invitation email sent via SMTP (MailHog in dev, SendGrid/Resend in production)
4. Team member clicks invitation link → token validated and not expired
5. New user account created if doesn't exist, appropriate campaign role assigned
6. Invitation marked with `accepted_at` timestamp
7. User redirected to role-specific campaign dashboard

### Campaign Authentication Flow (NextAuth v5)

1. Campaign team member logs in with email/password (bcrypt verification)
2. Session token stored in HTTP-only cookie
3. Session payload: `user_id`, `email`, `role`, `isSuperAdmin`, area/city scope
4. Middleware validates session on protected routes
5. Server Actions/API Routes verify campaign permissions per-request
6. Token refresh handled automatically by NextAuth

### Field Activist Attendance Tracking

**Use Case**: Activist coordinator tracks field volunteers during canvassing operations

1. Coordinator marks activist as "checked in" at campaign location with timestamp
2. System records GPS coordinates (verifies activist is at assigned location)
3. Coordinator can add notes about activist assignment (e.g., "Door-to-door in blocks 5-8")
4. Check-out recorded with duration calculation and work summary
5. Attendance history displayed in activist profile with total hours contributed
6. Analytics aggregate attendance by neighborhood/city for campaign reporting
7. Politicians can view real-time field activity across all regions

### Campaign Task Assignment & Coordination

**Use Case**: City Coordinator assigns canvassing tasks to neighborhood teams

1. Coordinator creates campaign task:
   - **Canvassing**: Door-to-door routes with target addresses
   - **Phone Banking**: Call lists with voter contact info
   - **Event Coordination**: Rally setup, voter registration drives
   - **Data Collection**: Survey responses, voter sentiment tracking
2. Assigns task to specific activists or entire neighborhoods
3. Push notification sent to assigned activists (if subscribed to web push)
4. Activists see tasks in their mobile-friendly dashboard with maps and details
5. Task status tracked: pending → in_progress → completed
6. Coordinators and politicians monitor completion rates and campaign progress
7. Real-time updates on campaign coverage and voter outreach metrics

## UI/UX Requirements

### 🇮🇱 HEBREW-ONLY, RTL-ONLY (No Exceptions!)

**This is NOT a bilingual system. Hebrew is the ONLY language.**

- ✅ ALWAYS use `dir="rtl"` and `lang="he"` on ALL components
- ✅ ALWAYS use Hebrew labels (no English)
- ✅ ALWAYS configure MUI theme for RTL with `stylis-plugin-rtl`
- ✅ ALWAYS use `marginInlineStart` / `marginInlineEnd` (not left/right)
- ✅ ALWAYS align text to the right
- ✅ Default (and ONLY) locale: `he-IL`
- ✅ Timezone: `Asia/Jerusalem`
- ❌ NO locale selector
- ❌ NO English translations
- ❌ NO bilingual support

### Dashboard Navigation (Hebrew)

**Sidebar Structure (varies by role)**:

SuperAdmin:
- מערכת הבחירות (Election System Overview)
- מנהלי אזור (Area Managers)
- ערים (Cities)
- רכזים (Coordinators)
- שכונות (Neighborhoods)
- פעילים (Activists)
- משימות (Tasks)
- נוכחות (Attendance)
- הגדרות מערכת (System Settings)

Area Manager:
- לוח בקרה (Dashboard)
- ערים שלי (My Cities)
- רכזי עיר (City Coordinators)
- שכונות (Neighborhoods)
- פעילים (Activists)
- משימות (Tasks)
- דוחות (Reports)

City Coordinator:
- לוח בקרה (Dashboard)
- רכזי פעילים (Activist Coordinators)
- שכונות (Neighborhoods)
- פעילים (Activists)
- משימות (Tasks)
- נוכחות (Attendance)
- מפה (Map)

Activist Coordinator:
- לוח בקרה (Dashboard)
- הפעילים שלי (My Activists)
- משימות (Tasks)
- נוכחות (Attendance)
- מפה (Map)

**Top Bar (All Roles)**:
- Search: "חיפוש..." (Search...)
- Notifications: עדכונים (Updates)
- User menu: שלום, [שם מלא] (Hello, [Full Name])

**KPI Cards (Role-Specific)**:
- פעילים פעילים (Active Activists)
- משימות פעילות (Active Tasks)
- נוכחות היום (Today's Attendance)
- שכונות (Neighborhoods)

## Security Considerations

### Multi-Tenancy Security

- **ALWAYS** filter by `city_id` or area scope in WHERE clauses (except SuperAdmin)
- **NEVER** expose `is_super_admin` flag in public APIs
- Validate city/area scope matches user's role on every API request
- Activist Coordinators must validate neighborhood access via `activist_coordinator_neighborhoods` join
- Test cross-city and cross-area data leakage thoroughly in E2E tests
- **GPS Coordinates**: Store securely, only visible to authorized coordinators

### Authentication & Authorization

- Hash passwords with bcrypt/argon2 (use `bcryptjs` for Next.js)
- Use HTTP-only cookies for refresh tokens
- Access tokens in memory or short-lived localStorage
- Validate all DTOs with Zod on both client and server
- Rate limit authentication endpoints
- Log all failed authentication attempts

### Best Practices

- Validate input on both client (React Hook Form + Zod) and server (Zod)
- Sanitize user inputs to prevent XSS
- Use parameterized queries (Prisma handles this)
- Implement CSRF protection (NextAuth handles this)
- Enable CORS only for trusted origins in production

## Development Guidelines

### When Implementing Backend

1. Start with Prisma schema matching database specification
2. Implement RBAC guards/middleware before controllers (campaign data isolation is critical)
3. Test multi-city isolation first (prevent cross-campaign data leakage)
4. Always log mutations to `audit_logs` (campaign operations audit trail)
5. Use Prisma middleware to auto-inject city/area filters (except for SuperAdmin)
6. Never allow cross-city campaign data leakage (strict data isolation)
7. Consider mobile-first for activist-facing features (field volunteers use mobile devices)
8. Optimize for real-time updates (campaign coordinators need live activity tracking)

### When Implementing Frontend

1. Setup MUI theme with RTL support first (Hebrew is primary language)
2. Use `data-testid` attributes for all interactive elements (E2E testing)
3. Implement React Hook Form + Zod for all forms
4. Use TanStack Table for data grids (activist lists, task assignments, attendance logs)
5. **Mobile-first design** - Field activists primarily use mobile devices
6. **Real-time updates** - Use polling or WebSockets for live campaign activity
7. **GPS integration** - Location tracking for attendance verification
8. **Offline support** (future) - Field activists may have poor connectivity
9. Ensure all UI is responsive and works on mobile browsers
10. Test with `he-IL` locale enabled (Hebrew-only system)
11. Use maps integration (Google Maps/Mapbox) for neighborhood visualization

### Terminology (v2.0 Election Campaign System)

**IMPORTANT**: As of v2.0, the system was migrated from corporate hierarchy to election campaign management:

| Campaign Role | Database Table | Code Reference | Real-world Example |
|---------------|----------------|----------------|-------------------|
| Election Campaign System | N/A (organizational concept) | - | National/Regional Campaign |
| Area Manager | `area_managers` | `AreaManager` | Regional Campaign Director |
| City | `cities` | `City` | Tel Aviv-Yafo, Jerusalem |
| City Coordinator | `city_coordinators` | `CityCoordinator` | City Campaign Manager |
| Activist Coordinator | `activist_coordinators` | `ActivistCoordinator` | Neighborhood Organizer |
| Neighborhood | `neighborhoods` | `Neighborhood` | Florentin, Neve Tzedek (שכונות) |
| Activist | `activists` | `Activist` | Field Volunteer, Campaign Worker |
| Task | `tasks` | `Task` | Canvassing Route, Phone Banking Shift |
| Attendance | `attendance_records` | `AttendanceRecord` | Check-in/out at Campaign HQ |

**Migration from v1.x (Corporate Hierarchy)**:
- Corporation → Election Campaign System
- Manager → Area Manager / City Coordinator (Campaign Managers)
- Supervisor → Activist Coordinator (Neighborhood Organizers)
- Site → Neighborhood (Campaign Districts/Precincts)
- Worker → Activist (Field Volunteers)

**Domain Context**: This is a political campaign field operations system. All terminology and features are designed around coordinating activists, tracking campaign activities, and providing analytics to politicians and campaign managers.

**Historical Note**: Pre-v2.0 was a corporate hierarchy system. Repository name "corporations" remains for continuity but the domain is now exclusively election campaign management.

## File Structure

```
/corporations (repository root)
├── app/                          # 🎯 MAIN APPLICATION
│   ├── app/                      # Next.js 15 App Router
│   │   ├── [locale]/             # i18n routes (he, en)
│   │   │   ├── (auth)/           # Auth pages
│   │   │   │   └── login/
│   │   │   └── (dashboard)/      # Protected routes
│   │   │       ├── dashboard/    # Main dashboard
│   │   │       ├── activists/    # Activist management
│   │   │       ├── attendance/   # Attendance tracking
│   │   │       ├── cities/       # City management
│   │   │       ├── map/          # Interactive map view
│   │   │       ├── neighborhoods/# Neighborhood management
│   │   │       ├── tasks/        # Task management
│   │   │       └── users/        # User management
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/[...nextauth]/ # NextAuth endpoints
│   │   │   ├── org-tree/         # Organization tree API
│   │   │   └── ...               # Feature APIs
│   │   ├── actions/              # Server Actions
│   │   │   ├── dashboard.ts
│   │   │   ├── activists.ts
│   │   │   └── ...
│   │   └── components/           # Shared UI components
│   ├── lib/                      # Core utilities
│   │   ├── auth.ts               # NextAuth config
│   │   ├── prisma.ts             # Prisma client
│   │   ├── theme.ts              # MUI theme with RTL
│   │   ├── design-system.ts      # Design tokens
│   │   ├── tasks.ts              # Task management utilities
│   │   ├── attendance.ts         # Attendance tracking
│   │   └── push-notifications.ts # Web push setup
│   ├── prisma/                   # 🗄️ DATABASE (Single Source of Truth)
│   │   ├── schema.prisma         # Database schema
│   │   ├── seed.ts               # Development seed
│   │   └── seed-production.ts   # Production seed
│   ├── messages/                 # i18n translations
│   │   ├── he.json               # Hebrew (primary)
│   │   └── en.json               # English (secondary)
│   ├── scripts/                  # Utility scripts
│   │   └── check-worker-supervisor-integrity.ts
│   ├── tests/                    # Integration tests
│   │   └── integration/
│   ├── package.json              # Dependencies & scripts
│   ├── next.config.ts            # Next.js configuration
│   ├── auth.config.ts            # NextAuth configuration
│   ├── middleware.ts             # Route protection & i18n
│   └── i18n.ts                   # i18n configuration
├── tests/e2e/                    # E2E tests (Playwright)
│   ├── fixtures/                 # Test data
│   ├── auth/                     # Auth tests
│   ├── rbac/                     # Permission tests
│   └── multi-tenant/             # Isolation tests
├── docs/                         # Documentation (READ-ONLY)
│   └── syAnalyse/                # Requirements & specs
├── docker/                       # Docker init scripts
├── docker-compose.yml            # Docker services
├── Makefile                      # Development commands
├── playwright.config.ts          # Playwright configuration
└── CLAUDE.md                     # This file
```

## Documentation Reference

Documentation is in `docs/syAnalyse/`:

- **PRD**: `PRD_2025_Updated_Industry_Standards.md` - Product requirements with 2025 standards
- **Tech Stack**: `mvp/00_TECH_STACK_FINAL.md` - Complete technology decisions
- **Database**: `mvp/02_DATABASE_SCHEMA.md` - Schema documentation (Prisma format)
- **API Design**: `mvp/03_API_DESIGN.md` - RESTful API endpoints
- **UI Specs**: `mvp/04_UI_SPECIFICATIONS.md` - Screen-by-screen UI/UX requirements
- **Implementation**: `mvp/05_IMPLEMENTATION_PLAN.md` - Development roadmap
- **Docker**: `mvp/08_DOCKER_DEVELOPMENT.md` - Docker environment guide

## Key Architecture Patterns

### Server Actions vs API Routes

- **Server Actions** (preferred): Direct database access for mutations within components
- **API Routes**: Use for external integrations, webhooks, non-React clients
- **Auth Middleware**: NextAuth middleware validates all requests in `middleware.ts`

### Data Fetching Strategy

- **RSC**: Use React Server Components for initial page data (async components)
- **Client**: Use TanStack Query for client-side data fetching and mutations
- **Optimistic Updates**: Implement for task assignments and attendance tracking

### RTL Support

- **MUI Theme**: Configure with `createTheme({ direction: 'rtl' })` + `stylis-plugin-rtl`
- **CSS Logical Properties**: Use `marginInlineStart/End` instead of left/right
- **next-intl**: Provides locale-based routing and translations

### Design System

- **Monday.com Style**: Pastel colors, rounded corners (20px), soft shadows
- **Component Library**: Material-UI v6 with custom theme
- **Icons**: Lucide React (RTL-compatible)
- **Animations**: Framer Motion for smooth transitions

## 🔧 Troubleshooting

### Common Issues & Solutions

**Port Conflicts**
```bash
# Problem: "Port 3200 already in use"
# Solution: Kill existing process
lsof -ti:3200 | xargs kill -9
npm run dev

# Or use different port
PORT=3201 npm run dev
```

**Database Connection Errors**
```bash
# Problem: "Can't reach database server"
# Solution: Check Docker services
make health                    # Check all services
make logs-postgres             # View PostgreSQL logs
docker-compose restart postgres pgbouncer

# Problem: "Prisma Client not generated"
# Solution: Regenerate Prisma Client
cd app
npm run db:generate
```

**Prisma Schema Changes Not Reflecting**
```bash
# Always run this sequence after schema changes:
cd app
npm run db:generate            # Generate new Prisma Client
npm run db:push                # Push schema to database
npm run db:check-integrity     # Verify data integrity
```

**Test Failures**
```bash
# Problem: Tests failing with "Element not found"
# Check if it's a test issue (selectors, timing) vs actual bug

# Problem: "Port 3000 expected but dev server on 3200"
# Tests expect port 3000, dev server uses 3200
# Playwright auto-starts test server on 3000

# Run tests with UI for debugging
npm run test:e2e:ui
```

**Worker-Supervisor Integrity Issues**
```bash
# Problem: Workers not showing up for supervisors
cd app
npm run db:check-integrity      # Check for issues
npm run db:fix-integrity --fix  # Auto-repair relationships
```

**Redis Connection Issues**
```bash
# Problem: Redis connection refused
make redis-cli                  # Test Redis connection
make logs-redis                 # Check Redis logs

# Flush Redis if needed
make redis-flush
```

**Build Errors**
```bash
# Problem: "Module not found" after pulling changes
cd app
npm install                     # Reinstall dependencies
npm run db:generate             # Regenerate Prisma Client
rm -rf .next                    # Clear Next.js cache
npm run build                   # Rebuild
```

**Hebrew/RTL Not Working**
```typescript
// Always include these in components:
<Box dir="rtl" lang="he">
  {/* Hebrew content */}
</Box>

// Use logical properties:
marginInlineStart  // NOT marginLeft
marginInlineEnd    // NOT marginRight
```

**Cross-City Data Leakage**
```typescript
// WRONG - Missing city filter
const activists = await prisma.activist.findMany({
  where: { is_active: true }
});

// CORRECT - Always filter by scope
const activists = await prisma.activist.findMany({
  where: {
    is_active: true,
    neighborhood: {
      city_id: session.user.cityId  // RBAC filter
    }
  }
});
```

### Getting Help

1. **Check Logs**: `make logs` or `make logs-postgres`
2. **Verify Services**: `make health`
3. **Database GUI**: Adminer at http://localhost:8081
4. **Prisma Studio**: `npm run db:studio`
5. **Review Documentation**: `docs/syAnalyse/` directory
6. **Check Bug Log**: `docs/localDev/bugs.md` for known issues

---

## Important Reminders

### ✅ ALWAYS DO

- **Use PgBouncer** connection (`localhost:6433`) for app database queries
- **Filter by scope**: `city_id` or area for all queries (except SuperAdmin)
- **Add `data-testid`** attributes to all interactive elements for E2E testing
- **Validate inputs** with Zod schemas on BOTH client and server
- **Work in `app/` directory** - run all npm commands from there
- **Use Hebrew labels** - this is a Hebrew-first, RTL-only application
- **Test data isolation** - verify cross-city/area data cannot leak
- **Run integrity checks** after database changes: `npm run db:check-integrity`
- **Log all bugs** to `docs/localDev/bugs.md` with bug description AND final solution

### ❌ NEVER DO

- **Create SuperAdmin via UI/API** - only via `seed.ts` script
- **Expose `is_super_admin`** flag in public APIs
- **Skip RBAC validation** on any endpoint or Server Action
- **Allow cross-city data access** without proper authorization
- **Use LTR CSS** - always use RTL-compatible properties
- **Put .md files in root** - organize in `docs/mdFiles/`
- **Delete production data** - use soft deletes (`is_active = false`)

### 🔍 Testing & Debugging

- **Test failures**: First check if it's a test issue (selectors, timing) vs actual bug
- **Port conflicts**: Dev server runs on **port 3200**, tests expect **port 3000**
- **Database changes**: Always run `npm run db:generate` after schema updates
- **Integrity issues**: Use `npm run db:fix-integrity --fix` to repair relationships

### 📝 Code Organization

- **Server Actions**: In `app/actions/` directory
- **API Routes**: In `app/api/` directory
- **Utilities**: In `lib/` directory
- **Documentation**: In `docs/mdFiles/` or `docs/syAnalyse/`
- **Tests**: E2E in `tests/e2e/`, integration in `app/tests/integration/`