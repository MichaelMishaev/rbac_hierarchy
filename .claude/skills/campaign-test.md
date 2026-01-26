---
name: campaign-test
description: Generate RBAC negative tests and E2E test templates. Use when implementing features that need permission boundary testing.
allowed-tools: [Read, Write, Edit, Bash, Glob, Grep]
---

# Campaign Test Generator

Generate RBAC negative tests and E2E test templates for Election Campaign features.

## Usage

```bash
/test-rbac [entity]
```

**Entities:**
- `activist` - Activist CRUD permission tests
- `neighborhood` - Neighborhood access tests
- `task` - Task assignment tests
- `attendance` - Attendance recording tests
- `city` - City access tests (locked page)
- `all` - Generate all permission tests

---

## Negative Testing Philosophy

**Every permission MUST have a negative test** (verify access is DENIED).

```typescript
// ✅ REQUIRED: Test that unauthorized access is blocked
test('City Coordinator CANNOT access other cities', async () => {
  // This test MUST exist for every cross-boundary scenario
});
```

---

## RBAC Test Templates

### City Coordinator Tests

```typescript
// tests/e2e/rbac/city-coordinator-isolation.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsCityCoordinator } from '../helpers/auth';

test.describe('City Coordinator Data Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Tel Aviv City Coordinator
    await loginAsCityCoordinator(page, 'telaviv');
  });

  // ✅ POSITIVE: Can see own city data
  test('CAN see activists in own city', async ({ page }) => {
    await page.goto('/activists');

    // Should see Tel Aviv activists
    await expect(page.getByTestId('activist-list')).toBeVisible();
    const rows = page.getByTestId('activist-row');
    await expect(rows.first()).toBeVisible();
  });

  // ❌ NEGATIVE: Cannot see other city data
  test('CANNOT see activists from other cities', async ({ page }) => {
    await page.goto('/activists');

    // Should NOT see Jerusalem activists
    const jerusalemActivist = page.getByText('ירושלמי טסט'); // Jerusalem test activist
    await expect(jerusalemActivist).not.toBeVisible();
  });

  // ❌ NEGATIVE: Cannot access cities page
  test('CANNOT access cities page', async ({ page }) => {
    await page.goto('/cities');

    // Should see access denied or redirect
    await expect(page.getByTestId('access-denied')).toBeVisible();
    // OR
    await expect(page).toHaveURL('/dashboard');
  });

  // ❌ NEGATIVE: Cannot create activist in other city
  test('CANNOT create activist in other city', async ({ page }) => {
    // Try to POST to Jerusalem neighborhood
    const response = await page.request.post('/api/activists', {
      data: {
        full_name: 'טסט פעיל',
        neighborhood_id: 'jerusalem-neighborhood-uuid'
      }
    });

    expect(response.status()).toBe(403);
  });

  // ❌ NEGATIVE: API returns only own city data
  test('API filters out other city activists', async ({ page }) => {
    const response = await page.request.get('/api/activists');
    const data = await response.json();

    // All activists should be from Tel Aviv
    data.activists.forEach(activist => {
      expect(activist.neighborhood.city.name).toBe('תל אביב');
    });
  });
});
```

### Activist Coordinator Tests

