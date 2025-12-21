# CLAUDE.md

Election Campaign Management System - Hebrew-only, RTL-only platform for coordinating field activists.

## 🚀 Quick Start

```bash
make up && make health                                # Start Docker
cd app && npm install                                 # Install deps
npm run db:generate && npm run db:push && npm run db:seed  # Setup DB
npm run dev                                           # → http://localhost:3200
# Login: superadmin@election.test / admin123
```

## ⚠️ AI DEVELOPMENT RULES (READ FIRST)

**BEFORE writing ANY code, AI MUST:**

1. **Read** `/docs/infrastructure/base/baseRules.md` (system invariants, RBAC rules, Hebrew/RTL)
2. **Classify risk level:** 🔴 HIGH (RBAC/auth) | 🔸 MEDIUM (features) | 🔹 LOW (UI)
3. **Declare change boundary:** Allowed files vs forbidden files
4. **Check locked flows:** `/cities` page, `/manage-voters` page
5. **State assumptions:** "I assume city-scoped query", "I assume Hebrew-only"

**For 🔴 HIGH RISK changes (RBAC, auth, data filters):**
- Read `/docs/infrastructure/roles/PERMISSIONS_MATRIX.md`
- Read `/docs/infrastructure/bugs.md` (check for similar issues)
- Propose explicit plan BEFORE coding
- Include negative tests (verify access is DENIED)

**Violating baseRules.md = invalid solution, even if it works.**

**Definition of Done:** See `baseRules.md` section 14.

---

## 🇮🇱 CRITICAL: Hebrew-Only System

**ALL UI/DB content MUST be Hebrew with RTL**
- ✅ Use `dir="rtl"` and `lang="he"` on all components
- ✅ Use `marginInlineStart/End` (not left/right)
- ✅ Hebrew labels only, default locale: `he-IL`, timezone: `Asia/Jerusalem`
- ❌ NO bilingual support, NO English fallbacks, NO locale switching

## ⚠️ Working Directory

**ALWAYS work in `/app` directory** - Run all npm commands from there
- Database schema: `app/prisma/schema.prisma` (Single Source of Truth)
- Repository root is historical only

## Architecture

### Campaign Hierarchy
```
SuperAdmin (system-wide)
└── Area Managers (multi-city regions)
    └── City Coordinators (single city)
        └── Activist Coordinators (assigned neighborhoods)
            └── Neighborhoods (campaign districts)
                └── Activists (field volunteers)
```

### RBAC Rules
- **SuperAdmin**: System-wide, created via seed only (`is_super_admin` flag)
- **Area Manager**: Region access, manages multiple cities
- **City Coordinator**: Single city scope
- **Activist Coordinator**: Assigned neighborhoods only (M2M table)
- **Data Isolation**: ALWAYS filter by `city_id`/area (except SuperAdmin)

**📋 RBAC Documentation** (Single Source of Truth):
- **Permissions Matrix**: `docs/infrastructure/roles/PERMISSIONS_MATRIX.md` ⭐ **START HERE**
- **Role-specific docs**: `docs/infrastructure/roles/{superAdmin|areManager|cityCoordinator|activistCoordinator}Roles.md`
- **Hierarchy Overview**: `docs/infrastructure/roles/hierarchy.md`

### Organization Tree Visibility
**Each user sees only themselves and what's under them as ROOT:**
- SuperAdmin → Full hierarchy
- Area Manager → Their area as root (NO SuperAdmin visible)
- City Coordinator → Their city as root (NO Area Manager/SuperAdmin)
- Activist Coordinator → Their city with assigned neighborhoods only

### Navigation by Role
- **SuperAdmin/Area Manager**: Dashboard, Attendance, Map, Areas, Cities, Neighborhoods, Activists, Users
- **City/Activist Coordinator**: Dashboard, Attendance, Neighborhoods, Activists, Users (NO Cities tab)

### 🔒 LOCKED Pages

#### Cities Page
**File**: `app/app/[locale]/(dashboard)/cities/page.tsx`
**Access**: SuperAdmin & Area Manager ONLY (locked 2025-12-15)
```typescript
// ⚠️ DO NOT MODIFY
if (session.user.role !== 'SUPERADMIN' && session.user.role !== 'AREA_MANAGER') {
  return <AccessDenied />;
}
```

