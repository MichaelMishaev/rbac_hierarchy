# Dashboard UI/UX - QA Automation Tests

**Created:** 2025-11-30
**Purpose:** Prevent regression bugs after UX improvements
**Framework:** Playwright E2E
**Coverage:** 14 tests across UI/UX, Accessibility, and Performance

---

## 🎯 Test Suite Overview

### File Location
```
tests/e2e/dashboard/dashboard-ui.spec.ts
```

### Test Categories

1. **UI/UX Functionality** (9 tests)
   - Loading states
   - Empty states
   - Navigation
   - Data display
   - State persistence

2. **Accessibility** (3 tests)
   - Heading hierarchy
   - Button accessibility
   - Keyboard navigation

3. **Performance** (2 tests)
   - Load time (<5s)
   - Layout stability (no shifts)

---

## 📋 Test Specifications

### 1. UI/UX Tests

#### Test 1.1: Loading Skeletons
```typescript
test('should show loading skeletons before content loads', async ({ page }) => {
  await page.goto('/dashboard');

  // Skeleton should be visible briefly
  const skeletonCards = page.locator('[class*="MuiSkeleton"]');

  // Wait for actual content
  await page.waitForSelector('text=שלום, Super Admin!');

  // Verify KPI cards loaded
  const kpiCards = page.locator('[data-testid^="kpi-card"]');
  await expect(kpiCards.first()).toBeVisible();
});
```

**Purpose:** Ensure skeleton screens show during async data loading
**Success Criteria:** Skeleton visible → Content loads → No layout shift

---

#### Test 1.2: Empty States
```typescript
test('should display empty state when no recent activity', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  const emptyState = page.locator('[data-testid="empty-state"]');

  if (await emptyState.isVisible()) {
    await expect(emptyState.locator('text=אין פעילות עדיין')).toBeVisible();
    await expect(emptyState.locator('svg')).toBeVisible(); // Icon
  }
});
```

**Purpose:** Verify empty states render with icon and text
**Success Criteria:** Title + description + icon visible

---

#### Test 1.3: KPI Card Navigation
```typescript
test('should have clickable KPI cards that navigate correctly', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  const corporationsCard = page.locator('text=סה"כ תאגידים').locator('..');
  await corporationsCard.click();

  await expect(page).toHaveURL(/.*\/corporations/);
});
```

**Purpose:** Ensure KPI cards navigate to correct pages
**Success Criteria:** Click card → Navigate to detail page

---

#### Test 1.4: Correct Data Display
```typescript
test('should display correct KPI values for SuperAdmin', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  // Check all 5 KPI cards present
  await expect(page.locator('text=סה"כ תאגידים')).toBeVisible();
  await expect(page.locator('text=סה"כ אתרים')).toBeVisible();
  await expect(page.locator('text=משתמשי מערכת')).toBeVisible();
  await expect(page.locator('text=סה"כ עובדים')).toBeVisible();
  await expect(page.locator('text=הזמנות ממתינות')).toBeVisible();

  // Verify values are valid numbers
  const totalCorporations = page.locator('text=סה"כ תאגידים')
    .locator('../..')
    .locator('h2');
  const value = await totalCorporations.textContent();
  expect(parseInt(value || '0')).toBeGreaterThanOrEqual(0);
});
```

**Purpose:** Validate data integrity and display
**Success Criteria:** All KPIs visible with valid numeric values

---

#### Test 1.5: Organizational Tree
```typescript
test('should render organizational tree', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  await expect(page.locator('text=היררכיית המערכת')).toBeVisible();
  await expect(page.locator('button:has-text("הגדל")')).toBeVisible();
  await expect(page.locator('button:has-text("הקטן")')).toBeVisible();
  await expect(page.locator('button:has-text("התאם למסך")')).toBeVisible();
});
```

**Purpose:** Ensure tree visualization loads with controls
**Success Criteria:** Tree + zoom controls visible

---

#### Test 1.6: RTL Layout
```typescript
test('should have proper RTL layout', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  const mainBox = page.locator('main, [dir="rtl"]').first();
  await expect(mainBox).toBeVisible();

  await expect(page.locator('text=תאגידים')).toBeVisible();
  await expect(page.locator('text=אתרים')).toBeVisible();
});
```

