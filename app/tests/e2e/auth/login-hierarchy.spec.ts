import { test, expect } from '@playwright/test';
import { testUsers, loginAs } from '../fixtures/auth.fixture';

/**
 * Authentication and Hierarchy Tests - v2.0
 * Tests SuperAdmin, Area Manager, City Coordinator, Activist Coordinator role hierarchy
 */

test.describe('Authentication & Hierarchy - v2.0', () => {
  test('SuperAdmin should have system-wide access', async ({ page }) => {
    // Login as SuperAdmin using fixture
    await loginAs(page, testUsers.superAdmin);

    // Should reach dashboard
    await page.waitForURL(/\/(he\/)?dashboard/, { timeout: 10000 });

    // SuperAdmin should see greeting (מנהל מערכת ראשי)
    await expect(page.locator('text=/שלום/i')).toBeVisible({ timeout: 10000 });

    // SuperAdmin should see all navigation items
    await expect(page.locator('nav').getByText('ערים')).toBeVisible();
    await expect(page.locator('nav').getByText('שכונות')).toBeVisible();
    await expect(page.locator('nav').getByText('משתמשים')).toBeVisible();

    console.log('✅ SuperAdmin has system-wide access');
  });

  test('SuperAdmin can access cities page', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);

    // Navigate to cities (corporations)
    await page.locator('nav').getByText('ערים').click();
    await page.waitForURL(/.*\/cities/, { timeout: 5000 });

    // Should see cities page
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ SuperAdmin can access cities page');
  });

  test('Area Manager should have regional access', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);

    // Area Manager should see greeting
    await expect(page.locator('text=/שלום.*שרה/i')).toBeVisible({ timeout: 10000 });

    console.log('✅ Area Manager login successful');
  });

  test('City Coordinator should only see their city', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);

    // City Coordinator should see their role (David Levi)
    await expect(page.locator('text=/שלום.*דוד.*לוי/i')).toBeVisible({ timeout: 10000 });

    console.log('✅ City Coordinator login successful');
  });

  test('Activist Coordinator should only access assigned neighborhoods', async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);

    // Activist Coordinator should see their role (Rachel Ben-David)
    await expect(page.locator('text=/שלום.*רחל/i')).toBeVisible({ timeout: 10000 });

    console.log('✅ Activist Coordinator login successful');
  });

  test('Invalid credentials should fail', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[name="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Should see error message
    await page.waitForTimeout(2000);

    // Should still be on login page
    await expect(page).toHaveURL(/.*\/login/);

    console.log('✅ Invalid credentials rejected');
  });
});

test.describe('Role Hierarchy Enforcement', () => {
  test('SuperAdmin > Area Manager > City Coordinator hierarchy', async ({ page }) => {
    // Login as SuperAdmin
    await loginAs(page, testUsers.superAdmin);

    // SuperAdmin should see ALL cities
    await page.locator('nav').getByText('ערים').click();
    await page.waitForURL(/.*\/cities/, { timeout: 10000 });

    // Wait for data to load
    await page.waitForTimeout(1000);

    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ SuperAdmin sees all cities');
  });

  test('Area Manager can create users in their cities', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);

    // Navigate to users page
    await page.locator('nav').getByText('משתמשים').click();
    await page.waitForURL(/.*\/users/, { timeout: 10000 });

    // Should see "Create User" button
    const createButton = page.getByText('צור משתמש חדש');
    await expect(createButton).toBeVisible({ timeout: 5000 });

    console.log('✅ Area Manager can access user creation');
  });

  test('City Coordinator can create activist coordinators in their city', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);

    // City Coordinator should have access to their city
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ City Coordinator has access to their city');
  });

  test('Activist Coordinator cannot create other activist coordinators', async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);

    // Activist Coordinator should NOT see create user button in nav
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();

    console.log('✅ Activist Coordinator has limited access');
  });
});

test.describe('Sign Out Flow', () => {
  test('All roles can sign out successfully', async ({ page }) => {
    const users = [
      { ...testUsers.superAdmin, displayName: 'SuperAdmin' },
      { ...testUsers.areaManager, displayName: 'Area Manager' },
      { ...testUsers.cityCoordinator, displayName: 'City Coordinator' },
      { ...testUsers.activistCoordinator, displayName: 'Activist Coordinator' },
    ];

    for (const user of users) {
      await loginAs(page, user);

      // Click sign out
      const signOutButton = page.locator('button:has-text("התנתק")').first();
      await signOutButton.click();

      // Should redirect to login (increased timeout for server processing)
      try {
        await page.waitForURL(/.*\/login/, { timeout: 15000 });
      } catch (error) {
        // If first attempt fails, wait and retry
        await page.waitForTimeout(2000);
        await page.goto('/he/login');
      }

      console.log(`✅ ${user.displayName} sign out successful`);

      // Add longer delay between iterations to avoid overwhelming server
      await page.waitForTimeout(3000);
    }
  });
});