#### Manage Voters Page (Admin/Coordinator)
**File**: `app/app/[locale]/(dashboard)/manage-voters/page.tsx`
**Last locked**: 2025-12-20
**Reason**: Stable voter management with Excel import functionality
**Related files (also locked)**:
- `VotersPageClient.tsx` - Main client component with tabs
- `components/ExcelUpload.tsx` - Excel import with duplicate detection
- `components/VotersList.tsx` - Voter list table
- `components/VoterForm.tsx` - Create/edit voter form
- `components/VoterDetails.tsx` - Voter detail view
- `components/VoterStatistics.tsx` - Statistics dashboard
- `components/DuplicatesDashboard.tsx` - Duplicate voters report

**⚠️ WARNING**: These files are locked. Any modifications require explicit approval.
**URL**: `/manage-voters` (admin/coordinators auto-redirected from `/voters`)

## Development Commands

### Docker (from project root)
```bash
make up/down/clean      # Start/stop/reset containers
make health/logs/ps     # Check status/logs/processes
make db-shell           # PostgreSQL psql
make redis-cli          # Redis CLI
make test               # Run E2E tests
```

### Database (from app/)
```bash
npm run db:generate     # Generate Prisma Client (after schema changes)
npm run db:push         # Push schema to DB
npm run db:seed         # Seed test data
npm run db:studio       # Open Prisma Studio
npm run db:check-integrity  # Check data integrity
```

### Development (from app/)
```bash
npm run dev/build/start # Dev server (3200) / Build / Production
npm run test:e2e        # E2E tests (headless)
npm run test:e2e:ui     # Playwright UI
```

## Services

| Service | URL/Port | Use For |
|---------|----------|---------|
| PostgreSQL | `localhost:5434` | Direct admin access |
| PgBouncer | `localhost:6433` | App connections (ALWAYS use this) |
| Redis | `localhost:6381` | Cache/sessions |
| Adminer | http://localhost:8081 | DB GUI |
| MailHog | http://localhost:8025 | Email testing |

**Connection Strings:**
```bash
# App code (PgBouncer pooling)
DATABASE_URL_POOLED="postgresql://postgres:postgres_dev_password@localhost:6433/hierarchy_platform?pgbouncer=true"
# Migrations (direct)
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform"
```

## Database Schema

**Core Tables:**
- Users: `users`, `user_tokens`
- Org: `area_managers`, `cities`, `city_coordinators`, `activist_coordinators`, `activist_coordinator_neighborhoods` (M2M), `neighborhoods`, `activists`
- Features: `invitations`, `tasks`, `task_assignments`, `attendance_records`, `push_subscriptions`

**Constraints:**
- Role uniqueness: `UNIQUE (city_id, user_id)` for city coordinators
- Activist uniqueness: `UNIQUE (neighborhood_id, full_name, phone)`
- Soft deletes: `is_active = false` for activists

## Testing

**Test Users:**
```typescript
superAdmin: 'superadmin@election.test'
areaManager: 'area.manager@election.test'
cityCoordinator: 'city.coordinator@telaviv.test'
activistCoordinator: 'activist.coordinator@telaviv.test'
```

**Tests verify:** Auth flows, RBAC boundaries, multi-tenant isolation, attendance tracking

**Config:** Base URL `http://localhost:3000`, RTL `he-IL`, timezone `Asia/Jerusalem`

## Development Guidelines

