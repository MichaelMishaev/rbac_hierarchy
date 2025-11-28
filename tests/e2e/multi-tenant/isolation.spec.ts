import { test, expect, testUsers } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';

test.describe('Multi-Corporation Isolation', () => {
  test('Manager from Corp1 cannot see Corp2 data', async ({ page, loginAs }) => {
    await loginAs('manager');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Try to navigate to Corp2 data via URL manipulation
    await page.goto(`/corporations/${testUsers.managerCorp2.corporationId}/sites`);

    // Should either get 403 Forbidden or redirect to authorized corporation
    const status = page.url();
    expect(status).not.toContain(testUsers.managerCorp2.corporationId);

    // Verify error message or redirect
    const errorMessage = page.locator('[data-testid="access-denied-message"]');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toContain('Access Denied');
    }
  });

  test('SuperAdmin can switch between corporations', async ({ page, loginAs }) => {
    await loginAs('superAdmin');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Verify corporation selector is visible
    await expect(dashboard.corporationSelector).toBeVisible();

    // Select Corporation 1
    await dashboard.selectCorporation('Corporation 1');

    // Verify data updates for Corp1
    const corp1Sites = await dashboard.getKPIValue('sites');
    expect(corp1Sites).toBeGreaterThan(0);

    // Select Corporation 2
    await dashboard.selectCorporation('Corporation 2');

    // Verify data updates for Corp2 (different values)
    const corp2Sites = await dashboard.getKPIValue('sites');

    // Sites count should be different between corporations
    expect(corp2Sites).not.toBe(corp1Sites);
  });

  test('API requests include correct corporation_id filter', async ({ page, loginAs }) => {
    await loginAs('manager');

    const dashboard = new DashboardPage(page);

    // Set up request interceptor to verify corporation_id in API calls
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

    // Verify all API requests include corporation_id
    const apiRequests = requests.filter(r => r.url.includes('/sites') || r.url.includes('/workers'));

    for (const req of apiRequests) {
      // Check URL or headers contain corporation_id
      const hasCorporationId =
        req.url.includes('corporation_id=') ||
        req.url.includes(`/corporations/${testUsers.manager.corporationId}`);

      expect(hasCorporationId).toBe(true);
    }
  });

  test('Manager cannot create entities in other corporations', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Navigate to create site page
    await page.goto('/sites/new');

    // Fill in site details with different corporation_id via DevTools
    await page.evaluate((corpId) => {
      // Try to inject different corporation_id
      (window as any).__INJECTED_CORP_ID = corpId;
    }, testUsers.managerCorp2.corporationId);

    // Fill form
    await page.fill('[data-testid="site-name"]', 'Malicious Site');
    await page.fill('[data-testid="site-address"]', '123 Test St');

    // Submit form
    await page.click('[data-testid="submit-button"]');

    // Should fail with authorization error
    await expect(page.locator('[data-testid="error-message"]')).toContain('Unauthorized');

    // Verify site was NOT created in Corp2
    await page.goto(`/corporations/${testUsers.managerCorp2.corporationId}/sites`);

    // Should not see the malicious site
    await expect(page.locator(`text=Malicious Site`)).not.toBeVisible();
  });

  test('Audit logs are scoped to corporation', async ({ page, loginAs }) => {
    await loginAs('manager');

    const dashboard = new DashboardPage(page);
    await dashboard.goto();

    // Navigate to audit logs
    await dashboard.navigateToSection('audit-logs');

    // Verify all logs shown belong to the manager's corporation
    const logRows = page.locator('[data-testid="audit-log-row"]');
    const count = await logRows.count();

    for (let i = 0; i < count; i++) {
      const corporationId = await logRows.nth(i).getAttribute('data-corporation-id');
      expect(corporationId).toBe(testUsers.manager.corporationId);
    }
  });

  test('Supervisor can only see assigned sites', async ({ page, loginAs }) => {
    await loginAs('supervisor');

    // Navigate to sites page
    await page.goto('/sites');

    // Get all visible sites
    const siteCards = page.locator('[data-testid="site-card"]');
    const count = await siteCards.count();

    // Verify only assigned sites are visible
    for (let i = 0; i < count; i++) {
      const siteId = await siteCards.nth(i).getAttribute('data-site-id');
      expect(testUsers.supervisor.siteIds).toContain(siteId);
    }

    // Try to access unassigned site via URL
    await page.goto('/sites/999');

    // Should get access denied
    await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();
  });
});
