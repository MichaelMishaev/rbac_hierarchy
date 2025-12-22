# 🗳️ Election Campaign Management System - Color-Coded Specialized Agents

This directory contains specialized AI agents for developing the Election Campaign Management System for politicians and campaign managers.

## 🎨 Color-Coded Agent System

Each agent has a unique color for easy identification:

```
🔵 BLUE   = Backend Developer (Infrastructure & APIs)
🟢 GREEN  = Frontend Developer (UI & Components)
🔴 RED    = QA Tester (Quality & Testing)
🟣 PURPLE = UI Designer (Design & UX)
🟡 YELLOW = Project Manager (Coordination & Planning)
🟠 ORANGE = Campaign Analyst (Data & Analytics)
🔷 LIGHT BLUE = RBAC Security Guard (Security & Permissions)
🟦 DARK BLUE = Hebrew RTL Specialist (i18n & RTL)
```

## 🤖 Available Agents

### 1. 🔵 Backend Developer (`backend-developer`)
**Color:** Blue - Infrastructure, APIs, Database
**Model:** Sonnet
**Tools:** Read, Write, Edit, Bash, Grep, Glob

**Responsibilities:**
- Database schema and migrations (Prisma) - Election domain
- Authentication (NextAuth v5) - Campaign team access control
- API routes and server actions - Campaign operations
- Role-based access control (RBAC) - Multi-city data isolation
- Campaign data validation (Zod)
- Security best practices for political campaigns

**Use for:**
- Creating/updating Prisma schema for campaign entities
- Building campaign APIs (activists, tasks, attendance)
- Implementing RBAC for campaign hierarchy
- Server-side campaign logic
- Database queries for activists, neighborhoods, cities

**Invoke:** `"Backend developer: [task]"` or just mention "backend"

---

### 2. 🟢 Frontend Developer (`frontend-developer`)
**Color:** Green - UI, Components, Visual Elements
**Model:** Sonnet
**Tools:** Read, Write, Edit, Bash, Grep, Glob

**Responsibilities:**
- Campaign UI components (Material-UI v6) - Hebrew-first
- Advanced forms (React Hook Form + Zod) - Activist registration, task assignment
- Data tables (TanStack Table) - Activist lists, attendance logs
- **Mobile-first design** - Field activists use mobile devices
- **RTL support** - Hebrew is primary language
- Campaign maps (neighborhood visualization)
- Real-time updates for campaign activity

**Use for:**
- Building campaign dashboard UI
- Creating activist management forms
- Implementing task assignment interfaces
- Mobile-optimized field volunteer views
- Hebrew/RTL layouts
- Map-based neighborhood views

**Invoke:** `"Frontend developer: [task]"` or just mention "frontend"

---

### 3. 🔴 QA Tester (`qa-tester`)
**Color:** Red - Quality, Alerts, Testing, Bug Detection
**Model:** Sonnet
**Tools:** Read, Bash, Grep, Glob (read-only)

**Responsibilities:**
- Functional testing (all campaign workflows)
- Authentication testing (campaign team login)
- **Data isolation testing** - Cross-city/area data leakage
- **RBAC testing** - Role permission boundaries
- Campaign API testing
- Mobile UI/UX testing (field activists)
- Performance testing (real-time updates)
- Security testing (multi-tenant isolation)

**Use for:**
- Testing campaign features
- Verifying RBAC boundaries
- Cross-city isolation validation
- Mobile responsiveness testing
- Security audits for campaign data
- Bug reporting

**Invoke:** `"QA tester: [task]"` or just mention "qa" or "test"

---

### 4. 🟣 UI Designer (`ui-designer`)
**Color:** Purple - Design, Creativity, User Experience
**Model:** Sonnet
**Tools:** Read, Bash, Grep, Glob (read-only)

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

**Use for:**
- Campaign UI design reviews
- Hebrew/RTL validation
- Mobile layout optimization
- Dashboard design feedback
- Map interface review
- Accessibility audits

**Invoke:** `"UI designer: [task]"` or just mention "design"

---

### 5. 🟡 Project Manager (`project-manager`)
**Color:** Yellow - Coordination, Organization, Planning
**Model:** Sonnet
**Tools:** Read, Write, Bash, Grep, Glob

**Responsibilities:**
- Development timeline management
- Task coordination across agents
- Campaign feature prioritization
- Risk management
- Quality gates enforcement
- Technical debt management
- Launch readiness for campaign season
- Stakeholder communication

**Use for:**
- Sprint planning
- Progress tracking
- Risk mitigation
- Task prioritization
- Status reporting
- Launch preparation
- Coordinating other agents

**Invoke:** `"Project manager: [task]"` or just mention "pm" or "manager"

---

### 6. 🟠 Campaign Analyst (`campaign-analyst`)
**Color:** Orange - Data, Analytics, Insights
**Model:** Sonnet
**Tools:** Read, Write, Bash, Grep, Glob

**Responsibilities:**
- Campaign metrics tracking
- Activist engagement analytics
- Task completion reporting
- Attendance analysis
- Geographic coverage analytics
- Performance dashboards for politicians
- SQL queries for campaign data
- Export campaign reports

