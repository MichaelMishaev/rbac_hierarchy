# 🚀 Corporations MVP - Premium UI

**Complete Next.js 15 application with PostgreSQL, Prisma, NextAuth, and Material-UI**

---

## ✅ Setup Status

**READY FOR DEVELOPMENT** - All foundation work complete!

- ✅ Next.js 15 with App Router
- ✅ TypeScript configured
- ✅ Material-UI v6 with custom theme
- ✅ PostgreSQL database (Docker)
- ✅ Prisma ORM with complete schema
- ✅ NextAuth v5 authentication
- ✅ Role-based access control (RBAC)
- ✅ Database seeded with test users
- ✅ Build tested and working
- ✅ Login + Dashboard pages created

---

## 🚀 Quick Start

### Prerequisites

Make sure the Docker services are running:
```bash
cd ..  # Go to project root
make up
make health
```

### Development

```bash
# Install dependencies (already done)
npm install

# Run development server
npm run dev

# Open browser
open http://localhost:3000
```

### Test Login

Visit http://localhost:3000/login and use:

**SuperAdmin:**
- Email: `superadmin@hierarchy.test`
- Password: `admin123`

**City Coordinator:**
- Email: `manager@acme.com`
- Password: `manager123`

**Activist Coordinator:**
- Email: `supervisor@acme.com`
- Password: `supervisor123`

---

## 📂 Project Structure

```
app/
├── app/
│   ├── (auth)/
│   │   └── login/           # Login page
│   ├── (dashboard)/
│   │   └── dashboard/       # Dashboard page
│   ├── api/
│   │   └── auth/            # NextAuth API routes
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   └── globals.css
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   ├── auth.ts              # Auth helpers
│   ├── theme.ts             # MUI themes (light/dark)
│   └── providers.tsx        # Client providers
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── seed.ts              # Seed script
├── components/
│   ├── ui/                  # Reusable UI components
│   ├── forms/               # Form components
│   └── tables/              # Table components
├── types/
│   └── next-auth.d.ts       # NextAuth types
├── auth.config.ts           # NextAuth configuration
├── middleware.ts            # Auth middleware
└── .env                     # Environment variables
```

---

## 🗄️ Database

### Connection

Uses Docker PostgreSQL from parent directory:

```bash
# Direct connection (for migrations)
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform"

# Pooled connection (for app - via PgBouncer)
DATABASE_URL_POOLED="postgresql://postgres:postgres_dev_password@localhost:6433/hierarchy_platform?pgbouncer=true"
```

### Prisma Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes
npm run db:push

# Create migration
npm run db:migrate

# Seed database
npm run db:seed

# Open Prisma Studio (Database GUI)
npm run db:studio
```

### Database Schema

6 core tables:
- `users` - All authenticated users
- `corporations` - Companies/organizations
- `sites` - Physical locations
- `workers` - Non-authenticated workers
- `invitations` - Invitation system
- `audit_logs` - Change tracking

---

## 🔐 Authentication

### NextAuth v5

- **Strategy:** JWT
- **Provider:** Credentials (email + password)
- **Session:** 30 days
- **Passwords:** bcrypt hashed

### Role-Based Access

**Roles:**
- `SUPERADMIN` - System-wide access
- `MANAGER` - Corporation-scoped access
- `SUPERVISOR` - Site-scoped access

**Auth Helpers:**
```typescript
import { getCurrentUser, requireRole } from '@/lib/auth';

// Get current user
const user = await getCurrentUser();

// Require specific role
const admin = await requireRole(['SUPERADMIN']);
const manager = await requireRole(['SUPERADMIN', 'MANAGER']);
```

---

## 🎨 UI Components

### Material-UI v6

**Theme:**
- Light mode (default)
- Dark mode (configured)
- RTL support ready (for Hebrew)
- Custom typography
- Rounded corners (8px)
- Custom button styles

**Usage:**
```tsx
import { Box, Typography, Button, Card } from '@mui/material';

