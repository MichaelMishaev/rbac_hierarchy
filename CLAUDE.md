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
/corporations
├── app/                    ← 🎯 MAIN APPLICATION (WORK HERE)
│   ├── prisma/            ← Database schema & seed (SINGLE SOURCE OF TRUTH)
│   │   ├── schema.prisma  ← ONLY DATABASE SCHEMA
│   │   └── seed.ts        ← ONLY SEED SCRIPT
│   ├── app/               ← Next.js 15 App Router
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

**RBAC Hierarchy Platform** - A multi-tenant organizational management system for corporations with strict role-based access control and complete tenant isolation.

**Current State**:
- ✅ **Next.js 15 app** - Running at http://localhost:3000
- ✅ **SuperAdmin dashboard** - With organizational tree visualization
- ✅ **Database schema** - With passwords and RBAC (in `app/prisma/schema.prisma`)
- ✅ **Authentication** - NextAuth v5 with bcrypt
- ✅ **Docker environment** - PostgreSQL, Redis, PgBouncer
- ✅ **Playwright E2E tests** - Authentication and RBAC tests
- ⏳ **Full CRUD operations** - In progress

**Tech Stack**:
- **Backend**: Next.js 15 API Routes + Server Actions, NextAuth v5, Prisma ORM
- **Frontend**: Next.js 15 (App Router), Material-UI v6, React Hook Form + Zod, **HEBREW-ONLY, RTL-ONLY**
- **Database**: PostgreSQL 15 (Railway for production, Docker for development)
- **Infrastructure**: Docker Compose (local), Railway (production)
- **Testing**: Playwright E2E tests
- **Tree Visualization**: react-d3-tree (Hebrew-first, RTL support)

## Development Environment

### Quick Start Commands

```bash
# Initial setup
make setup              # Create .env from .env.example

# Start development environment
make up                 # Start all Docker containers
make health             # Verify all services are running
make logs               # View logs from all containers

# Database management
make db-shell           # Connect to PostgreSQL with psql
make db-backup          # Backup database to ./backups/
make db-reset           # Reset database (deletes all data!)

# Redis management
make redis-cli          # Connect to Redis CLI
make redis-flush        # Clear all Redis data

# Testing
make test               # Run Playwright E2E tests
make test-ui            # Run Playwright tests with UI
make test-headed        # Run Playwright tests in headed mode

# Stop environment
make down               # Stop all containers (data persists)
make clean              # Stop and remove all volumes (deletes data!)
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

### Organizational Hierarchy

```
SuperAdmin (system-wide access)
└── Corporations (multi-tenant root)
    ├── Managers (full corp access)
    └── Supervisors (site-scoped access)
        └── Sites (physical locations)
            └── Workers (data only, no login)
```

### Role-Based Access Control (RBAC)

**SuperAdmin**:
- System-wide access across all corporations
- Creates and manages corporations
- Cannot be created via UI/API (database/bootstrap only)
- Flag: `users.is_super_admin = true`

**Manager** (DB: `corporation_managers`):
- Scoped to single corporation
- Full CRUD: Managers, Supervisors, Sites, Workers (within their corp)
- Cannot access other corporations

**Supervisor** (DB: `supervisors`):
- Scoped to single corporation
- Assigned to specific sites via M2M (`supervisor_sites`)
- Can only manage workers in assigned sites
- Cannot manage managers, supervisors, or sites

**Worker** (DB: `workers`):
- Data entity only, no login capability
- Assigned to one site
- Soft-deleted via `is_active = false`
- Unique constraint: `(site_id, full_name, phone)`

### Critical RBAC Rules

**Creation Permissions**:
- SuperAdmin → Only via database/bootstrap script
- Corporation → Only SuperAdmin can create
- Manager → SuperAdmin or Manager (same corp)
- Supervisor → SuperAdmin or Manager (same corp)
- Site → SuperAdmin or Manager (same corp)
- Worker → SuperAdmin, Manager, or Supervisor (assigned sites only)

**Data Isolation**:
- All queries MUST filter by `corporation_id` except for SuperAdmin
- Supervisors can only access sites in `supervisor_sites` table
- Use Prisma middleware or NestJS interceptors to enforce corporation filters
- Test cross-corporation isolation thoroughly

## Database Schema

### Core Tables

- `users` - All user accounts with `is_super_admin` flag
- `corporations` - Multi-tenant root entities
- `sites` - Physical locations within corporations
- `corporation_managers` - Manager role assignments
- `supervisors` - Supervisor role assignments (v1.4: renamed from site_managers)
- `supervisor_sites` - M2M relationship (supervisor ↔ sites)
- `workers` - Non-login worker data entities
- `user_invitations` - Invitation system with tokens
- `audit_logs` - Complete change tracking

### Important Constraints

- All role tables: `UNIQUE (corporation_id, user_id)`
- Workers: `UNIQUE (site_id, full_name, phone)`
- M2M junction references composite FKs: `(supervisor_id, corporation_id)` and `(site_id, corporation_id)`
- Cascade delete from corporation (except audit logs → SET NULL)

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
  superAdmin: 'superadmin@hierarchy.test',
  manager: 'manager@corp1.test',        // Corporation 1
  supervisor: 'supervisor@corp1.test',  // Corporation 1, Sites 1-2
  managerCorp2: 'manager@corp2.test'    // Corporation 2
}
```

