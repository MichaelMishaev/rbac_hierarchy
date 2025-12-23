/**
 * Golden Path Canary Test - Basic Health Check
 *
 * This test verifies the most critical user journey in production:
 * 1. Application loads
 * 2. Login page is accessible
 * 3. Authentication works
 * 4. Dashboard loads for authenticated user
 *
 * Runs: Hourly in production (via GitHub Actions)
 * Purpose: Early detection of production issues
 * Alerts: Creates GitHub issue + Slack notification on failure
 */

import { test, expect } from '@playwright/test';

test.describe('Golden Path Canary - Health Check', () => {
  test('should load application homepage', async ({ page }) => {
    // Navigate to root
    await page.goto('/');

    // Should redirect to login (unauthenticated users)
    await expect(page).toHaveURL(/.*\/login/);

    // Page should load successfully
    await expect(page.locator('h1, h2, [role="heading"]')).toBeVisible({ timeout: 10000 });
  });

  test('should display login form with Hebrew labels', async ({ page }) => {
    await page.goto('/login');

    // Check for Hebrew login form elements
    await expect(page.locator('input[name="email"], input[type="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"], input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Verify RTL layout (Hebrew text should be right-aligned)
    const htmlDir = await page.locator('html').getAttribute('dir');
    expect(htmlDir).toBe('rtl');
  });

  test('should login with test credentials and access dashboard', async ({ page }) => {
    // Get credentials from environment (GitHub Secrets)
    const email = process.env.CANARY_USER_EMAIL;
    const password = process.env.CANARY_PASSWORD;

    // Skip if credentials not provided (dev environment)
    if (!email || !password) {
      test.skip();
    }

    // Navigate to login
    await page.goto('/login');

    // Fill credentials
    await page.locator('input[name="email"], input[type="email"]').fill(email);
    await page.locator('input[name="password"], input[type="password"]').fill(password);

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard after successful login
    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 15000 });

    // Dashboard should load successfully
    await expect(page.locator('h1, h2, [role="heading"]')).toBeVisible({ timeout: 10000 });

    // User menu should be visible (indicates authenticated state)
    await expect(page.locator('[data-testid="user-menu"], button[aria-label*="תפריט"], button[aria-label*="משתמש"]')).toBeVisible();
  });

  test('should verify database connectivity', async ({ page }) => {
    // This test ensures the application can connect to the database
    // by checking that a page requiring database access loads correctly

    const email = process.env.CANARY_USER_EMAIL;
    const password = process.env.CANARY_PASSWORD;

    if (!email || !password) {
      test.skip();
    }

    // Login
    await page.goto('/login');
    await page.locator('input[name="email"], input[type="email"]').fill(email);
    await page.locator('input[name="password"], input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    // Wait for dashboard
    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Try to access a page that requires database access
    // (this will fail if database is down/unreachable)
    await expect(page.locator('body')).not.toContainText('Database Error');
    await expect(page.locator('body')).not.toContainText('Connection refused');
    await expect(page.locator('body')).not.toContainText('ECONNREFUSED');
  });

  test('should verify Redis connectivity (sessions)', async ({ page }) => {
    // This test ensures Redis is working by verifying session persistence

    const email = process.env.CANARY_USER_EMAIL;
    const password = process.env.CANARY_PASSWORD;

    if (!email || !password) {
      test.skip();
    }

    // Login (creates session in Redis)
    await page.goto('/login');
    await page.locator('input[name="email"], input[type="email"]').fill(email);
    await page.locator('input[name="password"], input[type="password"]').fill(password);
    await page.locator('button[type="submit"]').click();

    await page.waitForURL(/.*\/dashboard/, { timeout: 15000 });

    // Refresh page - session should persist (Redis working)
    await page.reload();

    // Should still be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/.*\/dashboard/);
    await expect(page.locator('[data-testid="user-menu"], button[aria-label*="תפריט"]')).toBeVisible();
  });
});
