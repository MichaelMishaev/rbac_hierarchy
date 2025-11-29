# Premium UI MVP - Specialized Agents

This directory contains specialized AI agents for developing the corporations Premium UI MVP.

## 🤖 Available Agents

### 1. Backend Developer (`backend-developer`)
**Purpose:** Expert backend developer for Railway + Prisma + NextAuth

**Responsibilities:**
- Database schema and migrations (Prisma)
- Authentication (NextAuth v5)
- API routes and server actions
- Role-based access control
- Data validation (Zod)
- Security best practices

**Tools:** Read, Write, Edit, Bash, Grep, Glob
**Model:** Sonnet

**Use for:**
- Creating/updating Prisma schema
- Building API endpoints
- Implementing authentication
- Server-side logic
- Database queries and mutations

---

### 2. Frontend Developer (`frontend-developer`)
**Purpose:** Expert frontend developer for Premium UI with MUI + Next.js 15

**Responsibilities:**
- Premium UI components (Material-UI v6)
- Advanced forms (React Hook Form + Zod)
- Data tables (TanStack Table)
- Responsive design (mobile-first)
- Animations (Framer Motion)
- Dark mode (next-themes)
- RTL support (Hebrew)

**Tools:** Read, Write, Edit, Bash, Grep, Glob
**Model:** Sonnet

**Use for:**
- Building UI components
- Creating forms and tables
- Implementing responsive layouts
- Adding animations
- Dark mode implementation
- RTL localization

---

### 3. QA Tester (`qa-tester`)
**Purpose:** Expert QA engineer for comprehensive testing

**Responsibilities:**
- Functional testing (all user flows)
- Authentication testing
- Database integrity testing
- API testing
- UI/UX testing
- Performance testing (Lighthouse)
- Security testing
- Browser compatibility
- Regression testing

**Tools:** Read, Bash, Grep, Glob (read-only)
**Model:** Sonnet

**Use for:**
- Testing new features
- Regression testing after changes
- Security audits
- Performance validation
- Accessibility checks
- Bug reporting

---

### 4. UI Designer (`ui-designer`)
**Purpose:** World-class UI/UX designer for Premium UI standards

**Responsibilities:**
- Design system consistency
- Component design review
- Screen layout validation
- Responsive design validation
- Animation and interaction design
- Dark mode design validation
- RTL (Hebrew) support
- Accessibility compliance (WCAG AA)
- User flow validation
- Design QA

**Tools:** Read, Bash, Grep, Glob (read-only)
**Model:** Sonnet

**Use for:**
- Design system validation
- Component design reviews
- User flow validation
- Accessibility audits
- Dark mode checks
- RTL layout validation
- Design feedback

---

### 5. Project Manager (`project-manager`)
**Purpose:** Senior project manager for 3-week MVP timeline

**Responsibilities:**
- Timeline management (3-week sprint)
- Task coordination across agents
- Progress tracking
- Risk management
- Priority management (P0/P1/P2)
- Quality gates (Week 1/2/3)
- Communication and reporting
- Decision making
- Technical debt management
- Launch readiness

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

## 🎯 Agent Coordination Pattern

### Pattern 1: New Feature Development
```
1. Project Manager: Define scope, assign to Backend Developer
2. Backend Developer: Build API, notify PM
3. Project Manager: Assign UI to Frontend Developer
4. Frontend Developer: Build UI, notify PM
5. Project Manager: Assign review to UI Designer
6. UI Designer: Review design, provide feedback
7. Project Manager: Assign testing to QA Tester
8. QA Tester: Test feature, report findings
9. Project Manager: Coordinate fixes, verify completion
```

### Pattern 2: Bug Fix
```
1. QA Tester: Report bug with reproduction steps
2. Project Manager: Assess severity, assign to appropriate dev
3. Backend/Frontend Developer: Fix bug
4. QA Tester: Verify fix, close bug
```

### Pattern 3: Design Review
```
1. Frontend Developer: Complete screen
2. UI Designer: Review design compliance
3. Frontend Developer: Implement feedback
4. QA Tester: Test final implementation
```

---

## 📚 Reference Documentation

All agents reference the MVP documentation:

