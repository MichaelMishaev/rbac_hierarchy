/**
 * E2E Tests: PWA Offline Mode
 * Tests Progressive Web App offline functionality
 *
 * Test Coverage:
 * - Service Worker registration
 * - Offline banner display
 * - Cached pages load offline
 * - Online/offline state detection
 * - Background sync (future)
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

test.describe('PWA Offline Mode', () => {
  test.beforeEach(async ({ page, context }) => {
    // Login
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill(testUsers.cityCoordinator);
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/dashboard');

    // Wait for service worker to be ready
    await page.waitForTimeout(2000);
  });

  test('should register service worker on page load', async ({ page }) => {
    const swRegistered = await page.evaluate(async () => {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return registration !== undefined;
      }
      return false;
    });

    expect(swRegistered).toBeTruthy();
  });

  test('should display offline banner when network is unavailable', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Simulate offline mode
    await context.setOffline(true);

    // Wait for offline detection
    await page.waitForTimeout(1000);

    // Offline banner should appear
    const offlineBanner = page.getByTestId('offline-banner');
    await expect(offlineBanner).toBeVisible({ timeout: 5000 });
  });

  test('should hide offline banner when network is restored', async ({ page, context }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Go offline
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    const offlineBanner = page.getByTestId('offline-banner');
    await expect(offlineBanner).toBeVisible({ timeout: 5000 });

    // Go back online
    await context.setOffline(false);
    await page.waitForTimeout(1000);

    // Offline banner should disappear
    await expect(offlineBanner).toBeHidden({ timeout: 5000 });
  });

  test('should load cached dashboard page offline', async ({ page, context }) => {
    // Visit dashboard to cache it
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // Page should still load from cache
    await expect(page.getByText('לוח בקרה')).toBeVisible({ timeout: 5000 });
  });

  test('should detect online state correctly', async ({ page }) => {
    const isOnline = await page.evaluate(() => navigator.onLine);
    expect(isOnline).toBeTruthy();
  });

  test('should detect offline state correctly', async ({ page, context }) => {
    await context.setOffline(true);
    await page.waitForTimeout(500);

    const isOffline = await page.evaluate(() => !navigator.onLine);
    expect(isOffline).toBeTruthy();
  });

  test('should cache static assets (CSS, JS, images)', async ({ page, context }) => {
    // Navigate to activists page
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Reload page
    await page.reload();

    // Page should load with styles intact
    const hasStyles = await page.evaluate(() => {
      const body = document.querySelector('body');
      if (!body) return false;

      const computedStyle = window.getComputedStyle(body);
      return computedStyle.fontFamily !== '' && computedStyle.margin !== '';
    });

    expect(hasStyles).toBeTruthy();
  });

  test('should handle API requests gracefully when offline', async ({ page, context }) => {
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Try to navigate to a data-heavy page
    await page.goto('/he/tasks');

    // Page should load without crashing (might show empty state)
    await expect(page.getByText('משימות')).toBeVisible({ timeout: 5000 });
  });
});
