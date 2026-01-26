# 🔒 LOCKED SYSTEM FILES - Election Campaign Management System

**Date Locked**: 2025-12-17
**Status**: FROZEN - DO NOT EDIT WITHOUT EXPLICIT PERMISSION
**Scope**: All core system logic, business rules, RBAC, database schema

---

## 🚫 CRITICAL - LOCKED FILES (DO NOT MODIFY)

### 🗄️ Database Schema & Prisma (LOCKED)
```
app/prisma/
├── schema.prisma ........................... 🔒 LOCKED (Single Source of Truth)
├── seed.ts ................................. 🔒 LOCKED (Test data generation)
└── migrations/ ............................. 🔒 LOCKED (All migration files)
```

**Why Locked**: Database schema is the foundation. Changes can break entire system.

---

### 🔐 Authentication & Session Management (LOCKED)
```
app/auth.config.ts .......................... 🔒 LOCKED (NextAuth configuration)
app/auth.ts ................................. 🔒 LOCKED (Auth providers & callbacks)
app/middleware.ts ........................... 🔒 LOCKED (Route protection)
app/lib/auth-helpers.ts ..................... 🔒 LOCKED (Auth utility functions)
```

**Why Locked**: Security-critical. Any changes could expose vulnerabilities.

---

### 🛡️ RBAC & Permissions System (LOCKED)
```
app/lib/rbac/
├── permissions.ts .......................... 🔒 LOCKED (Permission definitions)
├── roles.ts ................................ 🔒 LOCKED (Role hierarchy)
├── guards.ts ............................... 🔒 LOCKED (Permission guards)
└── middleware.ts ........................... 🔒 LOCKED (RBAC middleware)

app/lib/rbac-helpers.ts ..................... 🔒 LOCKED (RBAC utilities)
```

**Why Locked**: RBAC is core security. Mistakes = data leakage between cities/roles.

---

### 🏢 Organization Hierarchy Logic (LOCKED)
```
app/lib/hierarchy/
├── tree-builder.ts ......................... 🔒 LOCKED (Org tree construction)
├── role-filter.ts .......................... 🔒 LOCKED (Role-based visibility)
├── city-isolation.ts ....................... 🔒 LOCKED (Multi-tenant isolation)
└── area-manager-scope.ts ................... 🔒 LOCKED (Area manager data access)
```

**Why Locked**: Core business logic. Changes affect data visibility across entire app.

---

### 🗺️ Cities & Neighborhoods System (LOCKED)
```
app/lib/cities/
├── cities-data.ts .......................... 🔒 LOCKED (Israeli cities database)
├── neighborhoods-data.ts ................... 🔒 LOCKED (Tel Aviv neighborhoods)
└── geo-helpers.ts .......................... 🔒 LOCKED (Geographic utilities)

app/scripts/
├── add-israeli-districts.ts ................ 🔒 LOCKED (City seeding)
├── seed-israeli-cities.ts .................. 🔒 LOCKED (City data)
└── seed-neighborhoods.ts ................... 🔒 LOCKED (Neighborhood data)
```

**Why Locked**: Critical geographic data. Used throughout entire system.

---

### 👥 User & Activist Management (LOCKED)
```
app/lib/activists/
├── activist-helpers.ts ..................... 🔒 LOCKED (Activist business logic)
├── supervisor-assignment.ts ................ 🔒 LOCKED (Supervisor relationships)
└── validation.ts ........................... 🔒 LOCKED (Activist validation rules)

app/lib/users/
├── user-helpers.ts ......................... 🔒 LOCKED (User utilities)
├── role-assignment.ts ...................... 🔒 LOCKED (Role assignment logic)
└── session-helpers.ts ...................... 🔒 LOCKED (Session management)
```

**Why Locked**: Core data management. Errors = data corruption.

---

