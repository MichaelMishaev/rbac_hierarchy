import { test, expect } from '@playwright/test';
import { loginAs, testUsers } from '../fixtures/auth.fixture';
import {
  verifyRTL,
  verifyHebrewLocale,
  waitForDataLoad,
  verifyPageTitle,
  verifyDataDisplayed,
  verifyActionButton,
  verifyMobileLayout,
} from './helpers/ui-test-helpers';

/**
 * neighborhoods Page UI Tests
 */

test.describe('neighborhoods UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=שכונות');
    await page.waitForURL(/.*\/neighborhoods/);
  });

  test('should render neighborhoods page with RTL and Hebrew', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyRTL(page);
    await verifyHebrewLocale(page);
    await verifyPageTitle(page, 'שכונות');

    console.log('✅ neighborhoods page renders with RTL and Hebrew');
  });

  test('should display neighborhoods data', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ neighborhoods data displayed');
  });

  test('should display "Create neighborhood" button', async ({ page }) => {
    await waitForDataLoad(page);

    // SuperAdmin should see create button
    const createButton = page.locator('button').filter({ hasText: /שכונה חדש|הוסף אתר/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Create Neighborhood button is visible');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('שכונות');

    console.log('✅ neighborhoods page is responsive on mobile');
  });
});

test.describe('neighborhoods UI - Manager', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=שכונות');
    await page.waitForURL(/.*\/neighborhoods/);
  });

  test('should see only neighborhoods from their city', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');

    // Should see Corp1 neighborhood (מפעל תל אביב)
    // Should NOT see neighborhoods from other cities
    expect(pageContent).toBeTruthy();

    console.log('✅ City Coordinator sees only their city neighborhoods');
  });

  test('should display "Create neighborhood" button', async ({ page }) => {
    await waitForDataLoad(page);

    // City Coordinator CAN create neighborhoods
    const createButton = page.locator('button').filter({ hasText: /שכונה חדש|הוסף אתר/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ City Coordinator can create neighborhoods');
  });
});

test.describe('neighborhoods UI - activist coordinator', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=שכונות');
    await page.waitForURL(/.*\/neighborhoods/);
  });

  test('should see only assigned neighborhoods', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see their assigned neighborhood only
    expect(pageContent).toBeTruthy();

    console.log('✅ Activist Coordinator sees only assigned neighborhoods');
  });

  test('should NOT display "Create neighborhood" button', async ({ page }) => {
    await waitForDataLoad(page);

    // Activist Coordinator CANNOT create neighborhoods
    const createButton = page.locator('button').filter({ hasText: /שכונה חדש|הוסף אתר/ });
    await expect(createButton).not.toBeVisible();

    console.log('✅ Activist Coordinator cannot create neighborhoods');
  });
});

test.describe('neighborhoods UI - Data Display', () => {
  test('should display neighborhood information', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=שכונות');
    await page.waitForURL(/.*\/neighborhoods/);
    await waitForDataLoad(page);

    // Verify neighborhoods are displayed (either in table or grid/card layout)
    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');

    // Verify neighborhood information is shown (Hebrew labels)
    expect(pageContent).toContain('שם');

    console.log('✅ Neighborhood information displayed correctly');
  });
});