```typescript
// tests/e2e/rbac/activist-coordinator-isolation.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsActivistCoordinator } from '../helpers/auth';

test.describe('Activist Coordinator Neighborhood Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Florentin neighborhood coordinator
    await loginAsActivistCoordinator(page, 'florentin');
  });

  // ✅ POSITIVE: Can see assigned neighborhood activists
  test('CAN see activists in assigned neighborhood', async ({ page }) => {
    await page.goto('/activists');

    // Should see Florentin activists
    const florentinActivist = page.getByText('פלורנטין פעיל');
    await expect(florentinActivist).toBeVisible();
  });

  // ❌ NEGATIVE: Cannot see unassigned neighborhood activists
  test('CANNOT see activists from unassigned neighborhoods', async ({ page }) => {
    await page.goto('/activists');

    // Should NOT see Neve Tzedek activists (not assigned)
    const neveTzedekActivist = page.getByText('נווה צדק פעיל');
    await expect(neveTzedekActivist).not.toBeVisible();
  });

  // ❌ NEGATIVE: Cannot create activist in unassigned neighborhood
  test('CANNOT create activist in unassigned neighborhood', async ({ page }) => {
    const response = await page.request.post('/api/activists', {
      data: {
        full_name: 'טסט פעיל',
        neighborhood_id: 'neve-tzedek-uuid' // Not assigned
      }
    });

    expect(response.status()).toBe(403);
  });

  // ❌ NEGATIVE: Cannot modify neighborhood assignments
  test('CANNOT modify neighborhood assignments', async ({ page }) => {
    // Activist Coordinators cannot change their own assignments
    await page.goto('/neighborhoods');

    // Edit button should not be visible or disabled
    const editButton = page.getByTestId('edit-neighborhood-btn');
    await expect(editButton).not.toBeVisible();
  });

  // ❌ NEGATIVE: Cannot create neighborhoods
  test('CANNOT create new neighborhoods', async ({ page }) => {
    await page.goto('/neighborhoods');

    // Create button should not be visible
    const createButton = page.getByTestId('create-neighborhood-btn');
    await expect(createButton).not.toBeVisible();
  });
});
```

### Area Manager Tests

```typescript
// tests/e2e/rbac/area-manager-isolation.spec.ts
import { test, expect } from '@playwright/test';
import { loginAsAreaManager } from '../helpers/auth';

test.describe('Area Manager Area Isolation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Central Area Manager
    await loginAsAreaManager(page, 'central');
  });

  // ✅ POSITIVE: Can see cities in own area
  test('CAN see cities in own area', async ({ page }) => {
    await page.goto('/cities');

    // Should see Tel Aviv (Central area)
    await expect(page.getByText('תל אביב')).toBeVisible();
  });

  // ❌ NEGATIVE: Cannot see cities from other areas
  test('CANNOT see cities from other areas', async ({ page }) => {
    await page.goto('/cities');

    // Should NOT see Haifa (North area)
    const haifa = page.getByText('חיפה');
    await expect(haifa).not.toBeVisible();
  });

  // ❌ NEGATIVE: Cannot access other area's data via API
  test('API filters out other area cities', async ({ page }) => {
    const response = await page.request.get('/api/cities');
    const data = await response.json();

    // All cities should be in Central area
    data.cities.forEach(city => {
      expect(city.areaManagerId).toBe('central-area-manager-uuid');
    });
  });
});
```

---

## SuperAdmin Boundary Tests

```typescript
// tests/e2e/rbac/superadmin-protection.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SuperAdmin Protection', () => {
  // ❌ NEGATIVE: Cannot create SuperAdmin via API
  test('CANNOT create SuperAdmin via API', async ({ page }) => {
    // Login as existing SuperAdmin
    await loginAsSuperAdmin(page);

    // Try to create another SuperAdmin
    const response = await page.request.post('/api/users', {
      data: {
        email: 'new-super@test.com',
        password: 'test123',
        is_super_admin: true  // Should be rejected
      }
    });

    // Should be rejected - SuperAdmin only via seed
    expect(response.status()).toBe(403);
  });

  // ❌ NEGATIVE: Cannot expose is_super_admin via public API
  test('is_super_admin NOT exposed in user API', async ({ page }) => {
    await loginAsSuperAdmin(page);

    const response = await page.request.get('/api/users');
    const data = await response.json();

    // is_super_admin should not be in response
    data.users.forEach(user => {
      expect(user).not.toHaveProperty('is_super_admin');
      expect(user).not.toHaveProperty('isSuperAdmin');
    });
  });
});
```

---

## Auth Helper Functions

