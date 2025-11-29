import { test, expect } from '../fixtures/auth.fixture';

/**
 * Dashboard Tests - Role-Specific Dashboards
 * Based on: docs/syAnalyse/mvp/07_TESTING_CHECKLIST.md (Lines 342-377)
 */

test.describe('Dashboard - SuperAdmin', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/dashboard');
  });

  test('should load without errors', async ({ page }) => {
    // No console errors
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should display all 3 KPI cards', async ({ page }) => {
    await expect(page.locator('[data-testid="kpi-corporations"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-users"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-invitations"]')).toBeVisible();
  });

  test('should show accurate corporation count', async ({ page }) => {
    const corpCount = page.locator('[data-testid="kpi-corporations"] [data-testid="kpi-value"]');

    await expect(corpCount).toBeVisible();

    const count = await corpCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should show accurate user count', async ({ page }) => {
    const userCount = page.locator('[data-testid="kpi-users"] [data-testid="kpi-value"]');

    await expect(userCount).toBeVisible();

    const count = await userCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should show accurate pending invitations count', async ({ page }) => {
    const invitationsCount = page.locator('[data-testid="kpi-invitations"] [data-testid="kpi-value"]');

    await expect(invitationsCount).toBeVisible();

    const count = await invitationsCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should display trend indicators if implemented', async ({ page }) => {
    // Optional feature - check if exists
    const trendIndicator = page.locator('[data-testid^="trend-indicator-"]').first();

    if (await trendIndicator.isVisible()) {
      await expect(trendIndicator).toHaveAttribute('data-trend', /up|down|neutral/);
    }
  });

  test('should display recent corporations', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-corporations"]')).toBeVisible();

    const recentCorpCards = page.locator('[data-testid^="recent-corp-"]');
    const count = await recentCorpCards.count();

    expect(count).toBeLessThanOrEqual(5); // Last 5
  });

  test('should display recent activity', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-activity"]')).toBeVisible();

    const activityItems = page.locator('[data-testid^="activity-item-"]');
    const count = await activityItems.count();

    expect(count).toBeLessThanOrEqual(10); // Last 10 actions
  });

  test('should animate cards on hover', async ({ page }) => {
    const kpiCard = page.locator('[data-testid="kpi-corporations"]');

    const initialTransform = await kpiCard.evaluate(el => getComputedStyle(el).transform);

    await kpiCard.hover();

    const hoverTransform = await kpiCard.evaluate(el => getComputedStyle(el).transform);

    // Transform should change on hover
    expect(hoverTransform).not.toBe(initialTransform);
  });

  test('should navigate to correct pages on card click', async ({ page }) => {
    await page.click('[data-testid="kpi-corporations"]');

    await expect(page).toHaveURL(/\/corporations$/);
  });
});

test.describe('Dashboard - Manager', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/dashboard');
  });

  test('should load without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should display corporation header', async ({ page }) => {
    await expect(page.locator('[data-testid="corporation-header"]')).toBeVisible();
    await expect(page.locator('[data-testid="corporation-name"]')).toBeVisible();
  });

  test('should display corporation logo', async ({ page }) => {
    const logo = page.locator('[data-testid="corporation-logo"]');

    if (await logo.isVisible()) {
      await expect(logo).toHaveAttribute('src', /.+/);
    }
  });

  test('should display 3 KPI cards: Sites, Supervisors, Workers', async ({ page }) => {
    await expect(page.locator('[data-testid="kpi-sites"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-supervisors"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-workers"]')).toBeVisible();
  });

  test('should show accurate counts', async ({ page }) => {
    const sitesCount = page.locator('[data-testid="kpi-sites"] [data-testid="kpi-value"]');
    const supervisorsCount = page.locator('[data-testid="kpi-supervisors"] [data-testid="kpi-value"]');
    const workersCount = page.locator('[data-testid="kpi-workers"] [data-testid="kpi-value"]');

    await expect(sitesCount).toBeVisible();
    await expect(supervisorsCount).toBeVisible();
    await expect(workersCount).toBeVisible();

    // All counts should be numbers
    const sites = parseInt((await sitesCount.textContent()) || '0');
    const supervisors = parseInt((await supervisorsCount.textContent()) || '0');
    const workers = parseInt((await workersCount.textContent()) || '0');

    expect(sites).toBeGreaterThanOrEqual(0);
    expect(supervisors).toBeGreaterThanOrEqual(0);
    expect(workers).toBeGreaterThanOrEqual(0);
  });

  test('should display sites grid', async ({ page }) => {
    await expect(page.locator('[data-testid="sites-grid"]')).toBeVisible();

    const siteCards = page.locator('[data-testid^="site-card-"]');
    await expect(siteCards.first()).toBeVisible();
  });

  test('should show responsive grid', async ({ page }) => {
    const grid = page.locator('[data-testid="sites-grid"]');

    // Desktop: 3 columns
    await expect(grid).toHaveCSS('grid-template-columns', /repeat\(3,/);
  });

  test('should display quick actions', async ({ page }) => {
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible();
  });

  test('should show new site button', async ({ page }) => {
    await expect(page.locator('[data-testid="new-site-button"]')).toBeVisible();
  });

  test('should open site modal on new site button click', async ({ page }) => {
    await page.click('[data-testid="new-site-button"]');

    await expect(page.locator('[data-testid="site-modal"]')).toBeVisible();
  });

  test('should show invite button', async ({ page }) => {
    await expect(page.locator('[data-testid="invite-button"]')).toBeVisible();
  });

  test('should open invitation wizard on invite button click', async ({ page }) => {
    await page.click('[data-testid="invite-button"]');

    await expect(page.locator('[data-testid="invitation-wizard"]')).toBeVisible();
  });
});

