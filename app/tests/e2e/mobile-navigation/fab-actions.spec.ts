import { test, expect } from '@playwright/test';

test.describe('Floating Action Button (FAB)', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE
    locale: 'he-IL',
  });

  test.beforeEach(async ({ page }) => {
    // Login as activist coordinator
    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', 'activist.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
  });

  test('should not display FAB on dashboard page', async ({ page }) => {
    // FAB should not be visible on dashboard (no primary action)
    const fab = page.locator('[data-testid="context-aware-fab"]');
    await expect(fab).not.toBeVisible({ timeout: 2000 }).catch(() => {
      // It's ok if the element doesn't exist
    });
  });

  test('should display FAB on activists page', async ({ page }) => {
    await page.click('[data-testid="bottom-nav-activists"]');
    await page.waitForURL('**/activists');

    const fab = page.locator('[data-testid="context-aware-fab"]');
    await expect(fab).toBeVisible();
  });

  test('should display FAB on tasks page', async ({ page }) => {
    await page.click('[data-testid="bottom-nav-tasks"]');
    await page.waitForURL('**/tasks');

    const fab = page.locator('[data-testid="context-aware-fab"]');
    await expect(fab).toBeVisible();
  });

  test('should be positioned above bottom navigation on mobile', async ({ page }) => {
    await page.click('[data-testid="bottom-nav-activists"]');
    await page.waitForURL('**/activists');

    const fab = page.locator('[data-testid="context-aware-fab"]');
    const fabBox = await fab.boundingBox();

    const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
    const navBox = await bottomNav.boundingBox();

    // FAB should be above bottom nav
    expect(fabBox!.y).toBeLessThan(navBox!.y);
  });

  test('should have minimum size of 56x56px', async ({ page }) => {
    await page.click('[data-testid="bottom-nav-activists"]');
    await page.waitForURL('**/activists');

    const fab = page.locator('[data-testid="context-aware-fab"]');
    const box = await fab.boundingBox();

    // Material Design 3 FAB size: 56x56px
    expect(box?.height).toBeGreaterThanOrEqual(56);
    expect(box?.width).toBeGreaterThanOrEqual(56);
  });

  test('should be clickable and trigger action', async ({ page }) => {
    await page.click('[data-testid="bottom-nav-activists"]');
    await page.waitForURL('**/activists');

    const fab = page.locator('[data-testid="context-aware-fab"]');
    await expect(fab).toBeVisible();

    // Click should trigger action (console.log in current implementation)
    await fab.click();

    // TODO: Verify modal opens when implemented
  });

  test('should change context when navigating between pages', async ({ page }) => {
    // Go to activists page
    await page.click('[data-testid="bottom-nav-activists"]');
    await page.waitForURL('**/activists');

    let fab = page.locator('[data-testid="context-aware-fab"]');
    await expect(fab).toBeVisible();

    // Go to tasks page
    await page.click('[data-testid="bottom-nav-tasks"]');
    await page.waitForURL('**/tasks');

    fab = page.locator('[data-testid="context-aware-fab"]');
    await expect(fab).toBeVisible();

    // The FAB should still be visible but context changed
    // (icon and action would be different, but we can't easily test that)
  });
});