```typescript
// tests/helpers/auth.ts
import { Page } from '@playwright/test';

export async function loginAsSuperAdmin(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', 'superadmin@election.test');
  await page.fill('[data-testid="login-password"]', 'admin123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginAsAreaManager(page: Page, area: string) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', `area.manager.${area}@election.test`);
  await page.fill('[data-testid="login-password"]', 'manager123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginAsCityCoordinator(page: Page, city: string) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', `city.coordinator@${city}.test`);
  await page.fill('[data-testid="login-password"]', 'coord123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/dashboard');
}

export async function loginAsActivistCoordinator(page: Page, neighborhood: string) {
  await page.goto('/login');
  await page.fill('[data-testid="login-email"]', `activist.coordinator.${neighborhood}@election.test`);
  await page.fill('[data-testid="login-password"]', 'coord123');
  await page.click('[data-testid="login-submit"]');
  await page.waitForURL('/dashboard');
}
```

---

## Test Data Setup

```typescript
// tests/fixtures/test-data.ts

export const TEST_USERS = {
  superAdmin: {
    email: 'superadmin@election.test',
    password: 'admin123'
  },
  areaManagerCentral: {
    email: 'area.manager.central@election.test',
    password: 'manager123',
    areaId: 'central-area-uuid'
  },
  cityCoordinatorTelAviv: {
    email: 'city.coordinator@telaviv.test',
    password: 'coord123',
    cityId: 'telaviv-city-uuid'
  },
  activistCoordinatorFlorentin: {
    email: 'activist.coordinator.florentin@election.test',
    password: 'coord123',
    neighborhoodIds: ['florentin-uuid']
  }
};

export const TEST_DATA = {
  cities: {
    telAviv: { id: 'telaviv-city-uuid', name: 'תל אביב', areaId: 'central-area-uuid' },
    jerusalem: { id: 'jerusalem-city-uuid', name: 'ירושלים', areaId: 'central-area-uuid' },
    haifa: { id: 'haifa-city-uuid', name: 'חיפה', areaId: 'north-area-uuid' }
  },
  neighborhoods: {
    florentin: { id: 'florentin-uuid', name: 'פלורנטין', cityId: 'telaviv-city-uuid' },
    neveTzedek: { id: 'neve-tzedek-uuid', name: 'נווה צדק', cityId: 'telaviv-city-uuid' }
  }
};
```

---

## Running RBAC Tests

```bash
# Run all RBAC tests
npm run test:e2e -- tests/e2e/rbac/

# Run specific isolation tests
npm run test:e2e -- tests/e2e/rbac/city-coordinator-isolation.spec.ts

# Run with UI for debugging
npm run test:e2e:ui -- tests/e2e/rbac/

# Generate report
npm run test:e2e -- tests/e2e/rbac/ --reporter=html
```

---

## Test Coverage Checklist

For each role, ensure these tests exist:

### City Coordinator
- [ ] CAN see own city activists
- [ ] CANNOT see other city activists
- [ ] CANNOT access cities page
- [ ] CANNOT create activist in other city
- [ ] API filters out other cities

### Activist Coordinator
- [ ] CAN see assigned neighborhood activists
- [ ] CANNOT see unassigned neighborhood activists
- [ ] CANNOT create activist in unassigned neighborhood
- [ ] CANNOT modify neighborhood assignments
- [ ] CANNOT create neighborhoods

### Area Manager
- [ ] CAN see cities in own area
- [ ] CANNOT see cities from other areas
- [ ] API filters out other areas

### SuperAdmin
- [ ] Cannot be created via API
- [ ] is_super_admin not exposed
- [ ] Can access all data (positive tests)

---

## Integration

- Called by: qa-tester agent, `/protocol bug-fix`
- Used after: backend-developer implements new features
- Reference: `PERMISSIONS_MATRIX.md`, `baseRules.md` section 4

---

**No permission without a negative test. Period.**
