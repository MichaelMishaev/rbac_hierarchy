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

## 🚢 PRODUCTION DEPLOYMENT SAFETY (2026-01-02)

**CRITICAL: Recent database changes are SAFE for production merge**

### Phase 1: Error Dashboard (✅ Deployed)
- **Schema Changes:** NONE
- **Migration Required:** NO
- **Risk:** ZERO - Uses existing `ErrorLog` table

### Phase 2: Session Tracking (✅ Deployed)
- **Schema Changes:** Added `SessionEvent` table (NEW TABLE ONLY)
- **Migration Required:** YES (but SAFE - additive only)
- **Risk:** VERY LOW - New table, no existing data affected
- **Migration Command:**
  ```bash
  cd app && npm run db:generate && npm run db:push
  ```
- **Feature Flag:** `NEXT_PUBLIC_ENABLE_SESSION_TRACKING=true` (default enabled)
- **Rollback:** Set flag to `false` (instant rollback, no code changes)

### Phase 3: Audit Logging (✅ Deployed)
- **Schema Changes:** NONE
- **Migration Required:** NO
- **Risk:** ZERO - Uses existing `AuditLog` table (already in production)
- **Feature Flag:** `ENABLE_AUDIT_LOGGING=true` (default enabled)
- **Rollback:** Set flag to `false` (instant rollback)

### Deployment Checklist

**Before merging to main:**
- [ ] Run `npm run build` (verify compilation)
- [ ] Run `npm run test:e2e` (verify tests pass)
- [ ] Review `git diff app/prisma/schema.prisma` (only SessionEvent table added)

**On production:**
```bash
# 1. Pull latest code
git pull origin main

# 2. Install dependencies
cd app && npm install

# 3. Apply schema changes (SAFE - only adds SessionEvent table)
npm run db:generate && npm run db:push

# 4. Build and restart
npm run build
pm2 restart all  # or Railway auto-deploy
```

**If any issues occur:**
```bash
# Disable session tracking (instant rollback)
export NEXT_PUBLIC_ENABLE_SESSION_TRACKING=false

# Disable audit logging (instant rollback)
export ENABLE_AUDIT_LOGGING=false
```

**Database Safety Guarantees:**
- ✅ NO existing tables modified
- ✅ NO existing columns changed
- ✅ NO data migrations required
- ✅ Only ADDITIVE changes (new table: `session_events`)
- ✅ All new fields are nullable/optional
- ✅ Backward compatible (old code works without changes)

---

## ⚠️ AI DEVELOPMENT RULES (READ FIRST)

**BEFORE writing ANY code, AI MUST:**

1. **Read** `/docs/infrastructure/base/baseRules.md` (system invariants, RBAC rules, Hebrew/RTL)
2. **Classify risk level:** 🔴 HIGH (RBAC/auth) | 🔸 MEDIUM (features) | 🔹 LOW (UI)
3. **Declare change boundary:** Allowed files vs forbidden files
4. **Check locked screens:** ALL screens locked (see "🔒 ALL SCREENS LOCKED" section) - modifications require approval
5. **State assumptions:** "I assume city-scoped query", "I assume Hebrew-only"

**For 🔴 HIGH RISK changes (RBAC, auth, data filters):**
- Read `/docs/infrastructure/roles/PERMISSIONS_MATRIX.md`
- Read `/docs/bugs/bugs-current.md` (check for similar issues)
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

### 🔒 ALL SCREENS LOCKED (2026-01-02)

**⚠️ CRITICAL**: All pages and their associated logic are now LOCKED. Any modifications require explicit user approval.

**Lock Status**: PRODUCTION STABLE - Do not modify without permission

#### Authentication Screens
- `/login` - `app/app/[locale]/(auth)/login/page.tsx`
- `/change-password` - `app/app/[locale]/(auth)/change-password/page.tsx`

