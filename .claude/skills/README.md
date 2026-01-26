# 🗳️ Campaign Skills - Election Campaign Management System

Project-specific skills for robust development of the Election Campaign Management System.

## 🎯 Quick Reference

| Skill | Command | Purpose | Use When |
|-------|---------|---------|----------|
| **campaign-protocol** | `/protocol` | 5-step task flow, bug fix discipline | Before ANY code changes |
| **campaign-invariant** | `/invariant` | Check all 19 system invariants | Before commits |
| **campaign-rbac** | `/rbac-check` | Validate city/area scoping | Writing backend code |
| **campaign-rtl** | `/rtl-check` | Hebrew-only, RTL layout validation | Creating UI components |
| **campaign-test** | `/test-rbac` | Generate RBAC negative tests | After implementing features |

---

## 📋 Skill Descriptions

### 1. Campaign Protocol (`/protocol`)
**Enforce development discipline**

```bash
/protocol validate     # Validate current changes
/protocol bug-fix      # RBAC-safe bug fix flow
/protocol task-flow    # 5-step task enforcement
/protocol pre-commit   # Full pre-commit checks
/protocol risk-check   # Classify change risk
```

**Use:** Before starting ANY task to ensure proper process.

---

### 2. Campaign Invariant (`/invariant`)
**Check system invariants from baseRules.md**

```bash
/invariant all        # Check all 19 invariants
/invariant rbac       # RBAC isolation (INV-RBAC-001-004)
/invariant security   # Security (INV-SEC-001-010)
/invariant i18n       # Hebrew/RTL (INV-I18N-001-003)
/invariant data       # Data integrity (INV-DATA-001-004)
```

**Checks:**
- RBAC data isolation (city/area scoping)
- Security controls (auth, soft deletes, validation)
- Hebrew-only UI text
- RTL layout compliance
- data-testid automation contract

---

### 3. Campaign RBAC (`/rbac-check`)
**Validate RBAC in Prisma queries**

```bash
/rbac-check queries   # Audit all Prisma queries
/rbac-check actions   # Audit server actions
/rbac-check api       # Audit API routes
/rbac-check file X    # Audit specific file
/rbac-check all       # Full RBAC audit
```

**Validates:**
- City filter on City Coordinator queries
- M2M neighborhood filter on Activist Coordinator queries
- Area filter on Area Manager queries
- SuperAdmin bypass pattern

---

### 4. Campaign RTL (`/rtl-check`)
**Hebrew-only and RTL validation**

```bash
/rtl-check all        # Full Hebrew/RTL audit
/rtl-check text       # Find English text
/rtl-check layout     # Check RTL direction
/rtl-check css        # Check logical CSS properties
/rtl-check locale     # Check date/number formatting
```

**Validates:**
- No English text in UI
- `direction: 'rtl'` on containers
- Logical CSS (marginInlineStart, not marginLeft)
- `he-IL` locale for dates/numbers
- MUI RTL theme configuration

---

### 5. Campaign Test (`/test-rbac`)
**Generate RBAC negative tests**

```bash
/test-rbac activist      # Activist permission tests
/test-rbac neighborhood  # Neighborhood access tests
/test-rbac task          # Task assignment tests
/test-rbac city          # City access tests
/test-rbac all           # All permission tests
```

**Generates:**
- Positive tests (CAN access own scope)
- Negative tests (CANNOT access other scopes)
- API boundary tests
- Auth helper functions

---

## 🔄 Workflow Integration

### Before Starting a Task
```bash
/protocol task-flow    # Review 5-step process
```

### While Implementing
```bash
/rbac-check file app/actions/activists.ts  # Validate RBAC
/rtl-check file app/components/Form.tsx    # Validate Hebrew/RTL
```

### Before Committing
```bash
/protocol pre-commit   # Full validation
/invariant all         # Check all invariants
```

### After Feature Complete
```bash
/test-rbac activist    # Generate negative tests
```

---

## 🤖 Agent Integration

| Agent | Skills Used |
|-------|-------------|
| **backend-developer** | `/protocol`, `/rbac-check`, `/invariant rbac` |
| **frontend-developer** | `/protocol`, `/rtl-check`, `/invariant i18n` |
| **qa-tester** | `/invariant all`, `/test-rbac` |
| **rbac-security-guard** | `/rbac-check`, `/invariant security` |
| **hebrew-rtl-specialist** | `/rtl-check`, `/invariant i18n` |

---

## 📚 Reference Documentation

- **Base Rules:** `/docs/infrastructure/base/baseRules.md`
- **Permissions Matrix:** `/docs/infrastructure/roles/PERMISSIONS_MATRIX.md`
- **Project Instructions:** `/CLAUDE.md`
- **Bug Knowledge Base:** `/docs/bugs/`

---

## ⚠️ Critical Rules

1. **No code changes without `/protocol`** - Declare boundary and risk first
2. **No commits without `/invariant all`** - Check all system rules
3. **No RBAC code without `/rbac-check`** - Validate scoping
4. **No UI without `/rtl-check`** - Hebrew-only, RTL-only
5. **No feature complete without negative tests** - Use `/test-rbac`

---

**Campaign-specific. RBAC-first. Hebrew-only. 🗳️**
