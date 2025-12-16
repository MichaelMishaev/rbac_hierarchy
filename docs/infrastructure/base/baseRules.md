# Development Protocols - Universal Quick Reference

**Purpose:** Core workflow patterns for consistent, high-quality development across all projects.
**Audience:** Claude Code, AI assistants, and developers
**Philosophy:** Minimal diffs, regression-proof bug fixes, clear communication

---

## 🔄 Standard Task Flow

Follow this sequence for every task:

1. **Read files FIRST** - Never guess file contents, APIs, or schemas
2. **Provide short plan** - Bullet points only, no code yet
3. **Implement minimal diffs** - Change only what's necessary for the task
4. **Run smallest relevant tests** - Expand test coverage only if risk is high
5. **Summarize results** - Files touched + why + commands run + results

---

## 🐛 Bug Fix Protocol (Regression-Proof)

Every bug fix MUST include these 5 steps:

1. **Root Cause Identification** (1-3 bullets explaining WHY it happened)
2. **Regression Test** - Write test that FAILS before fix, PASSES after
3. **Minimal Fix** - Change only what's needed to fix the bug
4. **Run Relevant Tests** - Execute tests affected by the change
5. **Document Prevention** - Add entry to project's bug log (e.g., `docs/bugs.md`, `docs/localDev/bugs.md`):
   - Bug description + reproduction steps
   - Root cause analysis
   - **Prevention rule** (how to avoid this pattern in future)

**Output:** Root cause + failing test + diff + test results + bug log entry

---

## ⚠️ Stop Conditions (When to Ask)

STOP and ask the user before proceeding if:

- ❌ Required file/command doesn't exist
- ❌ Package versions or APIs are uncertain
- ❌ Schema change is implied but not explicitly specified
- ❌ More than 3 files need large edits (high regression risk)
- ❌ Request conflicts with existing decisions in project documentation

**Never guess or hallucinate.** When uncertain, ask first.

---

## 📝 Output Format

When showing code changes:

- ✅ **PREFERRED:** Show patch/diff format
- ✅ **ACCEPTABLE:** Show only changed functions/blocks (not entire files)
- ❌ **AVOID:** Showing entire files (wastes context)
- ✅ **ALWAYS:** List commands run + results

---

## 🚫 Never Do

- ❌ Invent APIs, packages, fields, or file paths (ask if unsure)
- ❌ Refactor code silently (only if requested or required for fix)
- ❌ Skip regression tests for bug fixes
- ❌ Make breaking changes without updating tests and docs
- ❌ Show entire files in responses (use diffs/patches)
- ❌ Skip documentation for bugs (must update bug log)
- ❌ Modify unrelated code (stay within task scope)

---

## ✅ Quality Checklist

Good work includes:

- ✅ Minimal diff (only necessary changes)
- ✅ Tests added for new behavior or bugs
- ✅ No unrelated formatting churn
- ✅ Clear root cause and prevention note (for bugs)
- ✅ Output includes: files touched + why + verification commands

---

## 🧪 Testing Protocol

### For Every Feature:
- **Unit tests:** Business logic and functions
- **Integration tests:** API endpoints + database interactions (if applicable)
- **E2E tests:** Critical user flows only (not every feature)

### For Every Bug:
- **Regression test FIRST** (must fail before fix)
- **Verify test passes** after implementation
- **Document in bug log** with prevention rule

---

## 📏 Code Quality Standards

- **File size:** Target 200-300 lines. Split by responsibility if larger.
- **Modules:** Prefer adding a small module over editing a large file
- **Dependencies:** Business logic should not import infrastructure directly (dependency inversion)
- **Breaking changes:** Update tests, docs, and migration guides
- **Type safety:** Use strict type checking where available (TypeScript, Python type hints, etc.)

---

## 🤖 Anti-Regression Safety Nets

**Note:** Adapt these to your project's tech stack and constraints.

### Tier 1: Mandatory (Every Change)
- ✅ **Strict type checking** enforced (catch 60-70% of bugs at compile time)
- ✅ **Pre-commit hooks** block bad code (lint + type-check + fast tests)
- ✅ **Critical tests** run on every PR (authentication, authorization, data integrity)
- ✅ **Type-check passes** before commit

### Tier 2: High-Value (Run on PR)
- ✅ **Visual regression tests** (screenshot comparison for UI changes)
- ✅ **Schema validation** on all API boundaries (runtime contract enforcement)
- ✅ **Database constraints** enforce business rules (last line of defense)
- ✅ **CI/CD pipeline** runs tests automatically