#### Dashboard Screens (Admin/Coordinators)
- `/dashboard` - `app/app/[locale]/(dashboard)/dashboard/page.tsx`
- `/areas` - `app/app/[locale]/(dashboard)/areas/page.tsx`
- `/cities` - `app/app/[locale]/(dashboard)/cities/page.tsx` (SuperAdmin/Area Manager only)
- `/neighborhoods` - `app/app/[locale]/(dashboard)/neighborhoods/page.tsx`
- `/activists` - `app/app/[locale]/(dashboard)/activists/page.tsx`
- `/users` - `app/app/[locale]/(dashboard)/users/page.tsx`
- `/attendance` - `app/app/[locale]/(dashboard)/attendance/page.tsx`
- `/tasks` - `app/app/[locale]/(dashboard)/tasks/page.tsx`
- `/tasks/inbox` - `app/app/[locale]/(dashboard)/tasks/inbox/page.tsx`
- `/tasks/new` - `app/app/[locale]/(dashboard)/tasks/new/page.tsx`
- `/manage-voters` - `app/app/[locale]/(dashboard)/manage-voters/page.tsx`
- `/map` - `app/app/[locale]/(dashboard)/map/page.tsx`
- `/map/leaflet` - `app/app/[locale]/(dashboard)/map/leaflet/page.tsx`

#### Activist Screens (Mobile-First)
- `/voters` - `app/app/[locale]/(activist)/voters/page.tsx`
- `/voters/new` - `app/app/[locale]/(activist)/voters/new/page.tsx`
- `/voters/[id]` - `app/app/[locale]/(activist)/voters/[id]/page.tsx`
- `/voters/[id]/edit` - `app/app/[locale]/(activist)/voters/[id]/edit/page.tsx`
- `/profile` - `app/app/[locale]/(activist)/profile/page.tsx`

#### System/Utility Screens
- `/settings/notifications` - `app/app/[locale]/(dashboard)/settings/notifications/page.tsx`
- `/notifications` - `app/app/[locale]/(dashboard)/notifications/page.tsx`
- `/more` - `app/app/[locale]/(dashboard)/more/page.tsx`
- `/wiki` - `app/app/[locale]/(dashboard)/wiki/page.tsx`
- `/wiki/[categorySlug]` - `app/app/[locale]/(dashboard)/wiki/[categorySlug]/page.tsx`
- `/wiki/[categorySlug]/[pageSlug]` - `app/app/[locale]/(dashboard)/wiki/[categorySlug]/[pageSlug]/page.tsx`
- `/system-rules` - `app/app/[locale]/(dashboard)/system-rules/page.tsx`
- `/onboarding` - `app/app/[locale]/(dashboard)/onboarding/page.tsx`
- `/org-tree-demo` - `app/app/[locale]/(dashboard)/org-tree-demo/page.tsx`
- `/performance` - `app/app/[locale]/(dashboard)/performance/page.tsx`

#### Root Pages
- `/` - `app/app/page.tsx`
- `/[locale]` - `app/app/[locale]/page.tsx`

**Lock Scope Includes**:
- All `page.tsx` files listed above
- All associated client components (`*Client.tsx`, `*PageClient.tsx`)
- All page-specific component directories
- All server actions directly called by these pages
- All API routes exclusively used by these pages

**Modification Protocol**:
1. AI must ASK for explicit permission before modifying ANY locked screen
2. State which screen(s) will be modified and why
3. Wait for user approval with "yes" or "approved"
4. Only proceed after confirmation

**Allowed Without Permission**:
- Bug fixes for critical errors (crashes, data corruption)
- Security vulnerabilities (RBAC bypass, data leakage)
- Build failures blocking deployment

**All other changes require approval.**

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
5. Document in `docs/bugs/bugs-current.md` with prevention rule

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
- Modify locked screens without explicit user approval (see "🔒 ALL SCREENS LOCKED")
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
- Any locked screen needs modification (see "🔒 ALL SCREENS LOCKED")
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
- never push without me permission