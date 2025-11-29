# 🏢 Hierarchy Platform - Multi-Tenant RBAC System

**Premium organizational management system for corporations with strict role-based access control**

[![Status](https://img.shields.io/badge/status-in%20development-yellow)]()
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL%2015-blue)]()
[![Next.js](https://img.shields.io/badge/framework-Next.js%2015-black)]()
[![Prisma](https://img.shields.io/badge/ORM-Prisma%205-brightgreen)]()
[![Docker](https://img.shields.io/badge/docker-ready-blue)]()

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Testing](#-testing)
- [Documentation](#-documentation)

---

## ⚠️ IMPORTANT: Single Source of Truth

**All development work happens in the `/app` directory.**

```
/corporations
├── app/                    ← 🎯 MAIN APPLICATION (WORK HERE)
│   ├── prisma/            ← Database schema & seed
│   ├── app/               ← Next.js 15 App Router
│   ├── components/        ← React components
│   ├── lib/               ← Utilities & config
│   └── package.json       ← Dependencies & scripts
└── docs/                  ← Documentation only
```

**Working Directory:** Always `cd app/` before running any commands.

---

## 🎯 Overview

The Hierarchy Platform is a multi-tenant organizational management system designed for corporations with multiple layers of roles and strict data isolation. It provides complete RBAC (Role-Based Access Control) with a beautiful, Monday.com-inspired UI.

### Organizational Hierarchy

```
SuperAdmin (system-wide access)
└── Corporations (multi-tenant root)
    ├── Managers (full corporation access)
    └── Supervisors (site-scoped access)
        └── Sites (physical locations)
            └── Workers (data only, no login)
```

### Key Capabilities

- ✅ **Multi-tenant isolation** - Complete data separation per corporation
- ✅ **Role-based access control** - SuperAdmin, Manager, Supervisor roles
- ✅ **Hierarchical structure** - Interactive organizational tree visualization
- ✅ **Worker management** - Track non-authenticated workers per site
- ✅ **Invitation system** - Email-based user onboarding
- ✅ **Audit logging** - Complete change tracking
- ✅ **RTL support** - Hebrew language (he-IL)

---

## ✨ Features

### 🌳 Organizational Tree Visualization
- Interactive, expandable tree structure
- Color-coded by entity type (Monday.com style)
- Real-time stats display
- Expand All / Collapse All controls
- Smooth animations (300ms transitions)

### 🔐 Authentication & Authorization
- NextAuth v5 integration
- Password hashing with bcrypt
- JWT-based sessions
- Role-based route protection
- Multi-corporation user support

### 📊 Dashboard & Analytics
- Role-specific dashboards (SuperAdmin, Manager, Supervisor)
- KPI cards (corporations, users, sites, workers)
- Recent activity feed
- Site overview (grid/list views)
- Mobile-responsive design

### 👥 User Management
- Invite managers and supervisors
- Email-based invitations with tokens
- Profile management
- Avatar support
- Password reset functionality

### 🏗️ Site & Worker Management
- CRUD operations for sites
- Worker tracking (non-authenticated)
- Supervisor assignment (M2M)
- Employment details and tags
- Soft delete support

### 📝 Audit Logging
- Track all CRUD operations
- JSON before/after snapshots
- User and IP tracking
- Timestamp and action type

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Next.js 15 (App Router + Server Actions)
- **Database:** PostgreSQL 15
- **ORM:** Prisma 5
- **Connection Pool:** PgBouncer
- **Cache:** Redis 7
- **Auth:** NextAuth v5

### Frontend
- **Framework:** Next.js 15 (React Server Components)
- **UI Library:** Material-UI v6
- **Forms:** React Hook Form + Zod
- **Tables:** TanStack Table
- **Animations:** Framer Motion
- **Tree View:** react-organizational-chart
- **i18n:** next-intl (Hebrew RTL support)

### Infrastructure
- **Containerization:** Docker Compose
- **Database UI:** Adminer
- **Email Testing:** MailHog (dev)
- **Production DB:** Railway
- **Production Host:** Vercel

### Development
- **Language:** TypeScript 5
- **Testing:** Playwright (E2E)
- **Package Manager:** npm

---

## 📁 Project Structure

```
/corporations
├── app/                          🎯 MAIN APPLICATION (SINGLE SOURCE OF TRUTH)
│   ├── app/                      # Next.js 15 App Router
│   │   ├── [locale]/             # Internationalization routes
│   │   │   ├── (auth)/           # Authentication pages
│   │   │   │   └── login/
│   │   │   ├── (dashboard)/      # Protected dashboard routes
│   │   │   │   ├── dashboard/    # Main dashboard with org tree
│   │   │   │   ├── corporations/ # Corporation management
│   │   │   │   ├── sites/        # Site management
│   │   │   │   ├── users/        # User management
│   │   │   │   └── workers/      # Worker management
│   │   │   └── page.tsx          # Landing page
│   │   ├── api/                  # API Routes
│   │   │   ├── auth/             # NextAuth endpoints
│   │   │   └── org-tree/         # Organizational tree API
│   │   ├── actions/              # Server Actions
│   │   │   └── dashboard.ts      # Dashboard data fetching
│   │   └── components/           # Shared components
│   │       └── dashboard/        # Dashboard-specific components
│   │           ├── OrganizationalTree.tsx  # Tree visualization
│   │           ├── KPICard.tsx
│   │           └── RecentActivity.tsx
│   ├── components/               # Global UI components
│   │   └── ui/                   # MUI/Shadcn components
│   ├── lib/                      # Utilities & configuration
│   │   ├── prisma.ts             # Prisma client singleton
│   │   ├── design-system.ts      # Design tokens (colors, shadows)
│   │   └── utils.ts              # Helper functions
│   ├── prisma/                   # 🗄️ DATABASE (SINGLE SOURCE OF TRUTH)
│   │   ├── schema.prisma         # Database schema with password field
│   │   └── seed.ts               # Seed script with test users
│   ├── messages/                 # i18n translations (he, en)
│   │   ├── en.json
│   │   └── he.json
│   ├── public/                   # Static assets
│   ├── types/                    # TypeScript type definitions
│   ├── middleware.ts             # Next.js middleware (auth, i18n)
│   ├── auth.config.ts            # NextAuth configuration
│   ├── i18n.ts                   # Internationalization config
│   ├── next.config.ts            # Next.js configuration
│   ├── package.json              # Dependencies & scripts
│   └── tsconfig.json             # TypeScript configuration
│
├── docs/                         # Documentation (read-only)
│   ├── syAnalyse/                # Product requirements & specs
│   │   ├── PRD_2025_Updated_Industry_Standards.md
│   │   ├── mvp/
│   │   │   ├── 02_DATABASE_SCHEMA.md
│   │   │   ├── 03_API_DESIGN.md
│   │   │   └── 04_UI_SPECIFICATIONS.md  # With org tree design
│   │   └── draws/
│   └── mdFiles/                  # Setup guides
│       ├── DATABASE_SETUP_GUIDE.md
│       └── ORGANIZATIONAL_TREE_IMPLEMENTATION.md
│
├── tests/e2e/                    # Playwright E2E tests
│   ├── fixtures/                 # Test data & helpers
│   ├── auth/                     # Authentication tests
│   └── rbac/                     # Permission tests
│
├── docker/                       # Docker initialization scripts
├── docker-compose.yml            # Docker services (PostgreSQL, Redis, etc.)
├── Makefile                      # Docker management commands
├── .env.example                  # Environment variables template
├── CLAUDE.md                     # Instructions for Claude AI
└── README.md                     # This file
```

---

## 🚀 Quick Start

### Prerequisites

- **Docker Desktop** - For PostgreSQL, Redis, PgBouncer
- **Node.js 18+** - Runtime for Next.js
- **Make** - For convenient Docker commands (optional)

### 1. Clone & Navigate to App

```bash
git clone <repository-url>
cd corporations/app  # ← IMPORTANT: Always work in app/ directory
```

### 2. Setup Environment

```bash
# Copy environment variables
cp .env.example .env

# Edit .env if needed (database URLs, auth secrets)
```

### 3. Start Docker Services

```bash
# From project root (not app/)
cd ..
make up         # Start PostgreSQL, Redis, PgBouncer, Adminer, MailHog
make health     # Verify services are running
make logs       # View container logs

# Back to app directory
cd app
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Seed database with test users
npm run db:seed
```

### 6. Start Development Server

```bash
npm run dev
```

### 7. Access Application

- **Application:** http://localhost:3000
- **Prisma Studio:** http://localhost:5555
- **Adminer (DB UI):** http://localhost:8081
- **MailHog (Email):** http://localhost:8025

### 8. Login with Test Credentials

**SuperAdmin:**
- Email: `superadmin@hierarchy.test`
- Password: `admin123`

**Manager:**
- Email: `manager@acme.com`
- Password: `manager123`

**Supervisor:**
- Email: `supervisor@acme.com`
- Password: `supervisor123`

---

## 🛠️ Development

### Docker Services Management

**From project root directory:**

```bash
# Service control
make up              # Start all Docker containers
make down            # Stop all containers (data persists)
make clean           # Stop and remove volumes (⚠️ deletes data!)
make restart         # Restart all services

# Health checks
make health          # Check service health
make logs            # View container logs
make ps              # List running containers

# Database
make db-shell        # Connect to PostgreSQL with psql
make db-backup       # Backup database to ./backups/
make db-reset        # Reset database (⚠️ deletes all data!)

# Redis
make redis-cli       # Connect to Redis CLI
make redis-flush     # Clear all Redis data
```

### Database Management

**From app/ directory:**

```bash
# Prisma commands
npm run db:generate  # Generate Prisma Client (after schema changes)
npm run db:push      # Push schema to database
npm run db:migrate   # Create migration files (production)
npm run db:seed      # Seed database with test data
npm run db:studio    # Open Prisma Studio (database GUI)

# Quick reset
npm run db:push --force-reset  # Reset database completely
npm run db:seed                # Reseed with test data
```

### Application Development

**From app/ directory:**

```bash
# Development
npm run dev          # Start Next.js dev server (http://localhost:3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Type checking
npm run type-check   # TypeScript type checking (if configured)
```

### Testing

**From app/ directory:**

```bash
# E2E Testing (Playwright)
npm run test:e2e          # Run all E2E tests (headless)
npm run test:e2e:ui       # Run with Playwright UI
npm run test:e2e:headed   # Run in headed browser mode
npm run test:e2e:debug    # Run in debug mode
```

### Docker Services

| Service | URL/Port | Credentials |
|---------|----------|-------------|
| **PostgreSQL (direct)** | `localhost:5434` | `postgres` / `postgres_dev_password` |
| **PgBouncer (pooled)** | `localhost:6433` | ⚠️ Use this for app connections |
| **Redis** | `localhost:6381` | Password: `redis_dev_password` |
| **Adminer (DB UI)** | http://localhost:8081 | Server: `postgres`, User: `postgres` |
| **MailHog (Email)** | http://localhost:8025 | No auth required |

---

## 🗄️ Database

### Schema Overview

**Location:** `app/prisma/schema.prisma` ← Single Source of Truth

**Tables (6):**
- `users` - SuperAdmin, Managers, Supervisors (with passwords)
- `corporations` - Multi-tenant root entities
- `sites` - Physical locations
- `supervisor_sites` - M2M join table (supervisor ↔ sites)
- `workers` - Non-authenticated tracked individuals
- `invitations` - Pending user invitations
- `audit_logs` - Change tracking

**Key Features:**
- UUID primary keys
- Cascade delete for data integrity
- Indexes on foreign keys and lookup fields
- Timestamp tracking (created_at, updated_at)
- Soft delete support (is_active flag)
- Password hashing (bcryptjs)

### Connection Strings

```env
# In app/.env

# Direct connection (for migrations, admin tasks)
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform"

# Pooled connection (for application code - USE THIS)
DATABASE_URL_POOLED="postgresql://postgres:postgres_dev_password@localhost:6433/hierarchy_platform?pgbouncer=true"
```

**⚠️ Important:** Always use `DATABASE_URL_POOLED` in application code for PgBouncer connection pooling.

---

## 🧪 Testing

### E2E Testing with Playwright

**Location:** `tests/e2e/`

Tests are organized by feature:

```
tests/e2e/
├── fixtures/
│   └── auth.fixture.ts         # Test users and login helpers
├── page-objects/
│   └── DashboardPage.ts        # Page object models
├── auth/
│   └── login.spec.ts           # Authentication flows
├── rbac/
│   └── permissions.spec.ts     # Permission boundaries
├── multi-tenant/
│   └── isolation.spec.ts       # Corporation isolation
└── invitations/
    └── invitation-flow.spec.ts # Invitation system
```

**Run tests from app/ directory:**

```bash
npm run test:e2e           # Headless mode
npm run test:e2e:ui        # Interactive UI
npm run test:e2e:headed    # Headed browser
npm run test:e2e:debug     # Debug mode
```

**Test Configuration:**
- Base URL: `http://localhost:3000`
- Browsers: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- RTL: Hebrew (`he-IL`)
- Timezone: `Asia/Jerusalem`

---

## 🎨 UI Design

### Design System (Monday.com-style)

**Location:** `app/lib/design-system.ts`

- **Colors:** Pastel palette (blue, purple, green, orange)
- **Border Radius:** 20px standard, 32px for KPIs
- **Shadows:** Neo-morphic dual-direction shadows
- **Typography:** System fonts (-apple-system, Roboto)
- **Spacing:** 8px base unit
- **Animations:** 250ms transitions

### Color Palette

```typescript
// Pastel colors for entities
SuperAdmin:  #9D99FF (purple)
Corporation: #6C9EFF (blue)
Manager:     #6C9EFF (blue)
Supervisor:  #00D084 (green)
Site:        #FFB84D (orange)
```

### Screens (14 total)

1. Login Page
2. **SuperAdmin Dashboard (with organizational tree 🌳)**
3. Corporations Table
4. Create Corporation Modal
5. Manager Dashboard
6. Site Detail Page (tabs)
7. Supervisor Mobile Dashboard
8. Workers Table
9. Create Worker Form
10. Sites Grid/List View
11. User Profile
12. Invitation Management
13. Audit Logs
14. Settings

---

## 📚 Documentation

### Core Documentation

**Location:** `docs/`

- **[CLAUDE.md](CLAUDE.md)** - Instructions for Claude Code AI
- **[PRD (Enhanced)](docs/syAnalyse/PRD_2025_Updated_Industry_Standards.md)** - Product requirements + 2025 standards
- **[Database Schema](docs/syAnalyse/mvp/02_DATABASE_SCHEMA.md)** - Prisma schema documentation
- **[API Design](docs/syAnalyse/mvp/03_API_DESIGN.md)** - RESTful API endpoints
- **[UI Specifications](docs/syAnalyse/mvp/04_UI_SPECIFICATIONS.md)** - Screen-by-screen design with org tree

### Setup Guides

- **[Database Setup Guide](docs/mdFiles/DATABASE_SETUP_GUIDE.md)** - Complete database setup walkthrough
- **[Organizational Tree Implementation](docs/mdFiles/ORGANIZATIONAL_TREE_IMPLEMENTATION.md)** - Tree component design + seed data

---

## 📝 Environment Variables

**Location:** `app/.env`

```env
# Database (PostgreSQL via Docker)
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform"
DATABASE_URL_POOLED="postgresql://postgres:postgres_dev_password@localhost:6433/hierarchy_platform?pgbouncer=true"

# Redis (Docker)
REDIS_URL="redis://:redis_dev_password@localhost:6381"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl"

# Email (MailHog for dev)
SMTP_HOST="localhost"
SMTP_PORT="1025"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM="noreply@hierarchy.test"

# i18n
NEXT_PUBLIC_DEFAULT_LOCALE="he"
NEXT_PUBLIC_LOCALES="en,he"
```

---

## 🚢 Deployment

### Development
- **Database:** Docker Compose (PostgreSQL + PgBouncer + Redis)
- **Frontend:** `npm run dev` (Next.js dev server)
- **Working Directory:** `app/`

### Production (Planned)
- **Database:** Railway (PostgreSQL managed)
- **Frontend:** Vercel (Next.js hosting)
- **CDN:** Cloudflare (optional)
- **Email:** SendGrid or Resend
- **Build Command:** `npm run build` (from app/ directory)
- **Start Command:** `npm run start` (from app/ directory)

---

## 🤝 Contributing

### Development Workflow

1. **Always work in `app/` directory**
2. Create feature branch: `git checkout -b feature/your-feature`
3. Make changes and test thoroughly
4. Run E2E tests: `npm run test:e2e`
5. Commit with descriptive message
6. Push and create pull request

### Code Style

- TypeScript strict mode
- ESLint + Prettier
- React Server Components by default
- Use Server Actions for mutations
- Always validate inputs with Zod on both client and server

### Database Changes

1. Modify `app/prisma/schema.prisma`
2. Run `npm run db:push` (dev) or `npm run db:migrate` (prod)
3. Update seed script if needed
4. Test with `npm run db:seed`

---

## ⚠️ Important Reminders

### Single Source of Truth

- ✅ **ALL development** happens in `/app` directory
- ✅ **Database schema** is in `app/prisma/schema.prisma`
- ✅ **Run all commands** from `app/` directory
- ❌ **DO NOT** create duplicate Prisma schemas elsewhere
- ❌ **DO NOT** run Prisma commands from project root

### Database Best Practices

- ✅ **ALWAYS** use `DATABASE_URL_POOLED` for app connections (PgBouncer)
- ✅ **ALWAYS** filter by `corporation_id` (except SuperAdmin)
- ✅ **ALWAYS** validate inputs with Zod on client AND server
- ✅ **ALWAYS** log mutations to `audit_logs`
- ✅ **ALWAYS** use `data-testid` attributes for testable elements
- ❌ **NEVER** create SuperAdmin via API (only via seed script)
- ❌ **NEVER** expose sensitive fields (password, is_super_admin) in public APIs
- ❌ **NEVER** skip RBAC validation on any endpoint
- ❌ **NEVER** allow cross-corporation data access

---

## 📄 License

ISC

---

## 🙏 Acknowledgments

- **Next.js** - Amazing React framework
- **Prisma** - Excellent ORM
- **MUI** - Beautiful UI components
- **Playwright** - Powerful E2E testing
- **Railway** - Simple database hosting
- **Vercel** - Seamless frontend deployment
- **react-organizational-chart** - Tree visualization

---

## 📞 Support

For issues, questions, or suggestions:
- Create an issue in the repository
- Check documentation in `docs/`
- Review PRD and implementation plans

---

**Status:** 🟢 Active Development

**Current Features:**
- ✅ Database schema with authentication
- ✅ SuperAdmin dashboard with organizational tree
- ✅ Role-based access control
- ✅ Multi-tenant data isolation
- ✅ Hebrew RTL support
- ⏳ Full CRUD operations (in progress)
- ⏳ Email invitations (in progress)

**Working Directory:** `/app` ← Always work here!

---

Made with ❤️ for modern organizational management
