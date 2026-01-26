# Automation Quick Start Guide

**For Developers**: Quick reference for running and understanding MVP automation tests

---

## 🚀 Quick Commands

```bash
# Install dependencies
npm install
npx playwright install

# Run ALL tests (headless, CI mode)
npm run test:e2e

# Run tests with UI (debugging, see browser)
npm run test:e2e:ui

# Run tests in headed mode (see browser, no UI)
npm run test:e2e:headed

# Run specific test file
npx playwright test corporations/corporation-crud.spec.ts

# Run specific test suite
npx playwright test --grep "Corporation Management - Create"

# Run tests by tag
npx playwright test --grep @critical
npx playwright test --grep @smoke

# Generate and view HTML report
npx playwright show-report

# Debug specific test
npx playwright test --debug corporations/
```

---

## 📂 Test File Locations

```bash
tests/e2e/
├── corporations/corporation-crud.spec.ts  # 35 tests
├── workers/worker-crud.spec.ts            # 42 tests
├── sites/site-crud.spec.ts                # 32 tests
├── users/user-crud.spec.ts                # 25 tests
├── dashboard/dashboard.spec.ts            # 28 tests
├── auth/login.spec.ts                     # 10 tests
├── rbac/permissions.spec.ts               # 8 tests
├── invitations/invitation-flow.spec.ts    # 18 tests
└── multi-tenant/isolation.spec.ts         # 12 tests
```

**Total**: 210+ tests

---

## 🎯 Test Users (Fixtures)

```typescript
// tests/e2e/fixtures/auth.fixture.ts

testUsers = {
  superAdmin: {
    email: 'superadmin@hierarchy.test',
    password: 'SuperAdmin123!',
  },
  manager: {
    email: 'manager@corp1.test',
    password: 'Manager123!',
    corporationId: '1',
  },
  supervisor: {
    email: 'supervisor@corp1.test',
    password: 'Supervisor123!',
    corporationId: '1',
    siteIds: ['1', '2'],
  },
  managerCorp2: {
    email: 'manager@corp2.test',
    password: 'Manager123!',
    corporationId: '2',
  },
}
```

---

## 🧪 Writing New Tests

### Template

```typescript
import { test, expect } from '../fixtures/auth.fixture';

test.describe('Feature Name - Action', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('manager'); // or 'superAdmin', 'supervisor'
    await page.goto('/your-page');
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await page.click('[data-testid="create-button"]');

    // Act
    await page.fill('[data-testid="name-input"]', 'Test Name');
    await page.click('[data-testid="submit-button"]');

    // Assert
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
    await expect(page.locator('text=Test Name')).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid** for all selectors
2. **Follow AAA pattern** (Arrange, Act, Assert)
3. **One assertion per test** (when possible)
4. **Descriptive test names** ("should create corporation with valid input")
5. **Use fixtures** for authentication (`loginAs`)

---

## 🎨 Data Test ID Conventions

```typescript
// Buttons
[data-testid="create-{entity}-button"]
[data-testid="submit-{entity}-button"]
[data-testid="delete-{entity}-button"]
[data-testid="edit-{entity}-button"]

// Forms
[data-testid="{entity}-{field}-input"]
[data-testid="{entity}-{field}-select"]

// Tables & Lists
[data-testid="{entities}-table"]
[data-testid="{entity}-row-{id}"]
[data-testid="{entity}-card-{id}"]

// Messages
[data-testid="success-snackbar"]
[data-testid="error-snackbar"]
[data-testid="confirmation-dialog"]

// Navigation
[data-testid="back-button"]
[data-testid="breadcrumbs"]
[data-testid="tab-{name}"]
```

---

## 🔍 Common Assertions

```typescript
// Visibility
await expect(locator).toBeVisible();
await expect(locator).not.toBeVisible();
await expect(locator).toBeHidden();

// Text
await expect(locator).toHaveText('exact text');
await expect(locator).toContainText('partial text');

// Values
await expect(locator).toHaveValue('value');

// Attributes
await expect(locator).toHaveAttribute('data-id', '1');

// URL
await expect(page).toHaveURL(/\/corporations$/);

// Count
await expect(locator).toHaveCount(5);