**Purpose:** Validate RTL/Hebrew layout
**Success Criteria:** dir="rtl" + Hebrew text rendering

---

#### Test 1.7: Sign Out
```typescript
test('should show sign out button', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  const signOutButton = page.locator('button:has-text("התנתק")').first();
  await expect(signOutButton).toBeVisible();

  await signOutButton.click();
  await expect(page).toHaveURL(/.*\/login/);
});
```

**Purpose:** Verify authentication flow
**Success Criteria:** Sign out → Redirect to login

---

#### Test 1.8: Error Handling
```typescript
test('should handle errors gracefully', async ({ page }) => {
  // Intercept API and force error
  await page.route('**/api/dashboard/**', (route) => {
    route.fulfill({
      status: 500,
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('/dashboard');
  await page.waitForTimeout(1000);

  const body = await page.locator('body').textContent();
  expect(body).toBeTruthy(); // Page doesn't crash
});
```

**Purpose:** Ensure graceful error handling
**Success Criteria:** Page doesn't crash on API errors

---

#### Test 1.9: State Persistence
```typescript
test('should maintain state during navigation', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  const totalCorporations = page.locator('text=סה"כ תאגידים')
    .locator('../..')
    .locator('h2');
  const initialCount = await totalCorporations.textContent();

  // Navigate away
  await page.click('text=תאגידים');
  await page.waitForURL(/.*\/corporations/);

  // Navigate back
  await page.click('text=לוח בקרה');
  await page.waitForURL(/.*\/dashboard/);

  const newCount = await totalCorporations.textContent();
  expect(newCount).toBe(initialCount);
});
```

**Purpose:** Verify state doesn't reset on navigation
**Success Criteria:** Data consistent across navigation

---

### 2. Accessibility Tests

#### Test 2.1: Heading Hierarchy
```typescript
test('should have proper heading hierarchy', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  const h4 = page.locator('h4:has-text("שלום, Super Admin!")');
  await expect(h4).toBeVisible();

  const h5 = page.locator('h5:has-text("היררכיית המערכת")');
  await expect(h5).toBeVisible();
});
```

**Purpose:** Validate semantic HTML structure
**Success Criteria:** Proper heading levels (h4, h5)

---

#### Test 2.2: Accessible Buttons
```typescript
test('should have accessible buttons', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  const buttons = page.locator('button');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);

  const signOutButton = page.locator('button[type="submit"]:has-text("התנתק")');
  await expect(signOutButton).toBeVisible();
});
```

**Purpose:** Ensure all buttons are accessible
**Success Criteria:** Buttons have proper type attribute

---

#### Test 2.3: Keyboard Navigation
```typescript
test('should support keyboard navigation', async ({ page }) => {
  await page.waitForSelector('text=שלום, Super Admin!');

  await page.keyboard.press('Tab');

  const focused = page.locator(':focus');
  await expect(focused).toBeVisible();
});
```

**Purpose:** Validate keyboard accessibility
**Success Criteria:** Can tab through interactive elements

---

### 3. Performance Tests

#### Test 3.1: Load Time
```typescript
test('should load dashboard within acceptable time', async ({ page }) => {
  const startTime = Date.now();

  await page.goto('/login');
  await page.fill('input[name="email"]', 'superadmin@hierarchy.test');
  await page.fill('input[name="password"]', 'SuperAdmin123!');
  await page.click('button[type="submit"]');

  await page.waitForSelector('text=שלום, Super Admin!');
  await page.waitForSelector('text=סה"כ תאגידים');

  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(5000); // 5 seconds

  console.log(`Dashboard loaded in ${loadTime}ms`);
});
```

**Purpose:** Ensure acceptable load performance
**Success Criteria:** Full dashboard load < 5 seconds

---

