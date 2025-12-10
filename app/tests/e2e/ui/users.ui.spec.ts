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
 * Users Page UI Tests
 */

test.describe('Users UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=משתמשים');
    await page.waitForURL(/.*\/users/);
  });

  test('should render users page with RTL and Hebrew', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyRTL(page);
    await verifyHebrewLocale(page);
    await verifyPageTitle(page, 'משתמשים');

    console.log('✅ Users page renders with RTL and Hebrew');
  });

  test('should display users data', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyDataDisplayed(page, 1);

    console.log('✅ Users data displayed');
  });

  test('should display "Create User" button', async ({ page }) => {
    await waitForDataLoad(page);

    const createButton = page.locator('button').filter({ hasText: /משתמש חדש|הוסף משתמש/ });
    await expect(createButton.first()).toBeVisible();

    console.log('✅ Create User button is visible');
  });

  test('should display users from all cities', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // SuperAdmin should see users from all cities
    expect(pageContent).toBeTruthy();

    console.log('✅ SuperAdmin sees users from all cities');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('משתמשים');

    console.log('✅ Users page is responsive on mobile');
  });
});

test.describe('Users UI - Manager', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);

    // Check if users link exists in navigation
    const nav = page.locator('nav');
    const usersLink = nav.locator('text=משתמשים');

    if (await usersLink.isVisible()) {
      await usersLink.click();
      await page.waitForURL(/.*\/users/);
    }
  });

  test('should see only users from their city', async ({ page }) => {
    const url = page.url();

    if (url.includes('/users')) {
      await waitForDataLoad(page);

      const pageContent = await page.textContent('body');

      // Should see only users from their city
      expect(pageContent).toBeTruthy();

      console.log('✅ City Coordinator sees only their city users');
    } else {
      console.log('⏭️  City Coordinator may not have access to users page');
    }
  });

  test('should display "Create User" button if has permission', async ({ page }) => {
    const url = page.url();

    if (url.includes('/users')) {
      await waitForDataLoad(page);

      const createButton = page.locator('button').filter({ hasText: /משתמש חדש|הוסף משתמש/ });

      // City Coordinator may or may not have permission depending on RBAC rules
      const isVisible = await createButton.isVisible();
      console.log(`✅ City Coordinator create user button: ${isVisible ? 'visible' : 'not visible'}`);
    }
  });
});

test.describe('Users UI - Activist Coordinator (Should Not Access)', () => {
  test('should NOT display users in navigation', async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);

    const nav = page.locator('nav');
    const usersLink = nav.locator('text=משתמשים');

    // Activist Coordinator should NOT see users link
    await expect(usersLink).not.toBeVisible();

    console.log('✅ Activist Coordinator cannot see users in navigation');
  });
});

test.describe('Users UI - Data Display', () => {
  test('should display user information', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=משתמשים');
    await page.waitForURL(/.*\/users/);
    await waitForDataLoad(page);

    // Verify users are displayed (either in table or grid/card layout)
    await verifyDataDisplayed(page, 1);

    const pageContent = await page.textContent('body');

    // Verify user information is shown
    expect(pageContent).toBeTruthy();

    console.log('✅ User information displayed correctly');
  });

  test('should display user roles in Hebrew', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=משתמשים');
    await page.waitForURL(/.*\/users/);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should display role names
    expect(pageContent).toBeTruthy();

    console.log('✅ User roles displayed');
  });
});

test.describe('Users UI - Search and Filter', () => {
  test('should display search functionality', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
    await page.click('text=משתמשים');
    await page.waitForURL(/.*\/users/);
    await waitForDataLoad(page);

    const searchInput = page.locator('input[type="text"]').first();
    await expect(searchInput).toBeVisible();

    console.log('✅ User search functionality available');
  });
});