### Tier 3: Advanced (Periodic)
- ✅ **Mutation testing** on critical modules (verify test quality)
- ✅ **Error monitoring** in development (catch errors immediately)
- ✅ **Manual verification** for security-critical changes

---

## 🛡️ AI Assistant Protocol (Claude Code / Copilot / etc.)

**When AI writes code, it MUST:**

### Before Writing Code:
1. ✅ READ existing implementation first (no guessing)
2. ✅ IDENTIFY affected tests
3. ✅ PROPOSE plan in bullet points (wait for approval if complex)

### After Writing Code:
1. ✅ RUN affected tests and SHOW results
2. ✅ RUN type-checker (e.g., `npm run type-check`, `mypy`, etc.)
3. ✅ RUN linter (e.g., `npm run lint`, `flake8`, etc.)
4. ✅ VERIFY git diff (no unintended changes)
5. ✅ LIST files touched + why

### For Security/Critical Changes:
1. ✅ WRITE regression test FIRST (fails before change)
2. ✅ IMPLEMENT change
3. ✅ VERIFY test now PASSES
4. ✅ RUN full critical test suite
5. ✅ DOCUMENT in bug log if fixing a bug

### For UI Changes:
1. ✅ VERIFY layout across target devices/browsers
2. ✅ VERIFY responsive design (mobile + desktop if applicable)
3. ✅ VERIFY accessibility (ARIA labels, keyboard navigation, etc.)
4. ✅ VERIFY internationalization (if project supports multiple locales)

---

## 🧪 QA Automation Principles

**Philosophy:** Stop wasting time on manual QA. Catch regressions automatically.

### Core Principles

1. **Test Pyramid Strategy (2025 Standards)**
   - **Fast unit tests** (80%+ coverage) - Business logic, pure functions, utilities
   - **Integration tests** (60%+ coverage) - API endpoints, database queries, service interactions
   - **E2E tests** (10-20% coverage) - Critical user journeys only (authentication, checkout, data submission)

2. **Shift Left Testing**
   - Catch bugs as early as possible (compile time > build time > pre-commit > CI > production)
   - Pre-commit hooks block bad code before it enters the codebase
   - CI/CD catches integration issues before merge

3. **Critical Path Coverage**
   - Identify 10-15 critical scenarios that MUST work (authentication, authorization, data integrity)
   - Write E2E tests for these scenarios first
   - Never skip regression tests for bugs

4. **Contract-First APIs**
   - Define API contracts with schema validation (Zod, JSON Schema, OpenAPI)
   - Validate responses at runtime (catch breaking changes early)
   - Generate types from schemas (single source of truth)

5. **Visual Regression Testing**
   - Screenshot comparison for UI changes (Percy, Playwright screenshots, BackstopJS)
   - Catch layout breaks automatically (especially important for RTL/LTR, responsive design)
   - Require explicit approval for visual changes

6. **Database as Last Line of Defense**
   - Use DB constraints to enforce business rules (CHECK, FOREIGN KEY, UNIQUE)
   - Database should refuse invalid data even if application code is buggy
   - Test constraint violations (they should fail gracefully)

---

## 🔄 Regression Testing Strategy (2025 Best Practices)

**Goal:** Catch regressions in unchanged code when making changes. Not all regressions are obvious - this strategy prevents silent breakage.

### 1. Risk-Based Test Prioritization

Don't run all tests equally - prioritize by risk and impact:

**Tier 1 (Critical) - Always Run:**
- Authentication & authorization flows
- Payment/transaction processing
- Data integrity (creation, updates, deletions)
- Security-critical operations
- API contract compliance
- **When:** On every PR, pre-merge, production deploy

**Tier 2 (High Priority) - Scheduled:**
- Feature-specific integration tests
- UI component regression tests
- Cross-module integration
- Performance benchmarks
- **When:** Nightly builds, weekly regression suite

**Tier 3 (Nice-to-Have) - Optional:**
- Edge case scenarios
- Exploratory test suites
- Non-critical UI variants
- **When:** Manual runs, quarterly full regression

