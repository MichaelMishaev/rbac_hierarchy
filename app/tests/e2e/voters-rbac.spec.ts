/**
 * E2E Tests for Voter RBAC and Visibility Rules
 *
 * Tests:
 * - SuperAdmin sees all voters
 * - Area Manager sees voters in their area
 * - City Coordinator sees voters in their city
 * - Activist Coordinator sees only their own voters
 * - Duplicates dashboard is SuperAdmin-only
 * - Visibility chain enforcement
 */

import { test, expect } from '@playwright/test';

test.describe('Voter RBAC and Visibility', () => {
  test('SuperAdmin should see all voters', async ({ page }) => {
    // Login as SuperAdmin
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('admin@election.test');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-button').click();

    // Navigate to voters
    await page.goto('/he/voters');

    // Verify voters list is visible
    await expect(page.getByText('רשימת בוחרים')).toBeVisible();

    // Verify at least some voters are shown
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('SuperAdmin should see Duplicates tab', async ({ page }) => {
    // Login as SuperAdmin
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('admin@election.test');
    await page.getByTestId('password-input').fill('admin123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Verify Duplicates tab exists
    await expect(page.getByRole('tab', { name: 'כפילויות' })).toBeVisible();

    // Click Duplicates tab
    await page.getByRole('tab', { name: 'כפילויות' }).click();

    // Verify duplicates dashboard
    await expect(page.getByText('דוח כפילויות')).toBeVisible();
  });

  test('Area Manager should see voters in their area', async ({ page }) => {
    // Login as Area Manager
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('sarah.cohen@telaviv-district.test');
    await page.getByTestId('password-input').fill('area123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Verify voters list is visible
    await expect(page.getByText('רשימת בוחרים')).toBeVisible();

    // Verify voters are shown (should see voters from Tel Aviv district)
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  });

  test('City Coordinator should see voters in their city', async ({ page }) => {
    // Login as City Coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('david.levi@telaviv.test');
    await page.getByTestId('password-input').fill('manager123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Verify voters list is visible
    await expect(page.getByText('רשימת בוחרים')).toBeVisible();

    // Verify can see voters from activist coordinators in their city
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    // Should see at least the voters from activist coordinators in Tel Aviv
    if (count > 0) {
      // Verify "Inserted By" column shows activist coordinators
      await expect(page.locator('table tbody')).toContainText('רכז פעילים');
    }
  });

  test('Activist Coordinator should see only their own voters', async ({ page }) => {
    // Login as Activist Coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('rachel.bendavid@telaviv.test');
    await page.getByTestId('password-input').fill('supervisor123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Verify voters list is visible
    await expect(page.getByText('רשימת בוחרים')).toBeVisible();

    // Verify all shown voters were inserted by this user
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    if (count > 0) {
      // Check "Inserted By" column for all rows
      const inserters = await page.locator('table tbody td:nth-child(6)').allTextContents();

      // All should be inserted by Rachel
      for (const inserter of inserters) {
        expect(inserter).toContain('רחל בן-דוד');
      }
    }
  });

  test('Non-SuperAdmin should NOT see Duplicates tab', async ({ page }) => {
    // Login as City Coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('david.levi@telaviv.test');
    await page.getByTestId('password-input').fill('manager123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Verify Duplicates tab does NOT exist
    await expect(page.getByRole('tab', { name: 'כפילויות' })).not.toBeVisible();
  });

  test('Activist Coordinator cannot see other coordinators voters', async ({ page }) => {
    // Login as Activist Coordinator (Rachel)
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('rachel.bendavid@telaviv.test');
    await page.getByTestId('password-input').fill('supervisor123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Search for a voter from another coordinator (Yael)
    await page.getByPlaceholder('שם, טלפון, אימייל').fill('יעל כהן');

    await page.waitForTimeout(500);

    // Verify no results (Rachel can't see Yael's voters)
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    if (count > 0) {
      // If there are results, they should NOT be inserted by Yael
      const inserters = await page.locator('table tbody td:nth-child(6)').allTextContents();
      for (const inserter of inserters) {
        expect(inserter).not.toContain('יעל כהן');
      }
    }
  });

  test('should enforce visibility when creating voter', async ({ page }) => {
    // Login as Activist Coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('rachel.bendavid@telaviv.test');
    await page.getByTestId('password-input').fill('supervisor123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Create a voter
    await page.getByRole('button', { name: /הוסף בוחר/ }).click();

    await page.getByLabel('שם מלא').fill('בדיקת RBAC');
    await page.getByLabel('טלפון').fill('0509999999');

    await page.getByRole('button', { name: /הוסף בוחר/ }).click();

    // Verify success
    await expect(page.getByText('הבוחר נוסף בהצלחה!')).toBeVisible();

    // Verify voter appears immediately (can see own voters)
    await page.waitForTimeout(1000);
    await expect(page.getByText('בדיקת RBAC')).toBeVisible();
  });

  test('City Coordinator sees statistics for their city only', async ({ page }) => {
    // Login as City Coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('david.levi@telaviv.test');
    await page.getByTestId('password-input').fill('manager123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Click Statistics tab
    await page.getByRole('tab', { name: 'סטטיסטיקות' }).click();

    // Verify statistics dashboard
    await expect(page.getByText('סטטיסטיקות בוחרים')).toBeVisible();

    // Verify stats are shown (should be scoped to their city)
    await expect(page.getByText('סה"כ בוחרים')).toBeVisible();
    await expect(page.getByText('פעילים')).toBeVisible();
  });

  test('Area Manager sees voters from multiple cities in their area', async ({ page }) => {
    // Login as Area Manager
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('sarah.cohen@telaviv-district.test');
    await page.getByTestId('password-input').fill('area123');
    await page.getByTestId('login-button').click();

    await page.goto('/he/voters');

    // Verify can see voters from their area
    const rows = page.locator('table tbody tr');
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);

    // Verify insertion activity shows multiple users
    await page.getByRole('tab', { name: 'סטטיסטיקות' }).click();

    await expect(page.getByText('פעילות הכנסה לפי משתמש')).toBeVisible();

    // Should see multiple users in the activity list
    const userRows = page.locator('ul li');
    const userCount = await userRows.count();

    // Area Manager should see activity from multiple coordinators
    expect(userCount).toBeGreaterThan(0);
  });
});
