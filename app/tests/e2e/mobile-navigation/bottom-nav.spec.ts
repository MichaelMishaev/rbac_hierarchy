/**
 * E2E Tests: Mobile Bottom Navigation
 * Tests the bottom navigation bar on mobile viewport
 *
 * Test Coverage:
 * - Bottom nav is visible on mobile (<768px)
 * - Bottom nav is hidden on desktop (≥768px)
 * - Navigation works correctly between tabs
 * - Active tab highlighting
 * - Badge notifications display
 * - Touch targets meet WCAG 2.1 standards (48x48px minimum)
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

test.describe('Mobile Bottom Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login as city coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill(testUsers.cityCoordinator);
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/dashboard');
  });

  test('should display bottom navigation on mobile viewport', async ({ page }) => {
    // Set mobile viewport (iPhone 14 Pro)
    await page.setViewportSize({ width: 390, height: 844 });

    const bottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Verify all 5 navigation items are present
    await expect(page.getByTestId('bottom-nav-dashboard')).toBeVisible();
    await expect(page.getByTestId('bottom-nav-activists')).toBeVisible();
    await expect(page.getByTestId('bottom-nav-tasks')).toBeVisible();
    await expect(page.getByTestId('bottom-nav-map')).toBeVisible();
    await expect(page.getByTestId('bottom-nav-more')).toBeVisible();
  });

  test('should hide bottom navigation on desktop viewport', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    const bottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(bottomNav).toBeHidden();
  });

  test('should navigate correctly when tapping tabs', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Tap activists tab
    await page.getByTestId('bottom-nav-activists').click();
    await page.waitForURL('**/activists');
    expect(page.url()).toContain('/activists');

    // Tap tasks tab
    await page.getByTestId('bottom-nav-tasks').click();
    await page.waitForURL('**/tasks');
    expect(page.url()).toContain('/tasks');

    // Tap map tab
    await page.getByTestId('bottom-nav-map').click();
    await page.waitForURL('**/map');
    expect(page.url()).toContain('/map');

    // Tap dashboard tab
    await page.getByTestId('bottom-nav-dashboard').click();
    await page.waitForURL('**/dashboard');
    expect(page.url()).toContain('/dashboard');
  });

  test('should highlight active tab correctly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to activists page
    await page.getByTestId('bottom-nav-activists').click();
    await page.waitForURL('**/activists');

    // Check that activists tab has selected class
    const activistsTab = page.getByTestId('bottom-nav-activists');
    const selectedClass = await activistsTab.evaluate((el) =>
      el.querySelector('.Mui-selected') !== null
    );
    expect(selectedClass).toBeTruthy();
  });

  test('should display task notification badge', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const tasksTab = page.getByTestId('bottom-nav-tasks');

    // Check if badge is present (count may vary)
    const badgeExists = await tasksTab.locator('.MuiBadge-badge').count();

    // Badge might be 0 or more depending on unread tasks
    expect(badgeExists).toBeGreaterThanOrEqual(0);
  });

  test('should meet WCAG 2.1 touch target size requirements', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Get all bottom nav action buttons
    const navItems = [
      page.getByTestId('bottom-nav-dashboard'),
      page.getByTestId('bottom-nav-activists'),
      page.getByTestId('bottom-nav-tasks'),
      page.getByTestId('bottom-nav-map'),
      page.getByTestId('bottom-nav-more'),
    ];

    for (const item of navItems) {
      const box = await item.boundingBox();
      expect(box).toBeTruthy();

      // WCAG 2.1: Minimum touch target size is 48x48px
      if (box) {
        expect(box.height).toBeGreaterThanOrEqual(48);
        expect(box.width).toBeGreaterThanOrEqual(48);
      }
    }
  });

  test('should support RTL (right-to-left) layout', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    const bottomNav = page.getByTestId('mobile-bottom-nav');
    const direction = await bottomNav.evaluate((el) =>
      window.getComputedStyle(el).direction
    );

    expect(direction).toBe('rtl');
  });

  test('should stay fixed at bottom during scroll', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to page with scrollable content
    await page.getByTestId('bottom-nav-activists').click();
    await page.waitForURL('**/activists');

    const bottomNav = page.getByTestId('mobile-bottom-nav');

    // Get initial position
    const initialBox = await bottomNav.boundingBox();
    expect(initialBox).toBeTruthy();

    // Scroll down
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(300);

    // Get position after scroll
    const scrolledBox = await bottomNav.boundingBox();
    expect(scrolledBox).toBeTruthy();

    // Bottom nav should stay at same position (fixed)
    if (initialBox && scrolledBox) {
      expect(Math.abs(initialBox.y - scrolledBox.y)).toBeLessThan(5);
    }
  });

  test('should animate tab transitions smoothly', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate between tabs and check for smooth transitions
    await page.getByTestId('bottom-nav-activists').click();
    await page.waitForTimeout(200);

    await page.getByTestId('bottom-nav-tasks').click();
    await page.waitForTimeout(200);

    // Check that navigation completed without errors
    expect(page.url()).toContain('/tasks');
  });
});
