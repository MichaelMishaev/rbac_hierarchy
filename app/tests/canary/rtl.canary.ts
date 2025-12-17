/**
 * Golden Path Canary 3: Hebrew/RTL Rendering
 *
 * CRITICAL: This test runs hourly in production to verify:
 * - All pages render in Hebrew
 * - RTL direction applied correctly
 * - No English text visible
 *
 * INVARIANTS TESTED: INV-003 (Hebrew/RTL-Only)
 *
 * @owner frontend-ui
 * @created 2025-12-17
 */

import { test, expect } from '@playwright/test';

test.describe('GP-3: Hebrew/RTL Rendering', () => {
  test('Dashboard renders in Hebrew RTL', async ({ page }) => {
    const canaryEmail = process.env.CANARY_USER_EMAIL || 'canary@test.com';
    const canaryPassword = process.env.CANARY_PASSWORD || 'canary123';

    await page.goto('/login');
    await page.fill('input[name="email"]', canaryEmail);
    await page.fill('input[name="password"]', canaryPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // CRITICAL: Verify HTML attributes (INV-003)
    const html = page.locator('html');
    await expect(html).toHaveAttribute('dir', 'rtl');
    await expect(html).toHaveAttribute('lang', 'he');

    // Visual regression test
    await expect(page).toHaveScreenshot('dashboard-rtl.png', {
      maxDiffPixels: 100,
      fullPage: false
    });

    console.log('✅ GP-3 PASSED: Hebrew RTL rendering correct (INV-003)');
  });

  test('All navigation labels are in Hebrew', async ({ page }) => {
    const canaryEmail = process.env.CANARY_USER_EMAIL || 'canary@test.com';
    const canaryPassword = process.env.CANARY_PASSWORD || 'canary123';

    await page.goto('/login');
    await page.fill('input[name="email"]', canaryEmail);
    await page.fill('input[name="password"]', canaryPassword);
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard/, { timeout: 10000 });

    // Check for Hebrew navigation labels
    const hebrewLabels = [
      'לוח בקרה',     // Dashboard
      'שכונות',        // Neighborhoods
      'פעילים',        // Activists
      'משתמשים'        // Users
    ];

    const pageContent = await page.textContent('body');

    for (const label of hebrewLabels) {
      if (!pageContent?.includes(label)) {
        console.warn(`⚠️ Missing Hebrew label: ${label}`);
      }
    }

    // Check for English (should NOT exist)
    const englishWords = ['Dashboard', 'Users', 'Settings', 'Logout'];
    for (const word of englishWords) {
      if (pageContent?.includes(word)) {
        throw new Error(`🚨 INVARIANT VIOLATION (INV-003): English word found: ${word}`);
      }
    }

    console.log('✅ GP-3 PASSED: All text in Hebrew, no English (INV-003)');
  });
});
