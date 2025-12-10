# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

**Election/Activism Management System (v2.0)** - A hierarchical organization management platform for election campaigns and activism coordination with strict role-based access control.

**IMPORTANT MIGRATION NOTE**: This system was migrated from a corporate hierarchy platform to an election/activism system. The repository name "corporations" is historical. The actual domain is now:
- **Election System** (formerly Corporations)
- **Activists** (formerly Workers)
- **Neighborhoods** (formerly Sites)
- **City Coordinators** (formerly Managers)
- **Activist Coordinators** (formerly Supervisors)

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

### Organizational Hierarchy (Election/Activism Domain)

```
SuperAdmin (system-wide access)
└── Election System (multi-region root)
    ├── Area Managers (region-wide access)
    └── City Coordinators (city-scoped access)
        └── Activist Coordinators (neighborhood-scoped access)
            └── Neighborhoods (physical locations)
                └── Activists (tracked individuals with attendance)
```

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

**Special Features**:
- **Attendance Tracking**: Record check-in/out times, notes, GPS coordinates
- **Task Management**: Assign tasks to activists with priority and deadlines
- **Push Notifications**: Web push notifications for task assignments
- **Analytics**: Area-wide and city-wide reporting dashboards

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

## System Flows

### Invitation & Onboarding

1. Admin creates invitation with role type (area_manager, city_coordinator, activist_coordinator)
2. System generates unique token → stored in `invitations` table
3. Email sent via SMTP (MailHog in dev, SendGrid/Resend in production)
4. User clicks invitation link → token validated and not expired
5. New user created if doesn't exist, appropriate role table populated
6. Invitation marked with `accepted_at` timestamp
7. User redirected to role-specific dashboard

### Authentication Flow (NextAuth v5)

1. User logs in with email/password (bcrypt verification)
2. Session token stored in HTTP-only cookie
3. Session payload: `user_id`, `email`, `role`, `isSuperAdmin`, area/city scope
4. Middleware validates session on protected routes
5. Server Actions/API Routes verify permissions per-request
6. Token refresh handled automatically by NextAuth

### Attendance Tracking Flow

1. Coordinator marks activist as "checked in" with timestamp
2. System records GPS coordinates (if available)
3. Coordinator can add notes about activist status
4. Check-out recorded with duration calculation
5. Attendance history displayed in activist profile
6. Analytics aggregate attendance by neighborhood/city

### Task Management Flow

1. Coordinator creates task with title, description, priority, deadline
2. Assigns task to specific activists or neighborhoods
3. Push notification sent to assigned activists (if subscribed)
4. Activists see tasks in their dashboard/notifications
5. Task status tracked: pending → in_progress → completed
6. Coordinators monitor completion rates

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
2. Implement RBAC guards/middleware before controllers
3. Test multi-corporation isolation first
4. Always log mutations to `audit_logs`
5. Use Prisma middleware to auto-inject corporation filters
6. Never allow cross-corporation data leakage

### When Implementing Frontend

1. Setup MUI theme with RTL support first
2. Use `data-testid` attributes for all interactive elements
3. Implement React Hook Form + Zod for all forms
4. Use TanStack Table for data grids
5. Ensure all UI is responsive and mobile-friendly
6. Test with `he-IL` locale enabled

### Terminology (v2.0 Election System)

**IMPORTANT**: As of v2.0, the system was migrated from corporate hierarchy to election/activism:

| Domain Entity | Database Table | Code Reference |
|---------------|----------------|----------------|
| Election System | N/A (organizational concept) | - |
| Area Manager | `area_managers` | `AreaManager` |
| City | `cities` | `City` |
| City Coordinator | `city_coordinators` | `CityCoordinator` |
| Activist Coordinator | `activist_coordinators` | `ActivistCoordinator` |
| Neighborhood | `neighborhoods` | `Neighborhood` |
| Activist | `activists` | `Activist` |
| Task | `tasks` | `Task` |
| Attendance | `attendance_records` | `AttendanceRecord` |

**Migration from v1.x (Corporate)**:
- Corporation → Election System (conceptual)
- Manager → Area Manager / City Coordinator
- Supervisor → Activist Coordinator
- Site → Neighborhood
- Worker → Activist

**Historical Note**: Pre-v2.0 was a corporate hierarchy system. Repository name "corporations" remains for continuity but domain is now elections/activism.

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