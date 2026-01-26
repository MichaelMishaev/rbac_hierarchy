# E2E Test Suite - Hierarchy Platform

This directory contains end-to-end tests for the Hierarchy Platform using Playwright.

## Structure

```
tests/
└── e2e/
    ├── auth/               # Authentication tests
    │   └── login.spec.ts
    ├── rbac/               # Role-Based Access Control tests
    │   └── permissions.spec.ts
    ├── multi-tenant/       # Multi-corporation isolation tests
    │   └── isolation.spec.ts
    ├── invitations/        # Invitation system tests
    │   └── invitation-flow.spec.ts
    ├── fixtures/           # Test fixtures and helpers
    │   └── auth.fixture.ts
    └── page-objects/       # Page Object Models
        └── DashboardPage.ts
```

## Running Tests

### All Tests
```bash
npm run test:e2e
```

### UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npm run test:e2e:debug
```

### Specific Test File
```bash
npx playwright test tests/e2e/auth/login.spec.ts
```

### Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

## Test Coverage

### Authentication (`auth/`)
- ✅ SuperAdmin login
- ✅ Manager login
- ✅ Supervisor login
- ✅ Invalid credentials handling
- ✅ JWT token storage
- ✅ Logout functionality

### RBAC (`rbac/`)
- ✅ SuperAdmin permissions (create corporations, access all data)
- ✅ Manager permissions (create managers, supervisors, sites, workers)
- ✅ Supervisor permissions (create workers in assigned sites only)
- ✅ Permission boundaries (cannot access unauthorized resources)
- ✅ Role-based UI elements

### Multi-Tenant Isolation (`multi-tenant/`)
- ✅ Corporation data isolation
- ✅ SuperAdmin corporation switching
- ✅ API request corporation filtering
- ✅ Cross-corporation access prevention
- ✅ Audit log scoping
- ✅ Supervisor site assignment enforcement

### Invitation System (`invitations/`)
- ✅ Manager creates invitations
- ✅ Invitation token generation
- ✅ User accepts invitation
- ✅ Expired token handling
- ✅ Already accepted token handling
- ✅ Invitation scoping to corporation
- ✅ Permission enforcement (Supervisors cannot invite)
- ✅ Audit logging for invitations

## Test Users

Test fixtures provide the following test users:

- **SuperAdmin**: `superadmin@hierarchy.test`
- **Manager (Corp1)**: `manager@corp1.test`
- **Supervisor (Corp1)**: `supervisor@corp1.test`
- **Manager (Corp2)**: `manager@corp2.test`

See `tests/e2e/fixtures/auth.fixture.ts` for full credentials.

## Page Objects

Page Object Models (POM) are used to encapsulate page interactions:

- **DashboardPage**: SuperAdmin/Manager dashboard with KPIs, sidebar navigation, and organizational diagram

## Configuration

Playwright configuration is in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000` (configurable via `BASE_URL` env var)
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **RTL Testing**: Special `chromium-rtl` project for Hebrew UI testing
- **Retries**: 2 retries on CI, 0 locally
- **Reporters**: HTML, List, JSON
- **Screenshots**: On failure only
- **Video**: Retained on failure
- **Trace**: On first retry

## RTL (Right-to-Left) Testing

The test suite includes RTL-specific testing for Hebrew UI:

```bash
npx playwright test --project=chromium-rtl
```

Tests verify:
- `dir="rtl"` attribute on HTML element
- Correct layout and alignment for RTL languages
- Hebrew labels in UI elements

## CI/CD Integration

Tests are optimized for CI environments:

- **GitHub Actions**: Use `CI=true npm run test:e2e`
- **Parallel Execution**: Disabled on CI for stability
- **Retries**: Enabled on CI (2 retries)
- **Dev Server**: Auto-starts on local, disabled on CI

## Best Practices

1. **Use Page Objects**: Always use POM for page interactions
2. **Use Fixtures**: Leverage auth fixtures for login/setup
3. **data-testid**: Use `data-testid` attributes for selectors
4. **Isolation**: Each test should be independent
5. **Cleanup**: Tests should clean up their own data
6. **Assertions**: Use meaningful assertion messages

## Adding New Tests

1. Create test file in appropriate directory
2. Import fixtures and page objects
3. Use descriptive test names
4. Follow existing patterns
5. Add to this README's coverage section

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check if dev server is running
- Verify network connectivity

### Element not found
- Ensure `data-testid` attributes exist
- Check if page has loaded completely
- Use `page.waitForLoadState('domcontentloaded')`

### Authentication issues
- Verify test user credentials
- Check token storage mechanism
- Ensure cookies/localStorage is working

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