**Implementation:**
```yaml
# Example: GitHub Actions workflow
name: Regression Tests
on:
  pull_request:
    paths: ['src/**', 'tests/**']
jobs:
  tier1-critical:
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- --testPathPattern=critical

  tier2-nightly:
    if: github.event_name == 'schedule'
    runs-on: ubuntu-latest
    steps:
      - run: npm test -- --testPathPattern=integration
```

### 2. CI/CD Automation Rules

**All regression tests MUST be automated** - human oversight is unreliable.

**Required CI Stages:**

| Stage | When | Tests Run | Pass Threshold |
|-------|------|-----------|----------------|
| **Pre-commit Hook** | On `git commit` | Lint + Type-check + Fast unit tests | 100% pass |
| **Pull Request** | On PR open/update | Tier 1 critical tests | 100% pass |
| **Pre-merge** | Before merge to main | Tier 1 + affected Tier 2 tests | 100% pass |
| **Post-merge** | After merge to main | Full Tier 1 + Tier 2 suite | 95%+ pass |
| **Nightly** | Scheduled (daily) | All tiers + mutation tests | 90%+ pass |

**Example: Pre-commit hook** (`.husky/pre-commit`):
```bash
#!/bin/sh
# Run fast tests before commit
npm run lint && npm run type-check && npm run test:unit:fast
```

**Example: PR automation** (`.github/workflows/pr-checks.yml`):
```yaml
name: PR Checks
on:
  pull_request:
    types: [opened, synchronize]
jobs:
  critical-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:tier1
      - run: npm run test:coverage -- --min=80
```

### 3. Shift-Left Validation (Catch Early)

The earlier you catch regressions, the cheaper they are to fix:

| Stage | Cost to Fix | Detection Method | Example |
|-------|-------------|------------------|---------|
| **Compile Time** | $1 | Type checking, linting | TypeScript strict mode catches missing null checks |
| **Pre-commit** | $10 | Fast unit tests, type-check | Husky hook blocks commit with failing test |
| **PR Build** | $100 | CI integration tests | GitHub Actions fails PR with broken API contract |
| **Staging** | $1,000 | E2E tests, manual QA | Playwright catches login flow regression |
| **Production** | $10,000+ | User reports, monitoring | Sentry alerts about payment failure spike |

**Shift-left checklist:**
- [ ] Enable TypeScript/MyPy strict mode (catches types at compile time)
- [ ] Add pre-commit hooks for lint + fast tests (blocks bad commits)
- [ ] Run Tier 1 tests on every PR (catches integration issues)
- [ ] Require PR approval + CI green before merge (enforces quality gate)
- [ ] Set up staging environment with E2E tests (final validation before production)

### 4. Test Coverage Goals

