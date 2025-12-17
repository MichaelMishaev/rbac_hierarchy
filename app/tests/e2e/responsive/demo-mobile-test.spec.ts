/**
 * DEMO: Mobile Testing - Quick Verification
 * Run this to verify your mobile testing setup works correctly
 *
 * Command: npm run test:e2e:ui tests/e2e/responsive/demo-mobile-test.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Mobile Testing Demo', () => {
  test('should demonstrate mobile viewport testing - iPhone 14', async ({ page }) => {
    // Set iPhone 14 viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to login page
    await page.goto('http://localhost:3200/he/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot to show mobile view
    await page.screenshot({ path: 'test-results/demo-mobile-iphone14.png', fullPage: true });

    // Verify the page loaded
    await expect(page).toHaveTitle(/Election Campaign/i);

    console.log('✅ iPhone 14 viewport test passed!');
  });

  test('should demonstrate tablet viewport testing - iPad', async ({ page }) => {
    // Set iPad viewport
    await page.setViewportSize({ width: 768, height: 1024 });

    // Navigate to login page
    await page.goto('http://localhost:3200/he/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot to show tablet view
    await page.screenshot({ path: 'test-results/demo-tablet-ipad.png', fullPage: true });

    // Verify the page loaded
    await expect(page).toHaveTitle(/Election Campaign/i);

    console.log('✅ iPad viewport test passed!');
  });

  test('should demonstrate desktop viewport testing', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Navigate to login page
    await page.goto('http://localhost:3200/he/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take a screenshot to show desktop view
    await page.screenshot({ path: 'test-results/demo-desktop.png', fullPage: true });

    // Verify the page loaded
    await expect(page).toHaveTitle(/Election Campaign/i);

    console.log('✅ Desktop viewport test passed!');
  });

  test('should demonstrate RTL layout validation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to login page
    await page.goto('http://localhost:3200/he/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check RTL direction on body
    const direction = await page.evaluate(() => {
      return window.getComputedStyle(document.body).direction;
    });

    // Verify RTL
    expect(direction).toBe('rtl');

    console.log('✅ RTL layout validation passed!');
  });

  test('should demonstrate orientation change testing', async ({ page }) => {
    // Start in portrait mode (iPhone 14)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:3200/he/login');
    await page.waitForLoadState('networkidle');

    // Take portrait screenshot
    await page.screenshot({ path: 'test-results/demo-portrait.png' });

    console.log('📱 Portrait mode captured');

    // Switch to landscape mode
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500); // Wait for layout adjustment

    // Take landscape screenshot
    await page.screenshot({ path: 'test-results/demo-landscape.png' });

    console.log('📱 Landscape mode captured');

    // Verify page still works in landscape
    await expect(page).toHaveTitle(/Election Campaign/i);

    console.log('✅ Orientation change test passed!');
  });

  test('should demonstrate visual comparison testing', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 390, height: 844 });

    // Navigate to login page
    await page.goto('http://localhost:3200/he/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Take screenshot for visual comparison
    // First run creates baseline, subsequent runs compare
    await expect(page).toHaveScreenshot('demo-login-mobile.png', {
      maxDiffPixels: 100,
      fullPage: false,
    });

    console.log('✅ Visual comparison test passed!');
  });
});

test.describe('Device-Specific Demo', () => {
  const devices = [
    { name: 'iPhone 14', width: 390, height: 844 },
    { name: 'Pixel 7', width: 412, height: 915 },
    { name: 'iPad Air', width: 768, height: 1024 },
  ];

  for (const device of devices) {
    test(`should work correctly on ${device.name}`, async ({ page }) => {
      // Set device viewport
      await page.setViewportSize({ width: device.width, height: device.height });

      // Navigate to login page
      await page.goto('http://localhost:3200/he/login');

      // Wait for page to load
      await page.waitForLoadState('networkidle');

      // Verify page loaded
      await expect(page).toHaveTitle(/Election Campaign/i);

      // Take device-specific screenshot
      const filename = `test-results/demo-${device.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      await page.screenshot({ path: filename });

      console.log(`✅ ${device.name} (${device.width}×${device.height}) test passed!`);
    });
  }
});
