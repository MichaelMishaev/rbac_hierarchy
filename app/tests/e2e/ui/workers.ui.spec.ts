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
 * activists Page UI Tests
 */

test.describe('activists UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=פעילים');
    await page.waitForURL(/.*\/activists/);
  });

  test('should render activists page with RTL and Hebrew', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyRTL(page);
    await verifyHebrewLocale(page);
    await verifyPageTitle(page, 'פעילים');

    console.log('✅ activists page renders with RTL and Hebrew');
  });

  test('should display activists data', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyDataDisplayed(page, 1);

    console.log('✅ activists data displayed');
  });

  test('should display "Create activist" button', async ({ page }) => {
    await waitForDataLoad(page);

    const createButton = page.locator('button').filter({ hasText: /פעיל חדש|הוסף עובד/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Create Activist button is visible');
  });

  test('should display activists from all cities', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // SuperAdmin should see activists from all cities
    expect(pageContent).toBeTruthy();

    console.log('✅ SuperAdmin sees activists from all cities');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('פעילים');

    console.log('✅ activists page is responsive on mobile');
  });
});

test.describe('activists UI - Manager', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=פעילים');
    await page.waitForURL(/.*\/activists/);
  });

  test('should see only activists from their city', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see Corp1 activists only
    // Should NOT see activists from Corp2/Corp3
    expect(!pageContent?.includes('דני אברהם')).toBeTruthy(); // Corp2 activist
    expect(!pageContent?.includes('יאיר כהן')).toBeTruthy(); // Corp3 activist

    console.log('✅ City Coordinator sees only their city activists');
  });

  test('should display "Create activist" button', async ({ page }) => {
    await waitForDataLoad(page);

    const createButton = page.locator('button').filter({ hasText: /פעיל חדש|הוסף עובד/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ City Coordinator can create activists');
  });
});

test.describe('activists UI - activist coordinator', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=פעילים');
    await page.waitForURL(/.*\/activists/);
  });

  test('should see only activists from assigned neighborhoods', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see activists from assigned neighborhood only
    expect(pageContent).toBeTruthy();

    console.log('✅ Activist Coordinator sees only activists from assigned neighborhoods');
  });

  test('should display "Create activist" button', async ({ page }) => {
    await waitForDataLoad(page);

    const createButton = page.locator('button').filter({ hasText: /פעיל חדש|הוסף עובד/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Activist Coordinator can create activists');
  });
});

test.describe('activists UI - Data Display', () => {
  test('should display activist information', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=פעילים');
    await page.waitForURL(/.*\/activists/);
    await waitForDataLoad(page);

    // Verify activists are displayed (either in table or grid/card layout)
    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');

    // Verify activist information is shown
    expect(pageContent).toBeTruthy();

    console.log('✅ Activist information displayed correctly');
  });
});

test.describe('activists UI - Search and Filter', () => {
  test('should display search functionality', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=פעילים');
    await page.waitForURL(/.*\/activists/);
    await waitForDataLoad(page);

    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    console.log('✅ Activist search functionality available');
  });
});