<Card>
  <Typography variant="h5">Hello</Typography>
  <Button variant="contained">Click me</Button>
</Card>
```

---

## 📝 Available Scripts

```bash
# Development
npm run dev              # Start dev server (port 3000)

# Building
npm run build            # Production build
npm run start            # Start production server

# Database
npm run db:generate      # Generate Prisma Client
npm run db:push          # Push schema to database
npm run db:migrate       # Create migration
npm run db:studio        # Open Prisma Studio GUI
npm run db:seed          # Seed database

# Linting
npm run lint             # Run ESLint
```

---

## 🔧 Environment Variables

Create `.env` file (already created):

```bash
# Database
DATABASE_URL="postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform"
DATABASE_URL_POOLED="postgresql://postgres:postgres_dev_password@localhost:6433/hierarchy_platform?pgbouncer=true"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-change-in-production"
NEXTAUTH_URL="http://localhost:3000"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 📊 Database Seeded Data

**Corporation:** Acme Corporation (code: ACME)
**Site:** Tel Aviv HQ

**Users:**
| Role | Email | Password | Corporation | Site |
|------|-------|----------|-------------|------|
| SuperAdmin | superadmin@hierarchy.test | admin123 | - | - |
| Manager | manager@acme.com | manager123 | Acme | - |
| Supervisor | supervisor@acme.com | supervisor123 | Acme | Tel Aviv HQ |

**Workers:** 2 workers assigned to Tel Aviv HQ

---

## 🚀 Next Steps

Your foundation is complete! Time to implement the 14 premium screens:

### Week 2 Tasks (UI Development)

**SuperAdmin Screens (5):**
1. Dashboard - KPI cards
2. Corporations table - CRUD
3. Users management
4. Corporation details
5. Settings

**Manager Screens (4):**
6. Manager Dashboard
7. Sites grid/list
8. Site details with tabs
9. Invite supervisor wizard

**Supervisor Screens (3):**
10. Site dashboard
11. Workers table
12. Worker form

**Onboarding (2):**
13. Invitation landing page
14. Success page

---

## 📚 Documentation

All MVP documentation is in `../docs/syAnalyse/mvp/`:

- `00_OVERVIEW.md` - Project overview
- `01_TECH_STACK.md` - Technology choices
- `02_DATABASE_SCHEMA.md` - Database structure
- `03_API_DESIGN.md` - API endpoints
- `04_UI_SPECIFICATIONS.md` - Screen designs
- `05_IMPLEMENTATION_PLAN.md` - 3-week plan
- `06_FEATURE_SPECIFICATIONS.md` - Feature details
- `07_TESTING_CHECKLIST.md` - QA checklist

---

## 🐛 Troubleshooting

### Build Warnings

**bcryptjs Edge Runtime warnings** - Safe to ignore. NextAuth middleware uses Node.js runtime, not Edge.

### Database Connection

**Can't connect to database:**
```bash
# Check Docker services
cd ..
make health

# Restart services if needed
make restart
```

### Prisma Issues

**Schema out of sync:**
```bash
npm run db:push
npm run db:generate
```

---

## 🎯 Success Metrics

You're ready to code when:
- ✅ `npm run dev` works
- ✅ Login page loads at http://localhost:3000/login
- ✅ You can log in with test credentials
- ✅ Dashboard shows after login
- ✅ `npm run build` succeeds

**ALL METRICS MET! 🎉**

---

## 🔗 Useful Links

- **Development Server:** http://localhost:3000
- **Prisma Studio:** `npm run db:studio`
- **Adminer (DB UI):** http://localhost:8081
- **MailHog (Email):** http://localhost:8025

---

**Status:** ✅ READY FOR FEATURE DEVELOPMENT

**Time to implement:** ~2 weeks for all 14 screens

**Ship date:** Follow `05_IMPLEMENTATION_PLAN.md`

**Let's build! 🚀**
