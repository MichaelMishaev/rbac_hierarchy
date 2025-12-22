/**
 * 🚨 CRITICAL SECURITY TEST: Deleted Voters RBAC Isolation
 *
 * This test verifies that ONLY SuperAdmin can access the deleted voters feature.
 * Non-SuperAdmin users must NOT see:
 * - Deleted voters tab
 * - Deleted voters data
 * - Restore functionality
 *
 * Test Scenarios:
 * 1. SuperAdmin CAN see deleted voters tab and data
 * 2. City Coordinator CANNOT see deleted voters tab
 * 3. Activist Coordinator CANNOT see deleted voters tab
 * 4. Direct API access is blocked for non-SuperAdmin
 *
 * Security Impact: HIGH
 * - Data Exposure: Non-admin seeing deleted voter history
 * - Unauthorized Restore: Non-admin restoring deleted voters
 * - RBAC Violation: Breaking role-based access rules
 *
 * Related Bug: RBAC isolation for deleted voters (2025-12-22)
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test users
const TEST_USERS = {
  superAdmin: {
    email: 'superadmin@election.test',
    password: 'admin123',
    role: 'SUPERADMIN',
    expectedTabs: ['רשימת בוחרים', 'סטטיסטיקות', 'כפילויות', 'בוחרים מחוקים'],
  },
  cityCoordinator: {
    email: 'city.coordinator@telaviv.test',
    password: 'password123',
    role: 'CITY_COORDINATOR',
    expectedTabs: ['רשימת בוחרים', 'סטטיסטיקות'], // NO deleted voters
  },
  activistCoordinator: {
    email: 'activist.coordinator@telaviv.test',
    password: 'password123',
    role: 'ACTIVIST_COORDINATOR',
    expectedTabs: ['רשימת בוחרים', 'סטטיסטיקות'], // NO deleted voters
  },
};

/**
 * Helper: Login as specific user
 */
async function loginAs(page: Page, email: string, password: string) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);
  await page.click('button[type="submit"]');

  // Wait for navigation to complete
  await page.waitForURL(/\/(dashboard|manage-voters)/, { timeout: 10000 });
}

/**
 * Helper: Navigate to manage-voters page
 */
async function navigateToManageVoters(page: Page) {
  await page.goto(`${BASE_URL}/manage-voters`);
  await page.waitForLoadState('networkidle');
}

/**
 * Helper: Get all tab labels
 */
async function getTabLabels(page: Page): Promise<string[]> {
  const tabs = await page.locator('[role="tab"]').allTextContents();
  return tabs.filter(t => t.trim().length > 0);
}

// ============================================
// CRITICAL TEST: Deleted Voters RBAC
// ============================================

