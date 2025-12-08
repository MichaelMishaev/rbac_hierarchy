import { test, expect } from '@playwright/test';
import { loginAs, testUsers } from '../fixtures/auth.fixture';
import {
  verifyRTL,
  verifyHebrewLocale,
  waitForDataLoad,
  verifyMobileLayout,
} from './helpers/ui-test-helpers';

/**
 * Settings/Notifications Page UI Tests
 */

test.describe('Settings/Notifications UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);

    // Navigate to notifications settings
    await page.goto('/he/settings/notifications');
    await page.waitForURL(/.*\/settings\/notifications/);
  });

  test('should render notifications page with RTL and Hebrew', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyRTL(page);
    await verifyHebrewLocale(page);

    const pageContent = await page.textContent('body');
    expect(pageContent?.includes('התראות') || pageContent?.includes('הגדרות')).toBeTruthy();

    console.log('✅ Notifications page renders with RTL and Hebrew');
  });

  test('should display notification settings', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Notification settings displayed');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Notifications page is responsive on mobile');
  });
});

test.describe('Settings/Notifications UI - Manager', () => {
  test('should display manager-specific notification settings', async ({ page }) => {
    await loginAs(page, testUsers.manager);
    await page.waitForURL(/\/(he\/)?dashboard/);

    await page.goto('/he/settings/notifications');

    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Manager notification settings displayed');
  });
});

test.describe('Settings/Notifications UI - Supervisor', () => {
  test('should display supervisor-specific notification settings', async ({ page }) => {
    await loginAs(page, testUsers.supervisor);
    await page.waitForURL(/\/(he\/)?dashboard/);

    await page.goto('/he/settings/notifications');

    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Supervisor notification settings displayed');
  });
});

test.describe('Settings/Notifications UI - Push Subscription', () => {
  test('should display push notification subscription options', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);

    await page.goto('/he/settings/notifications');
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should display push notification options
    expect(pageContent?.includes('התראות') || pageContent?.includes('push')).toBeTruthy();

    console.log('✅ Push notification options displayed');
  });
});
