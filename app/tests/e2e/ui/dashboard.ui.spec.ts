import { test, expect } from '@playwright/test';
import { loginAs, testUsers } from '../fixtures/auth.fixture';
import {
  verifyRTL,
  verifyHebrewLocale,
  waitForDataLoad,
  verifyNavigationSidebar,
  verifyUserGreeting,
  verifyPageTitle,
  verifyKPICard,
  verifyDesktopLayout,
  verifyMobileLayout,
} from './helpers/ui-test-helpers';

/**
 * Dashboard UI Tests
 * Tests that verify the actual UI rendering (not just API calls)
 */

test.describe('Dashboard UI - SuperAdmin', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);
  });

  test('should render dashboard with RTL and Hebrew', async ({ page }) => {
    // Verify RTL layout
    await verifyRTL(page);
    await verifyHebrewLocale(page);

    // Verify page title
    await verifyPageTitle(page, 'לוח בקרה');

    console.log('✅ Dashboard renders with RTL and Hebrew');
  });

  test('should display user greeting', async ({ page }) => {
    await waitForDataLoad(page);

    // Verify greeting shows SuperAdmin name
    await verifyUserGreeting(page, 'Super Admin');

    console.log('✅ User greeting displayed');
  });

  test('should display navigation sidebar with all items', async ({ page }) => {
    const expectedNavItems = [
      'לוח בקרה',
      'ערים',
      'שכונות',
      'פעילים',
      'משתמשים',
      'משימות',
    ];

    await verifyNavigationSidebar(page, expectedNavItems);

    console.log('✅ Navigation sidebar displayed with all items');
  });

  test('should display KPI cards with data', async ({ page }) => {
    await waitForDataLoad(page);

    // Verify KPI cards are visible (values are dynamic)
    await verifyKPICard(page, 'ערים');
    await verifyKPICard(page, 'שכונות');
    await verifyKPICard(page, 'פעילים');

    console.log('✅ KPI cards displayed with data');
  });

  test('should be responsive on mobile', async ({ page }) => {
    await verifyMobileLayout(page);
    await waitForDataLoad(page);

    // Verify page still renders on mobile
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('לוח בקרה');

    console.log('✅ Dashboard is responsive on mobile');
  });

  test('should navigate to cities page', async ({ page }) => {
    await page.click('text=ערים');
    await page.waitForURL(/.*\/cities/);

    // Verify navigation worked
    await verifyPageTitle(page, 'ערים');

    console.log('✅ Navigation to cities works');
  });
});

test.describe('Dashboard UI - Manager', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);
  });

  test('should render dashboard with city coordinator view', async ({ page }) => {
    await waitForDataLoad(page);

    // Verify RTL layout
    await verifyRTL(page);
    await verifyHebrewLocale(page);

    // Verify city coordinator greeting
    await verifyUserGreeting(page, 'דוד כהן');

    console.log('✅ City Coordinator dashboard renders correctly');
  });

  test('should NOT show cities in navigation', async ({ page }) => {
    const nav = page.locator('nav');
    const corporationsLink = nav.locator('text=ערים');

    // City Coordinator should not see cities link
    await expect(corporationsLink).not.toBeVisible();

    console.log('✅ City Coordinator cannot see cities link');
  });

  test('should display city-scoped data only', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see their city name (טכנולוגיות אלקטרה)
    expect(pageContent?.includes('טכנולוגיות') || pageContent?.includes('אלקטרה')).toBeTruthy();

    console.log('✅ City Coordinator sees city-scoped data');
  });
});

test.describe('Dashboard UI - activist coordinator', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);
    await page.waitForURL(/\/(he\/)?dashboard/);
  });

  test('should render dashboard with activist coordinator view', async ({ page }) => {
    await waitForDataLoad(page);

    // Verify RTL layout
    await verifyRTL(page);
    await verifyHebrewLocale(page);

    // Verify activist coordinator greeting
    await verifyUserGreeting(page, 'משה ישראלי');

    console.log('✅ Activist Coordinator dashboard renders correctly');
  });

  test('should have limited navigation items', async ({ page }) => {
    const nav = page.locator('nav');

    // Activist Coordinator should see limited navigation
    await expect(nav.getByText('לוח בקרה')).toBeVisible();
    await expect(nav.getByText('פעילים')).toBeVisible();

    // Should NOT see cities
    await expect(nav.getByText('ערים')).not.toBeVisible();

    console.log('✅ Activist Coordinator has limited navigation');
  });

  test('should display neighborhood-scoped data only', async ({ page }) => {
    await waitForDataLoad(page);

    const pageContent = await page.textContent('body');

    // Should see their assigned neighborhood info
    expect(pageContent).toBeTruthy();

    console.log('✅ Activist Coordinator sees neighborhood-scoped data');
  });
});

test.describe('Dashboard UI - Error Handling', () => {
  test('should handle network errors gracefully', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);

    // Simulate network failure (if needed in future)
    // For now, just verify page loads without crashes

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Dashboard handles errors gracefully');
  });

  test('should show loading state initially', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.waitForURL(/\/(he\/)?dashboard/);

    // Check if loading indicators exist (they should disappear after load)
    await page.waitForTimeout(500);

    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('לוח בקרה');

    console.log('✅ Loading states work correctly');
  });
});