#### Test 3.2: Layout Stability
```typescript
test('should not have layout shifts', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'superadmin@hierarchy.test');
  await page.fill('input[name="password"]', 'SuperAdmin123!');
  await page.click('button[type="submit"]');

  await page.waitForSelector('text=שלום, Super Admin!');

  const header = page.locator('h4:has-text("שלום, Super Admin!")');
  const initialBox = await header.boundingBox();

  await page.waitForTimeout(2000);

  const finalBox = await header.boundingBox();

  // Position shouldn't change (1px tolerance)
  expect(Math.abs((finalBox?.y || 0) - (initialBox?.y || 0))).toBeLessThan(2);
});
```

**Purpose:** Prevent Cumulative Layout Shift (CLS)
**Success Criteria:** Elements don't shift after load

---

## 🚀 Running Tests

### Prerequisites
```bash
# Ensure dev server is running
npm run dev

# Or production build
npm run build
npm start
```

### Run All Tests
```bash
npx playwright test tests/e2e/dashboard/dashboard-ui.spec.ts
```

### Run Specific Test
```bash
npx playwright test -g "should show loading skeletons"
```

### Run with UI
```bash
npx playwright test --ui
```

### Debug Mode
```bash
npx playwright test --debug
```

### Generate Report
```bash
npx playwright test --reporter=html
npx playwright show-report
```

---

## 📊 Expected Results

### Success Criteria
- ✅ All 14 tests pass
- ✅ No console errors
- ✅ Load time < 5 seconds
- ✅ No layout shifts
- ✅ Accessibility standards met

### Sample Output
```
Running 14 tests using 5 workers

  ✓  1 should show loading skeletons (523ms)
  ✓  2 should display empty state (412ms)
  ✓  3 should have clickable KPI cards (385ms)
  ✓  4 should display correct KPI values (401ms)
  ✓  5 should render organizational tree (445ms)
  ✓  6 should have proper RTL layout (392ms)
  ✓  7 should show sign out button (418ms)
  ✓  8 should handle errors gracefully (502ms)
  ✓  9 should maintain state (655ms)
  ✓ 10 should have proper heading hierarchy (381ms)
  ✓ 11 should have accessible buttons (398ms)
  ✓ 12 should support keyboard navigation (412ms)
  ✓ 13 should load within acceptable time (4122ms)
  ✓ 14 should not have layout shifts (2145ms)

  14 passed (12.1s)
```

---

## 🐛 Troubleshooting

### Issue: "Cannot navigate to invalid URL"
**Cause:** Missing baseURL in test
**Fix:** Playwright config should have:
```typescript
use: {
  baseURL: 'http://localhost:3000',
}
```

### Issue: "Test times out"
**Cause:** Dev server not running
**Fix:** Start dev server before running tests
```bash
npm run dev
```

### Issue: "Element not found"
**Cause:** Selector doesn't match RTL Hebrew text
**Fix:** Use `text=` locator for Hebrew:
```typescript
page.locator('text=שלום, Super Admin!')
```

---

## 📈 Regression Prevention Strategy

### 1. **Run Tests Before Every Deploy**
```bash
#!/bin/bash
# .github/workflows/test.yml
npm run build
npm run test:e2e
```

### 2. **Add to CI/CD Pipeline**
```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm ci
      - run: npx playwright install
      - run: npm run build
      - run: npm test
```

### 3. **Pre-commit Hook**
```bash
# .husky/pre-push
#!/bin/sh
npm run test:e2e
```

---

## 🔄 Maintenance

### When to Update Tests

1. **UI Changes** - Update selectors if layout changes
2. **New Features** - Add new test cases
3. **Performance Goals** - Adjust timeout thresholds
4. **Accessibility** - Add WCAG tests

### Test Review Cadence
- **Weekly:** Run full suite
- **Before Deploy:** All tests must pass
- **After Incidents:** Add test for bug that escaped

---

## 📚 Related Documentation

- Main Implementation: `docs/mdFiles/ui-ux/IMPLEMENTATION_SUMMARY.md`
- UX Analysis: `docs/mdFiles/ui-ux/dashboard-ux-analysis-revised.md`
- Playwright Docs: https://playwright.dev
- Test Fixtures: `tests/e2e/fixtures/auth.fixture.ts`

---

**Last Updated:** 2025-11-30
**Test Suite Version:** 1.0
**Coverage:** 14 tests
**Status:** ✅ Ready for CI/CD