### Running Tests

```bash
npm run test:e2e           # Run all tests headless
npm run test:e2e:ui        # Run with Playwright UI
npm run test:e2e:headed    # Run in headed browser mode
npm run test:e2e:debug     # Run in debug mode
```

### Test Configuration

- Base URL: `http://localhost:3000` (configurable via `BASE_URL` env)
- RTL locale: `he-IL` (Hebrew)
- Timezone: `Asia/Jerusalem`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- Web server auto-starts in dev mode (when `npm run dev` is available)

## System Flows

### Invitation & Onboarding

1. Admin (SuperAdmin/Manager) creates invitation with `target_type` (corporation_manager or supervisor)
2. System generates unique token → stored in `user_invitations`
3. Email sent via SMTP (MailHog in dev)
4. User clicks link → token validated
5. New user created if not exists, role assigned
6. Invitation marked with `accepted_at` timestamp

### Authentication Flow

1. User logs in with email/password
2. JWT access + refresh tokens returned
3. Token payload: `user_id`, `isSuperAdmin`, corporation list
4. If multiple corporations → user selects active corporation
5. Minimal role info in token; full permissions resolved server-side per request

### Audit Logging

Every mutation logs to `audit_logs`:
- `action` (create/update/delete)
- `entity` type and `entity_id`
- `before` and `after` JSON snapshots
- `user_id` and `corporation_id`
- `timestamp`

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

### SuperAdmin Dashboard (Hebrew)

**Sidebar Navigation**:
- תאגידים (Corporations)
- משתמשים (Users)
- תפקידים והרשאות (Roles & Permissions)
- מבנה ארגוני (Organizational Structure)
- לוגים (Audit Logs)
- הגדרות מערכת (System Settings)

**Top Bar**:
- Corporation selector (SuperAdmin only)
- Search bar
- User greeting: "שלום, [role name]"

**KPI Cards**:
- Active Corporations
- Total Managers
- Total Supervisors
- Total Sites
- Total Workers

## Security Considerations

### Multi-Tenancy Security

- **ALWAYS** include `corporation_id` in WHERE clauses (except SuperAdmin)
- **NEVER** expose `is_super_admin` flag in public APIs
- Validate corporation_id matches user's scope on every API request
- Supervisors must validate site access via `supervisor_sites` join
- Test cross-corporation data leakage thoroughly in E2E tests

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

### Terminology (v1.4 Unified Naming)

**IMPORTANT**: As of v1.4, naming is UNIFIED across all layers:
- **UX/UI**: "Supervisor"
- **Database**: `supervisors` table (renamed from `site_managers`)
- **Code**: `Supervisor` model, `supervisor` variables
- **Junction Table**: `supervisor_sites` (renamed from `site_manager_sites`)

**Historical Note**: Pre-v1.4 used dual naming (UX: "Supervisor", DB: "site_manager"). This caused confusion and was unified in v1.4 for consistency.

## File Structure (When Implementing)

