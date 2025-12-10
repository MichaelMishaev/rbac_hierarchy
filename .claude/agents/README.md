# 🗳️ Election Campaign Management System - Specialized Agents

This directory contains specialized AI agents for developing the Election Campaign Management System for politicians and campaign managers.

## 🤖 Available Agents

### 1. Backend Developer (`backend-developer`)
**Purpose:** Expert backend developer for campaign database, APIs, and authentication

**Responsibilities:**
- Database schema and migrations (Prisma) - Election domain
- Authentication (NextAuth v5) - Campaign team access control
- API routes and server actions - Campaign operations
- Role-based access control (RBAC) - Multi-city data isolation
- Campaign data validation (Zod)
- Security best practices for political campaigns

**Tools:** Read, Write, Edit, Bash, Grep, Glob
**Model:** Sonnet

**Use for:**
- Creating/updating Prisma schema for campaign entities
- Building campaign APIs (activists, tasks, attendance)
- Implementing RBAC for campaign hierarchy
- Server-side campaign logic
- Database queries for activists, neighborhoods, cities

---

### 2. Frontend Developer (`frontend-developer`)
**Purpose:** Expert frontend developer for campaign UI with Hebrew/RTL support

**Responsibilities:**
- Campaign UI components (Material-UI v6) - Hebrew-first
- Advanced forms (React Hook Form + Zod) - Activist registration, task assignment
- Data tables (TanStack Table) - Activist lists, attendance logs
- **Mobile-first design** - Field activists use mobile devices
- **RTL support** - Hebrew is primary language
- Campaign maps (neighborhood visualization)
- Real-time updates for campaign activity

**Tools:** Read, Write, Edit, Bash, Grep, Glob
**Model:** Sonnet

**Use for:**
- Building campaign dashboard UI
- Creating activist management forms
- Implementing task assignment interfaces
- Mobile-optimized field volunteer views
- Hebrew/RTL layouts
- Map-based neighborhood views

---

### 3. QA Tester (`qa-tester`)
**Purpose:** Expert QA engineer for campaign system testing

**Responsibilities:**
- Functional testing (all campaign workflows)
- Authentication testing (campaign team login)
- **Data isolation testing** - Cross-city/area data leakage
- **RBAC testing** - Role permission boundaries
- Campaign API testing
- Mobile UI/UX testing (field activists)
- Performance testing (real-time updates)
- Security testing (multi-tenant isolation)

**Tools:** Read, Bash, Grep, Glob (read-only)
**Model:** Sonnet

**Use for:**
- Testing campaign features
- Verifying RBAC boundaries
- Cross-city isolation validation
- Mobile responsiveness testing
- Security audits for campaign data
- Bug reporting

---

### 4. UI Designer (`ui-designer`)
**Purpose:** World-class UI/UX designer for campaign interfaces

**Responsibilities:**
- Campaign design system consistency
- **Hebrew/RTL layout validation** - Primary language
- **Mobile-first design review** - Field activists use phones
- Dashboard layout validation (politicians, coordinators)
- Map interface design (neighborhood visualization)
- Real-time update UX (live campaign activity)
- Accessibility compliance (WCAG AA)
- User flow validation (campaign workflows)
- Monday.com-inspired design system

**Tools:** Read, Bash, Grep, Glob (read-only)
**Model:** Sonnet

**Use for:**
- Campaign UI design reviews
- Hebrew/RTL validation
- Mobile layout optimization
- Dashboard design feedback
- Map interface review
- Accessibility audits

---

### 5. Project Manager (`project-manager`)
**Purpose:** Senior project manager for campaign system development

**Responsibilities:**
- Development timeline management
- Task coordination across agents
- Campaign feature prioritization
- Risk management
- Quality gates enforcement
- Technical debt management
- Launch readiness for campaign season
- Stakeholder communication

**Tools:** Read, Write, Bash, Grep, Glob
**Model:** Sonnet

**Use for:**
- Sprint planning
- Progress tracking
- Risk mitigation
- Task prioritization
- Status reporting
- Launch preparation
- Coordinating other agents

---

### 6. Campaign Analyst (`campaign-analyst`)
**Purpose:** Campaign analytics and reporting specialist

**Responsibilities:**
- Campaign metrics tracking
- Activist engagement analytics
- Task completion reporting
- Attendance analysis
- Geographic coverage analytics
- Performance dashboards for politicians
- SQL queries for campaign data
- Export campaign reports

**Tools:** Read, Write, Bash, Grep, Glob
**Model:** Sonnet

