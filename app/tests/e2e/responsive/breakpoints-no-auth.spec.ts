/**
 * E2E Tests: Responsive Design Breakpoints (No Auth Required)
 * Tests responsive behavior on the login page across all breakpoints
 *
 * Note: This tests responsive design WITHOUT requiring authentication,
 * making it reliable for CI/CD and quick validation.
 */

import { test, expect } from '@playwright/test';

// MUI breakpoints matching the theme
const BREAKPOINTS = {
  xs: { width: 375, height: 667, name: 'Mobile (xs)' },
  sm: { width: 768, height: 1024, name: 'Small Tablet (sm)' },
  md: { width: 1024, height: 768, name: 'Tablet (md)' },
  lg: { width: 1280, height: 720, name: 'Desktop (lg)' },
  xl: { width: 1920, height: 1080, name: 'Large Desktop (xl)' },
};

test.describe('Responsive Breakpoints (Login Page)', () => {
  test('should render correctly on mobile viewport (xs)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.xs;
    await page.setViewportSize({ width, height });

    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    // Verify page loaded
    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();

    // Check no horizontal overflow
    const body = page.locator('body');
    const box = await body.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      expect(box.width).toBeLessThanOrEqual(width);
    }

    // Verify form elements are visible and accessible
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should render correctly on small tablet (sm)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.sm;
    await page.setViewportSize({ width, height });

    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();

    // Verify form is still usable
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should render correctly on tablet (md)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.md;
    await page.setViewportSize({ width, height });

    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should render correctly on desktop (lg)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.lg;
    await page.setViewportSize({ width, height });

    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
  });

  test('should render correctly on large desktop (xl)', async ({ page }) => {
    const { width, height } = BREAKPOINTS.xl;
    await page.setViewportSize({ width, height });

    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();

    // Content should be centered, not stretched full width
    const mainContent = page.locator('text=ברוכים הבאים').locator('..');
    const box = await mainContent.boundingBox();
    expect(box).toBeTruthy();
    if (box) {
      // On XL screens, content shouldn't be full width (should have margins)
      expect(box.width).toBeLessThan(width * 0.9);
    }
  });

  test('should maintain RTL layout across all breakpoints', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });
      await page.goto('/he/login');
      await page.waitForLoadState('networkidle');

      // Check RTL direction
      const direction = await page.evaluate(() => {
        return window.getComputedStyle(document.body).direction;
      });

      expect(direction, `RTL failed at ${name}`).toBe('rtl');
    }
  });

  test('should have no horizontal overflow at any breakpoint', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });
      await page.goto('/he/login');
      await page.waitForLoadState('networkidle');

      // Check body width doesn't exceed viewport
      const hasOverflow = await page.evaluate(() => {
        return document.body.scrollWidth > window.innerWidth;
      });

      expect(hasOverflow, `Horizontal overflow at ${name}`).toBe(false);
    }
  });

  test('should have readable font sizes at all breakpoints', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });
      await page.goto('/he/login');
      await page.waitForLoadState('networkidle');

      // Check heading font size
      const heading = page.locator('text=ברוכים הבאים');
      const fontSize = await heading.evaluate((el) => {
        return parseInt(window.getComputedStyle(el).fontSize);
      });

      // Font should be at least 20px for headings
      expect(fontSize, `Font too small at ${name}`).toBeGreaterThanOrEqual(20);
    }
  });

  test('should have proper touch target sizes on mobile', async ({ page }) => {
    const { width, height } = BREAKPOINTS.xs;
    await page.setViewportSize({ width, height });

    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    // Check submit button size
    const submitButton = page.locator('button[type="submit"]');
    const box = await submitButton.boundingBox();

    expect(box).toBeTruthy();
    if (box) {
      // WCAG 2.1: Minimum 44x44px touch target (allowing some tolerance)
      expect(box.height, 'Button height too small').toBeGreaterThanOrEqual(44);
      expect(box.width, 'Button width too small').toBeGreaterThanOrEqual(100);
    }
  });

  test('should handle orientation change smoothly', async ({ page }) => {
    // Portrait
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();

    // Switch to landscape
    await page.setViewportSize({ width: 844, height: 390 });
    await page.waitForTimeout(500);

    // Should still be visible and properly laid out
    await expect(page.locator('text=ברוכים הבאים')).toBeVisible();

    // Check no overflow in landscape
    const hasOverflow = await page.evaluate(() => {
      return document.body.scrollWidth > window.innerWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test('should display all form elements at every breakpoint', async ({ page }) => {
    for (const [key, { width, height, name }] of Object.entries(BREAKPOINTS)) {
      await page.setViewportSize({ width, height });
      await page.goto('/he/login');
      await page.waitForLoadState('networkidle');

      // All form elements should be visible
      await expect(page.locator('input[name="email"]'), `Email input missing at ${name}`).toBeVisible();
      await expect(page.locator('input[name="password"]'), `Password input missing at ${name}`).toBeVisible();
      await expect(page.locator('button[type="submit"]'), `Submit button missing at ${name}`).toBeVisible();
    }
  });

  test('should center content appropriately on large screens', async ({ page }) => {
    const { width, height } = BREAKPOINTS.xl;
    await page.setViewportSize({ width, height });

    await page.goto('/he/login');
    await page.waitForLoadState('networkidle');

    // Get the form container position
    const form = page.locator('input[name="email"]').locator('..');
    const box = await form.boundingBox();

    expect(box).toBeTruthy();
    if (box) {
      const centerX = box.x + box.width / 2;
      const viewportCenterX = width / 2;

      // Form should be roughly centered (within 20% of center)
      const deviation = Math.abs(centerX - viewportCenterX);
      expect(deviation).toBeLessThan(width * 0.2);
    }
  });
});