**Use for:**
- Building analytics dashboards
- Creating campaign reports
- Analyzing activist productivity
- Geographic coverage analysis
- Performance metrics for politicians
- Data exports for campaign managers

**Invoke:** `"Campaign analyst: [task]"` or just mention "analyst" or "analytics"

---

### 7. 🔷 RBAC Security Guard (`rbac-security-guard`)
**Color:** Light Blue - Security, Permissions, Data Isolation
**Model:** Sonnet
**Tools:** Read, Grep, Glob, Bash (read-only)

**Responsibilities:**
- **RBAC enforcement validation** - Multi-role permission boundaries
- **Data isolation audits** - Cross-city/area data leakage prevention
- **Security vulnerability detection** - Campaign data exposure
- **Permission boundary testing** - Role-based access verification
- **Middleware validation** - Filter injection and scope checks
- **Audit log verification** - Complete campaign operation tracking

**Use for:**
- Reviewing RBAC implementation
- Auditing data isolation patterns
- Validating security middleware
- Testing permission boundaries
- Security compliance checks
- Multi-tenant isolation verification

**Invoke:** `"RBAC security guard: [task]"` or just mention "rbac" or "security"

---

### 8. 🟦 Hebrew RTL Specialist (`hebrew-rtl-specialist`)
**Color:** Dark Blue - Internationalization, RTL, Hebrew
**Model:** Sonnet
**Tools:** Read, Grep, Glob, Bash (read-only)

**Responsibilities:**
- **Hebrew-only validation** - No English fallbacks or bilingual support
- **RTL layout verification** - Right-to-left text direction enforcement
- **i18n compliance** - next-intl configuration and usage
- **Typography validation** - Hebrew font rendering and spacing
- **Form input validation** - Hebrew text fields with proper alignment
- **Date/number formatting** - he-IL locale usage

**Use for:**
- Validating Hebrew-only UI text
- Checking RTL layout implementation
- Reviewing CSS logical properties usage
- Testing MUI RTL theme configuration
- Verifying Hebrew date/number formatting
- Auditing i18n implementation

**Invoke:** `"Hebrew RTL specialist: [task]"` or just mention "hebrew" or "rtl"

---

## 🎯 Quick Reference - When to Use Each Agent

| Task Type | Agent | Color | Example |
|-----------|-------|-------|---------|
| Database schema, APIs | Backend Developer | 🔵 Blue | "Add attendance tracking table" |
| UI components, forms | Frontend Developer | 🟢 Green | "Build activist registration form" |
| Testing, bug detection | QA Tester | 🔴 Red | "Test cross-city data isolation" |
| Design review, UX | UI Designer | 🟣 Purple | "Review dashboard layout" |
| Planning, coordination | Project Manager | 🟡 Yellow | "What's our sprint progress?" |
| Data analysis, reports | Campaign Analyst | 🟠 Orange | "Activist productivity report" |
| Security, RBAC | RBAC Security Guard | 🔷 Light Blue | "Audit permission boundaries" |
| Hebrew, RTL validation | Hebrew RTL Specialist | 🟦 Dark Blue | "Validate Hebrew layout" |

---

## 🔄 Agent Coordination Patterns

### Pattern 1: New Campaign Feature (Full Stack)
```
1. 🟡 Project Manager: Define scope → assign to 🔵 Backend Developer
2. 🔵 Backend Developer: Build API → notify 🟡 PM
3. 🟡 Project Manager: Assign UI → 🟢 Frontend Developer
4. 🟢 Frontend Developer: Build UI → notify 🟡 PM
5. 🟡 Project Manager: Request review → 🟣 UI Designer
6. 🟣 UI Designer: Review design → provide feedback
7. 🟡 Project Manager: Request Hebrew validation → 🟦 Hebrew RTL Specialist
8. 🟦 Hebrew RTL Specialist: Validate RTL → approve
9. 🟡 Project Manager: Assign testing → 🔴 QA Tester
10. 🔴 QA Tester: Test feature → report results
11. 🟡 Project Manager: Verify completion
```

### Pattern 2: Security-Critical Feature (RBAC + Data Isolation)
```
1. 🟡 Project Manager: Define security requirements → assign to 🔷 RBAC Security Guard
2. 🔷 RBAC Security Guard: Audit current RBAC → identify gaps
3. 🔵 Backend Developer: Implement RBAC middleware → notify 🔷
4. 🔷 RBAC Security Guard: Validate implementation → approve/reject
5. 🔴 QA Tester: Test permission boundaries → verify isolation
6. 🟡 Project Manager: Sign off on security
```

### Pattern 3: Hebrew UI Component
```
1. 🟢 Frontend Developer: Build component → notify 🟦 Hebrew RTL Specialist
2. 🟦 Hebrew RTL Specialist: Validate Hebrew/RTL → provide feedback
3. 🟢 Frontend Developer: Fix RTL issues → resubmit
4. 🟣 UI Designer: Review visual design → approve
5. 🔴 QA Tester: Test on mobile → verify responsive
```

