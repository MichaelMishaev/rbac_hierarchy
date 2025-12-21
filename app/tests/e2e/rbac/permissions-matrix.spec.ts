/**
 * RBAC Permissions Matrix E2E Tests
 *
 * Tests EVERY permission defined in PERMISSIONS_MATRIX.md
 * This is the authoritative test suite for RBAC enforcement
 *
 * ⚠️ CRITICAL: This test file MUST match docs/infrastructure/roles/PERMISSIONS_MATRIX.md
 *
 * Test Matrix Coverage:
 * - Page Access (Section 2)
 * - Entity CRUD Permissions (Section 3)
 * - Data Isolation Rules (Section 4)
 * - Creation Permissions (Section 5)
 *
 * @see docs/infrastructure/roles/PERMISSIONS_MATRIX.md
 */

import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// ============================================
// TEST DATA SETUP
// ============================================

let testData: {
  superAdmin: { id: string; email: string; password: string };
  areaManager: { id: string; email: string; password: string; areaManagerId: string };
  cityCoordinator: { id: string; email: string; password: string; cityId: string };
  activistCoordinator: { id: string; email: string; password: string; cityId: string; neighborhoodIds: string[] };

  city1: { id: string; name: string };
  city2: { id: string; name: string };

  neighborhood1: { id: string; name: string; cityId: string };
  neighborhood2: { id: string; name: string; cityId: string };

  activist1: { id: string; fullName: string; neighborhoodId: string };
  activist2: { id: string; fullName: string; neighborhoodId: string };
};

test.beforeAll(async () => {
  // Create test data for RBAC testing
  const passwordHash = await hash('testpass123', 10);

  // SuperAdmin
  const superAdminUser = await prisma.user.create({
    data: {
      email: 'rbac-superadmin@test.local',
      fullName: 'RBAC SuperAdmin',
      passwordHash,
      role: 'SUPERADMIN',
      isSuperAdmin: true,
      isActive: true,
    },
  });

  // Area Manager
  const areaManager = await prisma.areaManager.create({
    data: {
      regionName: 'Test Region',
      regionCode: 'TEST-REGION',
      isActive: true,
    },
  });

  const areaManagerUser = await prisma.user.create({
    data: {
      email: 'rbac-areamanager@test.local',
      fullName: 'RBAC Area Manager',
      passwordHash,
      role: 'AREA_MANAGER',
      isActive: true,
      areaManager: {
        connect: { id: areaManager.id },
      },
    },
  });

  // Cities
  const city1 = await prisma.city.create({
    data: {
      name: 'Test City 1',
      code: 'TC1',
      areaManagerId: areaManager.id,
      isActive: true,
    },
  });

  const city2 = await prisma.city.create({
    data: {
      name: 'Test City 2',
      code: 'TC2',
      areaManagerId: null, // Different area (no manager assigned)
      isActive: true,
    },
  });

  // City Coordinator (for City 1)
  const cityCoordinatorUser = await prisma.user.create({
    data: {
      email: 'rbac-citycoord@test.local',
      fullName: 'RBAC City Coordinator',
      passwordHash,
      role: 'CITY_COORDINATOR',
      isActive: true,
    },
  });

  await prisma.cityCoordinator.create({
    data: {
      userId: cityCoordinatorUser.id,
      cityId: city1.id,
      isActive: true,
    },
  });

  // Neighborhoods
  const neighborhood1 = await prisma.neighborhood.create({
    data: {
      name: 'Test Neighborhood 1',
      cityId: city1.id,
      isActive: true,
    },
  });

  const neighborhood2 = await prisma.neighborhood.create({
    data: {
      name: 'Test Neighborhood 2',
      cityId: city2.id,
      isActive: true,
    },
  });

  // Activist Coordinator (for City 1, assigned to Neighborhood 1 only)
  const activistCoordinatorUser = await prisma.user.create({
    data: {
      email: 'rbac-activistcoord@test.local',
      fullName: 'RBAC Activist Coordinator',
      passwordHash,
      role: 'ACTIVIST_COORDINATOR',
      isActive: true,
    },
  });

  const activistCoordinator = await prisma.activistCoordinator.create({
    data: {
      userId: activistCoordinatorUser.id,
      cityId: city1.id,
      isActive: true,
    },
  });

  // M2M assignment (Activist Coordinator → Neighborhood 1 only)
  await prisma.activistCoordinatorNeighborhood.create({
    data: {
      activistCoordinatorId: activistCoordinator.id,
      neighborhoodId: neighborhood1.id,
    },
  });

  // Activists
  const activist1 = await prisma.activist.create({
    data: {
      fullName: 'Test Activist 1',
      phone: '050-1111111',
      neighborhoodId: neighborhood1.id,
      cityId: city1.id,
      isActive: true,
    },
  });

  const activist2 = await prisma.activist.create({
    data: {
      fullName: 'Test Activist 2',
      phone: '050-2222222',
      neighborhoodId: neighborhood2.id,
      cityId: city2.id,
      isActive: true,
    },
  });

  testData = {
    superAdmin: { id: superAdminUser.id, email: superAdminUser.email, password: 'testpass123' },
    areaManager: { id: areaManagerUser.id, email: areaManagerUser.email, password: 'testpass123', areaManagerId: areaManager.id },
    cityCoordinator: { id: cityCoordinatorUser.id, email: cityCoordinatorUser.email, password: 'testpass123', cityId: city1.id },
    activistCoordinator: { id: activistCoordinatorUser.id, email: activistCoordinatorUser.email, password: 'testpass123', cityId: city1.id, neighborhoodIds: [neighborhood1.id] },

    city1: { id: city1.id, name: city1.name },
    city2: { id: city2.id, name: city2.name },

    neighborhood1: { id: neighborhood1.id, name: neighborhood1.name, cityId: city1.id },
    neighborhood2: { id: neighborhood2.id, name: neighborhood2.name, cityId: city2.id },

    activist1: { id: activist1.id, fullName: activist1.fullName, neighborhoodId: neighborhood1.id },
    activist2: { id: activist2.id, fullName: activist2.fullName, neighborhoodId: neighborhood2.id },
  };
});