### Task Flow
1. Read relevant files FIRST (never guess)
2. Provide short plan (bullets, no code)
3. Implement minimal diffs (change only what's necessary)
4. Run smallest relevant tests
5. Summarize: files + why + commands

### Code Output
- ✅ Show patch/diff or changed blocks only
- ❌ Avoid showing entire files
- ✅ Always list commands + results

### Bug Fix Protocol (5 Steps)
1. Root cause (1-3 bullets)
2. Regression test (fails before, passes after)
3. Minimal fix (diff-first)
4. Run relevant tests
5. Document in `docs/infrastructure/bugs.md` with prevention rule

### Backend Guidelines
1. Prisma schema first
2. RBAC guards before controllers
3. Test multi-city isolation first
4. Log mutations to `audit_logs`
5. Use Prisma middleware for auto city/area filters (except SuperAdmin)
6. Mobile-first for activist features
7. Optimize for real-time updates

### Frontend Guidelines
1. MUI theme with RTL (`stylis-plugin-rtl`)
2. `data-testid` on all interactive elements
3. React Hook Form + Zod for forms
4. TanStack Table for data grids
5. Mobile-first design
6. Real-time updates (polling/WebSockets)
7. GPS integration for attendance
8. Test with `he-IL` locale

### Terminology (v2.0 Migration)

| Campaign Role | DB Table | Real-world |
|---------------|----------|-----------|
| Area Manager | `area_managers` | Regional Campaign Director |
| City | `cities` | Tel Aviv, Jerusalem |
| City Coordinator | `city_coordinators` | City Campaign Manager |
| Activist Coordinator | `activist_coordinators` | Neighborhood Organizer |
| Neighborhood | `neighborhoods` | Florentin, Neve Tzedek |
| Activist | `activists` | Field Volunteer |

**Migration Note:** Pre-v2.0 was corporate hierarchy. Repository name "corporations" is historical.

## Key Patterns

- **Server Actions** (preferred): Direct DB access within components
- **API Routes**: External integrations, webhooks
- **RSC**: React Server Components for initial page data
- **TanStack Query**: Client-side fetching
- **RTL**: `createTheme({ direction: 'rtl' })` + logical CSS properties
- **Design**: Monday.com style (pastel colors, 20px radius, soft shadows)

## Troubleshooting

**Port conflicts:** `lsof -ti:3200 | xargs kill -9`
**DB errors:** `make health && cd app && npm run db:generate`
**Schema changes:** `cd app && npm run db:generate && npm run db:push && npm run db:check-integrity`
**Test failures:** Check selectors/timing vs actual bug, use `npm run test:e2e:ui`
**Integrity:** `cd app && npm run db:fix-integrity --fix`
**Build errors:** `cd app && npm install && npm run db:generate && rm -rf .next && npm run build`

**Hebrew/RTL:**
```typescript
<Box dir="rtl" lang="he">{/* content */}</Box>
marginInlineStart  // NOT marginLeft
marginInlineEnd    // NOT marginRight
```

**Data Leakage Prevention:**
```typescript
// WRONG
const activists = await prisma.activist.findMany({ where: { is_active: true } });

// CORRECT
const activists = await prisma.activist.findMany({
  where: { is_active: true, neighborhood: { city_id: session.user.cityId } }
});
```

## Critical Rules

### ✅ ALWAYS DO
- Use PgBouncer (`localhost:6433`) for app queries
- Filter by `city_id`/area (except SuperAdmin)
- Add `data-testid` for E2E tests
- Validate with Zod on client AND server
- Work in `app/` directory
- Use Hebrew labels (RTL-only)
- Test cross-city isolation
- Run `db:check-integrity` after schema changes
- Follow Bug Fix Protocol

### ❌ NEVER DO
- Create SuperAdmin via UI/API (seed only)
- Expose `is_super_admin` in public APIs
- Skip RBAC validation
- Allow cross-city data access
- Use LTR CSS
- Delete production data (use soft deletes)
- Refactor silently (explain why)
- Guess file contents/APIs (ask first)
- Show entire files (use diffs)

### ⚠️ Stop and Ask If
- Required file/command doesn't exist
- Package versions/APIs uncertain
- Schema change implied but not specified
- 3+ files need large edits (regression risk)
- Request conflicts with CLAUDE.md

## Tech Stack

**Backend:** Next.js 15 API + Server Actions, NextAuth v5, Prisma ORM
**Frontend:** Next.js 15 App Router, MUI v6, React Hook Form, Zod, Framer Motion
**Database:** PostgreSQL 15 (PgBouncer pooling)
**Infra:** Docker Compose (local), Railway (prod)
**Testing:** Playwright E2E
**i18n:** next-intl (Hebrew primary)

## Documentation

See `docs/syAnalyse/`:
- PRD, Tech Stack, DB Schema, API Design, UI Specs, Implementation Plan, Docker Guide

**File Structure:** `/app` (main), `/tests/e2e`, `/docs` (read-only), `/docker`
