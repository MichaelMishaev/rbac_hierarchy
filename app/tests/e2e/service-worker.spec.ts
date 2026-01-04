/**
 * Service Worker E2E Tests
 *
 * Prevents Bug #39: Service Worker causing webpack chunk loading failures
 *
 * Tests:
 * 1. Service Worker registers correctly
 * 2. /_next/ chunks are NOT cached (bypass SW)
 * 3. Multi-build deployment scenario works
 */

import { test, expect } from '@playwright/test';

test.describe('Service Worker', () => {
  test.beforeEach(async ({ page }) => {
    // Clear service workers and caches before each test
    await page.goto('/');
    await page.evaluate(async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        await caches.delete(name);
      }
    });
  });

  test('should register Service Worker successfully', async ({ page }) => {
    await page.goto('/');

    // Wait for service worker to register
    await page.waitForTimeout(2000);

    // Check if service worker is registered
    const isRegistered = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration !== undefined;
    });

    expect(isRegistered).toBe(true);
  });

  test('should NOT cache /_next/ chunks (CRITICAL)', async ({ page }) => {
    // This test prevents Bug #39
    // Service Worker MUST bypass /_next/ requests to avoid chunk mismatch after deployments

    await page.goto('/');

    // Wait for service worker to activate
    await page.waitForTimeout(2000);

    // Navigate to trigger chunk loading
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check cache contents
    const hasNextChunksInCache = await page.evaluate(async () => {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          if (request.url.includes('/_next/')) {
            console.error('❌ FOUND /_next/ CHUNK IN CACHE:', request.url);
            return true;
          }
        }
      }

      return false;
    });

    expect(hasNextChunksInCache).toBe(false);
  });

  test('should fetch fresh /_next/ chunks (not from Service Worker)', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Track network requests
    const nextRequests: { url: string; fromServiceWorker: boolean }[] = [];

    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/_next/')) {
        const timing = await response.serverAddr();
        nextRequests.push({
          url,
          fromServiceWorker: timing === null, // null timing means from cache/SW
        });
      }
    });

    // Navigate to trigger chunk loading
    await page.goto('/users');
    await page.waitForLoadState('networkidle');

    // Verify all /_next/ requests came from network (NOT Service Worker)
    const fromSW = nextRequests.filter(r => r.fromServiceWorker);

    if (fromSW.length > 0) {
      console.error('❌ These /_next/ requests came from Service Worker:', fromSW);
    }

    expect(fromSW.length).toBe(0);
  });

  test('should handle navigation after Service Worker is active', async ({ page }) => {
    // Simulate user session with active Service Worker

    // Session 1: Initial visit, register SW
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Session 2: Navigate around (SPA navigation)
    await page.click('[data-testid="nav-link-dashboard"]');
    await expect(page).toHaveURL(/\/dashboard/);

    await page.click('[data-testid="nav-link-users"]');
    await expect(page).toHaveURL(/\/users/);

    await page.click('[data-testid="nav-link-areas"]');
    await expect(page).toHaveURL(/\/areas/);

    // Verify no console errors (especially chunk loading errors)
    const consoleErrors = await page.evaluate(() => {
      // @ts-expect-error - __consoleErrors is not defined in Window type
      return window.__consoleErrors || [];
    });

    const chunkErrors = consoleErrors.filter((msg: string) =>
      msg.includes('ChunkLoadError') || msg.includes('reading \'call\'')
    );

    expect(chunkErrors.length).toBe(0);
  });

  test('should update Service Worker version correctly', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const swVersion = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration?.active) return null;

      // Extract version from SW script
      const swUrl = registration.active.scriptURL;
      const response = await fetch(swUrl);
      const swCode = await response.text();

      // Find SW_VERSION constant
      const match = swCode.match(/SW_VERSION\s*=\s*['"]([^'"]+)['"]/);
      return match ? match[1] : null;
    });

    expect(swVersion).toBeTruthy();
    expect(swVersion).toMatch(/^\d+\.\d+\.\d+$/); // Semver format

    // Version should be at least 2.1.4 (after Bug #39 fix)
    const [major, minor, patch] = swVersion!.split('.').map(Number);
    const minVersion = [2, 1, 4];

    const isValid =
      major > minVersion[0] ||
      (major === minVersion[0] && minor > minVersion[1]) ||
      (major === minVersion[0] && minor === minVersion[1] && patch >= minVersion[2]);

    expect(isValid).toBe(true);
  });

  test.skip('should handle multi-build deployment scenario', async () => {
    // This test simulates Bug #39 scenario:
    // 1. User loads app (Build A)
    // 2. New deployment happens (Build B)
    // 3. User navigates without refresh
    // 4. Should NOT crash!

    // Note: This test is SKIPPED because it requires actual build system changes
    // Manual testing required:
    // 1. npm run build && npm run start  (Build A)
    // 2. Open app, navigate around
    // 3. npm run build && npm run start  (Build B)
    // 4. Navigate again - should work!

    test.skip();
  });

  test('should clean up old caches on activation', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    // Get current cache name
    const currentCacheName = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      return cacheNames.find(name => name.startsWith('campaign-v'));
    });

    expect(currentCacheName).toBeTruthy();
    expect(currentCacheName).toMatch(/^campaign-v\d+\.\d+\.\d+$/);

    // Verify only ONE version of campaign cache exists
    const allCaches = await page.evaluate(async () => {
      return await caches.keys();
    });

    const campaignCaches = allCaches.filter(name => name.startsWith('campaign-v'));
    expect(campaignCaches.length).toBe(1);
  });

  test('should NOT cache API authentication endpoints', async ({ page }) => {
    // Security test: Ensure auth endpoints bypass Service Worker

    await page.goto('/');
    await page.waitForTimeout(2000);

    // Make auth request
    await page.goto('/login');
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('[type="submit"]');

    // Wait for auth to process
    await page.waitForTimeout(1000);

    // Check that auth endpoints are NOT in cache
    const hasAuthInCache = await page.evaluate(async () => {
      const cacheNames = await caches.keys();

      for (const cacheName of cacheNames) {
        const cache = await caches.open(cacheName);
        const keys = await cache.keys();

        for (const request of keys) {
          if (request.url.includes('/api/auth/')) {
            return true;
          }
        }
      }

      return false;
    });

    expect(hasAuthInCache).toBe(false);
  });
});
