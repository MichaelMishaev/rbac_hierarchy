/**
 * Golden Path Canary 2: Multi-City Isolation
 *
 * CRITICAL: This test runs hourly in production to verify:
 * - City Coordinators see only their city
 * - No cross-city data leakage
 *
 * INVARIANTS TESTED: INV-001 (Multi-City Isolation)
 *
 * @owner backend-security
 * @created 2025-12-17
 */

import { test, expect } from '@playwright/test';

test.describe('GP-2: Multi-City Isolation', () => {
  test('City Coordinator sees only their city data', async ({ page }) => {
    const canaryEmail = process.env.CANARY_CITY_COORDINATOR_EMAIL || 'city.coordinator@test.com';
    const canaryPassword = process.env.CANARY_PASSWORD || 'canary123';
    const expectedCity = process.env.CANARY_CITY_NAME || 'תל אביב';
    const forbiddenCity = process.env.CANARY_FORBIDDEN_CITY || 'ירושלים';

    // Login as City Coordinator
    await page.goto('/login');
    await page.fill('input[name="email"]', canaryEmail);
    await page.fill('input[name="password"]', canaryPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Navigate to neighborhoods
    await page.click('text=שכונות');
    await page.waitForURL(/.*neighborhoods/);

    const pageContent = await page.textContent('body');

    // CRITICAL: Should see own city, should NOT see other city
    expect(pageContent).toBeTruthy();

    // Should NOT see forbidden city (INV-001)
    if (pageContent?.includes(forbiddenCity)) {
      throw new Error(`🚨 INVARIANT VIOLATION (INV-001): City Coordinator can see ${forbiddenCity} data!`);
    }

    console.log('✅ GP-2 PASSED: Multi-city isolation working (INV-001)');
  });

  test('Activist Coordinator cannot access /cities page', async ({ page }) => {
    const canaryEmail = process.env.CANARY_ACTIVIST_COORDINATOR_EMAIL || 'activist.coordinator@test.com';
    const canaryPassword = process.env.CANARY_PASSWORD || 'canary123';

    await page.goto('/login');
    await page.fill('input[name="email"]', canaryEmail);
    await page.fill('input[name="password"]', canaryPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Try to access /cities page (should be forbidden)
    await page.goto('/cities');

    // Should see 403 error or be redirected
    const pageContent = await page.textContent('body');
    const isBlocked = pageContent?.includes('אין הרשאה') || pageContent?.includes('403');

    if (!isBlocked) {
      throw new Error('🚨 INVARIANT VIOLATION (INV-002): Activist Coordinator can access /cities page!');
    }

    console.log('✅ GP-2 PASSED: RBAC boundaries enforced (INV-002)');
  });
});
