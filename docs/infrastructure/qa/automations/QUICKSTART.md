# QA Automation - QUICKSTART (Start NOW)

**You're done with manual QA. Let's automate everything.**

---

## ¡ Start Here (15 Minutes)

### 1. Enable TypeScript Strict Mode (5 min)

```bash
cd app
```

Edit `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

Fix all errors:
```bash
npx tsc --noEmit
```

**Why:** Catches 60-70% of bugs at compile time.

---

### 2. Install Pre-commit Hooks (5 min)

```bash
cd app
npm install -D husky lint-staged
npx husky init
```

Create `.husky/pre-commit`:
```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run lint
npm run type-check
```

Add to `package.json`:
```json
{
  "scripts": {
    "type-check": "tsc --noEmit",
    "prepare": "husky"
  }
}
```

**Test it:** Try committing bad code - it should be blocked.

**Why:** Prevents you from committing broken code.

---

### 3. Document Critical Test Scenarios (5 min)

Create `docs/infrastructure/qa/critical-test-scenarios.md`:

```markdown
# Critical Test Scenarios

1. SuperAdmin sees all cities
2. Area Manager CANNOT see other areas
3. City Coordinator CANNOT see other cities
4. Activist Coordinator CANNOT see unassigned neighborhoods
5. Cross-city queries return empty (not error)
6. Login works for all roles
7. Session persists after refresh
8. Unauthorized access returns 403
9. Hebrew RTL renders correctly
10. Navigation shows role-appropriate tabs
```

**Why:** Clear definition of what MUST work.

---

## =€ Next Steps (This Week)

### Week 1: Critical E2E Tests

**File:** `tests/e2e/critical/rbac-boundaries.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('City Coordinator CANNOT see other cities', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="email"]', 'city.coordinator@telaviv.test');
  await page.fill('[data-testid="password"]', 'password123');
  await page.click('[data-testid="login-button"]');

  // Cities tab should NOT be visible
  const citiesTab = page.locator('[data-testid="nav-cities"]');
  await expect(citiesTab).not.toBeVisible();

  // Direct access blocked
  await page.goto('/cities');
  await expect(page.locator('text=Access Denied')).toBeVisible();
});
```

Run:
```bash
cd app
npm run test:e2e -- tests/e2e/critical/
```

---

### Week 2: GitHub Actions CI

Create `.github/workflows/ci.yml` - **Full code in automationPlan.md**

Quick version:
```yaml
name: CI
on: [pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:e2e
```

**Result:** Tests run automatically on every PR.

---

### Week 3: Visual Regression Testing

```bash
cd app
npm install -D @percy/cli @percy/playwright
```

```typescript
import percySnapshot from '@percy/playwright';

test('Dashboard RTL', async ({ page }) => {
  await page.goto('/dashboard');
  await percySnapshot(page, 'Dashboard - RTL');
});
```

**Result:** Catch Hebrew RTL layout breaks automatically.

---

### Week 4: Zod API Validation

```typescript
// app/api/activists/route.ts
import { z } from 'zod';

const ResponseSchema = z.object({
  activists: z.array(z.object({
    id: z.string(),
    fullName: z.string()
  }))
});

export async function GET(req: Request) {
  const data = await getActivists();
  const validated = ResponseSchema.parse(data); // Throws if shape changes
  return Response.json(validated);
}
```

**Result:** API breaking changes fail loudly.

---

## =Ë Implementation Checklist

**Week 1:**
- [ ] TypeScript strict mode enabled
- [ ] Pre-commit hooks installed
- [ ] 10 critical scenarios documented
- [ ] First 3 critical E2E tests written

**Week 2:**
- [ ] All 10 critical E2E tests passing
- [ ] GitHub Actions CI configured
- [ ] Visual regression tests set up (Percy or screenshots)

**Week 3:**
- [ ] Zod schemas on all API routes
- [ ] Sentry error monitoring set up
- [ ] Database CHECK constraints added

**Week 4:**
- [ ] Mutation testing configured
- [ ] Test coverage tracking enabled
- [ ] Full automation plan complete

---

## <¯ Success Metrics

**Before automation:**
- L 2-3 hours manual testing per feature
- L Regressions found in production
- L No confidence in deployments

**After automation:**
-  5 minutes automated testing per PR
-  95% of regressions caught before merge
-  Zero manual QA for routine changes
-  Deploy with confidence

---

## =Ú Full Details

- **Complete plan:** `docs/infrastructure/qa/automations/automationPlan.md`
- **Base rules:** `docs/infrastructure/base/baseRules.md`
- **Project CLAUDE.md:** `/CLAUDE.md`

---

## <˜ Getting Help

If you hit issues:
1. Check the full automationPlan.md for detailed instructions
2. Each task has "Expected Impact" and "Success Criteria"
3. DO NOT SKIP STEPS - they build on each other

---

**START NOW. Week 1, Task 1.1. TypeScript strict mode.**
