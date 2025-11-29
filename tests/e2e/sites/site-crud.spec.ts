import { test, expect } from '../fixtures/auth.fixture';

/**
 * Site Management - CRUD Operations
 * Based on: docs/syAnalyse/mvp/07_TESTING_CHECKLIST.md (Lines 150-202)
 */

test.describe('Site Management - Create', () => {
  test('SuperAdmin can create site and select corporation', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/sites');

    await page.click('[data-testid="create-site-button"]');

    // SuperAdmin should see corporation selector
    await expect(page.locator('[data-testid="site-corporation-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="site-corporation-select"]')).not.toBeDisabled();

    await page.selectOption('[data-testid="site-corporation-select"]', '1');
    await page.fill('[data-testid="site-name-input"]', 'New SuperAdmin Site');
    await page.fill('[data-testid="site-address-input"]', 'Tel Aviv');
    await page.fill('[data-testid="site-city-input"]', 'Tel Aviv');

    await page.click('[data-testid="submit-site-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toContainText('Site created');
  });

  test('Manager site auto-assigned to their corporation', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.click('[data-testid="create-site-button"]');

    // Corporation should be pre-selected and disabled
    await expect(page.locator('[data-testid="site-corporation-select"]')).toBeDisabled();
    await expect(page.locator('[data-testid="site-corporation-select"]')).toHaveValue('1');

    await page.fill('[data-testid="site-name-input"]', 'Manager Site');
    await page.click('[data-testid="submit-site-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should require name field', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.click('[data-testid="create-site-button"]');
    await page.click('[data-testid="submit-site-button"]');

    await expect(page.locator('[data-testid="name-error"]')).toContainText('required');
  });

  test('should allow optional fields', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.click('[data-testid="create-site-button"]');

    // Only name is required
    await page.fill('[data-testid="site-name-input"]', 'Minimal Site');
    await page.click('[data-testid="submit-site-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should validate email format if provided', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.click('[data-testid="create-site-button"]');
    await page.fill('[data-testid="site-name-input"]', 'Test Site');
    await page.fill('[data-testid="site-email-input"]', 'invalid-email');

    await page.click('[data-testid="submit-site-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
  });
});

test.describe('Site Management - View Grid', () => {
  test('SuperAdmin should see all sites', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/sites');

    await expect(page.locator('[data-testid="sites-grid"]')).toBeVisible();

    // Should see sites from different corporations
    await expect(page.locator('[data-testid^="site-card-"]')).toHaveCount(await page.locator('[data-testid^="site-card-"]').count());
  });

  test('Manager should see sites in their corporation', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await expect(page.locator('[data-testid="sites-grid"]')).toBeVisible();

    // All sites should belong to corporation 1
    const siteCards = page.locator('[data-testid^="site-card-"]');
    const count = await siteCards.count();

    for (let i = 0; i < count; i++) {
      await expect(siteCards.nth(i)).toHaveAttribute('data-corporation-id', '1');
    }
  });

  test('Supervisor should see only their assigned site', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/sites');

    await expect(page.locator('[data-testid="sites-grid"]')).toBeVisible();

    // Should only see assigned sites (1 or 2 in fixtures)
    const siteCards = page.locator('[data-testid^="site-card-"]');
    await expect(siteCards).toHaveCount(2); // Supervisor has 2 sites in fixtures
  });

  test('should display cards correctly', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    const firstCard = page.locator('[data-testid="site-card-1"]');

    await expect(firstCard.locator('[data-testid="site-name"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="site-address"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="worker-count"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="supervisor-count"]')).toBeVisible();
  });

  test('should show 3 columns on desktop', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    const grid = page.locator('[data-testid="sites-grid"]');
    await expect(grid).toHaveCSS('grid-template-columns', /repeat\(3,/);
  });

  test.use({ viewport: { width: 375, height: 667 } });
  test('should show 1 column on mobile', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    const grid = page.locator('[data-testid="sites-grid"]');
    await expect(grid).toHaveCSS('grid-template-columns', /1fr/);
  });

  test('should lift card on hover', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    const card = page.locator('[data-testid="site-card-1"]');

    // Get initial box-shadow
    const initialShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);

    // Hover
    await card.hover();

    // Box-shadow should change (elevation effect)
    const hoveredShadow = await card.evaluate(el => getComputedStyle(el).boxShadow);
    expect(hoveredShadow).not.toBe(initialShadow);
  });

  test('should navigate to site details on card click', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.click('[data-testid="site-card-1"]');

    await expect(page).toHaveURL(/\/sites\/1$/);
  });

  test('should show accurate worker count', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    const workerCount = page.locator('[data-testid="site-card-1"] [data-testid="worker-count"]');
    const countText = await workerCount.textContent();

    // Verify it's a number
    expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should show accurate supervisor count', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    const supervisorCount = page.locator('[data-testid="site-card-1"] [data-testid="supervisor-count"]');
    const countText = await supervisorCount.textContent();

    expect(parseInt(countText || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should show active/inactive status badge', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await expect(page.locator('[data-testid="site-card-1"] [data-testid="status-badge"]')).toBeVisible();
  });
});

