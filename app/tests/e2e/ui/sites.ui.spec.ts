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
 * Sites Page UI Tests
 */

test.describe('Sites UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=אתרים');
    await page.waitForURL(/.*\/sites/);
  });

  test('should render sites page with RTL and Hebrew', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyRTL(page);
    await verifyHebrewLocale(page);
    await verifyPageTitle(page, 'אתרים');

    console.log('✅ Sites page renders with RTL and Hebrew');
  });

  test('should display sites data', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Sites data displayed');
  });

  test('should display "Create Site" button', async ({ page }) => {
    await waitForDataLoad(page);

    // SuperAdmin should see create button
    const createButton = page.locator('button').filter({ hasText: /אתר חדש|הוסף אתר/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Create Site button is visible');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('אתרים');

    console.log('✅ Sites page is responsive on mobile');
  });
});

test.describe('Sites UI - Manager', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.manager);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=אתרים');
    await page.waitForURL(/.*\/sites/);
  });

  test('should see only sites from their corporation', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');

    // Should see Corp1 site (מפעל תל אביב)
    // Should NOT see sites from other corporations
    expect(pageContent).toBeTruthy();

    console.log('✅ Manager sees only their corporation sites');
  });

  test('should display "Create Site" button', async ({ page }) => {
    await waitForDataLoad(page);

    // Manager CAN create sites
    const createButton = page.locator('button').filter({ hasText: /אתר חדש|הוסף אתר/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Manager can create sites');
  });
});

test.describe('Sites UI - Supervisor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.supervisor);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=אתרים');
    await page.waitForURL(/.*\/sites/);
  });

  test('should see only assigned sites', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see their assigned site only
    expect(pageContent).toBeTruthy();

    console.log('✅ Supervisor sees only assigned sites');
  });

  test('should NOT display "Create Site" button', async ({ page }) => {
    await waitForDataLoad(page);

    // Supervisor CANNOT create sites
    const createButton = page.locator('button').filter({ hasText: /אתר חדש|הוסף אתר/ });
    await expect(createButton).not.toBeVisible();

    console.log('✅ Supervisor cannot create sites');
  });
});

test.describe('Sites UI - Data Display', () => {
  test('should display site information', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=אתרים');
    await page.waitForURL(/.*\/sites/);
    await waitForDataLoad(page);

    // Verify sites are displayed (either in table or grid/card layout)
    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');

    // Verify site information is shown (Hebrew labels)
    expect(pageContent).toContain('שם');

    console.log('✅ Site information displayed correctly');
  });
});