### Pattern 4: Campaign Analytics Dashboard
```
1. 🟠 Campaign Analyst: Design analytics → define metrics
2. 🔵 Backend Developer: Create analytics queries → build API
3. 🟢 Frontend Developer: Build charts/visualizations → integrate API
4. 🟣 UI Designer: Review data visualization → provide feedback
5. 🟦 Hebrew RTL Specialist: Validate Hebrew labels → approve
6. 🔴 QA Tester: Test analytics accuracy → verify data
```

### Pattern 5: Bug Fix (Following Bug Fix Protocol)
```
1. 🔴 QA Tester: Report bug with reproduction → identify severity
2. 🟡 Project Manager: Assess impact → assign to appropriate dev
3. 🔵/🟢 Developer: Root cause analysis → write regression test
4. 🔵/🟢 Developer: Implement minimal fix → run tests
5. 🔴 QA Tester: Verify fix → confirm regression test passes
6. 🟡 Project Manager: Document in bugs-current.md → close ticket
```

---

## 📚 Reference Documentation

All agents reference the campaign system documentation:

- **`/CLAUDE.md`** - Complete system overview (Election Campaign System)
- **`/docs/syAnalyse/mvp/02_DATABASE_SCHEMA.md`** - Campaign database structure
- **`/docs/syAnalyse/mvp/03_API_DESIGN.md`** - Campaign API patterns
- **`/docs/syAnalyse/mvp/04_UI_SPECIFICATIONS.md`** - Campaign UI designs
- **`/docs/syAnalyse/PRD_2025_Updated_Industry_Standards.md`** - Campaign requirements
- **`/docs/bugs/bugs-current.md`** - Current bugs and prevention rules
- **`/docs/bugs/bugs-archive-*.md`** - Historical bug archives

---

## 🚀 Quick Start

### Invoke an Agent by Color

**Examples:**
- 🔵 "Backend developer: Create the activist attendance tracking API"
- 🟢 "Frontend developer: Build the mobile-first activist dashboard in Hebrew"
- 🔴 "QA tester: Test cross-city data isolation for area managers"
- 🟣 "UI designer: Review the Hebrew/RTL neighborhood map interface"
- 🟡 "Project manager: What's our progress on campaign features?"
- 🟠 "Campaign analyst: Create activist productivity dashboard"
- 🔷 "RBAC security guard: Audit permission boundaries for city coordinators"
- 🟦 "Hebrew RTL specialist: Validate activist registration form RTL layout"

### Multi-Agent Workflows

Invoke multiple agents in parallel or sequence:

```
"Project manager: Coordinate backend developer and frontend developer to build the activist check-in feature with Hebrew UI"
```

```
"RBAC security guard: Review the new neighborhoods API, then have QA tester verify cross-city isolation"
```

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

## ✅ Development Workflow by Phase

### Phase 1: Campaign Infrastructure
- 🔵 Backend Developer: Campaign schema, auth, RBAC APIs
- 🔷 RBAC Security Guard: Validate data isolation patterns
- 🟡 Project Manager: Track progress
- 🔴 QA Tester: RBAC and data isolation testing

### Phase 2: Campaign UI (Hebrew/RTL)
- 🟢 Frontend Developer: All campaign screens (mobile-first)
- 🟦 Hebrew RTL Specialist: Validate Hebrew/RTL implementation
- 🟣 UI Designer: Hebrew/RTL design reviews
- 🔴 QA Tester: Mobile UI/UX testing

### Phase 3: Campaign Analytics
- 🟠 Campaign Analyst: Analytics dashboard design
- 🔵 Backend Developer: Analytics queries and APIs
- 🟢 Frontend Developer: Data visualization charts
- 🔴 QA Tester: Analytics accuracy testing

### Phase 4: Launch Preparation
- All Agents: Bug fixes, polish
- 🔷 RBAC Security Guard: Final security audit
- 🔴 QA Tester: Comprehensive RBAC and security testing
- 🟡 Project Manager: Campaign season readiness

---

## 🏆 Success Criteria

**Each agent is successful when:**

- 🔵 **Backend Developer:** All campaign APIs work, RBAC enforced, no cross-city data leaks, activist data secure
- 🟢 **Frontend Developer:** All campaign screens perfect, Hebrew/RTL flawless, mobile-optimized, real-time updates work
- 🔴 **QA Tester:** 0 P0 bugs, <5 P1 bugs, RBAC boundaries tested, cross-city isolation verified
- 🟣 **UI Designer:** Design system consistent, Hebrew/RTL validated, mobile-first optimized, WCAG AA compliant
- 🟡 **Project Manager:** Campaign features delivered on time, quality gates passed, ready for campaign season
- 🟠 **Campaign Analyst:** Politician dashboards insightful, analytics accurate, reports actionable
- 🔷 **RBAC Security Guard:** No permission leaks, data isolation verified, audit logs complete
- 🟦 **Hebrew RTL Specialist:** 100% Hebrew UI, RTL layouts perfect, no English text found

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

**🗳️ Election Campaign Management System - Color-coded specialized agents for political campaign success! 🚀**
