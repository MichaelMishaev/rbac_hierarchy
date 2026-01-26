# AI Execution Checklist (Mandatory for Every Task)

**Purpose:** 1-page enforcement mode for AI assistants (Claude Code, Copilot, etc.)
**Rule:** Check this list BEFORE, DURING, and AFTER every task
**Why:** Prevents regressions, ensures quality, enforces best practices

---

## 🚦 BEFORE Starting (Classification Phase)

### Step 1: Read & Analyze
- [ ] **Read relevant files** - Never guess contents, APIs, schemas
- [ ] **Identify affected components** - Services, queries, UI, DB
- [ ] **Check project documentation** - CLAUDE.md, README, architecture docs

### Step 2: Classify Risk Level

**Choose ONE:**

| 🔹 **Low Risk** | 🔸 **Medium Risk** | 🔴 **High Risk** |
|-----------------|-------------------|------------------|
| Pure functions | Services/queries | Auth/RBAC |
| Constants | UI components | Data isolation |
| Helpers | Non-critical APIs | Lifecycle states |
| Docs/comments | Non-sensitive data | Payments/transactions |
| **Test:** Unit only | **Test:** Unit + integration | **Test:** Full Tier 1 |
| **Time:** ~1 min | **Time:** ~5 min | **Time:** ~15 min |

### Step 3: Identify Invariants (High Risk Only)

**If 🔴 High Risk, check affected invariants:**

- [ ] Authentication/Authorization
- [ ] Data isolation (multi-tenant, RBAC, user-scoped)
- [ ] Lifecycle state management (soft deletes, workflows)
- [ ] Data integrity constraints (required fields, foreign keys)
- [ ] Audit logging (mutations tracked)
- [ ] API contracts (response shapes, breaking changes)

### Step 4: Define Behavior Locks

**List 3-5 behaviors that MUST NOT change:**

1. [Example: User list sorted by creation date DESC]
2. [Example: Soft-deleted records excluded from queries]
3. [Example: City Coordinator can only access their city]
4. [Example: Audit logs capture all deletions]
5. [Example: API returns 401 for unauthenticated requests]

### Step 5: Stop Conditions Check

**STOP and ask user if:**

- ❌ Required file/command doesn't exist
- ❌ Package versions or APIs are uncertain
- ❌ Schema change implied but not specified
- ❌ More than 3 files need large edits (regression risk)
- ❌ Request conflicts with project documentation

---

## 🔨 DURING Implementation

### Code Changes
- [ ] **Minimal diffs only** - Change only what's necessary
- [ ] **No silent refactors** - Only refactor if requested or required
- [ ] **No unrelated changes** - Stay within task scope
- [ ] **Preserve formatting** - No unnecessary whitespace/style changes

### Test Strategy (Based on Risk Level)

**🔹 Low Risk:**
- [ ] Write unit tests for changed functions
- [ ] Run fast unit test suite

**🔸 Medium Risk:**
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Run integration test suite

**🔴 High Risk:**
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Write explicit invariant tests
- [ ] Add behavior lock tests (3-5 from Step 4)
- [ ] Add negative tests (unauthorized access, invalid input)
- [ ] Run full Tier 1 critical test suite

### Required Test Types

**For ALL changes:**
- [ ] **Feature tests** - New functionality works correctly

**For 🔴 High Risk changes:**
- [ ] **Behavior lock tests** - Unchanged behavior remains stable
- [ ] **Negative tests** - Unauthorized operations blocked
- [ ] **Invariant tests** - System guarantees still hold

### Negative Test Checklist (High Risk)

If touching auth, RBAC, or data isolation:

- [ ] Unauthenticated access blocked
- [ ] Unauthorized access rejected (wrong role/tenant)
- [ ] Invalid input rejected with clear errors
- [ ] Boundary violations caught (null, empty, out-of-range)
- [ ] Invalid state transitions blocked

---

## ✅ AFTER Implementation (Verification Phase)

### Step 1: Run Tests
- [ ] **Type-check** - `npm run type-check` (or equivalent)
- [ ] **Lint** - `npm run lint` (or equivalent)
- [ ] **Unit tests** - Fast suite (~1 min)
- [ ] **Integration tests** - If Medium/High risk (~5 min)
- [ ] **Tier 1 critical** - If High risk (~15 min)

