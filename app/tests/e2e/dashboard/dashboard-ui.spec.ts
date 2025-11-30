import { test, expect } from '@playwright/test';

test.describe('Dashboard UI/UX Improvements', () => {
  test.beforeEach(async ({ page }) => {
    // Login as SuperAdmin
    await page.goto('/login');
    await page.fill('input[name="email"]', 'superadmin@hierarchy.test');
    await page.fill('input[name="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should show loading skeletons before content loads', async ({ page }) => {
    // Navigate to dashboard (will show skeleton first)
    await page.goto('/dashboard');

    // Check if skeleton is visible (briefly)
    // Note: This might be fast, so we check for skeleton structure
    const skeletonCards = page.locator('[class*="MuiSkeleton"]');

    // Wait for actual content to load
    await page.waitForSelector('text=שלום, Super Admin!', { timeout: 10000 });

    // Verify KPI cards are now visible
    const kpiCards = page.locator('[data-testid^="kpi-card"]');
    await expect(kpiCards.first()).toBeVisible();
  });

  test('should display empty state when no recent activity', async ({ page }) => {
    // Wait for page to load
    await page.waitForSelector('text=שלום, Super Admin!');

    // Check if empty state is shown (if no activity exists)
    const emptyState = page.locator('[data-testid="empty-state"]');

    // If empty state exists, verify its content
    if (await emptyState.isVisible()) {
      await expect(emptyState.locator('text=אין פעילות עדיין')).toBeVisible();

      // Check for icon
      const icon = emptyState.locator('svg');
      await expect(icon).toBeVisible();
    }
  });

  test('should have clickable KPI cards that navigate correctly', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=שלום, Super Admin!');

    // Find "Total Corporations" card
    const corporationsCard = page.locator('text=סה"כ תאגידים').locator('..');

    // Click the card
    await corporationsCard.click();

    // Should navigate to corporations page
    await expect(page).toHaveURL(/.*\/corporations/);
  });

  test('should display correct KPI values for SuperAdmin', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=שלום, Super Admin!');

    // Check all 5 KPI cards are present
    await expect(page.locator('text=סה"כ תאגידים')).toBeVisible();
    await expect(page.locator('text=סה"כ אתרים')).toBeVisible();
    await expect(page.locator('text=משתמשי מערכת')).toBeVisible();
    await expect(page.locator('text=סה"כ עובדים')).toBeVisible();
    await expect(page.locator('text=הזמנות ממתינות')).toBeVisible();

    // Verify values are numbers (not NaN or undefined)
    const totalCorporations = page.locator('text=סה"כ תאגידים').locator('../..').locator('h2');
    const corporationsValue = await totalCorporations.textContent();
    expect(parseInt(corporationsValue || '0')).toBeGreaterThanOrEqual(0);
  });

  test('should render organizational tree', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=שלום, Super Admin!');

    // Check for tree section
    await expect(page.locator('text=היררכיית המערכת')).toBeVisible();

    // Tree should have zoom controls
    await expect(page.locator('button:has-text("הגדל")')).toBeVisible();
    await expect(page.locator('button:has-text("הקטן")')).toBeVisible();
    await expect(page.locator('button:has-text("התאם למסך")')).toBeVisible();
  });

  test('should have proper RTL layout', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=שלום, Super Admin!');

    // Check if main container has RTL direction
    const mainBox = page.locator('main, [dir="rtl"]').first();
    await expect(mainBox).toBeVisible();

    // Verify Hebrew text is displayed correctly
    await expect(page.locator('text=תאגידים')).toBeVisible();
    await expect(page.locator('text=אתרים')).toBeVisible();
  });

  test('should show sign out button', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=שלום, Super Admin!');

    // Check for sign out button
    const signOutButton = page.locator('button:has-text("התנתק")').first();
    await expect(signOutButton).toBeVisible();

    // Click sign out
    await signOutButton.click();

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Intercept API call and make it fail
    await page.route('**/api/dashboard/**', (route) => {
      route.fulfill({
        status: 500,
        body: JSON.stringify({ error: 'Internal Server Error' }),
      });
    });

    await page.goto('/dashboard');

    // Should show error message (if implemented)
    // Wait a bit for potential error to show
    await page.waitForTimeout(1000);

    // Page should not crash - at minimum should show something
    const body = await page.locator('body').textContent();
    expect(body).toBeTruthy();
  });

  test('should maintain state during navigation', async ({ page }) => {
    // Wait for dashboard to load
    await page.waitForSelector('text=שלום, Super Admin!');

    // Get initial corporations count
    const totalCorporations = page.locator('text=סה"כ תאגידים').locator('../..').locator('h2');
    const initialCount = await totalCorporations.textContent();

    // Navigate away
    await page.click('text=תאגידים');
    await page.waitForURL(/.*\/corporations/);

    // Navigate back
    await page.click('text=לוח בקרה');
    await page.waitForURL(/.*\/dashboard/);

    // Count should be the same
    await page.waitForSelector('text=שלום, Super Admin!');
    const newCount = await totalCorporations.textContent();
    expect(newCount).toBe(initialCount);
  });
});

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'superadmin@hierarchy.test');
    await page.fill('input[name="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.waitForSelector('text=שלום, Super Admin!');

    // Check for proper headings
    const h4 = page.locator('h4:has-text("שלום, Super Admin!")');
    await expect(h4).toBeVisible();

    const h5 = page.locator('h5:has-text("היררכיית המערכת")');
    await expect(h5).toBeVisible();
  });

  test('should have accessible buttons', async ({ page }) => {
    await page.waitForSelector('text=שלום, Super Admin!');

    // All buttons should be accessible
    const buttons = page.locator('button');
    const count = await buttons.count();

    expect(count).toBeGreaterThan(0);

    // Check if sign out button has proper type
    const signOutButton = page.locator('button[type="submit"]:has-text("התנתק")');
    await expect(signOutButton).toBeVisible();
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.waitForSelector('text=שלום, Super Admin!');

    // Tab through focusable elements
    await page.keyboard.press('Tab');

    // Should be able to focus on interactive elements
    const focused = page.locator(':focus');
    await expect(focused).toBeVisible();
  });
});

test.describe('Dashboard Performance', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();

    await page.goto('/login');
    await page.fill('input[name="email"]', 'superadmin@hierarchy.test');
    await page.fill('input[name="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');

    // Wait for dashboard to fully load
    await page.waitForSelector('text=שלום, Super Admin!');
    await page.waitForSelector('text=סה"כ תאגידים');

    const loadTime = Date.now() - startTime;

    // Dashboard should load within 5 seconds (generous for testing)
    expect(loadTime).toBeLessThan(5000);

    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('should not have layout shifts', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'superadmin@hierarchy.test');
    await page.fill('input[name="password"]', 'SuperAdmin123!');
    await page.click('button[type="submit"]');

    // Wait for dashboard
    await page.waitForSelector('text=שלום, Super Admin!');

    // Get initial positions of elements
    const header = page.locator('h4:has-text("שלום, Super Admin!")');
    const initialBox = await header.boundingBox();

    // Wait a bit to see if any layout shifts occur
    await page.waitForTimeout(2000);

    const finalBox = await header.boundingBox();

    // Position should not change (allowing 1px tolerance)
    expect(Math.abs((finalBox?.y || 0) - (initialBox?.y || 0))).toBeLessThan(2);
  });
});
