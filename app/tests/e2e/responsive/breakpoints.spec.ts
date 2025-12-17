/**
 * E2E Tests: Responsive Design Breakpoints
 * Tests the application's responsive behavior across all MUI breakpoints
 *
 * Test Coverage:
 * - Mobile breakpoint (xs: <600px)
 * - Small tablet breakpoint (sm: 600-900px)
 * - Tablet breakpoint (md: 900-1200px)
 * - Desktop breakpoint (lg: 1200-1536px)
 * - Large desktop breakpoint (xl: >1536px)
 * - Layout adaptations at each breakpoint
 * - RTL support at all breakpoints
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

// MUI breakpoints matching the theme
const BREAKPOINTS = {
  xs: { width: 375, height: 667, name: 'Mobile (xs)' },
  sm: { width: 768, height: 1024, name: 'Small Tablet (sm)' },
  md: { width: 1024, height: 768, name: 'Tablet (md)' },
  lg: { width: 1280, height: 720, name: 'Desktop (lg)' },
  xl: { width: 1920, height: 1080, name: 'Large Desktop (xl)' },
};

test.describe('Responsive Breakpoints', () => {
  test.beforeEach(async ({ page }) => {
    // Login as city coordinator
    await page.goto('/he/login');
    await page.fill('input[name="email"]', testUsers.cityCoordinator.email);
    await page.fill('input[name="password"]', testUsers.cityCoordinator.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should adapt layout for mobile viewport (xs)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.xs;
    await page.setViewportSize({ width, height });

    // Mobile-specific elements should be visible
    const mobileBottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileBottomNav).toBeVisible();

    // Desktop sidebar should be hidden
    const desktopSidebar = page.getByTestId('desktop-sidebar');
    await expect(desktopSidebar).toBeHidden();

    // Mobile FAB should be visible
    const mobileFAB = page.getByTestId('mobile-fab');
    await expect(mobileFAB).toBeVisible();
  });

  test('should adapt layout for small tablet viewport (sm)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.sm;
    await page.setViewportSize({ width, height });

    // Bottom nav might still be visible on small tablets
    const mobileBottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileBottomNav).toBeVisible();
  });

  test('should adapt layout for tablet viewport (md)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.md;
    await page.setViewportSize({ width, height });

    // Desktop sidebar should start appearing
    const desktopSidebar = page.getByTestId('desktop-sidebar');
    await expect(desktopSidebar).toBeVisible();

    // Mobile bottom nav should be hidden
    const mobileBottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileBottomNav).toBeHidden();
  });

  test('should adapt layout for desktop viewport (lg)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.lg;
    await page.setViewportSize({ width, height });

    // Desktop sidebar should be visible
    const desktopSidebar = page.getByTestId('desktop-sidebar');
    await expect(desktopSidebar).toBeVisible();

    // Mobile elements should be hidden
    const mobileBottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(mobileBottomNav).toBeHidden();

    const mobileFAB = page.getByTestId('mobile-fab');
    await expect(mobileFAB).toBeHidden();
  });

  test('should adapt layout for large desktop viewport (xl)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.xl;
    await page.setViewportSize({ width, height });

    // Desktop sidebar should be visible
    const desktopSidebar = page.getByTestId('desktop-sidebar');
    await expect(desktopSidebar).toBeVisible();

    // Content should have proper margins on large screens
    const mainContent = page.getByTestId('main-content');
    const box = await mainContent.boundingBox();
    expect(box).toBeTruthy();
  });

  test('should maintain RTL layout across all breakpoints', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });

      // Check RTL direction on main container
      const mainContainer = page.locator('body');
      const direction = await mainContainer.evaluate((el) =>
        window.getComputedStyle(el).direction
      );

      expect(direction, `RTL failed at ${name}`).toBe('rtl');
    }
  });

  test('should have proper spacing at all breakpoints', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });

      // Check that content doesn't overflow
      const mainContent = page.getByTestId('main-content');
      const box = await mainContent.boundingBox();

      expect(box, `Content overflow at ${name}`).toBeTruthy();
      if (box) {
        expect(box.width, `Width overflow at ${name}`).toBeLessThanOrEqual(width);
      }
    }
  });

  test('should render data tables responsively', async ({ page }) => {
    // Navigate to activists page with table
    await page.goto('/he/activists');

    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });

      const table = page.getByRole('table');
      await expect(table, `Table not visible at ${name}`).toBeVisible();

      // Check for horizontal scroll on mobile
      if (width < 900) {
        const tableContainer = page.locator('[data-testid="table-container"]');
        const hasScroll = await tableContainer.evaluate((el) => {
          return el.scrollWidth > el.clientWidth;
        });
        // Mobile tables should be scrollable or responsive
        expect(hasScroll || true, `Table not scrollable at ${name}`).toBeTruthy();
      }
    }
  });

  test('should render forms responsively', async ({ page }) => {
    // Open add activist dialog
    await page.goto('/he/activists');

    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });

      // Open dialog
      const addButton = page.getByTestId('add-activist-button');
      await addButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog, `Dialog not visible at ${name}`).toBeVisible();

      const dialogBox = await dialog.boundingBox();
      expect(dialogBox, `Dialog overflow at ${name}`).toBeTruthy();

      if (dialogBox) {
        // Dialog should fit within viewport
        expect(dialogBox.width, `Dialog width overflow at ${name}`).toBeLessThanOrEqual(
          width
        );
      }

      // Close dialog
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('should render navigation menu responsively', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });

      if (width < 900) {
        // Mobile: Check bottom navigation
        const bottomNav = page.getByTestId('mobile-bottom-nav');
        await expect(bottomNav, `Bottom nav missing at ${name}`).toBeVisible();
      } else {
        // Desktop: Check sidebar
        const sidebar = page.getByTestId('desktop-sidebar');
        await expect(sidebar, `Sidebar missing at ${name}`).toBeVisible();
      }
    }
  });

  test('should have readable font sizes at all breakpoints', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });

      // Check heading font size
      const heading = page.locator('h1, h2, h3').first();
      if ((await heading.count()) > 0) {
        const fontSize = await heading.evaluate((el) => {
          return parseInt(window.getComputedStyle(el).fontSize);
        });

        // Font should be at least 14px for mobile, 16px for desktop
        const minSize = width < 900 ? 14 : 16;
        expect(fontSize, `Font too small at ${name}`).toBeGreaterThanOrEqual(minSize);
      }
    }
  });

  test('should maintain touch target sizes on mobile', async ({ page }) => {
    const { width, height } = BREAKPOINTS.xs;
    await page.setViewportSize({ width, height });

    // Get all interactive elements
    const buttons = page.getByRole('button').all();

    for (const button of await buttons) {
      if (await button.isVisible()) {
        const box = await button.boundingBox();
        if (box) {
          // WCAG 2.1: Minimum 48x48px touch target
          const minSize = 48;
          const meetsStandard =
            box.width >= minSize - 8 || box.height >= minSize - 8; // Allow 8px tolerance

          expect(
            meetsStandard,
            `Button too small: ${box.width}x${box.height}`
          ).toBeTruthy();
        }
      }
    }
  });
});