**Use for:**
- Building analytics dashboards
- Creating campaign reports
- Analyzing activist productivity
- Geographic coverage analysis
- Performance metrics for politicians
- Data exports for campaign managers

---

## 🎯 Agent Coordination Pattern

### Pattern 1: New Campaign Feature
```
1. Project Manager: Define campaign feature scope, assign to Backend Developer
2. Backend Developer: Build campaign API (e.g., attendance tracking), notify PM
3. Project Manager: Assign UI to Frontend Developer
4. Frontend Developer: Build Hebrew/RTL mobile-first UI, notify PM
5. Project Manager: Assign review to UI Designer
6. UI Designer: Review mobile design & RTL, provide feedback
7. Project Manager: Assign testing to QA Tester
8. QA Tester: Test RBAC & data isolation, report findings
9. Project Manager: Coordinate fixes, verify completion
```

### Pattern 2: Campaign Bug Fix
```
1. QA Tester: Report bug with reproduction steps (e.g., cross-city data leak)
2. Project Manager: Assess severity, assign to appropriate dev
3. Backend/Frontend Developer: Fix bug
4. QA Tester: Verify fix with RBAC testing, close bug
```

### Pattern 3: Campaign Analytics Request
```
1. Campaign Analyst: Design analytics dashboard
2. Backend Developer: Create analytics queries
3. Frontend Developer: Build charts and visualizations
4. UI Designer: Review data visualization design
5. QA Tester: Test analytics accuracy
```

---

## 📚 Reference Documentation

All agents reference the campaign system documentation:

- **`/CLAUDE.md`** - Complete system overview (Election Campaign System)
- **`/docs/syAnalyse/mvp/02_DATABASE_SCHEMA.md`** - Campaign database structure
- **`/docs/syAnalyse/mvp/03_API_DESIGN.md`** - Campaign API patterns
- **`/docs/syAnalyse/mvp/04_UI_SPECIFICATIONS.md`** - Campaign UI designs
- **`/docs/syAnalyse/PRD_2025_Updated_Industry_Standards.md`** - Campaign requirements

---

## 🚀 Quick Start

### Invoke an Agent
When you need an agent, mention them by name in your request:

**Examples:**
- "Backend developer: Create the activist attendance tracking API"
- "Frontend developer: Build the mobile-first activist dashboard in Hebrew"
- "QA tester: Test cross-city data isolation for area managers"
- "UI designer: Review the Hebrew/RTL neighborhood map interface"
- "Project manager: What's our progress on campaign features?"
- "Campaign analyst: Create a dashboard showing activist productivity by neighborhood"

### Agent-Specific Guidelines

**Backend Developer:**
- Always use Prisma for campaign database operations
- Always validate input with Zod
- **Always implement RBAC** - Campaign data isolation is critical
- **Always filter by city_id** - Except for SuperAdmin
- Always hash passwords with bcryptjs
- **Test multi-city isolation** - Prevent data leakage

**Frontend Developer:**
- Always use MUI components (Material-UI v6)
- **Always design mobile-first** - Field activists use phones
- **Always implement Hebrew/RTL** - Primary language
- Always add loading/error/empty states
- **Always test on mobile devices** - Campaign coordinators are mobile
- Always use RTL-compatible CSS (`marginInlineStart`/`End`)

**QA Tester:**
- **Always test RBAC boundaries** - Cross-role access attempts
- **Always test multi-city isolation** - Data leakage prevention
- Always check all role dashboards (SuperAdmin, Area Manager, City Coordinator, Activist Coordinator)
- **Always verify mobile responsive** - Field activists use mobile
- Always test security (auth, RBAC, data isolation)

**UI Designer:**
- Always check design system consistency (Monday.com-inspired)
- **Always validate Hebrew/RTL layouts** - Primary language
- **Always review mobile-first design** - Field activists priority
- Always validate all states (loading, error, empty)
- Always test at all breakpoints (xs, md, lg)
- Always verify WCAG AA compliance

**Project Manager:**
- Always prioritize campaign-critical features (P0)
- Always track against development timeline
- Always coordinate agents efficiently
- Always make fast decisions
- **Prioritize features for campaign season** - Time-sensitive

**Campaign Analyst:**
- Always focus on politician-facing insights
- Always provide actionable campaign metrics
- Always consider geographic dimensions (city, neighborhood)
- Always optimize SQL queries for performance
- Always create exportable reports

---

## 🎨 Design System Quick Reference

