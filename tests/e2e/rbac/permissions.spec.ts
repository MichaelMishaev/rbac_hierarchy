import { test, expect } from '../fixtures/auth.fixture';
import { DashboardPage } from '../page-objects/DashboardPage';

test.describe('RBAC Permission Enforcement', () => {
  test.describe('SuperAdmin Permissions', () => {
    test('SuperAdmin can create corporations', async ({ page, loginAs }) => {
      await loginAs('superAdmin');

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      // Navigate to corporations section
      await dashboard.navigateToSection('corporations');

      // Click create corporation button
      await page.click('[data-testid="create-corporation-button"]');

      // Fill in corporation details
      await page.fill('[data-testid="corporation-name"]', 'Test Corporation');
      await page.fill('[data-testid="corporation-description"]', 'Test Description');

      // Submit
      await page.click('[data-testid="submit-button"]');

      // Verify success message
      await expect(page.locator('[data-testid="success-message"]')).toContain('Corporation created');
    });

    test('SuperAdmin can access all corporations', async ({ page, loginAs }) => {
      await loginAs('superAdmin');

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      // Verify corporation selector shows all corporations
      await dashboard.corporationSelector.click();

      const options = page.locator('[data-testid="corporation-option"]');
      const count = await options.count();

      expect(count).toBeGreaterThanOrEqual(2); // At least Corp1 and Corp2
    });
  });

  test.describe('Manager Permissions', () => {
    test('Manager can create managers in same corporation', async ({ page, loginAs }) => {
      await loginAs('manager');

      // Navigate to users page
      await page.goto('/users');

      // Click create manager
      await page.click('[data-testid="create-manager-button"]');

      // Fill in manager details
      await page.fill('[data-testid="email"]', 'newmanager@corp1.test');
      await page.fill('[data-testid="full-name"]', 'New Manager');

      // Submit
      await page.click('[data-testid="submit-button"]');

      // Verify success
      await expect(page.locator('[data-testid="success-message"]')).toContain('Manager created');
    });

    test('Manager can create supervisors', async ({ page, loginAs }) => {
      await loginAs('manager');

      await page.goto('/supervisors');

      await page.click('[data-testid="create-supervisor-button"]');

      await page.fill('[data-testid="email"]', 'newsupervisor@corp1.test');
      await page.fill('[data-testid="full-name"]', 'New Supervisor');

      // Select assigned sites
      await page.click('[data-testid="site-selector"]');
      await page.click('[data-testid="site-option-1"]');
      await page.click('[data-testid="site-option-2"]');

      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContain('Supervisor created');
    });

    test('Manager can create sites', async ({ page, loginAs }) => {
      await loginAs('manager');

      await page.goto('/sites');

      await page.click('[data-testid="create-site-button"]');

      await page.fill('[data-testid="site-name"]', 'New Site');
      await page.fill('[data-testid="site-address"]', '456 Manager St');

      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContain('Site created');
    });

    test('Manager can create workers', async ({ page, loginAs }) => {
      await loginAs('manager');

      await page.goto('/workers');

      await page.click('[data-testid="create-worker-button"]');

      await page.fill('[data-testid="full-name"]', 'New Worker');
      await page.fill('[data-testid="phone"]', '050-1234567');

      // Select site
      await page.selectOption('[data-testid="site-select"]', '1');

      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContain('Worker created');
    });

    test('Manager CANNOT create corporations', async ({ page, loginAs }) => {
      await loginAs('manager');

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      // Verify corporations section is not in sidebar
      await expect(dashboard.sidebarCorporations).not.toBeVisible();

      // Try to access via URL
      await page.goto('/corporations/new');

      // Should get 403 or redirect
      await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();
    });
  });

  test.describe('Supervisor Permissions', () => {
    test('Supervisor can create workers in assigned sites only', async ({ page, loginAs }) => {
      await loginAs('supervisor');

      await page.goto('/workers');

      await page.click('[data-testid="create-worker-button"]');

      await page.fill('[data-testid="full-name"]', 'Supervisor Worker');
      await page.fill('[data-testid="phone"]', '050-9876543');

      // Site selector should only show assigned sites
      const siteOptions = page.locator('[data-testid="site-option"]');
      const count = await siteOptions.count();

      expect(count).toBe(2); // Supervisor has 2 assigned sites

      // Select first assigned site
      await page.selectOption('[data-testid="site-select"]', '1');

      await page.click('[data-testid="submit-button"]');

      await expect(page.locator('[data-testid="success-message"]')).toContain('Worker created');
    });

    test('Supervisor CANNOT create managers', async ({ page, loginAs }) => {
      await loginAs('supervisor');

      // Try to access managers page
      await page.goto('/users');

      // Should not see create manager button
      await expect(page.locator('[data-testid="create-manager-button"]')).not.toBeVisible();

      // Try direct access
      await page.goto('/users/new?role=manager');

      await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();
    });

    test('Supervisor CANNOT create supervisors', async ({ page, loginAs }) => {
      await loginAs('supervisor');

      await page.goto('/supervisors');

      await expect(page.locator('[data-testid="create-supervisor-button"]')).not.toBeVisible();
    });

    test('Supervisor CANNOT create sites', async ({ page, loginAs }) => {
      await loginAs('supervisor');

      await page.goto('/sites');

      await expect(page.locator('[data-testid="create-site-button"]')).not.toBeVisible();

      // Try direct access
      await page.goto('/sites/new');

      await expect(page.locator('[data-testid="access-denied-message"]')).toBeVisible();
    });

    test('Supervisor can only view assigned sites', async ({ page, loginAs }) => {
      await loginAs('supervisor');

      await page.goto('/sites');

      // Count visible sites
      const siteCards = page.locator('[data-testid="site-card"]');
      const count = await siteCards.count();

      expect(count).toBe(2); // Only 2 assigned sites
    });
  });

  test.describe('Permission Guards', () => {
    test('Unauthenticated users are redirected to login', async ({ page }) => {
      await page.goto('/dashboard');

      // Should redirect to login
      await expect(page).toHaveURL('/login');
    });

    test('Role-based UI elements are hidden appropriately', async ({ page, loginAs }) => {
      await loginAs('supervisor');

      const dashboard = new DashboardPage(page);
      await dashboard.goto();

      // Verify supervisor cannot see certain sidebar items
      await expect(dashboard.sidebarCorporations).not.toBeVisible();
      await expect(dashboard.sidebarRoles).not.toBeVisible();

      // But can see workers
      await expect(page.locator('[data-testid="sidebar-workers"]')).toBeVisible();
    });
  });
});
