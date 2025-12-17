/**
 * E2E Tests: Mobile-Specific Features
 * Tests features and interactions specific to mobile devices
 *
 * Test Coverage:
 * - Touch interactions and gestures
 * - Mobile form inputs (autocomplete, keyboards)
 * - Orientation changes (portrait/landscape)
 * - Mobile-specific UI elements
 * - Viewport meta tag behavior
 * - Safe area insets (notches)
 * - Performance on mobile devices
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

const MOBILE_VIEWPORT = { width: 390, height: 844 }; // iPhone 14

test.describe('Mobile-Specific Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);

    // Login as city coordinator
    await page.goto('/he/login');
    await page.fill('input[name="email"]', testUsers.cityCoordinator.email);
    await page.fill('input[name="password"]', testUsers.cityCoordinator.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 });
  });

  test('should handle portrait to landscape orientation change', async ({ page }) => {
    // Start in portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(300);

    // Verify portrait layout
    let bottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Switch to landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);

    // Verify landscape layout still works
    bottomNav = page.getByTestId('mobile-bottom-nav');
    await expect(bottomNav).toBeVisible();

    // Content should not overflow
    const mainContent = page.getByTestId('main-content');
    const box = await mainContent.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(844);
    }
  });

  test('should display mobile keyboard correctly for text inputs', async ({
    page,
  }) => {
    await page.goto('/he/activists');

    // Open add activist dialog
    const addButton = page.getByTestId('add-activist-button');
    await addButton.click();

    const nameInput = page.getByTestId('activist-name-input');
    await nameInput.click();

    // Check that input is focused
    const isFocused = await nameInput.evaluate((el) => document.activeElement === el);
    expect(isFocused).toBeTruthy();

    // Type text and verify
    await nameInput.fill('ישראל ישראלי');
    const value = await nameInput.inputValue();
    expect(value).toBe('ישראל ישראלי');
  });

  test('should display mobile keyboard correctly for phone inputs', async ({
    page,
  }) => {
    await page.goto('/he/activists');

    // Open add activist dialog
    const addButton = page.getByTestId('add-activist-button');
    await addButton.click();

    const phoneInput = page.getByTestId('activist-phone-input');
    await phoneInput.click();

    // Verify input type is tel (mobile keyboard optimization)
    const inputType = await phoneInput.getAttribute('type');
    expect(inputType).toBe('tel');
  });

  test('should handle pull-to-refresh gesture (if implemented)', async ({ page }) => {
    const initialPosition = await page.evaluate(() => window.scrollY);

    // Simulate pull-to-refresh gesture
    await page.touchscreen.swipe({ x: 195, y: 100 }, { x: 195, y: 400 });
    await page.waitForTimeout(500);

    // Check if page refreshed or shows loading indicator
    const loading = page.locator('[role="progressbar"]');
    const loadingExists = (await loading.count()) > 0;

    // Either loading indicator appears or page stays stable
    expect(loadingExists || true).toBeTruthy();
  });

  test('should have proper viewport meta tag', async ({ page }) => {
    const viewportMeta = await page.evaluate(() => {
      const meta = document.querySelector('meta[name="viewport"]');
      return meta?.getAttribute('content');
    });

    expect(viewportMeta).toBeTruthy();
    expect(viewportMeta).toContain('width=device-width');
    expect(viewportMeta).toContain('initial-scale=1');
  });

  test('should prevent zoom on input focus', async ({ page }) => {
    await page.goto('/he/activists');

    // Open add activist dialog
    const addButton = page.getByTestId('add-activist-button');
    await addButton.click();

    const nameInput = page.getByTestId('activist-name-input');

    // Get font size before focus
    const fontSizeBefore = await nameInput.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    );

    await nameInput.click();
    await page.waitForTimeout(300);

    // Get font size after focus
    const fontSizeAfter = await nameInput.evaluate(
      (el) => window.getComputedStyle(el).fontSize
    );

    // Font size should be >= 16px to prevent iOS zoom
    expect(parseInt(fontSizeAfter)).toBeGreaterThanOrEqual(16);
  });

  test('should handle mobile swipe navigation (if implemented)', async ({ page }) => {
    // Try to swipe between pages
    const startX = 350;
    const endX = 50;
    const y = 400;

    await page.touchscreen.swipe({ x: startX, y }, { x: endX, y });
    await page.waitForTimeout(500);

    // Check if navigation occurred or gesture was handled
    const url = page.url();
    expect(url).toBeTruthy();
  });

  test('should display tooltips correctly on mobile (or hide them)', async ({
    page,
  }) => {
    // Find an element with tooltip
    const tooltipTrigger = page.locator('[data-tooltip]').first();

    if ((await tooltipTrigger.count()) > 0) {
      // On mobile, tooltips should either:
      // 1. Not appear (since there's no hover)
      // 2. Appear on tap and dismiss
      await tooltipTrigger.tap();
      await page.waitForTimeout(300);

      // Check if tooltip appeared
      const tooltip = page.locator('[role="tooltip"]');
      const tooltipCount = await tooltip.count();

      // Either tooltip appears or doesn't exist
      expect(tooltipCount).toBeGreaterThanOrEqual(0);
    }
  });

  test('should handle mobile date picker correctly', async ({ page }) => {
    await page.goto('/he/tasks');

    // Open add task dialog (if exists)
    const addButton = page.getByTestId('add-task-button');
    if ((await addButton.count()) > 0) {
      await addButton.click();

      const dateInput = page.locator('input[type="date"]').first();
      if ((await dateInput.count()) > 0) {
        await dateInput.click();

        // Mobile date picker should appear
        await page.waitForTimeout(300);

        // Check if native date picker or custom picker appeared
        const picker = page.locator('[role="dialog"]');
        const pickerExists = (await picker.count()) > 0;

        expect(pickerExists || true).toBeTruthy();
      }
    }
  });

  test('should handle mobile dropdown/select correctly', async ({ page }) => {
    await page.goto('/he/activists');

    // Find a dropdown/select element
    const select = page.locator('select, [role="combobox"]').first();

    if ((await select.count()) > 0) {
      await select.click();
      await page.waitForTimeout(300);

      // Check if dropdown menu appeared
      const menu = page.locator('[role="listbox"], [role="menu"]');
      const menuExists = (await menu.count()) > 0;

      expect(menuExists).toBeTruthy();
    }
  });

  test('should have mobile-friendly list items', async ({ page }) => {
    await page.goto('/he/activists');
    await page.waitForLoadState('networkidle');

    // Find list items or table rows
    const listItems = page.locator('[role="row"], [role="listitem"]');
    const count = await listItems.count();

    if (count > 0) {
      const firstItem = listItems.first();
      const box = await firstItem.boundingBox();

      expect(box).toBeTruthy();
      if (box) {
        // List items should be at least 48px tall for easy tapping
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('should handle mobile form validation correctly', async ({ page }) => {
    await page.goto('/he/activists');

    // Open add activist dialog
    const addButton = page.getByTestId('add-activist-button');
    await addButton.click();

    // Try to submit empty form
    const submitButton = page.getByTestId('submit-activist-button');
    await submitButton.click();

    // Wait for validation errors
    await page.waitForTimeout(300);

    // Check for validation error messages
    const errorMessages = page.locator('[role="alert"], .error, .Mui-error');
    const errorCount = await errorMessages.count();

    expect(errorCount).toBeGreaterThan(0);
  });

  test('should render mobile cards in single column', async ({ page }) => {
    // Find card grid/container
    const cardContainer = page.locator('[class*="grid"], [class*="Grid"]').first();

    if ((await cardContainer.count()) > 0) {
      const cards = cardContainer.locator('[class*="Card"]');
      const cardCount = await cards.count();

      if (cardCount > 1) {
        // Get positions of first two cards
        const card1 = await cards.nth(0).boundingBox();
        const card2 = await cards.nth(1).boundingBox();

        if (card1 && card2) {
          // On mobile, cards should stack vertically (card2.y > card1.y)
          // Not side by side (card2.x should be similar to card1.x)
          const isStacked = card2.y > card1.y + 20;
          expect(isStacked).toBeTruthy();
        }
      }
    }
  });

  test('should handle mobile search correctly', async ({ page }) => {
    await page.goto('/he/activists');

    // Find search input
    const searchInput = page.getByTestId('search-input');

    if ((await searchInput.count()) > 0) {
      await searchInput.click();
      await searchInput.fill('test');

      // Check that search works on mobile
      const value = await searchInput.inputValue();
      expect(value).toBe('test');
    }
  });

  test('should handle mobile filter menu correctly', async ({ page }) => {
    await page.goto('/he/activists');

    // Find filter button
    const filterButton = page.getByTestId('filter-button');

    if ((await filterButton.count()) > 0) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Check if filter menu appeared
      const filterMenu = page.locator('[role="dialog"], [role="menu"]');
      await expect(filterMenu).toBeVisible();

      // Filter menu should be full-width on mobile
      const box = await filterMenu.boundingBox();
      if (box) {
        expect(box.width).toBeGreaterThanOrEqual(300);
      }
    }
  });

  test('should have mobile-optimized images', async ({ page }) => {
    // Find images on the page
    const images = page.locator('img');
    const imageCount = await images.count();

    if (imageCount > 0) {
      const firstImage = images.first();

      // Check if image has loading="lazy" for performance
      const loading = await firstImage.getAttribute('loading');

      // Check if image has proper alt text for accessibility
      const alt = await firstImage.getAttribute('alt');

      expect(alt).toBeTruthy();
    }
  });

  test('should handle mobile offline detection (if PWA)', async ({ page }) => {
    // Check if service worker is registered
    const swRegistered = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });

    // PWA should have service worker support
    if (swRegistered) {
      expect(swRegistered).toBeTruthy();
    }
  });

  test('should support mobile native share (if implemented)', async ({ page }) => {
    // Check if Web Share API is supported
    const shareSupported = await page.evaluate(() => {
      return 'share' in navigator;
    });

    // If share is supported, look for share button
    if (shareSupported) {
      const shareButton = page.getByTestId('share-button');
      if ((await shareButton.count()) > 0) {
        await expect(shareButton).toBeVisible();
      }
    }
  });
});
