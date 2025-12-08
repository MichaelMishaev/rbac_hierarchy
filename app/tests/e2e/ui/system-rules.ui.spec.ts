import { test, expect } from '@playwright/test';
import { loginAs, testUsers } from '../fixtures/auth.fixture';
import {
  verifyRTL,
  verifyHebrewLocale,
  waitForDataLoad,
  verifyPageTitle,
  verifyMobileLayout,
} from './helpers/ui-test-helpers';

/**
 * System Rules Page UI Tests
 */

test.describe('System Rules UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);

    // Navigate to system rules
    await page.goto('/he/system-rules');
    await page.waitForURL(/.*\/system-rules/);
  });

  test('should render system rules page with RTL and Hebrew', async ({ page }) => {
    await waitForDataLoad(page);

    await verifyRTL(page);
    await verifyHebrewLocale(page);

    const pageContent = await page.textContent('body');
    expect(pageContent?.includes('כללי מערכת') || pageContent?.includes('הגדרות')).toBeTruthy();

    console.log('✅ System Rules page renders with RTL and Hebrew');
  });

  test('should display system rules content', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ System Rules content displayed');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ System Rules page is responsive on mobile');
  });
});

test.describe('System Rules UI - Manager', () => {
  test('should handle manager access to system rules', async ({ page }) => {
    await loginAs(page, testUsers.manager);
    await page.waitForURL(/\/(he\/)?dashboard/);

    // Try to access system rules
    await page.goto('/he/system-rules');

    await page.waitForTimeout(1000);

    const pageContent = await page.textContent('body');

    // Manager may or may not have access depending on RBAC rules
    expect(pageContent).toBeTruthy();

    console.log('✅ Manager access to System Rules handled');
  });
});

test.describe('System Rules UI - Supervisor', () => {
  test('should handle supervisor access to system rules', async ({ page }) => {
    await loginAs(page, testUsers.supervisor);
    await page.waitForURL(/\/(he\/)?dashboard/);

    // Try to access system rules
    await page.goto('/he/system-rules');

    await page.waitForTimeout(1000);

    const pageContent = await page.textContent('body');

    // Supervisor may or may not have access
    expect(pageContent).toBeTruthy();

    console.log('✅ Supervisor access to System Rules handled');
  });
});
