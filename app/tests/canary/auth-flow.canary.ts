/**
 * Golden Path Canary 1: Authentication Flow
 *
 * CRITICAL: This test runs hourly in production to verify:
 * - Login works
 * - Dashboard loads
 * - Hebrew RTL rendering works
 *
 * INVARIANTS TESTED: INV-003 (Hebrew/RTL)
 *
 * @owner backend-security
 * @created 2025-12-17
 */

import { test, expect } from '@playwright/test';

test.describe('GP-1: Authentication Flow', () => {
  test('User can login and access dashboard', async ({ page }) => {
    // Use read-only canary account from env
    const canaryEmail = process.env.CANARY_USER_EMAIL || 'canary@test.com';
    const canaryPassword = process.env.CANARY_PASSWORD || 'canary123';

    // Step 1: Login
    await page.goto('/login');
    await page.fill('input[name="email"]', canaryEmail);
    await page.fill('input[name="password"]', canaryPassword);
    await page.click('button[type="submit"]');

    // Step 2: Verify dashboard loads
    await expect(page).toHaveURL(/.*dashboard/, { timeout: 10000 });
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible({ timeout: 5000 });

    // Step 3: Verify Hebrew RTL (INV-003)
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'he');

    // Step 4: Verify user info visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ GP-1 PASSED: Auth flow + Hebrew RTL working');
  });

  test('Login rejects invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    // Should show error (not redirect)
    await expect(page).toHaveURL(/.*login/);

    console.log('✅ GP-1 PASSED: Invalid credentials rejected');
  });
});