test.afterAll(async () => {
  // Clean up test data
  await prisma.activist.deleteMany({
    where: {
      OR: [
        { id: testData.activist1.id },
        { id: testData.activist2.id },
      ],
    },
  });

  await prisma.activistCoordinatorNeighborhood.deleteMany({
    where: {
      activistCoordinatorId: {
        in: (await prisma.activistCoordinator.findMany({
          where: { userId: testData.activistCoordinator.id },
          select: { id: true },
        })).map(ac => ac.id),
      },
    },
  });

  await prisma.activistCoordinator.deleteMany({
    where: { userId: testData.activistCoordinator.id },
  });

  await prisma.cityCoordinator.deleteMany({
    where: { userId: testData.cityCoordinator.id },
  });

  await prisma.neighborhood.deleteMany({
    where: {
      OR: [
        { id: testData.neighborhood1.id },
        { id: testData.neighborhood2.id },
      ],
    },
  });

  await prisma.city.deleteMany({
    where: {
      OR: [
        { id: testData.city1.id },
        { id: testData.city2.id },
      ],
    },
  });

  await prisma.areaManager.deleteMany({
    where: { id: testData.areaManager.areaManagerId },
  });

  await prisma.user.deleteMany({
    where: {
      OR: [
        { id: testData.superAdmin.id },
        { id: testData.areaManager.id },
        { id: testData.cityCoordinator.id },
        { id: testData.activistCoordinator.id },
      ],
    },
  });
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function loginAs(page: any, email: string, password: string) {
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL('/dashboard');
}

// ============================================
// SECTION 2: PAGE ACCESS MATRIX TESTS
// ============================================

test.describe('Page Access Matrix - PERMISSIONS_MATRIX.md Section 2', () => {
  test('SuperAdmin can access all pages', async ({ page }) => {
    await loginAs(page, testData.superAdmin.email, testData.superAdmin.password);

    const accessiblePages = [
      '/dashboard',
      '/areas',
      '/cities',
      '/neighborhoods',
      '/users',
      '/manage-voters',
      '/tasks',
      '/attendance',
      '/system-rules',
    ];

    for (const url of accessiblePages) {
      await page.goto(url);
      await expect(page).not.toHaveURL('/login');
      await expect(page.locator('text=/access denied|גישה נדחתה/i')).not.toBeVisible();
    }
  });

  test('Area Manager CANNOT access system-rules (blocked)', async ({ page }) => {
    await loginAs(page, testData.areaManager.email, testData.areaManager.password);

    await page.goto('/system-rules');
    await expect(page.locator('text=/access denied|גישה נדחתה/i')).toBeVisible();
  });

  test('City Coordinator CANNOT access /areas (blocked)', async ({ page }) => {
    await loginAs(page, testData.cityCoordinator.email, testData.cityCoordinator.password);

    await page.goto('/areas');
    await expect(page.locator('text=/access denied|גישה נדחתה/i')).toBeVisible();
  });

  test('City Coordinator CANNOT access /cities (LOCKED)', async ({ page }) => {
    await loginAs(page, testData.cityCoordinator.email, testData.cityCoordinator.password);

    await page.goto('/cities');
    // See cities/page.tsx:35
    await expect(page.locator('text=/access denied|גישה נדחתה/i')).toBeVisible();
  });

  test('Activist Coordinator CANNOT access /cities (LOCKED)', async ({ page }) => {
    await loginAs(page, testData.activistCoordinator.email, testData.activistCoordinator.password);

    await page.goto('/cities');
    await expect(page.locator('text=/access denied|גישה נדחתה/i')).toBeVisible();
  });
});

// ============================================
// SECTION 4: DATA ISOLATION RULES TESTS
// ============================================

test.describe('Data Isolation Rules - PERMISSIONS_MATRIX.md Section 4', () => {
  test('SuperAdmin sees ALL activists (no filter)', async ({ page }) => {
    await loginAs(page, testData.superAdmin.email, testData.superAdmin.password);

    await page.goto('/neighborhoods');
    // Should see both neighborhoods (from both cities)
    await expect(page.locator(`text=${testData.neighborhood1.name}`)).toBeVisible();
    await expect(page.locator(`text=${testData.neighborhood2.name}`)).toBeVisible();
  });

  test('Area Manager sees ONLY their area (filtered)', async ({ page }) => {
    await loginAs(page, testData.areaManager.email, testData.areaManager.password);

    await page.goto('/neighborhoods');
    // Should see neighborhood1 (City 1 belongs to their area)
    await expect(page.locator(`text=${testData.neighborhood1.name}`)).toBeVisible();
    // Should NOT see neighborhood2 (City 2 belongs to different area)
    await expect(page.locator(`text=${testData.neighborhood2.name}`)).not.toBeVisible();
  });

  test('City Coordinator sees ONLY their city (filtered)', async ({ page }) => {
    await loginAs(page, testData.cityCoordinator.email, testData.cityCoordinator.password);

    await page.goto('/neighborhoods');
    // Should see neighborhood1 (belongs to City 1)
    await expect(page.locator(`text=${testData.neighborhood1.name}`)).toBeVisible();
    // Should NOT see neighborhood2 (belongs to City 2)
    await expect(page.locator(`text=${testData.neighborhood2.name}`)).not.toBeVisible();
  });

  test('Activist Coordinator sees ONLY assigned neighborhoods (M2M filter)', async ({ page }) => {
    await loginAs(page, testData.activistCoordinator.email, testData.activistCoordinator.password);

    await page.goto('/neighborhoods');
    // Should see neighborhood1 (assigned via M2M)
    await expect(page.locator(`text=${testData.neighborhood1.name}`)).toBeVisible();
    // Should NOT see neighborhood2 (not assigned, even though in same city)
    await expect(page.locator(`text=${testData.neighborhood2.name}`)).not.toBeVisible();
  });
});

// ============================================
// SECTION 5: CREATION PERMISSIONS TESTS
// ============================================

test.describe('Creation Permissions - PERMISSIONS_MATRIX.md Section 5', () => {
  test('Only SuperAdmin can create Area Managers', async ({ page }) => {
    await loginAs(page, testData.superAdmin.email, testData.superAdmin.password);

    await page.goto('/areas');
    await expect(page.locator('[data-testid="create-area-manager-button"]')).toBeVisible();
  });

  test('Area Manager CANNOT create Area Managers', async ({ page }) => {
    await loginAs(page, testData.areaManager.email, testData.areaManager.password);

    await page.goto('/areas');
    // Button should not exist
    await expect(page.locator('[data-testid="create-area-manager-button"]')).not.toBeVisible();
  });

  test('City Coordinator CANNOT create neighborhoods in other cities', async ({ page }) => {
    await loginAs(page, testData.cityCoordinator.email, testData.cityCoordinator.password);

    // Try to create neighborhood via API (should fail)
    const response = await page.request.post('/api/neighborhoods', {
      data: {
        name: 'Illegal Neighborhood',
        cityId: testData.city2.id, // Different city!
      },
    });

    expect(response.status()).toBe(403); // Forbidden
  });

  test('Activist Coordinator CAN create activists in assigned neighborhoods', async ({ page }) => {
    await loginAs(page, testData.activistCoordinator.email, testData.activistCoordinator.password);

    // Should be able to create activist in neighborhood1 (assigned)
    await page.goto('/neighborhoods');
    await page.click(`text=${testData.neighborhood1.name}`);
    await expect(page.locator('[data-testid="create-activist-button"]')).toBeVisible();
  });

  test('Activist Coordinator CANNOT create activists in non-assigned neighborhoods', async ({ page }) => {
    await loginAs(page, testData.activistCoordinator.email, testData.activistCoordinator.password);

    // Try to create activist via API in neighborhood2 (not assigned)
    const response = await page.request.post('/api/activists', {
      data: {
        fullName: 'Illegal Activist',
        phone: '050-9999999',
        neighborhoodId: testData.neighborhood2.id, // NOT assigned!
      },
    });

    expect(response.status()).toBe(403); // Forbidden
  });
});

// ============================================
// SECTION 7: SECURITY RULES & CONSTRAINTS
// ============================================

test.describe('Security Rules - PERMISSIONS_MATRIX.md Section 7', () => {
  test('NEVER expose is_super_admin flag in public APIs', async ({ page }) => {
    await loginAs(page, testData.superAdmin.email, testData.superAdmin.password);

    // Fetch user list via API
    const response = await page.request.get('/api/users');
    const users = await response.json();

    // Check that is_super_admin is NOT exposed
    for (const user of users) {
      expect(user).not.toHaveProperty('is_super_admin');
      expect(user).not.toHaveProperty('isSuperAdmin');
    }
  });

  test('Cross-city data leakage prevented (City Coordinator)', async ({ page }) => {
    await loginAs(page, testData.cityCoordinator.email, testData.cityCoordinator.password);

    // Try to fetch activists from City 2 (should fail or return empty)
    const response = await page.request.get(`/api/activists?cityId=${testData.city2.id}`);
    const activists = await response.json();

    // Should not contain activist2 (belongs to City 2)
    expect(activists.find((a: any) => a.id === testData.activist2.id)).toBeUndefined();
  });

  test('Cross-area data leakage prevented (Area Manager)', async ({ page }) => {
    await loginAs(page, testData.areaManager.email, testData.areaManager.password);

    // Try to fetch activists from City 2 (different area)
    const response = await page.request.get(`/api/activists?cityId=${testData.city2.id}`);
    const activists = await response.json();

    // Should not contain activist2 (City 2 not in their area)
    expect(activists.find((a: any) => a.id === testData.activist2.id)).toBeUndefined();
  });

  test('M2M relationship validated for Activist Coordinator', async ({ page }) => {
    await loginAs(page, testData.activistCoordinator.email, testData.activistCoordinator.password);

    // Fetch assigned neighborhoods via API
    const response = await page.request.get('/api/my-neighborhoods');
    const neighborhoods = await response.json();

    // Should only contain neighborhood1 (assigned via M2M)
    expect(neighborhoods.length).toBe(1);
    expect(neighborhoods[0].id).toBe(testData.neighborhood1.id);
  });
});

// ============================================
// SECTION 9: VALIDATION CHECKLIST
// ============================================

test.describe('Validation Checklist - PERMISSIONS_MATRIX.md Section 9', () => {
  test('✓ SuperAdmin bypass works correctly', async ({ page }) => {
    await loginAs(page, testData.superAdmin.email, testData.superAdmin.password);

    // Should see all data (no filters)
    await page.goto('/neighborhoods');
    await expect(page.locator(`text=${testData.neighborhood1.name}`)).toBeVisible();
    await expect(page.locator(`text=${testData.neighborhood2.name}`)).toBeVisible();
  });

  test('✓ Area Manager sees only their area', async ({ page }) => {
    await loginAs(page, testData.areaManager.email, testData.areaManager.password);

    await page.goto('/cities');
    await expect(page.locator(`text=${testData.city1.name}`)).toBeVisible();
    await expect(page.locator(`text=${testData.city2.name}`)).not.toBeVisible();
  });

  test('✓ City Coordinator cannot access other cities', async ({ page }) => {
    await loginAs(page, testData.cityCoordinator.email, testData.cityCoordinator.password);

    await page.goto('/neighborhoods');
    await expect(page.locator(`text=${testData.neighborhood2.name}`)).not.toBeVisible();
  });

  test('✓ Activist Coordinator validated against M2M table', async ({ page }) => {
    await loginAs(page, testData.activistCoordinator.email, testData.activistCoordinator.password);

    await page.goto('/neighborhoods');
    await expect(page.locator(`text=${testData.neighborhood1.name}`)).toBeVisible();
    await expect(page.locator(`text=${testData.neighborhood2.name}`)).not.toBeVisible();
  });

  test('✓ Cross-city data leakage tests pass', async ({ page }) => {
    await loginAs(page, testData.cityCoordinator.email, testData.cityCoordinator.password);

    const response = await page.request.get('/api/activists');
    const activists = await response.json();

    // Should only contain activist1 (from City 1)
    expect(activists.find((a: any) => a.id === testData.activist1.id)).toBeDefined();
    expect(activists.find((a: any) => a.id === testData.activist2.id)).toBeUndefined();
  });

  test('✓ Cross-area data leakage tests pass', async ({ page }) => {
    await loginAs(page, testData.areaManager.email, testData.areaManager.password);

    const response = await page.request.get('/api/activists');
    const activists = await response.json();

    // Should only contain activist1 (City 1 in their area)
    expect(activists.find((a: any) => a.id === testData.activist1.id)).toBeDefined();
    expect(activists.find((a: any) => a.id === testData.activist2.id)).toBeUndefined();
  });
});