- **`/docs/syAnalyse/mvp/00_OVERVIEW.md`** - Project overview
- **`/docs/syAnalyse/mvp/01_TECH_STACK.md`** - Technology choices
- **`/docs/syAnalyse/mvp/02_DATABASE_SCHEMA.md`** - Database structure
- **`/docs/syAnalyse/mvp/03_API_DESIGN.md`** - API patterns
- **`/docs/syAnalyse/mvp/04_UI_SPECIFICATIONS.md`** - Screen designs
- **`/docs/syAnalyse/mvp/05_IMPLEMENTATION_PLAN.md`** - 3-week timeline
- **`/docs/syAnalyse/mvp/06_FEATURE_SPECIFICATIONS.md`** - Feature behavior
- **`/docs/syAnalyse/mvp/07_TESTING_CHECKLIST.md`** - QA standards

---

## 🚀 Quick Start

### Invoke an Agent
When you need an agent, mention them by name in your request:

**Examples:**
- "Backend developer: Create the Prisma schema for corporations"
- "Frontend developer: Build the SuperAdmin dashboard"
- "QA tester: Test the authentication flow"
- "UI designer: Review the dark mode implementation"
- "Project manager: What's our current progress?"

### Agent-Specific Guidelines

**Backend Developer:**
- Always use Prisma for database operations
- Always validate input with Zod
- Always implement role-based access control
- Always hash passwords with bcryptjs

**Frontend Developer:**
- Always use MUI components (not custom)
- Always make responsive (mobile-first)
- Always add loading/error/empty states
- Always test dark mode and RTL

**QA Tester:**
- Always test P0 features first
- Always check all 3 role dashboards
- Always verify mobile responsive
- Always test security (auth, RBAC)

**UI Designer:**
- Always check design system consistency
- Always validate all states (loading, error, empty)
- Always test at all breakpoints
- Always verify WCAG AA compliance

**Project Manager:**
- Always prioritize P0 over P1/P2
- Always track against 3-week timeline
- Always coordinate agents efficiently
- Always make fast decisions

---

## 🎨 Design System Quick Reference

**Colors:**
- Primary: #1976d2 (Blue)
- Secondary: #dc004e (Pink)
- Success: #4caf50 (Green)
- Warning: #ff9800 (Orange)
- Error: #f44336 (Red)

**Typography:**
- h1: 2.5rem - Page titles
- h3: 1.75rem - KPI values
- body1: 1rem - Default text
- body2: 0.875rem - Secondary text

**Spacing (8px grid):**
- xs: 8px, sm: 16px, md: 24px, lg: 32px, xl: 48px

**Breakpoints:**
- xs: 0px (Mobile), md: 900px (Tablet), lg: 1200px (Desktop)

---

## ✅ Development Workflow

### Week 1: Backend Foundation
- Backend Developer: Schema, auth, APIs
- Project Manager: Track progress
- QA Tester: API testing

### Week 2: Premium UI
- Frontend Developer: All 14 screens
- UI Designer: Design reviews
- QA Tester: UI/UX testing

### Week 3: Polish & Launch
- All Agents: Bug fixes, polish
- QA Tester: Comprehensive testing
- Project Manager: Launch readiness

---

## 🏆 Success Criteria

**Each agent is successful when:**

- **Backend Developer:** All APIs work, auth secure, no data corruption
- **Frontend Developer:** All 14 screens perfect, mobile responsive, dark mode works
- **QA Tester:** 0 P0 bugs, <5 P1 bugs, all critical flows tested
- **UI Designer:** Design system consistent, WCAG AA compliant, Premium feel
- **Project Manager:** Ship on Day 21, P0 features complete, quality gates passed

---

## 📞 Agent Invocation Examples

```markdown
# Example 1: Start backend work
"Backend developer: Set up the Prisma schema following the database specification in /docs/syAnalyse/mvp/02_DATABASE_SCHEMA.md"

# Example 2: Build UI
"Frontend developer: Build the SuperAdmin dashboard with KPI cards and corporations table, following /docs/syAnalyse/mvp/04_UI_SPECIFICATIONS.md"

# Example 3: Test feature
"QA tester: Test the complete SuperAdmin flow from login to creating a corporation and inviting a manager"

# Example 4: Design review
"UI designer: Review the manager dashboard for design system consistency, responsive behavior, and dark mode compatibility"

# Example 5: Track progress
"Project manager: Give me a status update on Week 1 progress and identify any risks"
```

---

## 🔧 Configuration

All agents are configured with:
- **Format:** Markdown frontmatter + instructions
- **Location:** `.claude/agents/[agent-name].md`
- **Model:** Sonnet (balance of speed + quality)
- **Tools:** Appropriate tool access per role

---

**Premium UI MVP - Ship in 21 days with specialized agents! 🚀**