// State
await expect(locator).toBeDisabled();
await expect(locator).toBeEnabled();
await expect(locator).toBeChecked();
```

---

## 🐛 Debugging Tips

### View Browser During Test

```bash
npx playwright test --headed --workers=1
```

### Use Debug Mode

```bash
npx playwright test --debug
```

### Add Breakpoints

```typescript
await page.pause(); // Stops execution, opens inspector
```

### Screenshots

```typescript
await page.screenshot({ path: 'debug.png' });
```

### Console Logs

```typescript
page.on('console', msg => console.log(msg.text()));
```

### Network Requests

```typescript
page.on('request', request => console.log(request.url()));
page.on('response', response => console.log(response.status()));
```

---

## 📊 Test Reports

### HTML Report

```bash
npx playwright show-report
```

### JSON Report

```bash
npx playwright test --reporter=json
```

### JUnit Report (for CI)

```bash
npx playwright test --reporter=junit
```

---

## 🔄 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 🎯 Running Tests by Category

### Critical Tests Only

```bash
npx playwright test --grep @critical
```

### Smoke Tests

```bash
npx playwright test --grep @smoke
```

### RBAC Tests

```bash
npx playwright test rbac/
npx playwright test multi-tenant/
```

### Mobile Tests

```bash
npx playwright test --grep @mobile
```

### Desktop Only

```bash
npx playwright test --grep @desktop
```

---

## 📈 Coverage

| Domain | File | Tests | Status |
|--------|------|-------|--------|
| Corporations | `corporations/corporation-crud.spec.ts` | 35 | ✅ Ready |
| Workers | `workers/worker-crud.spec.ts` | 42 | ✅ Ready |
| Sites | `sites/site-crud.spec.ts` | 32 | ✅ Ready |
| Users | `users/user-crud.spec.ts` | 25 | ✅ Ready |
| Dashboard | `dashboard/dashboard.spec.ts` | 28 | ✅ Ready |
| Auth | `auth/login.spec.ts` | 10 | ✅ Ready |
| RBAC | `rbac/permissions.spec.ts` | 8 | ✅ Ready |
| Invitations | `invitations/invitation-flow.spec.ts` | 18 | ✅ Ready |
| Multi-Tenant | `multi-tenant/isolation.spec.ts` | 12 | ✅ Ready |

**Total**: 210+ tests ✅

---

## ⚠️ Prerequisites

### Before Running Tests

1. **Backend running**: Application server on `http://localhost:3000`
2. **Database seeded**: Test users must exist
3. **Playwright installed**: `npx playwright install`

### Seed Data Required

```sql
-- SuperAdmin user
INSERT INTO users (email, password, is_super_admin)
VALUES ('superadmin@hierarchy.test', '$hashed', true);

-- Corporation 1
INSERT INTO corporations (id, name, code)
VALUES (1, 'Corporation 1', 'CORP1');

-- Corporation 2
INSERT INTO corporations (id, name, code)
VALUES (2, 'Corporation 2', 'CORP2');

-- Manager for Corp 1
INSERT INTO users (email, password)
VALUES ('manager@corp1.test', '$hashed');

-- Supervisor for Corp 1
INSERT INTO users (email, password)
VALUES ('supervisor@corp1.test', '$hashed');

-- Sites 1 & 2 for Corp 1
INSERT INTO sites (id, name, corporation_id)
VALUES (1, 'Site 1', 1), (2, 'Site 2', 1);
```

---

## 📚 Full Documentation

- **Full Automation Docs**: `docs/infrastructure/qa/automations/MVP_AUTOMATION_TESTS.md`
- **Automation Summary**: `docs/infrastructure/qa/automations/AUTOMATION_SUMMARY.md`
- **Manual Checklist**: `docs/syAnalyse/mvp/07_TESTING_CHECKLIST.md`
- **Project Guide**: `CLAUDE.md`

---

## 🆘 Troubleshooting

### Test Timeout
```typescript
// Increase timeout for slow operations
test.setTimeout(60000);
await page.waitForTimeout(1000);
```

### Element Not Found
```typescript
// Wait for element explicitly
await page.waitForSelector('[data-testid="element"]');
```

### Flaky Tests
```typescript
// Add retries in config
retries: 2,

// Or per test
test.describe.configure({ retries: 2 });
```

### Authentication Fails
```bash
# Check test users exist in database
# Verify passwords match fixtures
# Check session/cookie settings
```

---

**Last Updated**: 2025-11-28
**Maintained By**: Development Team