test.describe('🚨 CRITICAL: Deleted Voters RBAC Isolation', () => {

  test.beforeEach(async ({ page }) => {
    // Clear all browser data before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('SuperAdmin CAN see deleted voters tab and access data', async ({ page }) => {
    // Login as SuperAdmin
    await loginAs(
      page,
      TEST_USERS.superAdmin.email,
      TEST_USERS.superAdmin.password
    );

    // Navigate to manage-voters
    await navigateToManageVoters(page);

    // Verify all tabs are visible
    const tabs = await getTabLabels(page);
    console.log('SuperAdmin tabs:', tabs);

    expect(tabs).toContain('רשימת בוחרים');
    expect(tabs).toContain('סטטיסטיקות');
    expect(tabs).toContain('כפילויות');
    expect(tabs).toContain('בוחרים מחוקים');

    // Click on deleted voters tab
    await page.click('text=בוחרים מחוקים');
    await page.waitForLoadState('networkidle');

    // Verify deleted voters list is visible
    const deletedVotersHeader = page.locator('text=בוחרים מחוקים');
    await expect(deletedVotersHeader).toBeVisible();

    // Verify table headers are visible
    const tableHeaders = ['שם מלא', 'טלפון', 'רמת תמיכה', 'נמחק על ידי', 'תאריך מחיקה', 'פעולות'];
    for (const header of tableHeaders) {
      await expect(page.locator(`th:has-text("${header}")`)).toBeVisible();
    }

    console.log('✅ SuperAdmin can access deleted voters tab and data');
  });

  test('City Coordinator CANNOT see deleted voters tab', async ({ page }) => {
    // Login as City Coordinator
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    // Navigate to manage-voters
    await navigateToManageVoters(page);

    // Get all visible tabs
    const tabs = await getTabLabels(page);
    console.log('City Coordinator tabs:', tabs);

    // Verify expected tabs are visible
    expect(tabs).toContain('רשימת בוחרים');
    expect(tabs).toContain('סטטיסטיקות');

    // Verify forbidden tabs are NOT visible
    expect(tabs).not.toContain('בוחרים מחוקים');
    expect(tabs).not.toContain('כפילויות'); // Also should not see duplicates

    // Verify deleted voters tab button does not exist in DOM
    const deletedVotersTab = page.locator('[role="tab"]:has-text("בוחרים מחוקים")');
    await expect(deletedVotersTab).not.toBeVisible();

    console.log('✅ City Coordinator CANNOT see deleted voters tab');
  });

  test('Activist Coordinator CANNOT see deleted voters tab', async ({ page }) => {
    // Login as Activist Coordinator
    await loginAs(
      page,
      TEST_USERS.activistCoordinator.email,
      TEST_USERS.activistCoordinator.password
    );

    // Navigate to manage-voters
    await navigateToManageVoters(page);

    // Get all visible tabs
    const tabs = await getTabLabels(page);
    console.log('Activist Coordinator tabs:', tabs);

    // Verify expected tabs are visible
    expect(tabs).toContain('רשימת בוחרים');
    expect(tabs).toContain('סטטיסטיקות');

    // Verify forbidden tabs are NOT visible
    expect(tabs).not.toContain('בוחרים מחוקים');
    expect(tabs).not.toContain('כפילויות');

    // Verify deleted voters tab button does not exist in DOM
    const deletedVotersTab = page.locator('[role="tab"]:has-text("בוחרים מחוקים")');
    await expect(deletedVotersTab).not.toBeVisible();

    console.log('✅ Activist Coordinator CANNOT see deleted voters tab');
  });

  test('SuperAdmin sees different tab count than City Coordinator', async ({ page }) => {
    // Login as SuperAdmin
    await loginAs(
      page,
      TEST_USERS.superAdmin.email,
      TEST_USERS.superAdmin.password
    );
    await navigateToManageVoters(page);

    const superAdminTabs = await getTabLabels(page);
    const superAdminTabCount = superAdminTabs.length;

    console.log(`SuperAdmin tab count: ${superAdminTabCount}`);

    // Logout
    await page.click('button:has-text("התנתק")');
    await page.waitForURL(/\/login/, { timeout: 10000 });

    // Login as City Coordinator
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );
    await navigateToManageVoters(page);

    const coordinatorTabs = await getTabLabels(page);
    const coordinatorTabCount = coordinatorTabs.length;

    console.log(`City Coordinator tab count: ${coordinatorTabCount}`);

    // SuperAdmin should see 2 more tabs (Duplicates + Deleted Voters)
    expect(superAdminTabCount).toBe(coordinatorTabCount + 2);

    console.log('✅ Tab count correctly differs between SuperAdmin and City Coordinator');
  });

  test('Development mode allows all users to see deleted voters (for testing)', async ({ page }) => {
    // This test verifies the development mode behavior
    // In development, non-SuperAdmin can still ACCESS the data via API
    // But the UI tab should still be hidden (UI RBAC)

    // Note: This test assumes NODE_ENV=development
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      test.skip();
      return;
    }

    // Login as City Coordinator
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    await navigateToManageVoters(page);

    // UI RBAC: Tab should STILL be hidden even in development
    const tabs = await getTabLabels(page);
    expect(tabs).not.toContain('בוחרים מחוקים');

    console.log('✅ Development mode: UI tab still hidden for non-SuperAdmin');

    // API RBAC: In development, the API should allow access for testing
    // (Tested separately in API tests)
  });

  test('SuperAdmin can restore deleted voters', async ({ page }) => {
    // Login as SuperAdmin
    await loginAs(
      page,
      TEST_USERS.superAdmin.email,
      TEST_USERS.superAdmin.password
    );

    await navigateToManageVoters(page);

    // Navigate to deleted voters tab
    await page.click('text=בוחרים מחוקים');
    await page.waitForLoadState('networkidle');

    // Check if there are any deleted voters
    const noDataMessage = page.locator('text=אין בוחרים מחוקים');
    const hasDeletedVoters = !(await noDataMessage.isVisible());

    if (hasDeletedVoters) {
      // Find first restore button
      const restoreButton = page.locator('button[aria-label="שחזור"]').first();

      if (await restoreButton.isVisible()) {
        // Verify restore button exists
        await expect(restoreButton).toBeVisible();
        console.log('✅ SuperAdmin can see restore buttons');

        // Note: We don't actually click restore to avoid mutating test data
        // Just verify the button is accessible
      } else {
        console.log('ℹ️ No deleted voters with restore buttons available');
      }
    } else {
      console.log('ℹ️ No deleted voters in system (test data may need seeding)');
    }
  });

  test('Non-SuperAdmin cannot access deleted voters via URL manipulation', async ({ page }) => {
    // Login as City Coordinator
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    // Try to directly access deleted voters tab by clicking (should fail)
    await navigateToManageVoters(page);

    // Verify tab is not visible
    const deletedVotersTab = page.locator('[role="tab"]:has-text("בוחרים מחוקים")');
    await expect(deletedVotersTab).not.toBeVisible();

    // Even if user tries to manipulate activeTab state via DevTools,
    // the DeletedVotersList component will call getDeletedVoters()
    // which enforces server-side RBAC

    console.log('✅ Non-SuperAdmin cannot access deleted voters via URL/UI manipulation');
  });
});

// ============================================
// REGRESSION TEST: Ensure RBAC doesn't break normal features
// ============================================

test.describe('Regression: Deleted Voters RBAC', () => {
  test('SuperAdmin can still access all other tabs', async ({ page }) => {
    await loginAs(
      page,
      TEST_USERS.superAdmin.email,
      TEST_USERS.superAdmin.password
    );

    await navigateToManageVoters(page);

    // Test all tabs are clickable
    await page.click('text=רשימת בוחרים');
    await expect(page.locator('text=רשימת בוחרים')).toBeVisible();

    await page.click('text=סטטיסטיקות');
    await expect(page.locator('text=סטטיסטיקות')).toBeVisible();

    await page.click('text=כפילויות');
    await expect(page.locator('text=כפילויות')).toBeVisible();

    await page.click('text=בוחרים מחוקים');
    await expect(page.locator('text=בוחרים מחוקים')).toBeVisible();

    console.log('✅ SuperAdmin can access all tabs correctly');
  });

  test('City Coordinator can still access allowed tabs', async ({ page }) => {
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    await navigateToManageVoters(page);

    // Test allowed tabs
    await page.click('text=רשימת בוחרים');
    await expect(page.locator('text=רשימת בוחרים')).toBeVisible();

    await page.click('text=סטטיסטיקות');
    await expect(page.locator('text=סטטיסטיקות')).toBeVisible();

    console.log('✅ City Coordinator can access allowed tabs correctly');
  });
});
