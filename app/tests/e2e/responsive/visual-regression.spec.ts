/**
 * E2E Tests: Visual Regression Testing
 * Uses Playwright's built-in screenshot comparison for visual regression testing
 *
 * Test Coverage:
 * - Dashboard layout across devices
 * - Data tables across devices
 * - Forms and dialogs across devices
 * - Navigation elements across devices
 * - RTL text rendering
 * - Hebrew font rendering
 *
 * Note: First run will create baseline screenshots
 * Subsequent runs will compare against baselines
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

const DEVICES = [
  { name: 'mobile', width: 390, height: 844 }, // iPhone 14
  { name: 'tablet', width: 768, height: 1024 }, // iPad
  { name: 'desktop', width: 1920, height: 1080 }, // Full HD
];

test.describe('Visual Regression Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login as city coordinator
    await page.goto('/he/login');
    await page.fill('input[name="email"]', testUsers.cityCoordinator.email);
    await page.fill('input[name="password"]', testUsers.cityCoordinator.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should match dashboard layout snapshot across devices', async ({ page }) => {
    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500); // Wait for animations

      // Take screenshot and compare
      await expect(page).toHaveScreenshot(`dashboard-${device.name}.png`, {
        fullPage: false,
        maxDiffPixels: 100, // Allow minor rendering differences
      });
    }
  });

  test('should match activists page layout across devices', async ({ page }) => {
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`activists-${device.name}.png`, {
        fullPage: false,
        maxDiffPixels: 100,
      });
    }
  });

  test('should match tasks page layout across devices', async ({ page }) => {
    await page.goto('/he/tasks');
    await page.waitForLoadState('networkidle');

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`tasks-${device.name}.png`, {
        fullPage: false,
        maxDiffPixels: 100,
      });
    }
  });

  test('should match map page layout across devices', async ({ page }) => {
    await page.goto('/he/map');
    // Wait for map to load
    await page.waitForTimeout(2000);

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`map-${device.name}.png`, {
        fullPage: false,
        maxDiffPixels: 200, // Maps can have more variance
      });
    }
  });

  test('should match neighborhoods page layout across devices', async ({ page }) => {
    await page.goto('/he/neighborhoods');
    await page.waitForLoadState('networkidle');

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      await expect(page).toHaveScreenshot(`neighborhoods-${device.name}.png`, {
        fullPage: false,
        maxDiffPixels: 100,
      });
    }
  });

  test('should match mobile bottom navigation across devices', async ({ page }) => {
    const mobileDevices = DEVICES.filter((d) => d.width < 900);

    for (const device of mobileDevices) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      const bottomNav = page.getByTestId('mobile-bottom-nav');
      await expect(bottomNav).toBeVisible();

      await expect(bottomNav).toHaveScreenshot(`bottom-nav-${device.name}.png`, {
        maxDiffPixels: 50,
      });
    }
  });

  test('should match desktop sidebar across devices', async ({ page }) => {
    const desktopDevices = DEVICES.filter((d) => d.width >= 900);

    for (const device of desktopDevices) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      const sidebar = page.getByTestId('desktop-sidebar');
      await expect(sidebar).toBeVisible();

      await expect(sidebar).toHaveScreenshot(`sidebar-${device.name}.png`, {
        maxDiffPixels: 50,
      });
    }
  });

  test('should match data table rendering across devices', async ({ page }) => {
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      const table = page.locator('[data-testid="table-container"]');
      if ((await table.count()) > 0) {
        await expect(table).toHaveScreenshot(`table-${device.name}.png`, {
          maxDiffPixels: 100,
        });
      }
    }
  });

  test('should match form dialog rendering across devices', async ({ page }) => {
    await page.goto('/he/activists');

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });

      // Open add activist dialog
      const addButton = page.getByTestId('add-activist-button');
      await addButton.click();
      await page.waitForTimeout(300);

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      await expect(dialog).toHaveScreenshot(`dialog-${device.name}.png`, {
        maxDiffPixels: 100,
      });

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('should match Hebrew text rendering', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Check various text elements for Hebrew rendering
    const textElements = page.locator('[lang="he"]').first();
    if ((await textElements.count()) > 0) {
      await expect(textElements).toHaveScreenshot('hebrew-text-rendering.png', {
        maxDiffPixels: 50,
      });
    }
  });

  test('should match RTL layout rendering', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    // Take screenshot of main content area
    const mainContent = page.getByTestId('main-content');
    if ((await mainContent.count()) > 0) {
      await expect(mainContent).toHaveScreenshot('rtl-layout.png', {
        maxDiffPixels: 100,
      });
    }
  });

  test('should match card components across devices', async ({ page }) => {
    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      // Find first card component
      const card = page.locator('[class*="MuiCard"]').first();
      if ((await card.count()) > 0) {
        await expect(card).toHaveScreenshot(`card-${device.name}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });

  test('should match button styles across devices', async ({ page }) => {
    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      // Find primary button
      const button = page.getByRole('button', { name: /הוספ|צור|שמור/i }).first();
      if ((await button.count()) > 0) {
        await expect(button).toHaveScreenshot(`button-${device.name}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });

  test('should match loading states across devices', async ({ page }) => {
    // Trigger loading state by navigating quickly
    await page.goto('/he/activists');
    await page.waitForTimeout(100); // Catch loading state

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });

      // Check if loading indicator exists
      const loading = page.locator('[role="progressbar"]');
      if ((await loading.count()) > 0) {
        await expect(loading).toHaveScreenshot(`loading-${device.name}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });

  test('should match empty state rendering across devices', async ({ page }) => {
    // Navigate to a page that might have empty state
    await page.goto('/he/tasks');
    await page.waitForLoadState('networkidle');

    for (const device of DEVICES) {
      await page.setViewportSize({ width: device.width, height: device.height });
      await page.waitForTimeout(500);

      // Look for empty state message
      const emptyState = page.locator('[data-testid="empty-state"]');
      if ((await emptyState.count()) > 0) {
        await expect(emptyState).toHaveScreenshot(`empty-state-${device.name}.png`, {
          maxDiffPixels: 50,
        });
      }
    }
  });
});
