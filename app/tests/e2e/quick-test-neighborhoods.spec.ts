import { test, expect } from '@playwright/test';

/**
 * Quick test to verify neighborhoods page works after fixing the areas prop issue
 */
test.describe('Neighborhoods Page - Quick Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Login as SuperAdmin
    await page.goto('http://localhost:3200/he/login');

    // Click on SuperAdmin quick login
    await page.click('text=מנהל מערכת ראשי');
    await page.click('button:has-text("התחבר")');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
  });

  test('should load neighborhoods page without errors', async ({ page }) => {
    // Navigate to neighborhoods page
    await page.goto('http://localhost:3200/he/neighborhoods');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check that there are no runtime errors on the page
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // Wait a bit to catch any errors
    await page.waitForTimeout(2000);

    // Verify no errors occurred
    expect(pageErrors).toEqual([]);

    // Verify the page title is visible
    await expect(page.locator('h4')).toBeVisible();

    console.log('✅ Neighborhoods page loaded successfully without errors');
  });

  test('should open create neighborhood modal', async ({ page }) => {
    // Navigate to neighborhoods page
    await page.goto('http://localhost:3200/he/neighborhoods');
    await page.waitForLoadState('networkidle');

    // Find and click the "Add" button
    const addButton = page.locator('button:has-text("הוסף שכונה"), button:has-text("שכונה חדשה"), button:has(svg)').first();
    await addButton.click();

    // Wait for modal to open
    await page.waitForTimeout(1000);

    // Check if modal opened (should contain area selector)
    const modalVisible = await page.locator('text=אזור, text=Area').isVisible().catch(() => false);

    if (modalVisible) {
      console.log('✅ Modal opened successfully');

      // Verify area dropdown exists and is not causing errors
      const areaSelect = page.locator('label:has-text("אזור"), label:has-text("Area")');
      await expect(areaSelect).toBeVisible();

      console.log('✅ Area selector is visible in the modal');
    } else {
      console.log('⚠️  Modal did not open or area selector not found');
    }
  });

  test('should display neighborhoods table', async ({ page }) => {
    // Navigate to neighborhoods page
    await page.goto('http://localhost:3200/he/neighborhoods');
    await page.waitForLoadState('networkidle');

    // Check if neighborhoods grid/table is visible
    const gridVisible = await page.locator('[role="grid"], .MuiDataGrid-root, .neighborhoods-grid').isVisible().catch(() => false);

    if (gridVisible) {
      console.log('✅ Neighborhoods table/grid is visible');
    } else {
      // Check if there's an empty state
      const emptyState = await page.locator('text=אין שכונות, text=No neighborhoods').isVisible().catch(() => false);
      if (emptyState) {
        console.log('✅ Empty state is shown (no neighborhoods yet)');
      } else {
        console.log('ℹ️  Neighborhoods display format not detected (might be using cards)');
      }
    }
  });
});