**Global coverage targets** (applies to entire codebase):
- **Unit tests:** 80%+ line coverage
- **Integration tests:** 60%+ coverage of API endpoints and database queries
- **E2E tests:** 10-20% coverage of critical user journeys (don't over-invest in E2E)

**Critical module targets** (authentication, payments, data integrity):
- **Unit tests:** 90%+ line coverage
- **Branch coverage:** 85%+ (test all if/else paths)
- **Mutation score:** 80%+ (tests actually catch bugs when code is mutated)

**Example: Coverage enforcement in CI:**
```json
// package.json
{
  "scripts": {
    "test:coverage": "jest --coverage --coverageThreshold='{\"global\":{\"lines\":80,\"branches\":75}}'"
  }
}
```

**Example: Module-specific thresholds:**
```javascript
// jest.config.js
module.exports = {
  coverageThreshold: {
    global: { lines: 80, branches: 75 },
    './src/auth/**/*.ts': { lines: 90, branches: 85 },
    './src/payments/**/*.ts': { lines: 90, branches: 85 }
  }
}
```

### 5. Test Reporting & Diagnostics

**When a regression test fails in CI, you need:**
- ✅ **Test name** - Which test failed?
- ✅ **Error message** - Why did it fail?
- ✅ **Stack trace** - Where in the code?
- ✅ **Screenshots/videos** (UI tests) - What did the user see?
- ✅ **Logs** - What was the application state?
- ✅ **Failed request/response** (API tests) - What data was sent/received?

**Required CI test report artifacts:**
```yaml
# GitHub Actions example
- name: Run E2E tests
  run: npx playwright test
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: test-results
    path: |
      playwright-report/
      test-results/
      screenshots/
      videos/
```

**Example: Rich test failure output** (Playwright):
```typescript
test('checkout flow works', async ({ page }) => {
  await page.goto('/checkout');

  // Automatic screenshot on failure
  await expect(page.locator('[data-testid="payment-form"]')).toBeVisible();

  // Automatic trace recording
  await page.fill('[name="cardNumber"]', '4242424242424242');
  await page.click('[data-testid="submit-payment"]');

  // Error includes screenshot + trace + logs
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### 6. Branch Protection & Code Quality Gates

**Main branch MUST be protected** - no direct commits allowed.

**Required branch protection rules:**
- ✅ Require pull request before merging
- ✅ Require status checks to pass (CI tests green)
- ✅ Require code review approval (1+ reviewer)
- ✅ Dismiss stale reviews on new commits
- ✅ Require linear history (no merge commits)

**Example: GitHub branch protection settings:**
```yaml
# .github/branch-protection.yml
rules:
  - pattern: main
    required_status_checks:
      - test-tier1
      - lint
      - type-check
    required_reviews: 1
    dismiss_stale_reviews: true
    require_linear_history: true
```

**Atomic commit guidelines:**
- Each commit should be self-contained (buildable, testable)
- Commit message format: `type(scope): description` (e.g., `fix(auth): handle expired tokens`)
- Reference issue/ticket numbers in commits
- No "WIP" or "fix typo" commits on main branch (squash before merge)

---

### Implementation Checklist

#### Week 1: Foundation (Blocking)
- [ ] **Enable strict type checking** (TypeScript strict mode, Python mypy, etc.)
- [ ] **Set up pre-commit hooks** (lint + type-check + fast tests)
- [ ] **Document 10 critical test scenarios** (what MUST work on every PR)

#### Week 2: Automated Testing
- [ ] **Write E2E tests for critical scenarios** (Playwright, Cypress, Selenium)
- [ ] **Set up CI/CD pipeline** (GitHub Actions, GitLab CI, CircleCI)
- [ ] **Add visual regression tests** (Percy, Playwright screenshots)

#### Week 3: Runtime Safety
- [ ] **Add schema validation to APIs** (Zod, Joi, AJV, Pydantic)
- [ ] **Add database constraints** (CHECK constraints, foreign keys)
- [ ] **Set up error monitoring** (Sentry, Rollbar, Bugsnag)

#### Week 4: Advanced
- [ ] **Set up mutation testing** (Stryker, PITest - monthly check, target 80%+ mutation score)
- [ ] **Track test coverage** (Jest, NYC, Coverage.py - target 80%+ unit, 60%+ integration, 90%+ critical modules)
- [ ] **Implement differential testing** (for refactors - old vs new implementation)
- [ ] **Configure branch protection rules** (require CI pass + code review before merge)
- [ ] **Set up test reporting** (artifacts, screenshots, traces for failed tests)

### Testing Patterns

#### Pattern 1: Red-Green-Refactor for Bugs
```markdown
1. Write failing test that reproduces the bug
2. Run test → verify it FAILS
3. Implement minimal fix
4. Run test → verify it PASSES
5. Run full test suite → verify no regressions
6. Document in bug log with prevention rule
```

#### Pattern 2: Contract Testing for APIs
```typescript
// Define API contract
const UserResponseSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  role: z.enum(['ADMIN', 'USER'])
});

// Validate in production
export async function GET(req: Request) {
  const data = await getUser();

  // This will throw if API shape changes
  const validated = UserResponseSchema.parse(data);
  return Response.json(validated);
}
```

#### Pattern 3: Critical Scenarios Testing
```markdown
## Critical Scenarios (Example - adapt to your project)

1. **Authentication works** (login, logout, session persistence)
2. **Authorization enforced** (users can't access other users' data)
3. **Data integrity maintained** (no orphaned records, FK constraints work)
4. **API contracts respected** (breaking changes caught by schema validation)
5. **UI renders correctly** (visual regression tests pass)
```

#### Pattern 4: Mutation Testing (Monthly)
```bash
# Verify test quality by mutating code
# Tests should catch mutated code (high mutation score = good tests)
npx stryker run --mutate "src/critical-module/**/*.ts"

