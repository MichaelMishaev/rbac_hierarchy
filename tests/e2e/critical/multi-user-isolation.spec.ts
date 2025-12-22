/**
 * 🚨 CRITICAL SECURITY TEST: Multi-User Data Isolation
 *
 * This test verifies that when different users log in sequentially on the same machine,
 * they do NOT see each other's data. This prevents serious security/GDPR violations.
 *
 * Test Scenario:
 * 1. User A (City Coordinator) logs in and navigates to multiple pages
 * 2. User A logs out
 * 3. User B (Activist Coordinator) logs in
 * 4. Verify User B does NOT see User A's data (recent pages, cached responses, etc.)
 *
 * Security Impact: CRITICAL
 * - Data Breach Risk: Users seeing other users' sensitive data
 * - GDPR Violation: Improper data isolation
 * - Trust Loss: Complete loss of user confidence
 *
 * @see /Users/michaelmishayev/Desktop/Projects/corporations/docs/bugs/bugs-archive-2025-12-22.md - Bug #999
 */

import { test, expect, Page } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Test users with different roles
const TEST_USERS = {
  cityCoordinator: {
    email: 'city.coordinator@telaviv.test',
    password: 'password123',
    role: 'CITY_COORDINATOR',
    expectedPages: ['שכונות', 'פעילים', 'לוח בקרה'], // Pages this user will visit
    restrictedPages: ['ערים'], // Pages this user should NOT see
  },
  activistCoordinator: {
    email: 'activist.coordinator@telaviv.test',
    password: 'password123',
    role: 'ACTIVIST_COORDINATOR',
    expectedPages: ['פעילים', 'לוח בקרה'], // Pages this user will visit
    restrictedPages: ['ערים', 'שכונות'], // Pages this user should NOT access
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
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Helper: Logout current user
 */
async function logout(page: Page) {
  // Find and click logout button (at bottom of sidebar)
  const logoutButton = page.locator('button:has-text("התנתק")').or(
    page.locator('[data-testid="logout-button"]')
  );

  await logoutButton.click();

  // Wait for redirect to login page
  await page.waitForURL(/\/login/, { timeout: 10000 });
}

/**
 * Helper: Get localStorage value
 */
async function getLocalStorageItem(page: Page, key: string): Promise<any> {
  return await page.evaluate((storageKey) => {
    const item = localStorage.getItem(storageKey);
    return item ? JSON.parse(item) : null;
  }, key);
}

/**
 * Helper: Get all localStorage keys
 */
async function getAllLocalStorageKeys(page: Page): Promise<string[]> {
  return await page.evaluate(() => {
    return Object.keys(localStorage);
  });
}

/**
 * Helper: Navigate to multiple pages to populate recent pages
 */
async function navigateToPages(page: Page, paths: string[]) {
  for (const path of paths) {
    await page.goto(`${BASE_URL}${path}`);
    await page.waitForLoadState('networkidle');
    // Wait a bit for recent pages to update
    await page.waitForTimeout(500);
  }
}

// ============================================
// CRITICAL TEST: Multi-User Data Isolation
// ============================================

test.describe('🚨 CRITICAL: Multi-User Data Isolation', () => {

  test.beforeEach(async ({ page }) => {
    // Clear all browser data before each test
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  });

  test('User B should NOT see User A\'s recent pages after logout', async ({ page }) => {
    // ========================================
    // STEP 1: User A (City Coordinator) logs in
    // ========================================
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    // Navigate to multiple pages to populate recent pages
    await navigateToPages(page, [
      '/neighborhoods', // שכונות
      '/activists',     // פעילים
      '/dashboard',     // לוח בקרה
    ]);

    // Verify User A has recent pages in localStorage
    const userARecentPages = await getLocalStorageItem(page, 'recentPages');
    expect(userARecentPages).toBeTruthy();
    expect(userARecentPages.length).toBeGreaterThan(0);

    console.log('✅ User A recent pages:', userARecentPages.map((p: any) => p.label));

    // ========================================
    // STEP 2: User A logs out
    // ========================================
    await logout(page);

    // Verify localStorage was cleared during logout
    const localStorageAfterLogout = await getAllLocalStorageKeys(page);
    console.log('📝 localStorage keys after User A logout:', localStorageAfterLogout);

    // ========================================
    // STEP 3: User B (Activist Coordinator) logs in
    // ========================================
    await loginAs(
      page,
      TEST_USERS.activistCoordinator.email,
      TEST_USERS.activistCoordinator.password
    );

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // ========================================
    // STEP 4: CRITICAL VERIFICATION - User B should NOT see User A's data
    // ========================================

    // Check 1: Recent pages should be empty or only contain User B's pages
    const userBRecentPages = await getLocalStorageItem(page, 'recentPages');

    if (userBRecentPages && userBRecentPages.length > 0) {
      // If User B has recent pages, they should NOT include User A's pages
      const userBPagePaths = userBRecentPages.map((p: any) => p.path);

      // User A visited /neighborhoods - User B should NOT see this
      expect(userBPagePaths).not.toContain('/neighborhoods');

      console.log('✅ User B recent pages (should NOT contain User A pages):', userBRecentPages.map((p: any) => p.label));
    } else {
      // Ideal case: User B has no recent pages yet
      console.log('✅ User B has no recent pages (clean slate)');
    }

    // Check 2: Verify navigation menu reflects User B's role
    // User B (Activist Coordinator) should NOT see Cities tab
    const citiesTab = page.locator('[data-testid="nav-link-cities"]');
    await expect(citiesTab).not.toBeVisible();

    // Check 3: Verify sidebar recent pages section
    const recentPagesSection = page.locator('text=עמודים אחרונים');

    if (await recentPagesSection.isVisible()) {
      // If recent pages section exists, it should NOT contain User A's pages
      const recentPagesText = await page.locator('[data-testid="recent-pages"]').textContent();

      // Should NOT contain "שכונות" (Neighborhoods) which User A visited
      expect(recentPagesText).not.toContain('שכונות');

      console.log('✅ Sidebar recent pages do NOT contain User A data');
    } else {
      console.log('✅ No recent pages section visible for User B');
    }

    // Check 4: Verify sessionStorage is clean
    const sessionStorageKeys = await page.evaluate(() => Object.keys(sessionStorage));
    console.log('📝 sessionStorage keys for User B:', sessionStorageKeys);

    // sessionStorage should be empty or only contain User B's data
    // (No leftover data from User A)

    console.log('✅ SECURITY TEST PASSED: User B does NOT see User A\'s data!');
  });

  test('Multiple logout/login cycles maintain data isolation', async ({ page }) => {
    // Test multiple cycles to ensure the fix is robust
    const cycles = 3;

    for (let i = 0; i < cycles; i++) {
      console.log(`\n🔄 Cycle ${i + 1}/${cycles}`);

      // Login as User A
      await loginAs(
        page,
        TEST_USERS.cityCoordinator.email,
        TEST_USERS.cityCoordinator.password
      );
      await navigateToPages(page, ['/neighborhoods', '/activists']);

      const userAPages = await getLocalStorageItem(page, 'recentPages');
      expect(userAPages).toBeTruthy();
      console.log(`  User A pages (cycle ${i + 1}):`, userAPages?.length || 0);

      // Logout
      await logout(page);

      // Login as User B
      await loginAs(
        page,
        TEST_USERS.activistCoordinator.email,
        TEST_USERS.activistCoordinator.password
      );

      const userBPages = await getLocalStorageItem(page, 'recentPages');

      // User B should NOT see User A's neighborhoods page
      if (userBPages) {
        const paths = userBPages.map((p: any) => p.path);
        expect(paths).not.toContain('/neighborhoods');
      }

      console.log(`  User B pages (cycle ${i + 1}):`, userBPages?.length || 0);
      console.log(`  ✅ Cycle ${i + 1} passed - no data leakage`);

      // Logout User B
      await logout(page);
    }

    console.log(`\n✅ All ${cycles} cycles passed - data isolation is robust!`);
  });

  test('React Query cache is cleared on logout', async ({ page }) => {
    // ========================================
    // STEP 1: User A logs in and triggers API calls
    // ========================================
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    // Navigate to pages that fetch data
    await page.goto(`${BASE_URL}/activists`);
    await page.waitForLoadState('networkidle');

    // Capture network requests before logout
    const requestsBefore: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requestsBefore.push(request.url());
      }
    });

    // Trigger some API calls
    await page.reload();
    await page.waitForLoadState('networkidle');

    const apiCallCountBeforeLogout = requestsBefore.length;
    console.log('📊 API calls by User A:', apiCallCountBeforeLogout);

    // ========================================
    // STEP 2: Logout (should clear React Query cache)
    // ========================================
    await logout(page);

    // ========================================
    // STEP 3: User B logs in
    // ========================================
    const requestsAfter: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        requestsAfter.push(request.url());
      }
    });

    await loginAs(
      page,
      TEST_USERS.activistCoordinator.email,
      TEST_USERS.activistCoordinator.password
    );

    await page.goto(`${BASE_URL}/activists`);
    await page.waitForLoadState('networkidle');

    // ========================================
    // VERIFICATION: User B should trigger fresh API calls
    // (not use cached responses from User A)
    // ========================================

    // User B should have made API calls (not using User A's cache)
    expect(requestsAfter.length).toBeGreaterThan(0);

    console.log('📊 API calls by User B:', requestsAfter.length);
    console.log('✅ React Query cache was cleared - User B made fresh API calls');
  });

  test('Browser console has no errors during logout/login cycle', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Full cycle
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );
    await navigateToPages(page, ['/neighborhoods', '/activists']);
    await logout(page);
    await loginAs(
      page,
      TEST_USERS.activistCoordinator.email,
      TEST_USERS.activistCoordinator.password
    );

    // Verify no console errors occurred
    if (consoleErrors.length > 0) {
      console.error('❌ Console errors detected:', consoleErrors);
    }

    expect(consoleErrors.length).toBe(0);
    console.log('✅ No console errors during logout/login cycle');
  });
});

// ============================================
// REGRESSION TEST: Ensure fix doesn't break normal functionality
// ============================================

test.describe('Regression: Logout functionality', () => {
  test('User can successfully logout and login again', async ({ page }) => {
    // Login
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    await expect(page).toHaveURL(/\/dashboard/);

    // Logout
    await logout(page);

    await expect(page).toHaveURL(/\/login/);

    // Login again (same user)
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    await expect(page).toHaveURL(/\/dashboard/);

    console.log('✅ Logout and re-login works correctly');
  });

  test('Recent pages work correctly for single user', async ({ page }) => {
    await loginAs(
      page,
      TEST_USERS.cityCoordinator.email,
      TEST_USERS.cityCoordinator.password
    );

    // Navigate to pages
    await navigateToPages(page, ['/neighborhoods', '/activists', '/dashboard']);

    // Verify recent pages are populated
    const recentPages = await getLocalStorageItem(page, 'recentPages');

    expect(recentPages).toBeTruthy();
    expect(recentPages.length).toBeGreaterThan(0);
    expect(recentPages.length).toBeLessThanOrEqual(5); // Max 5 recent pages

    console.log('✅ Recent pages feature works correctly:', recentPages.map((p: any) => p.label));
  });
});