### 📊 Data Integrity & Validation (LOCKED)
```
app/scripts/
├── check-worker-supervisor-integrity.ts .... 🔒 LOCKED (Data integrity checks)
├── verify-org-tree.ts ...................... 🔒 LOCKED (Org tree validation)
└── fix-supervisor-relationships.ts ......... 🔒 LOCKED (Data repair scripts)

app/lib/validation/
├── schemas.ts .............................. 🔒 LOCKED (Zod validation schemas)
├── activists.ts ............................ 🔒 LOCKED (Activist validation)
└── users.ts ................................ 🔒 LOCKED (User validation)
```

**Why Locked**: Data integrity is critical. Bad validation = corrupt database.

---

### 🌐 i18n & Localization (LOCKED)
```
app/messages/
├── he.json ................................. 🔒 LOCKED (Hebrew translations)
└── en.json ................................. 🔒 LOCKED (English translations)

app/lib/i18n/
├── config.ts ............................... 🔒 LOCKED (i18n configuration)
└── helpers.ts .............................. 🔒 LOCKED (Translation utilities)
```

**Why Locked**: Hebrew-only system requirement. Changes affect entire UI.

---

### 🎨 Theme & RTL Configuration (LOCKED)
```
app/lib/theme/
├── theme.ts ................................ 🔒 LOCKED (MUI theme with RTL)
├── rtl-plugin.ts ........................... 🔒 LOCKED (RTL support)
└── colors.ts ............................... 🔒 LOCKED (Color system)
```

**Why Locked**: RTL is fundamental requirement. Changes break entire UI.

---

### 🔄 Server Actions (LOCKED)
```
app/actions/
├── auth/ ................................... 🔒 LOCKED (Auth actions)
├── activists/ .............................. 🔒 LOCKED (Activist CRUD)
├── users/ .................................. 🔒 LOCKED (User management)
├── cities/ ................................. 🔒 LOCKED (City operations)
├── neighborhoods/ .......................... 🔒 LOCKED (Neighborhood ops)
├── tasks/ .................................. 🔒 LOCKED (Task management)
└── attendance/ ............................. 🔒 LOCKED (Attendance tracking)
```

**Why Locked**: Server actions contain business logic & RBAC checks. Critical.

---

### 📍 API Routes (LOCKED)
```
app/app/api/
├── auth/ ................................... 🔒 LOCKED (Auth endpoints)
├── activists/ .............................. 🔒 LOCKED (Activist API)
├── users/ .................................. 🔒 LOCKED (User API)
├── cities/ ................................. 🔒 LOCKED (City API)
├── neighborhoods/ .......................... 🔒 LOCKED (Neighborhood API)
├── tasks/ .................................. 🔒 LOCKED (Task API)
└── attendance/ ............................. 🔒 LOCKED (Attendance API)
```

**Why Locked**: API endpoints are public-facing. Security-critical.

---

### ⚙️ Configuration Files (LOCKED)
```
app/next.config.mjs ......................... 🔒 LOCKED (Next.js config)
app/tsconfig.json ........................... 🔒 LOCKED (TypeScript config)
app/tailwind.config.ts ...................... 🔒 LOCKED (Tailwind config)
app/.env.example ............................ 🔒 LOCKED (Environment template)
app/package.json ............................ 🔒 LOCKED (Dependencies & scripts)
```

**Why Locked**: Core configuration. Changes can break builds or deployments.

---

### 🧪 Test Infrastructure (LOCKED)
```
app/tests/e2e/
├── fixtures/ ............................... 🔒 LOCKED (Test fixtures)
├── auth/ ................................... 🔒 LOCKED (Auth tests)
├── rbac/ ................................... 🔒 LOCKED (RBAC tests)
├── multi-tenant/ ........................... 🔒 LOCKED (Isolation tests)
├── responsive/ ............................. ✅ UNLOCKED (Mobile/responsive - ACTIVE WORK)
└── critical/ ............................... 🔒 LOCKED (Critical path tests)

app/playwright.config.ts .................... ✅ UNLOCKED (May need device updates)
app/playwright.demo.config.ts ............... ✅ UNLOCKED (Demo config)
```

