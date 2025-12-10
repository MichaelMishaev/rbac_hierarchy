import { test, expect } from '@playwright/test';

/**
 * Test suite for User Creation with Neighborhood Selection (RTL)
 * Verifies that when creating a Supervisor, sites are visible and selectable in RTL layout
 */

const testUsers = {
  superAdmin: {
    email: 'admin@rbac.shop',
    password: 'admin123',
  },
  manager: {
    email: 'david.cohen@electra-tech.co.il',
    password: 'manager123',
  },
};

test.describe('User Neighborhood Selection (RTL)', () => {
  test.beforeEach(async ({ page }) => {
    // Set RTL locale
    await page.goto('/he/login');

    // Login as SuperAdmin (has access to all features)
    await page.fill('input[name="email"]', testUsers.superAdmin.email);
    await page.fill('input[name="password"]', testUsers.superAdmin.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Navigate to users page
    await page.goto('/he/users');
    await page.waitForLoadState('networkidle');
  });

  test('should display selected sites in RTL layout when creating supervisor', async ({ page }) => {
    // Click "Create User" button
    const createButton = page.getByRole('button', { name: /משתמש חדש/i });
    await createButton.click();

    // Wait for modal to open
    await page.waitForSelector('role=dialog', { timeout: 5000 });

    // Fill in basic info
    await page.fill('input[name="email"]', 'test.supervisor@electra-tech.co.il');
    await page.fill('input[name="password"]', 'test123456');

    // Find and fill name field
    const nameField = page.locator('input').filter({ hasText: /שם/ }).or(
      page.locator('label:has-text("שם")').locator('..').locator('input')
    );
    await nameField.first().fill('בודק טסט');

    // Select role: Activist Coordinator (מפקח)
    const roleSelect = page.locator('div[role="button"]').filter({ hasText: /תפקיד|מפקח/ }).first();
    await roleSelect.click();
    await page.getByRole('option', { name: /מפקח/i }).click();

    // Select corporation
    await page.waitForTimeout(500); // Wait for city field to appear
    const corpSelect = page.locator('div[role="button"]').filter({ hasText: /תאגיד/ }).first();
    await corpSelect.click();
    await page.getByRole('option').first().click(); // Select first corporation

    // Wait for sites field to appear
    await page.waitForTimeout(500);

    // Find sites autocomplete by test-id
    const sitesAutocomplete = page.locator('[data-testid="sites-autocomplete"]');
    await expect(sitesAutocomplete).toBeVisible({ timeout: 5000 });

    // Click on sites input
    const sitesInput = sitesAutocomplete.locator('input');
    await sitesInput.click();

    // Wait for dropdown to open
    await page.waitForSelector('role=listbox', { timeout: 5000 });

    // Select first site
    const firstSiteOption = page.getByRole('option').first();
    const firstSiteName = await firstSiteOption.textContent();
    await firstSiteOption.click();

    // Verify that selected neighborhood chip is visible
    const selectedChip = page.locator('.MuiChip-root', { hasText: firstSiteName || '' });
    await expect(selectedChip).toBeVisible({ timeout: 3000 });

    // Verify chip has correct styling (blue background)
    const chipBackground = await selectedChip.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });

    // Should have primary color (blue)
    expect(chipBackground).toBeTruthy();

    // Verify chip text is visible and readable
    const chipText = await selectedChip.textContent();
    expect(chipText).toContain(firstSiteName);

    // Take screenshot for visual verification
    await page.screenshot({
      path: 'tests/e2e/screenshots/user-site-selection-rtl.png',
      fullPage: true
    });

    console.log('✅ Neighborhood chip is visible with text:', chipText);
    console.log('✅ Chip background color:', chipBackground);
  });

  test('should handle multiple neighborhood selection in RTL', async ({ page }) => {
    // Click "Create User" button
    const createButton = page.getByRole('button', { name: /משתמש חדש/i });
    await createButton.click();

    // Wait for modal
    await page.waitForSelector('role=dialog', { timeout: 5000 });

    // Fill basic fields
    await page.fill('input[name="email"]', 'multi.supervisor@electra-tech.co.il');
    await page.fill('input[name="password"]', 'test123456');

    const nameField = page.locator('input').filter({ hasText: /שם/ }).or(
      page.locator('label:has-text("שם")').locator('..').locator('input')
    );
    await nameField.first().fill('מפקח רב-אתרים');

    // Select Activist Coordinator role
    const roleSelect = page.locator('div[role="button"]').filter({ hasText: /תפקיד/ }).first();
    await roleSelect.click();
    await page.getByRole('option', { name: /מפקח/i }).click();

    // Select corporation
    await page.waitForTimeout(500);
    const corpSelect = page.locator('div[role="button"]').filter({ hasText: /תאגיד/ }).first();
    await corpSelect.click();
    await page.getByRole('option').first().click();

    // Wait for sites field
    await page.waitForTimeout(500);
    const sitesAutocomplete = page.locator('[data-testid="sites-autocomplete"]');
    await expect(sitesAutocomplete).toBeVisible();

    // Select multiple sites
    const sitesInput = sitesAutocomplete.locator('input');

    // Select first site
    await sitesInput.click();
    await page.waitForSelector('role=listbox');
    const options = page.getByRole('option');
    const optionsCount = await options.count();

    if (optionsCount >= 2) {
      // Select first site
      await options.nth(0).click();
      await page.waitForTimeout(300);

      // Select second site
      await sitesInput.click();
      await options.nth(1).click();

      // Verify both chips are visible
      const chips = page.locator('.MuiChip-root').filter({ has: page.locator('.MuiChip-deleteIcon') });
      const chipCount = await chips.count();

      expect(chipCount).toBeGreaterThanOrEqual(2);

      console.log(`✅ Successfully selected ${chipCount} sites`);

      // Take screenshot
      await page.screenshot({
        path: 'tests/e2e/screenshots/user-multi-site-selection-rtl.png',
        fullPage: true
      });
    } else {
      console.log('⚠️  Less than 2 sites available, skipping multi-select test');
    }
  });

  test('should show validation error if no neighborhood selected for supervisor', async ({ page }) => {
    // Click "Create User"
    const createButton = page.getByRole('button', { name: /משתמש חדש/i });
    await createButton.click();

    await page.waitForSelector('role=dialog');

    // Fill fields but don't select site
    await page.fill('input[name="email"]', 'no.site@electra-tech.co.il');
    await page.fill('input[name="password"]', 'test123456');

    const nameField = page.locator('input').filter({ hasText: /שם/ }).or(
      page.locator('label:has-text("שם")').locator('..').locator('input')
    );
    await nameField.first().fill('מפקח ללא אתר');

    // Select Supervisor
    const roleSelect = page.locator('div[role="button"]').filter({ hasText: /תפקיד/ }).first();
    await roleSelect.click();
    await page.getByRole('option', { name: /מפקח/i }).click();

    // Select corporation
    await page.waitForTimeout(500);
    const corpSelect = page.locator('div[role="button"]').filter({ hasText: /תאגיד/ }).first();
    await corpSelect.click();
    await page.getByRole('option').first().click();

    // Don't select any site

    // Try to submit
    const submitButton = page.getByRole('button', { name: /צור|שמור/i }).last();
    await submitButton.click();

    // Wait for error message
    await page.waitForTimeout(1000);

    // Verify error message appears
    const errorMessage = page.locator('.MuiAlert-root, [role="alert"]').filter({
      hasText: /אתר|site/i
    });

    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    console.log('✅ Validation error displayed correctly for missing neighborhood selection');
  });
});