### Step 2: Verify Git Diff
- [ ] **Review changes** - `git diff` shows only intended changes
- [ ] **No unrelated edits** - No formatting, whitespace, or style changes
- [ ] **No commented code** - Remove debug logs, commented lines

### Step 3: Bug Fix Protocol (If Fixing Bug)

**If this task is a bug fix, you MUST:**

1. [ ] **Root cause identified** (1-3 bullets explaining WHY)
2. [ ] **Regression test written** (FAILS before fix, PASSES after)
3. [ ] **Minimal fix applied** (only what's needed)
4. [ ] **Tests run** (affected tests pass)
5. [ ] **Bug log updated** (docs/bugs.md or project-specific location)

**Bug log entry format:**
```markdown
## [YYYY-MM-DD] Bug Title

**Problem:** [Description + reproduction steps]
**Root Cause:** [Why it happened]
**Solution:** [What was changed]
**Prevention:** [Rule to avoid this in future]
**Files Changed:** [List of modified files]
```

### Step 4: Output to User

**Provide clear summary:**

```markdown
## Summary

**Risk Level:** 🔹 Low / 🔸 Medium / 🔴 High

**Files Modified:**
- `path/to/file.ext` - [reason]

**Tests Added:**
- [test description]

**Commands Run:**
- `npm run type-check` - ✅ No errors
- `npm run lint` - ✅ No issues
- `npm test` - ✅ Passed (45 tests)

**Behavior Locks Verified:**
- [behavior] - ✅ Unchanged
- [behavior] - ✅ Unchanged

**Result:** [1-2 sentence summary]
```

---

## 🎯 Quick Reference: What to Test

| Change Type | Feature Test | Behavior Lock | Negative Test | Invariant Test |
|-------------|--------------|---------------|---------------|----------------|
| **New feature** | ✅ Required | ⚠️ If affects existing | ✅ For auth/RBAC | ❌ N/A |
| **Bug fix** | ✅ Regression test | ✅ Verify no side effects | ✅ If security bug | ⚠️ If invariant violated |
| **Refactor** | ⚠️ Existing tests | ✅ All behavior locked | ⚠️ If touches RBAC | ⚠️ If touches invariants |
| **Auth/RBAC change** | ✅ Required | ✅ All existing permissions | ✅ **MANDATORY** | ✅ **MANDATORY** |
| **Data isolation** | ✅ Required | ✅ Existing filters | ✅ **MANDATORY** | ✅ **MANDATORY** |
| **Lifecycle/state** | ✅ Required | ✅ Valid transitions | ✅ Invalid transitions | ✅ State integrity |

---

## 🛡️ Runtime Guards (High Risk Only)

**For 🔴 High Risk changes, consider adding runtime guards:**

```typescript
// Example: Data integrity guard
if (!result.requiredField) {
  logger.error('INVARIANT VIOLATION: Missing required field', { data: result });
  throw new Error('Data integrity violation');
}
```

**When to add guards:**
- [ ] Data integrity violations possible
- [ ] Tenant isolation could break
- [ ] Invalid state transitions could occur
- [ ] Authorization checks could be bypassed

---

## ❌ Never Do (Hard Rules)

- ❌ **Guess file contents** - Always read first
- ❌ **Skip tests** - Test strategy is mandatory
- ❌ **Silent refactors** - Only if requested or required
- ❌ **Show entire files** - Use diffs/patches
- ❌ **Skip bug log** - Every bug fix MUST be documented
- ❌ **Skip negative tests** - Required for auth/RBAC/isolation
- ❌ **Skip behavior locks** - Required for high-risk changes

---

## 🏆 Success Criteria

**A task is complete when:**

✅ Risk level classified and justified
✅ Invariants identified (if high risk)
✅ Behavior locks defined and tested
✅ Appropriate tests written and passing
✅ Negative tests added (if auth/RBAC/isolation)
✅ No unintended changes in git diff
✅ Bug log updated (if bug fix)
✅ User informed with clear summary

---

## 📚 Reference Documents

**For detailed patterns, see:**
- `baseRules.md` - Full development protocols (canonical truth)
- Project's `CLAUDE.md` - Project-specific architecture and rules
- Project's `INVARIANTS.md` - Critical invariants for this project
- Project's bug log - Historical bugs and prevention rules

---

**Last Updated:** 2025-12-16
**Version:** 1.0 (enforces baseRules.md v2.0 with 4 new patterns)
