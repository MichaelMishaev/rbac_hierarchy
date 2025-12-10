import { test, expect } from '@playwright/test';

/**
 * Test activist coordinator activist creation flow
 * User: moshe.israeli@electra-tech.co.il
 * Password: supervisor123
 * Site: משרד ראשי - תל אביב (electra-tlv-hq)
 */

test.describe('Supervisor Activist Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console messages
    page.on('console', (msg) => {
      console.log(`BROWSER ${msg.type()}: ${msg.text()}`);
    });

    // Capture page errors
    page.on('pageerror', (error) => {
      console.error(`PAGE ERROR: ${error.message}`);
    });

    // Capture failed requests
    page.on('requestfailed', (request) => {
      console.error(`REQUEST FAILED: ${request.url()} - ${request.failure()?.errorText}`);
    });

    // Navigate to login page
    await page.goto('http://localhost:3200/login');

    // Login as supervisor
    await page.fill('input[type="email"]', 'moshe.israeli@electra-tech.co.il');
    await page.fill('input[type="password"]', 'supervisor123');
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard
    await page.waitForURL('**/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);

    console.log('✅ Logged in successfully');
  });

  test('should display correct activist count on dashboard', async ({ page }) => {
    // Check dashboard shows 2 workers
    const workerCountText = await page.locator('text=2').first();
    await expect(workerCountText).toBeVisible();

    console.log('✅ Dashboard shows correct activist count');
  });

  test('should navigate to workers page and display existing workers', async ({ page }) => {
    // Navigate to workers page
    await page.goto('http://localhost:3200/he/workers');

    // Wait for workers to load
    await page.waitForSelector('text=עובדים', { timeout: 10000 });

    // Check if existing workers are displayed
    const ronitLevi = page.locator('text=רונית לוי');
    const aviCohen = page.locator('text=אבי כהן');

    await expect(ronitLevi).toBeVisible({ timeout: 10000 });
    await expect(aviCohen).toBeVisible({ timeout: 10000 });

    console.log('✅ Existing workers are displayed');
  });

  test('should create a new activist and see it in the list', async ({ page }) => {
    // Navigate to workers page
    await page.goto('http://localhost:3200/he/workers');
    await page.waitForSelector('text=עובדים', { timeout: 10000 });

    console.log('📍 On workers page');

    // Click "Add Worker" button
    const addButton = page.locator('button:has-text("הוסף עובד"), button:has-text("עובד חדש")').first();
    await addButton.click();

    console.log('📍 Clicked add activist button');

    // Wait for modal to open (correct title: "הוסף עובד חדש")
    await page.waitForSelector('text=הוסף עובד חדש', { timeout: 5000 });

    console.log('📍 Modal opened');

    // Fill in activist details
    const timestamp = Date.now();
    const workerName = `עובד טסט ${timestamp}`;

    // Fill name (שם field) - using Material-UI TextField getByLabel
    await page.getByLabel('שם *').fill(workerName);
    console.log(`📍 Filled name: ${workerName}`);

    // Neighborhood and activist coordinator should be pre-selected (required fields)
    console.log('📍 Neighborhood and activist coordinator are pre-selected');

    // Take screenshot before submit
    await page.screenshot({ path: 'tests/screenshots/before-submit.png', fullPage: true });

    // Submit form
    const submitButton = page.locator('button[type="submit"], button:has-text("שמור"), button:has-text("צור")').first();
    await submitButton.click();

    console.log('📍 Clicked submit');

    // Wait for modal to close
    await page.waitForSelector('text=הוסף עובד חדש', { state: 'hidden', timeout: 5000 });

    console.log('📍 Modal closed');

    // Wait a bit for the activist to appear
    await page.waitForTimeout(2000);

    // Take screenshot after submit
    await page.screenshot({ path: 'tests/screenshots/after-submit.png', fullPage: true });

    // Check if the new activist appears in the list
    const newWorker = page.locator(`text=${workerName}`);

    try {
      await expect(newWorker).toBeVisible({ timeout: 5000 });
      console.log('✅ New activist appears in the list!');
    } catch (error) {
      console.error('❌ New activist NOT visible in the list');

      // Get all activist names on the page for debugging
      const allWorkers = await page.locator('[data-testid="worker-card"], .worker-name, text=/^[א-ת]+ [א-ת]+$/').allTextContents();
      console.log('All workers on page:', allWorkers);

      throw error;
    }
  });

  test('should show error if validation fails', async ({ page }) => {
    // Navigate to workers page
    await page.goto('http://localhost:3200/he/workers');
    await page.waitForSelector('text=עובדים', { timeout: 10000 });

    // Click "Add Worker" button
    const addButton = page.locator('button:has-text("הוסף עובד"), button:has-text("עובד חדש")').first();
    await addButton.click();

    // Wait for modal
    await page.waitForSelector('text=הוסף עובד חדש', { timeout: 5000 });

    // Try to submit without filling required fields
    const submitButton = page.locator('button[type="submit"], button:has-text("שמור"), button:has-text("צור")').first();
    await submitButton.click();

    // Should show validation error
    const errorMessage = page.locator('text=/שגיאה|חובה|required/i').first();
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    console.log('✅ Validation error displayed correctly');
  });
});
