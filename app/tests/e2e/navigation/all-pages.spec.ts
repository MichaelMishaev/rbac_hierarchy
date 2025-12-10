import { test, expect } from '@playwright/test';
import { loginAs, testUsers } from '../fixtures/auth.fixture';

/**
 * Comprehensive Navigation Test Suite
 *
 * Tests all major pages in the system to catch:
 * - Runtime errors (undefined functions, missing imports)
 * - Missing data (undefined props)
 * - Page load failures
 * - Authentication issues
 *
 * Run this after any major changes to verify system integrity.
 */

test.describe('System-Wide Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as SuperAdmin (has access to all pages)
    await loginAs(page, testUsers.superAdmin);
  });

  test('Dashboard page loads without errors', async ({ page }) => {
    await page.goto('/he/dashboard');

    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');

    // Verify no runtime errors by checking for error UI
    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });

    // Verify page loaded successfully
    await expect(page.locator('h4, h5, h6').first()).toBeVisible();
  });

  test('Activists page loads without errors', async ({ page }) => {
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    // Check for runtime errors
    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });

    // Verify page content
    await expect(page.locator('text=/פעילים|Activists/i')).toBeVisible();
  });

  test('Activists modal can be opened', async ({ page }) => {
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    // Click "Add Activist" button
    const addButton = page.locator('button:has-text("הוסף"), button:has-text("Add")').first();
    await addButton.click();

    // Verify modal opens without errors
    await expect(page.locator('role=dialog')).toBeVisible();

    // Verify hierarchical cascade fields are present
    await expect(page.locator('label:has-text("אזור"), label:has-text("Area")')).toBeVisible();
    await expect(page.locator('label:has-text("עיר"), label:has-text("City")')).toBeVisible();
  });

  test('Users page loads without errors', async ({ page }) => {
    await page.goto('/he/users');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });

    await expect(page.locator('text=/משתמשים|Users/i')).toBeVisible();
  });

  test('Cities page loads without errors', async ({ page }) => {
    await page.goto('/he/cities');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });

    await expect(page.locator('text=/ערים|Cities/i')).toBeVisible();
  });

  test('Neighborhoods page loads without errors', async ({ page }) => {
    await page.goto('/he/neighborhoods');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });

    await expect(page.locator('text=/שכונות|Neighborhoods/i')).toBeVisible();
  });

  test('Areas page loads without errors', async ({ page }) => {
    await page.goto('/he/areas');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });

    await expect(page.locator('text=/אזורים|Areas/i')).toBeVisible();
  });

  test('Tasks page loads without errors', async ({ page }) => {
    await page.goto('/he/tasks/inbox');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });
  });

  test('Attendance page loads without errors', async ({ page }) => {
    await page.goto('/he/attendance');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });
  });

  test('Map page loads without errors', async ({ page }) => {
    await page.goto('/he/map');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });
  });

  test('Settings/Notifications page loads without errors', async ({ page }) => {
    await page.goto('/he/settings/notifications');
    await page.waitForLoadState('networkidle');

    const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
    await expect(errorElement).toHaveCount(0, { timeout: 2000 });
  });

  test('All navigation links in sidebar work', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    // Get all navigation links
    const navLinks = page.locator('nav a, aside a').filter({ hasText: /פעילים|משתמשים|ערים|שכונות|אזורים|משימות|נוכחות|מפה/ });
    const linkCount = await navLinks.count();

    console.log(`Testing ${linkCount} navigation links...`);

    for (let i = 0; i < Math.min(linkCount, 10); i++) {
      const link = navLinks.nth(i);
      const href = await link.getAttribute('href');

      if (href && href.startsWith('/')) {
        console.log(`Testing link: ${href}`);
        await page.goto(href);
        await page.waitForLoadState('networkidle');

        // Check for errors
        const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
        const errorCount = await errorElement.count();

        expect(errorCount, `Page ${href} has runtime errors`).toBe(0);
      }
    }
  });
});

test.describe('Role-Based Navigation Tests', () => {
  test('Area Manager can access their pages', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);

    const pages = [
      '/he/dashboard',
      '/he/cities',
      '/he/neighborhoods',
      '/he/activists',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
      await expect(errorElement).toHaveCount(0, { timeout: 2000 });
    }
  });

  test('City Coordinator can access their pages', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);

    const pages = [
      '/he/dashboard',
      '/he/neighborhoods',
      '/he/activists',
      '/he/tasks/inbox',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
      await expect(errorElement).toHaveCount(0, { timeout: 2000 });
    }
  });

  test('Activist Coordinator can access their pages', async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);

    const pages = [
      '/he/dashboard',
      '/he/activists',
      '/he/attendance',
    ];

    for (const pagePath of pages) {
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');

      const errorElement = page.locator('text=/Runtime TypeError|Error|is not a function|is undefined/i');
      await expect(errorElement).toHaveCount(0, { timeout: 2000 });
    }
  });
});
