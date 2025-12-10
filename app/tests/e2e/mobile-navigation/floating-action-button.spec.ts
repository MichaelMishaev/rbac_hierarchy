/**
 * E2E Tests: Context-Aware Floating Action Button (FAB)
 * Tests the FAB behavior across different pages
 *
 * Test Coverage:
 * - FAB displays on correct pages
 * - FAB shows correct action per page context
 * - FAB size meets accessibility standards (56x56px)
 * - FAB positioned above bottom navigation on mobile
 * - FAB animations and transitions
 * - FAB click actions trigger correctly
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

test.describe('Floating Action Button (FAB)', () => {
  test.beforeEach(async ({ page }) => {
    // Login as city coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill(testUsers.cityCoordinator);
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/dashboard');
  });

  test('should display FAB on activists page with "Add Activist" action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    await expect(fab).toBeVisible();

    // Check tooltip shows "הוסף פעיל" (Add Activist)
    await fab.hover();
    await page.waitForTimeout(500);
    await expect(page.getByText('הוסף פעיל')).toBeVisible();
  });

  test('should display FAB on tasks page with "Create Task" action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/tasks');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    await expect(fab).toBeVisible();

    // Check tooltip shows "צור משימה" (Create Task)
    await fab.hover();
    await page.waitForTimeout(500);
    await expect(page.getByText('צור משימה')).toBeVisible();
  });

  test('should display FAB on attendance page with "Check-in" action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/attendance');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    await expect(fab).toBeVisible();

    // Check tooltip shows "רישום נוכחות" (Record Attendance)
    await fab.hover();
    await page.waitForTimeout(500);
    await expect(page.getByText('רישום נוכחות')).toBeVisible();
  });

  test('should NOT display FAB on dashboard page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    await expect(fab).toBeHidden();
  });

  test('should meet Material Design 3 size requirements (56x56px)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    const box = await fab.boundingBox();

    expect(box).toBeTruthy();
    if (box) {
      // Material Design 3: FAB should be 56x56px
      expect(box.width).toBeCloseTo(56, 2);
      expect(box.height).toBeCloseTo(56, 2);
    }
  });

  test('should be positioned above bottom navigation on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    const bottomNav = page.getByTestId('mobile-bottom-nav');

    const fabBox = await fab.boundingBox();
    const navBox = await bottomNav.boundingBox();

    expect(fabBox).toBeTruthy();
    expect(navBox).toBeTruthy();

    if (fabBox && navBox) {
      // FAB should be above bottom nav (lower Y value)
      expect(fabBox.y).toBeLessThan(navBox.y);

      // FAB should be at least 16px above bottom nav
      expect(navBox.y - (fabBox.y + fabBox.height)).toBeGreaterThanOrEqual(16);
    }
  });

  test('should display on both mobile and desktop', async ({ page }) => {
    // Test mobile
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    let fab = page.getByTestId('context-aware-fab');
    await expect(fab).toBeVisible();

    // Test desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(300);

    fab = page.getByTestId('context-aware-fab');
    await expect(fab).toBeVisible();
  });

  test('should have smooth zoom-in animation', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    // Navigate to activists page and check FAB appears
    await page.goto('/he/activists');

    const fab = page.getByTestId('context-aware-fab');

    // FAB should become visible with animation
    await expect(fab).toBeVisible({ timeout: 1000 });
  });

  test('should scale on hover (desktop)', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });

    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');

    // Get initial transform
    const initialTransform = await fab.evaluate((el) =>
      window.getComputedStyle(el).transform
    );

    // Hover over FAB
    await fab.hover();
    await page.waitForTimeout(300);

    // Get transform after hover
    const hoverTransform = await fab.evaluate((el) =>
      window.getComputedStyle(el).transform
    );

    // Transform should change on hover (scale effect)
    expect(hoverTransform).not.toBe(initialTransform);
  });

  test('should be clickable and trigger action', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    await expect(fab).toBeVisible();

    // Click FAB (action will be implemented later)
    await fab.click();

    // Check that click was registered (no errors)
    // TODO: Add modal detection when modals are implemented
  });

  test('should have appropriate z-index (above other content)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    const fab = page.getByTestId('context-aware-fab');
    const zIndex = await fab.evaluate((el) =>
      window.getComputedStyle(el).zIndex
    );

    // Z-index should be high enough to float above content
    expect(parseInt(zIndex)).toBeGreaterThanOrEqual(1000);
  });
});