**Campaign Color Palette (Monday.com-inspired):**
- Primary: #1976d2 (Blue) - Campaign actions
- Secondary: #dc004e (Pink) - Urgent tasks
- Success: #4caf50 (Green) - Completed tasks
- Warning: #ff9800 (Orange) - Pending tasks
- Error: #f44336 (Red) - Critical issues

**Typography (Hebrew-first):**
- h1: 2.5rem - Page titles (Hebrew)
- h3: 1.75rem - KPI values
- body1: 1rem - Default text (RTL)
- body2: 0.875rem - Secondary text (RTL)

**Spacing (8px grid):**
- xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 48px

**Breakpoints:**
- xs: 0px (Mobile - Field activists), md: 900px (Tablet), lg: 1200px (Desktop - Campaign HQ)

---

## ✅ Development Workflow

### Phase 1: Campaign Infrastructure
- Backend Developer: Campaign schema, auth, RBAC APIs
- Project Manager: Track progress
- QA Tester: RBAC and data isolation testing

### Phase 2: Campaign UI (Hebrew/RTL)
- Frontend Developer: All campaign screens (mobile-first)
- UI Designer: Hebrew/RTL design reviews
- QA Tester: Mobile UI/UX testing

### Phase 3: Campaign Analytics
- Campaign Analyst: Analytics dashboard design
- Backend Developer: Analytics queries and APIs
- Frontend Developer: Data visualization charts
- QA Tester: Analytics accuracy testing

### Phase 4: Launch Preparation
- All Agents: Bug fixes, polish
- QA Tester: Comprehensive RBAC and security testing
- Project Manager: Campaign season readiness

---

## 🏆 Success Criteria

**Each agent is successful when:**

- **Backend Developer:** All campaign APIs work, RBAC enforced, no cross-city data leaks, activist data secure
- **Frontend Developer:** All campaign screens perfect, Hebrew/RTL flawless, mobile-optimized, real-time updates work
- **QA Tester:** 0 P0 bugs, <5 P1 bugs, RBAC boundaries tested, cross-city isolation verified
- **UI Designer:** Design system consistent, Hebrew/RTL validated, mobile-first optimized, WCAG AA compliant
- **Project Manager:** Campaign features delivered on time, quality gates passed, ready for campaign season
- **Campaign Analyst:** Politician dashboards insightful, analytics accurate, reports actionable

---

## 📞 Agent Invocation Examples

```markdown
# Example 1: Start campaign backend work
"Backend developer: Set up the Prisma schema for activists, neighborhoods, and attendance tracking following the election campaign database specification"

# Example 2: Build campaign UI
"Frontend developer: Build the mobile-first activist coordinator dashboard in Hebrew with RTL support, showing neighborhood map and active tasks"

# Example 3: Test campaign RBAC
"QA tester: Test that City Coordinators cannot access other cities' activist data and verify Area Managers can see cross-city analytics"

# Example 4: Design review for campaign
"UI designer: Review the activist registration form for Hebrew/RTL compliance and mobile usability for field coordinators"

# Example 5: Track campaign progress
"Project manager: Give me a status update on campaign core features (attendance, tasks, neighborhoods) and identify any RBAC risks"

# Example 6: Campaign analytics
"Campaign analyst: Create a dashboard showing activist engagement rates by neighborhood for politicians to review campaign coverage"
```

---

## 🔧 Configuration

All agents are configured with:
- **Format:** Markdown frontmatter + instructions
- **Location:** `.claude/agents/[agent-name].md`
- **Model:** Sonnet (balance of speed + quality)
- **Tools:** Appropriate tool access per role
- **Context:** Election Campaign Management System

---

## 🗳️ Campaign System Key Concepts

**Organizational Hierarchy:**
```
SuperAdmin (Platform admin)
└── Election Campaign System
    ├── Area Managers (Regional campaign directors)
    └── City Coordinators (City campaign managers)
        └── Activist Coordinators (Neighborhood organizers)
            └── Neighborhoods (Geographic districts)
                └── Activists (Field volunteers)
```

**Critical Features:**
- **Multi-city isolation** - Campaign data cannot leak across cities
- **RBAC enforcement** - Role-based permissions strictly enforced
- **Mobile-first** - Field activists use mobile devices primarily
- **Hebrew/RTL** - Primary language for all UI
- **Real-time updates** - Live campaign activity tracking
- **GPS tracking** - Attendance verification for field activists
- **Task management** - Canvassing routes, phone banking shifts
- **Analytics** - Politician-facing campaign performance dashboards

---

**🗳️ Election Campaign Management System - Specialized agents for political campaign success! 🚀**