**Why Locked**: Tests ensure system correctness. Changes can hide bugs.
**Why responsive/ UNLOCKED**: Active development on responsive design - needs flexibility.

---

### 📚 Critical Documentation (LOCKED)
```
app/CLAUDE.md ............................... 🔒 LOCKED (Development protocols)
docs/infrastructure/base/baseRules.md ....... 🔒 LOCKED (Development rules)
docs/syAnalyse/ ............................. 🔒 LOCKED (System analysis docs)
docs/testing/ ............................... 🔒 LOCKED (Testing guides)
docs/bugs/bugs-current.md ................... 🔒 LOCKED (Bug prevention log)
docs/bugs/bugs-archive-*.md ................. 🔒 LOCKED (Historical bug archives)
README.md ................................... 🔒 LOCKED (Project overview)
```

**Why Locked**: Documentation is source of truth. Protects knowledge.

---

## 🔓 How to Request Edit Permission

### Step 1: Identify the File
```bash
# Check if file is locked
grep "filename.ts" LOCKED_SYSTEM_FILES.md
```

### Step 2: Request Permission
**Format**: "I need to edit [filename] to [specific change] because [reason]"

**Example**:
```
❌ Bad: "Can I change the database?"
✅ Good: "I need to edit app/prisma/schema.prisma to add an 'email_verified'
         boolean field to the User table because we need email verification."
```

### Step 3: Wait for Approval
- ✅ You'll receive explicit permission
- ✅ You'll be told which files you can modify
- ✅ You'll get guidelines for the change

### Step 4: Make Changes Carefully
- ✅ Change ONLY what was approved
- ✅ Run tests after changes
- ✅ Document changes in bug log if fixing bug
- ✅ Update this file with change record

---

## ✅ UNLOCKED: Responsive/Mobile Work Area

### 🎨 Fully Open for Modification (No Permission Needed)

**Directory**: `app/tests/e2e/responsive/`

All files in this directory are **UNLOCKED** for active responsive design work:

```
app/tests/e2e/responsive/
├── breakpoints.spec.ts ..................... ✅ UNLOCKED - Edit freely
├── visual-regression.spec.ts ............... ✅ UNLOCKED - Edit freely
├── mobile-specific.spec.ts ................. ✅ UNLOCKED - Edit freely
├── demo-mobile-test.spec.ts ................ ✅ UNLOCKED - Edit freely
├── README.md ............................... ✅ UNLOCKED - Update as needed
├── QUICK_START.md .......................... ✅ UNLOCKED - Update as needed
├── VISUAL_GUIDE.md ......................... ✅ UNLOCKED - Update as needed
└── LOCKED_FILES.md ......................... ✅ UNLOCKED - Ignore this file

app/playwright.config.ts .................... ✅ UNLOCKED - Add devices
app/playwright.demo.config.ts ............... ✅ UNLOCKED - Modify as needed
app/RUN_MOBILE_TESTS.md ..................... ✅ UNLOCKED - Update instructions
```

**Total Unlocked for Responsive Work**: 15 files
**Lines Available**: 2,500+

### Why These Are Unlocked:
1. 🎨 **Active responsive design work** - Need to iterate quickly
2. 📱 **Device testing changes** - May need new viewports/devices
3. 📸 **Visual regression updates** - Baselines will change during design
4. 📝 **Documentation updates** - Instructions may need adjustments
5. 🔧 **Test improvements** - Can enhance tests without permission

### You Can:
- ✅ Add new test files to `responsive/`
- ✅ Modify existing responsive test specs
- ✅ Add new device configurations to Playwright config
- ✅ Update visual regression baselines
- ✅ Improve test coverage
- ✅ Update documentation
- ✅ Add new npm scripts for responsive testing
- ✅ Experiment with different viewports
- ✅ Refactor test structure

---

## ✅ What You CAN Do (Without Unlocking - Other Areas)