# Target: 80%+ mutation score on critical modules
```

#### Pattern 5: Differential Testing for Refactors
```typescript
// When refactoring complex logic, ensure same output
test('refactored logic produces same result', async () => {
  const testCases = [
    { input: 'A', expected: 'result1' },
    { input: 'B', expected: 'result2' }
  ];

  for (const testCase of testCases) {
    const oldResult = await oldImplementation(testCase.input);
    const newResult = await newImplementation(testCase.input);

    expect(newResult).toEqual(oldResult);
  }
});
```

### Success Metrics

**After implementing QA automation:**
- ✅ **95%+ of regressions caught before merge** (via CI/CD)
- ✅ **5 min feedback loop** (down from hours of manual testing)
- ✅ **Zero manual QA for routine changes** (only exploratory testing for new features)
- ✅ **Confidence in deployments** (CI green = safe to deploy)
- ✅ **Sleep well** (monitoring catches production errors immediately)

### Common Pitfalls to Avoid

❌ **Don't:** Write tests after code is merged (defeats the purpose)
✅ **Do:** Write tests before or during development

❌ **Don't:** Test everything (wastes time, slows CI)
✅ **Do:** Focus on critical paths (10-15 scenarios cover 80% of value)

❌ **Don't:** Skip visual regression tests (layout breaks are common)
✅ **Do:** Screenshot critical pages (catches unexpected visual changes)

❌ **Don't:** Rely only on unit tests (integration bugs slip through)
✅ **Do:** Use test pyramid (80%+ unit coverage, 60%+ integration coverage, 10-20% E2E coverage)

❌ **Don't:** Ignore flaky tests (they erode trust)
✅ **Do:** Fix or delete flaky tests immediately

❌ **Don't:** Skip error monitoring (you'll find out from users)
✅ **Do:** Set up Sentry/Rollbar on day 1 (catch errors before users report)

### Tool Recommendations (Language-Agnostic)

**Type Safety:**
- TypeScript (JavaScript), MyPy (Python), Flow (deprecated), TypeScript ESLint

**Pre-commit Hooks:**
- Husky + lint-staged (JS/TS), pre-commit (Python), Lefthook (Go), Overcommit (Ruby)

**E2E Testing:**
- Playwright (recommended), Cypress, Selenium, TestCafe, Puppeteer

**Visual Regression:**
- Percy (free tier), Playwright screenshots, BackstopJS, Chromatic

**Schema Validation:**
- Zod (TypeScript), Joi (JS), AJV (JSON Schema), Pydantic (Python), JSON Schema

**Error Monitoring:**
- Sentry (recommended - generous free tier), Rollbar, Bugsnag, Honeybadger

**CI/CD:**
- GitHub Actions (free for public repos), GitLab CI, CircleCI, Travis CI

**Mutation Testing:**
- Stryker (JS/TS), PITest (Java), Mutmut (Python)

---

## 📋 Task Execution Template

Use this template when executing tasks:

```markdown
## Task: [Brief Description]

### 1. Analysis
- Read files: [list]
- Affected components: [list]
- Risk level: Low/Medium/High

### 2. Plan
- [ ] Step 1
- [ ] Step 2
- [ ] Step 3

### 3. Implementation
Files modified:
- `path/to/file1.ext` - [reason]
- `path/to/file2.ext` - [reason]

### 4. Verification
Commands run:
- `npm test` - ✅ Passed (45 tests)
- `npm run type-check` - ✅ No errors
- `npm run lint` - ✅ No issues

### 5. Summary
[1-2 sentence summary of what was done and why]
```

---

## 🎯 Project-Specific Adaptations

**This file is generic.** For project-specific protocols:

1. Create a `CLAUDE.md` or similar file in your project root
2. Reference this baseRules.md for universal patterns
3. Add project-specific:
   - Architecture decisions
   - Tech stack details
   - Security requirements
   - Domain-specific testing needs
   - Deployment procedures
   - Bug log location (e.g., `docs/bugs.md`)

---

## 📖 Common Bug Log Locations

Choose one that fits your project structure:

- `docs/bugs.md` (simple projects)
- `docs/localDev/bugs.md` (development-specific)
- `docs/infrastructure/bugs.md` (infrastructure/ops focus)
- `.github/BUG_LOG.md` (GitHub-centric projects)
- `BUGS.md` (root level, quick access)

**Format example:**
```markdown
## [YYYY-MM-DD] Bug Title

**Problem:** Description of the bug

**Root Cause:** Why it happened

**Solution:** What was changed

**Prevention:** Rule to avoid this in future

**Files Changed:** List of modified files
```

---

**End of Quick Reference** - For project-specific architecture, see project's main documentation file (CLAUDE.md, README.md, etc.)
