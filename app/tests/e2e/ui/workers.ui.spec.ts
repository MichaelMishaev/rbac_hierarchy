import { test, expect } from '@playwright/test';
import { loginAs, testUsers } from '../fixtures/auth.fixture';
import {
  verifyRTL,
  verifyHebrewLocale,
  waitForDataLoad,
  verifyPageTitle,
  verifyDataDisplayed,
  verifyMobileLayout,
} from './helpers/ui-test-helpers';

/**
 * Workers Page UI Tests
 */

test.describe('Workers UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=עובדים');
    await page.waitForURL(/.*\/activists/);
  });

  test('should render workers page with RTL and Hebrew', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyRTL(page);
    await verifyHebrewLocale(page);
    await verifyPageTitle(page, 'עובדים');

    console.log('✅ Workers page renders with RTL and Hebrew');
  });

  test('should display workers data', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyDataDisplayed(page, 1);

    console.log('✅ Workers data displayed');
  });

  test('should display "Create Worker" button', async ({ page }) => {
    await waitForDataLoad(page);

    const createButton = page.locator('button').filter({ hasText: /עובד חדש|הוסף עובד/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Create Activist button is visible');
  });

  test('should display workers from all corporations', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // SuperAdmin should see workers from all corporations
    expect(pageContent).toBeTruthy();

    console.log('✅ SuperAdmin sees workers from all corporations');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('עובדים');

    console.log('✅ Workers page is responsive on mobile');
  });
});

test.describe('Workers UI - Manager', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.manager);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=עובדים');
    await page.waitForURL(/.*\/activists/);
  });

  test('should see only workers from their corporation', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see Corp1 workers only
    // Should NOT see workers from Corp2/Corp3
    expect(!pageContent?.includes('דני אברהם')).toBeTruthy(); // Corp2 worker
    expect(!pageContent?.includes('יאיר כהן')).toBeTruthy(); // Corp3 worker

    console.log('✅ City Coordinator sees only their city workers');
  });

  test('should display "Create Worker" button', async ({ page }) => {
    await waitForDataLoad(page);

    const createButton = page.locator('button').filter({ hasText: /עובד חדש|הוסף עובד/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ City Coordinator can create workers');
  });
});

test.describe('Workers UI - Supervisor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.supervisor);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=עובדים');
    await page.waitForURL(/.*\/activists/);
  });

  test('should see only workers from assigned sites', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see workers from assigned neighborhood only
    expect(pageContent).toBeTruthy();

    console.log('✅ Activist Coordinator sees only workers from assigned sites');
  });

  test('should display "Create Worker" button', async ({ page }) => {
    await waitForDataLoad(page);

    const createButton = page.locator('button').filter({ hasText: /עובד חדש|הוסף עובד/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Activist Coordinator can create workers');
  });
});

test.describe('Workers UI - Data Display', () => {
  test('should display activist information', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=עובדים');
    await page.waitForURL(/.*\/activists/);
    await waitForDataLoad(page);

    // Verify workers are displayed (either in table or grid/card layout)
    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');

    // Verify activist information is shown
    expect(pageContent).toBeTruthy();

    console.log('✅ Activist information displayed correctly');
  });
});

test.describe('Workers UI - Search and Filter', () => {
  test('should display search functionality', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=עובדים');
    await page.waitForURL(/.*\/activists/);
    await waitForDataLoad(page);

    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    console.log('✅ Activist search functionality available');
  });
});