### Allowed Without Permission:
1. ✅ **Read any locked file** - View code anytime
2. ✅ **Run tests** - Execute test suites
3. ✅ **Run the application** - Start dev server
4. ✅ **View database** - Use Prisma Studio
5. ✅ **Create NEW files** - Add new features in new files
6. ✅ **Modify UI components** - If they don't contain business logic
7. ✅ **Update styles** - CSS/Tailwind changes
8. ✅ **Fix typos in comments** - Non-code documentation
9. ✅ **Add console.logs** - Temporary debugging (must remove before commit)

### Example - Adding New Feature (OK):
```bash
# Create NEW files (allowed)
touch app/lib/analytics/tracking.ts
touch app/actions/analytics/track-event.ts
touch app/app/[locale]/(dashboard)/analytics/page.tsx

# Don't modify locked business logic!
# ❌ vim app/lib/rbac/permissions.ts  # LOCKED!
```

---

## 🛡️ Lock Enforcement Rules

### Rule 1: Zero-Edit Policy
- ❌ **Never** edit locked files without explicit permission
- ❌ **Never** delete locked files
- ❌ **Never** rename locked files
- ❌ **Never** move locked files to different directories
- ❌ **Never** comment out code in locked files

### Rule 2: Explicit Permission Protocol
1. Must ask: "Can I edit [exact filename] to [specific change]?"
2. Must wait for YES/NO response
3. Must state clear business reason
4. Must commit with message: "Edit approved: [reason]"

### Rule 3: Minimal Change Principle
Even with permission:
- ✅ Change ONLY what was approved
- ✅ Keep changes minimal
- ✅ Maintain backward compatibility
- ✅ Run full test suite after changes
- ✅ Update documentation if behavior changes

### Rule 4: Emergency Override
Only for **production-down emergencies**:
1. Document the emergency in `docs/bugs/bugs-current.md`
2. Make minimal fix to restore service
3. Immediately notify team
4. Create follow-up task for proper fix
5. Log change in this file

---

## 📊 Lock Statistics

| Category | Files Locked | Lines Protected | Criticality |
|----------|--------------|-----------------|-------------|
| **Database** | 5+ | 2,000+ | 🔴 Critical |
| **Auth & Security** | 8+ | 1,500+ | 🔴 Critical |
| **RBAC** | 6+ | 1,200+ | 🔴 Critical |
| **Org Hierarchy** | 4+ | 800+ | 🔴 Critical |
| **Cities & Geo** | 6+ | 3,000+ | 🟠 High |
| **User Management** | 6+ | 1,000+ | 🟠 High |
| **Data Integrity** | 5+ | 1,500+ | 🔴 Critical |
| **i18n & RTL** | 5+ | 5,000+ | 🟡 Medium |
| **Server Actions** | 20+ | 3,000+ | 🔴 Critical |
| **API Routes** | 15+ | 2,000+ | 🔴 Critical |
| **Configuration** | 5+ | 500+ | 🔴 Critical |
| **Tests** | 35+ | 2,500+ | 🟠 High |
| **Responsive Tests** | 15 | 2,500+ | ✅ **UNLOCKED** |
| **Documentation** | 10+ | 10,000+ | 🟡 Medium |

**Total Locked**: 135+ files (150 - 15 responsive files)
**Total Lines**: 34,000+ lines (36,500 - 2,500 responsive)
**Protection Level**: MAXIMUM
**Unlocked for Work**: Responsive/Mobile testing (15 files)

---

## 🚨 High-Risk Files (Extra Protection)

### Tier 1: NEVER TOUCH (Without Very Strong Reason)
```
app/prisma/schema.prisma .................... 🔴 CRITICAL
app/auth.config.ts .......................... 🔴 CRITICAL
app/middleware.ts ........................... 🔴 CRITICAL
app/lib/rbac/permissions.ts ................. 🔴 CRITICAL
app/lib/rbac/guards.ts ...................... 🔴 CRITICAL
app/lib/hierarchy/city-isolation.ts ......... 🔴 CRITICAL
```

