# Navigation Tests - System-Wide Page Verification

## Purpose

These tests verify that all pages in the system load without runtime errors. They catch:

- ❌ **Import errors** (e.g., `listCorporations is not a function`)
- ❌ **Undefined props** (e.g., `areas is undefined`)
- ❌ **Missing data** (e.g., failed API calls)
- ❌ **TypeScript errors** that slip through to runtime
- ❌ **Authentication/RBAC issues**

## When to Run

**ALWAYS run these tests after:**
- Renaming functions or files
- Changing component props
- Refactoring API actions
- Updating database queries
- Modifying authentication logic
- Major feature changes

## How to Run

### Run all navigation tests:
```bash
cd app
npm run test:e2e tests/e2e/navigation/all-pages.spec.ts
```

### Run with UI (for debugging):
```bash
npm run test:e2e:ui tests/e2e/navigation/all-pages.spec.ts
```

### Run in headed mode (see browser):
```bash
npm run test:e2e:headed tests/e2e/navigation/all-pages.spec.ts
```

### Quick smoke test (fastest):
```bash
npx playwright test tests/e2e/navigation/all-pages.spec.ts --grep "loads without errors"
```

## Test Coverage

### SuperAdmin Tests
- ✅ Dashboard
- ✅ Activists page
- ✅ Activists modal (with cascading selects)
- ✅ Users page
- ✅ Cities page
- ✅ Neighborhoods page
- ✅ Areas page
- ✅ Tasks page
- ✅ Attendance page
- ✅ Map page
- ✅ Settings/Notifications
- ✅ All sidebar navigation links

### Role-Based Tests
- ✅ Area Manager navigation
- ✅ City Coordinator navigation
- ✅ Activist Coordinator navigation

## Interpreting Results

### ✅ Pass (Green)
All pages loaded successfully without errors.

### ❌ Fail (Red)
One or more pages have runtime errors:

**Example failure:**
```
Error: text=/Runtime TypeError|is not a function/i
Expected: count = 0
Received: count = 1

Found error: "listCorporations is not a function"
```

**Action:** Fix the import or function name, then re-run tests.

## CI/CD Integration

Add to GitHub Actions workflow:

```yaml
- name: Run Navigation Tests
  run: npm run test:e2e tests/e2e/navigation/all-pages.spec.ts
```

## Best Practices

1. **Run before committing** major changes
2. **Run before creating PR** to catch issues early
3. **Add new pages** to this test suite when created
4. **Keep tests fast** - no unnecessary waits
5. **Fix immediately** if tests fail - don't merge broken code

## Maintenance

When adding a new page:

1. Add route to `test.describe('System-Wide Navigation Tests')`
2. Follow the pattern:
   ```typescript
   test('New page loads without errors', async ({ page }) => {
     await page.goto('/he/new-page');
     await page.waitForLoadState('networkidle');

     const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
     await expect(errorElement).toHaveCount(0, { timeout: 2000 });

     await expect(page.locator('text=/Page Title/i')).toBeVisible();
   });
   ```

## Troubleshooting

### Tests fail with "page not found"
- Verify the route exists in the app
- Check middleware isn't blocking the route
- Ensure authentication is working

### Tests fail with "timeout"
- Increase timeout in playwright.config.ts
- Check if dev server is running
- Verify database is accessible

### Tests pass but page has errors in browser
- Clear Next.js cache: `rm -rf .next`
- Restart dev server
- Check browser console for errors not caught by test

## Quick Reference Commands

```bash
# Full test suite
npm run test:e2e tests/e2e/navigation/all-pages.spec.ts

# Single test
npx playwright test -g "Activists page loads"

# Debug mode
npm run test:e2e:debug tests/e2e/navigation/all-pages.spec.ts

# Generate HTML report
npx playwright show-report
```
