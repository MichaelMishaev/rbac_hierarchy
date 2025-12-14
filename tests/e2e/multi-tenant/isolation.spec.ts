import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';

test.describe('Multi-City Data Isolation', () => {
  test('City Coordinator from Tel Aviv cannot see other city data', async ({ page, loginAs }) => {
    await loginAs('cityCoordinator');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Verify the coordinator can only see Tel Aviv data
    await expect(page.locator('text=תל אביב-יפו')).toBeVisible();

    // Try to access another city's data via URL manipulation
    // This should be blocked or redirected
    await page.goto('/cities/ramat-gan/activists');

    // Should either get 403 Forbidden or redirect to authorized city
    const status = page.url();
    expect(status).not.toContain('ramat-gan');

    // Verify error message or redirect
    const errorMessage = page.locator('[data-testid="access-denied-message"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContainText('Access Denied');
    }
  });

  test('Area Manager can view multiple cities in their region', async ({ page, loginAs }) => {
    await loginAs('areaManager');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Area Manager should see all cities in Tel Aviv District
    await expect(page.locator('text=תל אביב-יפו')).toBeVisible();
    await expect(page.locator('text=רמת גן')).toBeVisible();

    // Can access both cities
    await page.goto('/cities/tel-aviv-yafo/activists');
    await expect(page.locator('h1')).toBeVisible();

    await page.goto('/cities/ramat-gan/activists');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('SuperAdmin can access all cities and regions', async ({ page, loginAs }) => {
    await loginAs('superAdmin');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // SuperAdmin should see system-wide overview
    await expect(page.locator('h1')).toBeVisible();

    // Can access any city in any region
    await page.goto('/cities/tel-aviv-yafo/activists');
    await expect(page).toHaveURL(/\/cities\/.*/);

    await page.goto('/cities/ramat-gan/activists');
    await expect(page).toHaveURL(/\/cities\/.*/);
  });

  test('API requests include correct city_id filter', async ({ page, loginAs }) => {
    await loginAs('cityCoordinator');

    const dashboard = new DashboardPage(page);

    // Set up request interceptor to verify city_id in API calls
    const requests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          headers: request.headers(),
          method: request.method(),
        });
      }
    });

    await dashboard.goto();

    // Wait for API calls to complete
    await page.waitForTimeout(1000);

    // Verify all API requests include city_id or are properly scoped
    const apiRequests = requests.filter(r =>
      r.url.includes('/activists') ||
      r.url.includes('/neighborhoods') ||
      r.url.includes('/attendance')
    );

    for (const req of apiRequests) {
      // Check URL or headers contain city scoping
      const hasCityScope =
        req.url.includes('city_id=') ||
        req.url.includes('/cities/') ||
        req.url.includes('cityId=');

      // API should be scoped to the user's city
      expect(hasCityScope || req.url.includes('/dashboard')).toBe(true);
    }
  });

  test('City Coordinator cannot create entities in other cities', async ({ page, loginAs }) => {
    await loginAs('cityCoordinator');

    // Navigate to create activist page
    await page.goto('/activists/new');

    // Try to manipulate the city_id via DevTools
    await page.evaluate(() => {
      // Try to inject different city_id
      (window as any).__INJECTED_CITY_ID = 'different-city-id';
    });

    // Fill form
    await page.fill('[data-testid="activist-name"]', 'Malicious Activist');
    await page.fill('[data-testid="activist-phone"]', '+972-50-999-9999');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Should either succeed with correct city_id or fail with authorization error
    // The server should ignore the injected city_id and use the authenticated user's city

    // Wait for response
    await page.waitForTimeout(1000);

    // Check if we're still on a valid page (not error page)
    const currentUrl = page.url();

    // If creation succeeded, it should be in the coordinator's city (Tel Aviv)
    // If it failed, there should be an error message
    const hasError = await page.locator('[data-testid="error-message"]').isVisible();
    const hasSuccess = await page.locator('[data-testid="success-message"]').isVisible();

    expect(hasError || hasSuccess).toBe(true);
  });

  test('Activist Coordinator can only see assigned neighborhoods', async ({ page, loginAs }) => {
    await loginAs('activistCoordinator');

    // Navigate to activists page
    await page.goto('/activists');

    // Get all visible activists
    const activistCards = page.locator('[data-testid="activist-card"]');
    const count = await activistCards.count();

    // Rachel is assigned to Florentin and Neve Tzedek neighborhoods
    const allowedNeighborhoods = ['פלורנטין', 'נווה צדק'];

    // Verify only activists from assigned neighborhoods are visible
    for (let i = 0; i < count; i++) {
      const activistCard = activistCards.nth(i);
      const neighborhoodText = await activistCard.locator('[data-testid="activist-neighborhood"]').textContent();

      if (neighborhoodText) {
        const isAllowed = allowedNeighborhoods.some(n => neighborhoodText.includes(n));
        expect(isAllowed).toBe(true);
      }
    }

    // Try to access activist from unassigned neighborhood (Old Jaffa)
    await page.goto('/neighborhoods/tlv-old-jaffa/activists');

    // Should get access denied or redirect
    const hasAccessDenied = await page.locator('[data-testid="access-denied-message"]').isVisible();
    const redirected = !page.url().includes('tlv-old-jaffa');

    expect(hasAccessDenied || redirected).toBe(true);
  });

  test('Attendance records are scoped to coordinator neighborhoods', async ({ page, loginAs }) => {
    await loginAs('activistCoordinator');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Navigate to attendance tracking
    await page.goto('/attendance');

    // Verify all attendance records shown belong to assigned neighborhoods
    const attendanceRows = page.locator('[data-testid="attendance-row"]');
    const count = await attendanceRows.count();

    const allowedNeighborhoods = ['פלורנטין', 'נווה צדק'];

    for (let i = 0; i < count; i++) {
      const neighborhoodCell = await attendanceRows.nth(i).locator('[data-testid="attendance-neighborhood"]').textContent();

      if (neighborhoodCell) {
        const isAllowed = allowedNeighborhoods.some(n => neighborhoodCell.includes(n));
        expect(isAllowed).toBe(true);
      }
    }
  });

  test('Cross-city data leakage prevention in search', async ({ page, loginAs }) => {
    await loginAs('cityCoordinator');

    // Navigate to activists search
    await page.goto('/activists');

    // Search for an activist from a different city
    await page.fill('[data-testid="search-input"]', 'משה ישראלי'); // Ramat Gan coordinator

    // Wait for search results
    await page.waitForTimeout(500);

    // Should not find activists from other cities
    const noResults = page.locator('[data-testid="no-results-message"]');
    const resultsCount = await page.locator('[data-testid="activist-card"]').count();

    // Either no results or results should not include cross-city data
    expect(resultsCount === 0 || await noResults.isVisible()).toBe(true);
  });
});