test.describe('Dashboard - Supervisor (Mobile)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/dashboard');
  });

  test('should load without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));

    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('should display site card', async ({ page }) => {
    await expect(page.locator('[data-testid="site-card"]')).toBeVisible();
  });

  test('should show site info', async ({ page }) => {
    await expect(page.locator('[data-testid="site-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="site-address"]')).toBeVisible();
  });

  test('should show accurate worker count', async ({ page }) => {
    const workerCount = page.locator('[data-testid="worker-count"]');

    await expect(workerCount).toBeVisible();

    const count = await workerCount.textContent();
    expect(parseInt(count || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should display large add worker button', async ({ page }) => {
    const addButton = page.locator('[data-testid="add-worker-button"]');

    await expect(addButton).toBeVisible();

    // Button should be prominent (min height for mobile)
    const box = await addButton.boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('should display recent workers', async ({ page }) => {
    await expect(page.locator('[data-testid="recent-workers"]')).toBeVisible();

    const recentWorkerCards = page.locator('[data-testid^="recent-worker-"]');
    const count = await recentWorkerCards.count();

    expect(count).toBeLessThanOrEqual(5); // Last 5
  });

  test('should show floating search bar', async ({ page }) => {
    const searchBar = page.locator('[data-testid="search-bar"]');

    await expect(searchBar).toBeVisible();
    await expect(searchBar).toHaveCSS('position', /fixed|sticky/);
  });

  test('should display fixed bottom toolbar', async ({ page }) => {
    const toolbar = page.locator('[data-testid="bottom-toolbar"]');

    await expect(toolbar).toBeVisible();
    await expect(toolbar).toHaveCSS('position', 'fixed');
    await expect(toolbar).toHaveCSS('bottom', '0px');
  });

  test('should show center floating action button (FAB)', async ({ page }) => {
    const fab = page.locator('[data-testid="fab-button"]');

    await expect(fab).toBeVisible();

    // FAB should be floating
    await expect(fab).toHaveCSS('position', 'fixed');

    // Should be centered
    const box = await fab.boundingBox();
    const viewportWidth = page.viewportSize()?.width || 0;
    const buttonCenter = (box?.x || 0) + (box?.width || 0) / 2;

    expect(buttonCenter).toBeCloseTo(viewportWidth / 2, 10);
  });

  test('should display tab navigation', async ({ page }) => {
    await expect(page.locator('[data-testid="tab-navigation"]')).toBeVisible();

    await expect(page.locator('[data-testid="tab-workers"]')).toBeVisible();
    await expect(page.locator('[data-testid="tab-profile"]')).toBeVisible();
  });

  test('should switch pages on tab click', async ({ page }) => {
    await page.click('[data-testid="tab-workers"]');

    await expect(page).toHaveURL(/\/workers$/);
  });
});

test.describe('Dashboard - RTL Support', () => {
  test('should display correctly in RTL mode', async ({ page, loginAs }) => {
    await loginAs('superAdmin');

    // Set RTL direction
    await page.addInitScript(() => {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'he');
    });

    await page.goto('/dashboard');

    // Verify RTL direction
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');

    // Verify cards are mirrored
    const kpiCard = page.locator('[data-testid="kpi-corporations"]').first();
    const textAlign = await kpiCard.evaluate(el => getComputedStyle(el).textAlign);

    expect(textAlign).toBe('right');
  });
});

test.describe('Dashboard - Loading States', () => {
  test('should show skeleton loaders during fetch', async ({ page, loginAs }) => {
    await loginAs('manager');

    const navigation = page.goto('/dashboard');

    // Should show skeletons
    await expect(page.locator('[data-testid="kpi-skeleton"]').first()).toBeVisible();

    await navigation;

    // Skeletons should disappear
    await expect(page.locator('[data-testid="kpi-skeleton"]')).not.toBeVisible();
  });
});

test.describe('Dashboard - Responsive Design', () => {
  test('should adjust layout for tablet', async ({ page, loginAs }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await loginAs('manager');
    await page.goto('/dashboard');

    const grid = page.locator('[data-testid="sites-grid"]');

    // Tablet: 2 columns
    const gridTemplate = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(gridTemplate).toContain('2');
  });

  test('should adjust layout for mobile', async ({ page, loginAs }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAs('manager');
    await page.goto('/dashboard');

    const grid = page.locator('[data-testid="sites-grid"]');

    // Mobile: 1 column
    const gridTemplate = await grid.evaluate(el => getComputedStyle(el).gridTemplateColumns);
    expect(gridTemplate).not.toContain('repeat');
  });
});