### Tier 2: High Risk (Require Strong Justification)
```
app/lib/rbac/roles.ts ....................... 🟠 HIGH RISK
app/lib/activists/supervisor-assignment.ts .. 🟠 HIGH RISK
app/scripts/check-worker-supervisor-integrity.ts .. 🟠 HIGH RISK
app/actions/activists/*.ts .................. 🟠 HIGH RISK
app/api/activists/*.ts ...................... 🟠 HIGH RISK
```

### Tier 3: Moderate Risk (Require Justification)
```
app/lib/theme/theme.ts ...................... 🟡 MODERATE
app/messages/he.json ........................ 🟡 MODERATE
app/lib/cities/*.ts ......................... 🟡 MODERATE
```

---

## 📝 Change Log (Post-Lock)

| Date | File | Change | Approved By | Reason | Risk Level |
|------|------|--------|-------------|--------|-----------|
| 2025-12-17 | ALL | Initial Lock | System | Production-ready | - |
| - | - | - | - | - | - |

---

## 🔍 How to Check If File Is Locked

### Option 1: Search This File
```bash
grep "your-file.ts" LOCKED_SYSTEM_FILES.md
```

### Option 2: Check Directory
If file is in one of these directories, it's locked:
- `app/prisma/`
- `app/lib/rbac/`
- `app/lib/hierarchy/`
- `app/lib/auth-helpers.ts`
- `app/actions/`
- `app/api/`
- `app/tests/e2e/`
- `docs/`

### Option 3: Ask First
When in doubt: **Ask before editing!**

---

## 💡 Development Guidelines

### For New Features:
1. ✅ Create NEW files instead of modifying locked ones
2. ✅ Import from locked files (reading is OK)
3. ✅ Extend existing logic without changing it
4. ✅ Add new API routes instead of modifying existing
5. ✅ Create new components instead of changing core ones

### For Bug Fixes:
1. ✅ **First**: Try to fix in non-locked code
2. ✅ **If locked file needed**: Request permission with bug details
3. ✅ **After fix**: Add entry to `docs/bugs/bugs-current.md`
4. ✅ **Prevention rule**: Document how to avoid this pattern

### For Refactoring:
1. ❌ **Don't refactor locked files** without strong business reason
2. ✅ **If absolutely needed**: Explain why current code is problematic
3. ✅ **Provide**: Before/after comparison
4. ✅ **Prove**: Changes maintain exact same behavior (tests must pass)

---

## 🎯 Summary

### 🔒 LOCKED: 150+ Core System Files

**Categories**:
- ✅ Database schema & migrations
- ✅ Authentication & security
- ✅ RBAC & permissions
- ✅ Organization hierarchy
- ✅ Cities & neighborhoods
- ✅ User & activist management
- ✅ Data integrity scripts
- ✅ i18n & RTL configuration
- ✅ Server actions & API routes
- ✅ Configuration files
- ✅ Test infrastructure
- ✅ Critical documentation

**Protection Level**: MAXIMUM
**Lines Protected**: 36,500+
**Risk Mitigation**: High

---

## 📞 Quick Reference

### ✅ YES (No Permission Needed):
- Read any file
- Run tests
- Run dev server
- Create NEW files
- Modify UI styles
- Fix typos in comments

### ⚠️ ASK FIRST:
- Edit any file in `app/lib/`
- Edit any file in `app/actions/`
- Edit any file in `app/api/`
- Edit `app/prisma/schema.prisma`
- Edit configuration files
- Edit test files

### ❌ NEVER (Emergency Only):
- Delete locked files
- Rename locked files
- Move locked files
- Comment out locked code
- Bypass RBAC checks
- Disable data validation

---

**🔒 System is locked for your protection and data integrity.**
**💡 When in doubt, ask before editing!**
**🛡️ These locks prevent accidental data corruption and security vulnerabilities.**

---

*Last Updated: 2025-12-17*
*Protection Level: MAXIMUM*
*Status: Enforced*
*Scope: ALL Core System Logic*