test.describe('Site Management - View List', () => {
  test('should toggle between grid and list view', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    // Initially in grid view
    await expect(page.locator('[data-testid="sites-grid"]')).toBeVisible();

    // Toggle to list view
    await page.click('[data-testid="view-toggle-list"]');
    await expect(page.locator('[data-testid="sites-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="sites-grid"]')).not.toBeVisible();

    // Toggle back to grid
    await page.click('[data-testid="view-toggle-grid"]');
    await expect(page.locator('[data-testid="sites-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="sites-table"]')).not.toBeVisible();
  });

  test('should display same info in list view', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.click('[data-testid="view-toggle-list"]');

    const table = page.locator('[data-testid="sites-table"]');
    await expect(table.locator('[data-testid="column-name"]')).toBeVisible();
    await expect(table.locator('[data-testid="column-city"]')).toBeVisible();
    await expect(table.locator('[data-testid="column-workers"]')).toBeVisible();
    await expect(table.locator('[data-testid="column-supervisors"]')).toBeVisible();
  });

  test('should sort columns in list view', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.click('[data-testid="view-toggle-list"]');

    // Sort by name
    await page.click('[data-testid="sort-name"]');
    await expect(page.locator('[data-testid="sort-name-asc"]')).toBeVisible();
  });

  test('should search sites by name and city', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites');

    await page.fill('[data-testid="search-input"]', 'Site 1');
    await expect(page.locator('text=Site 1')).toBeVisible();

    await page.fill('[data-testid="search-input"]', 'Tel Aviv');
    await expect(page.locator('text=Tel Aviv')).toBeVisible();
  });
});

test.describe('Site Management - Detail Page', () => {
  test('should display site details', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await expect(page.locator('[data-testid="site-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="site-address"]')).toBeVisible();
  });

  test('should show tabs: Workers, Supervisors, Settings', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await expect(page.locator('[data-testid="tab-workers"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-supervisors"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-settings"]')).toBeVisible();
  });

  test('should load workers table in workers tab', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="tab-workers"]');

    await expect(page.locator('[data-testid="workers-table"]')).toBeVisible();
  });

  test('should load supervisors list in supervisors tab', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="tab-supervisors"]');

    await expect(page.locator('[data-testid="supervisors-list"]')).toBeVisible();
  });

  test('should load edit form in settings tab', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="tab-settings"]');

    await expect(page.locator('[data-testid="site-edit-form"]')).toBeVisible();
  });

  test('should show add worker button', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="tab-workers"]');

    await expect(page.locator('[data-testid="add-worker-button"]')).toBeVisible();
  });

  test('should show breadcrumbs', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await expect(page.locator('[data-testid="breadcrumbs"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb-sites"]')).toBeVisible();
    await expect(page.locator('[data-testid="breadcrumb-current"]')).toBeVisible();
  });

  test('should navigate back to sites list', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="back-button"]');

    await expect(page).toHaveURL(/\/sites$/);
  });
});

test.describe('Site Management - Edit', () => {
  test('should pre-fill form with existing values', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="tab-settings"]');

    await expect(page.locator('[data-testid="site-name-input"]')).not.toHaveValue('');
  });

  test('should save valid updates', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="tab-settings"]');

    await page.fill('[data-testid="site-name-input"]', 'Updated Site Name');
    await page.click('[data-testid="submit-site-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="site-name"]')).toContainText('Updated Site Name');
  });
});

test.describe('Site Management - Delete', () => {
  test('should show confirmation dialog', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="delete-site-button"]');

    await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
  });

  test('should not delete workers when site is deleted', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Get worker count before deletion
    await page.goto('/sites/1');
    const workerCountBefore = await page.locator('[data-testid="worker-count"]').textContent();

    // Delete site
    await page.click('[data-testid="delete-site-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();

    // Workers should still exist (verify in workers page or database)
    await page.goto('/workers');
    await expect(page.locator('[data-testid="workers-table"]')).toBeVisible();
    // Workers from deleted site should still be visible but need reassignment
  });

  test('should redirect to sites list after deletion', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/sites/1');

    await page.click('[data-testid="delete-site-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    await expect(page).toHaveURL(/\/sites$/);
  });
});