```
corporations-mvp/
├── app/                          # Next.js 15 App Router
│   ├── (auth)/login/
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   ├── corporations/
│   │   ├── sites/
│   │   ├── users/
│   │   └── workers/
│   └── api/                      # API Routes
│       ├── auth/[...nextauth]/
│       ├── corporations/
│       ├── sites/
│       ├── users/
│       └── workers/
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── seed.ts                   # Seed data with SuperAdmin
├── lib/
│   ├── prisma.ts                 # Prisma client singleton
│   ├── auth.ts                   # NextAuth config
│   └── rbac.ts                   # RBAC utilities
├── components/
│   ├── ui/                       # Shadcn/MUI components
│   └── ...                       # Feature components
├── tests/e2e/                    # Playwright tests (already exists)
├── docker/                       # Docker init scripts (already exists)
├── docker-compose.yml            # Docker services (already exists)
├── Makefile                      # Development commands (already exists)
└── .env.local                    # Environment variables
```

## Documentation Reference

Project documentation is in `docs/` (excluded from git):

- `docs/syAnalyse/mvp/00_TECH_STACK_FINAL.md` - Complete tech stack
- `docs/syAnalyse/mvp/02_DATABASE_SCHEMA.md` - Database schema (Prisma format)
- `docs/syAnalyse/mvp/03_API_DESIGN.md` - API endpoints specification
- `docs/syAnalyse/mvp/04_UI_SPECIFICATIONS.md` - UI/UX requirements
- `docs/syAnalyse/mvp/05_IMPLEMENTATION_PLAN.md` - 3-week implementation plan
- `docs/syAnalyse/mvp/08_DOCKER_DEVELOPMENT.md` - Docker setup guide
- `docs/syAnalyse/draws/dbSchema.png` - Visual database schema
- `docs/infrastructure/bugs.md` - Bug tracking (document all bugs found)

## Bug Tracking & QA

### Bug Documentation

When you find bugs during development:
1. Document in `docs/infrastructure/bugs.md`
2. Include: Problem description, root cause, solution implemented
3. Reference commit hash where bug was fixed

### QA Automation

When developing features:
1. Create automation tests in parallel
2. Store in `docs/infrastructure/qa/automations/`
3. Ensure E2E tests cover critical user flows

## Implementation Checklist

When starting development:

1. **Setup** (Week 1):
   - [ ] Ensure Docker environment is running (`make up`)
   - [ ] Initialize Prisma schema from database spec
   - [ ] Run Prisma migrations (`npx prisma db push`)
   - [ ] Seed database with SuperAdmin user
   - [ ] Setup NextAuth v5 configuration
   - [ ] Verify all services with `make health`

2. **Backend** (Week 1-2):
   - [ ] Implement authentication API routes
   - [ ] Build RBAC middleware/guards
   - [ ] Create API routes for all entities
   - [ ] Add audit logging middleware
   - [ ] Test with Prisma Studio

3. **Frontend** (Week 2-3):
   - [ ] Setup MUI theme with RTL
   - [ ] Build 14 UI screens
   - [ ] Implement all CRUD forms
   - [ ] Add data tables with TanStack Table
   - [ ] Ensure responsive design

4. **Testing & Polish** (Week 3):
   - [ ] Run all Playwright E2E tests
   - [ ] Fix failing tests
   - [ ] Test multi-corporation isolation
   - [ ] Verify RTL support
   - [ ] Deploy to Railway

## Important Reminders

- ✅ **ALWAYS** use PgBouncer connection (`localhost:6433`) for app code
- ✅ **ALWAYS** filter by `corporation_id` (except SuperAdmin)
- ✅ **ALWAYS** use `data-testid` attributes for testable elements
- ✅ **ALWAYS** validate inputs with Zod on client AND server
- ✅ **ALWAYS** log mutations to `audit_logs`
- ❌ **NEVER** create SuperAdmin via API (only via seed script)
- ❌ **NEVER** expose `is_super_admin` flag in public APIs
- ❌ **NEVER** skip RBAC validation on any endpoint
- ❌ **NEVER** allow cross-corporation data access
- the project must be organised, do not put .md files in root, aggrigate them in olders in '/Users/michaelmishayev/Desktop/Projects/corporations/docs/mdFiles'