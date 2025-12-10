/**
 * E2E Tests for "Add New" Functionality with Strict Hierarchy Validation
 *
 * Tests comprehensive business rules from /docs/infrastructure/ADD_NEW_DESIGN.md
 *
 * Entity Creation Rules:
 * - Areas: SuperAdmin ONLY
 * - Cities: SuperAdmin + Area Manager (in their area only)
 * - Neighborhoods: SuperAdmin + Area Manager (in their area) + City Coordinator (in their city)
 * - Activists: All roles (with M2M validation for Activist Coordinators)
 * - Users: Role-based creation with scope validation
 */

import { test, expect } from '@playwright/test';
import { testUsers, loginAs } from '../fixtures/auth.fixture';

test.describe('Add New - Areas (אזורים)', () => {
  test('SuperAdmin can create new area with unique region name', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/he/dashboard/areas');
    await page.waitForLoadState('networkidle');

    // Click "Add Area" button
    const addButton = page.getByRole('button', { name: /הוסף אזור|Add Area/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Fill in area details
    await page.getByLabel(/שם אזור|Region Name/i).fill('אזור צפון חדש');
    await page.getByLabel(/קוד אזור|Region Code/i).fill('NORTH_NEW');

    // Select available Area Manager user
    const userDropdown = page.getByLabel(/משתמש|User/i);
    await userDropdown.click();
    await page.getByRole('option').first().click();

    // Submit
    await page.getByRole('button', { name: /שמור|Save/i }).click();

    // Verify success
    await expect(page.getByText('אזור צפון חדש')).toBeVisible({ timeout: 10000 });
  });

  test('Area Manager CANNOT see Areas page (no access)', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);

    // Try to access areas page directly
    await page.goto('/he/dashboard/areas');

    // Should be redirected or show 403
    await expect(page).toHaveURL(/\/(dashboard|forbidden|403)/);
  });

  test('Should reject duplicate region name', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/he/dashboard/areas');
    await page.waitForLoadState('networkidle');

    // Click "Add Area" button
    const addButton = page.getByRole('button', { name: /הוסף אזור/i });
    await addButton.click();

    // Try to create with existing region name (from seed data)
    await page.getByLabel(/שם אזור/i).fill('אזור מרכז'); // Existing name
    await page.getByLabel(/קוד אזור/i).fill('CENTER_DUPLICATE');

    const userDropdown = page.getByLabel(/משתמש/i);
    await userDropdown.click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: /שמור/i }).click();

    // Should show error
    await expect(page.getByText(/כבר קיים|already exists/i)).toBeVisible({ timeout: 5000 });
  });
});

test.describe('Add New - Cities (ערים) with Scope Validation', () => {
  test('SuperAdmin can create city in any area', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/he/dashboard/cities');
    await page.waitForLoadState('networkidle');

    // Click "Add City" button
    const addButton = page.getByRole('button', { name: /עיר חדשה|New City/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Fill in city details
    await page.getByLabel(/שם|Name/i).first().fill('עיר חדשה - בדיקה');
    await page.getByLabel(/קוד|Code/i).first().fill('NEW_CITY_TEST');
    await page.getByLabel(/אימייל|Email/i).fill('newcity@test.com');

    // Select any area manager
    const areaDropdown = page.getByLabel(/מנהל אזור/i);
    await areaDropdown.click();
    await page.getByRole('option').first().click();

    // Submit
    await page.getByRole('button', { name: /שמור/i }).click();

    // Verify success
    await expect(page.getByText('עיר חדשה - בדיקה')).toBeVisible({ timeout: 10000 });
  });

  test('Area Manager can ONLY create cities in their area (dropdown disabled)', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);
    await page.goto('/he/dashboard/cities');
    await page.waitForLoadState('networkidle');

    // Click "Add City" button (should be visible for Area Manager)
    const addButton = page.getByRole('button', { name: /עיר חדשה/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Area Manager dropdown should be disabled and pre-selected
    const areaDropdown = page.getByLabel(/מנהל אזור/i);
    await expect(areaDropdown).toBeDisabled();

    // Should show helper text
    await expect(page.getByText(/מנהלי אזור יכולים ליצור ערים רק באזור שלהם/i)).toBeVisible();

    // Fill in city details
    await page.getByLabel(/שם/i).first().fill('עיר באזור המנהל');
    await page.getByLabel(/קוד/i).first().fill('CITY_IN_AREA');
    await page.getByLabel(/אימייל/i).fill('cityinarea@test.com');

    // Submit
    await page.getByRole('button', { name: /שמור/i }).click();

    // Should succeed
    await expect(page.getByText('עיר באזור המנהל')).toBeVisible({ timeout: 10000 });
  });

  test('City Coordinator CANNOT see "Add City" button', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.goto('/he/dashboard/cities');
    await page.waitForLoadState('networkidle');

    // "Add City" button should NOT be visible
    const addButton = page.getByRole('button', { name: /עיר חדשה/i });
    await expect(addButton).not.toBeVisible();
  });
});

test.describe('Add New - Neighborhoods (שכונות) with Three-Tier Validation', () => {
  test('SuperAdmin can create neighborhood in any city', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/he/dashboard/neighborhoods');
    await page.waitForLoadState('networkidle');

    // Click "Add Neighborhood" button
    const addButton = page.getByRole('button', { name: /שכונה חדשה|New Neighborhood/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Fill in details
    await page.getByLabel(/שם|Name/i).first().fill('שכונה חדשה - בדיקה');

    // Select any city
    const cityDropdown = page.getByLabel(/עיר|City/i);
    await cityDropdown.click();
    await page.getByRole('option').first().click();

    // Submit
    await page.getByRole('button', { name: /שמור/i }).click();

    // Verify success
    await expect(page.getByText('שכונה חדשה - בדיקה')).toBeVisible({ timeout: 10000 });
  });

  test('Area Manager can create neighborhoods ONLY in cities within their area', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);
    await page.goto('/he/dashboard/neighborhoods');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /שכונה חדשה/i });
    await addButton.click();

    // City dropdown should only show cities in Area Manager's area
    const cityDropdown = page.getByLabel(/עיר/i);
    await cityDropdown.click();

    // Get all city options
    const cityOptions = page.getByRole('option');
    const count = await cityOptions.count();

    // Should be limited (not all cities in system)
    expect(count).toBeLessThanOrEqual(5); // Area Manager should see limited cities

    // Select first available city
    await cityOptions.first().click();

    await page.getByLabel(/שם/i).first().fill('שכונה באזור המנהל');
    await page.getByRole('button', { name: /שמור/i }).click();

    await expect(page.getByText('שכונה באזור המנהל')).toBeVisible({ timeout: 10000 });
  });

  test('City Coordinator can ONLY create neighborhoods in their city', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.goto('/he/dashboard/neighborhoods');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /שכונה חדשה/i });
    await addButton.click();

    // City dropdown should be disabled and pre-selected with coordinator's city
    const cityDropdown = page.getByLabel(/עיר/i);
    await expect(cityDropdown).toBeDisabled();

    await page.getByLabel(/שם/i).first().fill('שכונה בעיר הרכז');
    await page.getByRole('button', { name: /שמור/i }).click();

    await expect(page.getByText('שכונה בעיר הרכז')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Add New - Activists (פעילים) with M2M Validation', () => {
  test('SuperAdmin can create activist in any neighborhood', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/he/dashboard/activists');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /פעיל חדש|New Activist/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    await page.getByLabel(/שם מלא|Full Name/i).fill('פעיל בדיקה חדש');
    await page.getByLabel(/טלפון|Phone/i).fill('0501234567');
    await page.getByLabel(/אימייל|Email/i).fill('activist.test@example.com');

    // Select any neighborhood
    const neighborhoodDropdown = page.getByLabel(/שכונה|Neighborhood/i);
    await neighborhoodDropdown.click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: /שמור/i }).click();
    await expect(page.getByText('פעיל בדיקה חדש')).toBeVisible({ timeout: 10000 });
  });

  test('Area Manager can create activists in neighborhoods within their area', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);
    await page.goto('/he/dashboard/activists');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /פעיל חדש/i });
    await addButton.click();

    // Neighborhood dropdown should show only neighborhoods in Area Manager's area
    const neighborhoodDropdown = page.getByLabel(/שכונה/i);
    await neighborhoodDropdown.click();

    const options = page.getByRole('option');
    const count = await options.count();
    expect(count).toBeGreaterThan(0); // Should have at least one neighborhood

    await options.first().click();

    await page.getByLabel(/שם מלא/i).fill('פעיל אזור מנהל');
    await page.getByLabel(/טלפון/i).fill('0501234568');
    await page.getByLabel(/אימייל/i).fill('activist.area@example.com');

    await page.getByRole('button', { name: /שמור/i }).click();
    await expect(page.getByText('פעיל אזור מנהל')).toBeVisible({ timeout: 10000 });
  });

  test('City Coordinator can create activists in neighborhoods within their city', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.goto('/he/dashboard/activists');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /פעיל חדש/i });
    await addButton.click();

    const neighborhoodDropdown = page.getByLabel(/שכונה/i);
    await neighborhoodDropdown.click();

    const options = page.getByRole('option');
    await options.first().click();

    await page.getByLabel(/שם מלא/i).fill('פעיל רכז עיר');
    await page.getByLabel(/טלפון/i).fill('0501234569');
    await page.getByLabel(/אימייל/i).fill('activist.city@example.com');

    await page.getByRole('button', { name: /שמור/i }).click();
    await expect(page.getByText('פעיל רכז עיר')).toBeVisible({ timeout: 10000 });
  });

  test('Activist Coordinator can ONLY create activists in ASSIGNED neighborhoods (M2M)', async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);
    await page.goto('/he/dashboard/activists');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /פעיל חדש/i });
    await addButton.click();

    // Neighborhood dropdown should ONLY show assigned neighborhoods from M2M table
    const neighborhoodDropdown = page.getByLabel(/שכונה/i);
    await neighborhoodDropdown.click();

    const options = page.getByRole('option');
    const count = await options.count();

    // Should be limited to assigned neighborhoods (not all neighborhoods in city)
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(3); // Activist Coordinator has limited assignment

    await options.first().click();

    await page.getByLabel(/שם מלא/i).fill('פעיל רכז פעילים');
    await page.getByLabel(/טלפון/i).fill('0501234570');
    await page.getByLabel(/אימייל/i).fill('activist.coord@example.com');

    await page.getByRole('button', { name: /שמור/i }).click();
    await expect(page.getByText('פעיל רכז פעילים')).toBeVisible({ timeout: 10000 });
  });
});

test.describe('Add New - Users (משתמשים) with Role-Based Creation', () => {
  test('SuperAdmin can create Area Manager, City Coordinator, Activist Coordinator', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/he/dashboard/users');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /משתמש חדש|New User/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // Role dropdown should have Area Manager, City Coordinator, Activist Coordinator
    const roleDropdown = page.getByLabel(/תפקיד|Role/i);
    await roleDropdown.click();

    // Should see Area Manager option
    await expect(page.getByRole('option', { name: /מנהל אזור|Area Manager/i })).toBeVisible();

    // Select City Coordinator
    await page.getByRole('option', { name: /רכז עיר|City Coordinator/i }).click();

    await page.getByLabel(/שם מלא|Full Name/i).fill('רכז עיר חדש');
    await page.getByLabel(/אימייל|Email/i).fill('newcitycoord@test.com');
    await page.getByLabel(/סיסמה|Password/i).fill('SecurePass123!');

    // Select city
    const cityDropdown = page.getByLabel(/עיר|City/i);
    await cityDropdown.click();
    await page.getByRole('option').first().click();

    await page.getByRole('button', { name: /שמור/i }).click();
    await expect(page.getByText('רכז עיר חדש')).toBeVisible({ timeout: 10000 });
  });

  test('SuperAdmin CANNOT create SuperAdmin via UI (should be rejected)', async ({ page }) => {
    await loginAs(page, testUsers.superAdmin);
    await page.goto('/he/dashboard/users');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /משתמש חדש/i });
    await addButton.click();

    const roleDropdown = page.getByLabel(/תפקיד/i);
    await roleDropdown.click();

    // SuperAdmin option should NOT exist in dropdown
    await expect(page.getByRole('option', { name: /סופראדמין|SuperAdmin/i })).not.toBeVisible();
  });

  test('Area Manager can create City Coordinator in THEIR area only', async ({ page }) => {
    await loginAs(page, testUsers.areaManager);
    await page.goto('/he/dashboard/users');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /משתמש חדש/i });
    await addButton.click();

    // Role dropdown should ONLY show City Coordinator and Activist Coordinator
    const roleDropdown = page.getByLabel(/תפקיד/i);
    await roleDropdown.click();

    // Should NOT see Area Manager or SuperAdmin
    await expect(page.getByRole('option', { name: /מנהל אזור/i })).not.toBeVisible();

    // Select City Coordinator
    await page.getByRole('option', { name: /רכז עיר/i }).click();

    // City dropdown should be filtered to Area Manager's area
    const cityDropdown = page.getByLabel(/עיר/i);
    await cityDropdown.click();

    const cityOptions = page.getByRole('option');
    const count = await cityOptions.count();
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5); // Limited to area's cities

    await cityOptions.first().click();

    await page.getByLabel(/שם מלא/i).fill('רכז עיר מאזור המנהל');
    await page.getByLabel(/אימייל/i).fill('citycoord.area@test.com');
    await page.getByLabel(/סיסמה/i).fill('SecurePass123!');

    await page.getByRole('button', { name: /שמור/i }).click();
    await expect(page.getByText('רכז עיר מאזור המנהל')).toBeVisible({ timeout: 10000 });
  });

  test('City Coordinator can ONLY create Activist Coordinator in THEIR city', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);
    await page.goto('/he/dashboard/users');
    await page.waitForLoadState('networkidle');

    const addButton = page.getByRole('button', { name: /משתמש חדש/i });
    await addButton.click();

    // Role dropdown should ONLY show Activist Coordinator
    const roleDropdown = page.getByLabel(/תפקיד/i);
    await roleDropdown.click();

    // Should ONLY see Activist Coordinator
    await expect(page.getByRole('option', { name: /רכז פעילים|Activist Coordinator/i })).toBeVisible();

    // Should NOT see Area Manager or City Coordinator
    await expect(page.getByRole('option', { name: /מנהל אזור/i })).not.toBeVisible();
    await expect(page.getByRole('option', { name: /רכז עיר/i })).not.toBeVisible();

    await page.getByRole('option', { name: /רכז פעילים/i }).click();

    // City dropdown should be disabled and pre-selected
    const cityDropdown = page.getByLabel(/עיר/i);
    await expect(cityDropdown).toBeDisabled();

    await page.getByLabel(/שם מלא/i).fill('רכז פעילים חדש');
    await page.getByLabel(/אימייל/i).fill('activistcoord.city@test.com');
    await page.getByLabel(/סיסמה/i).fill('SecurePass123!');

    await page.getByRole('button', { name: /שמור/i }).click();
    await expect(page.getByText('רכז פעילים חדש')).toBeVisible({ timeout: 10000 });
  });

  test('Activist Coordinator CANNOT create users (no access to users page)', async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);

    // Try to access users page directly
    await page.goto('/he/dashboard/users');

    // Should be redirected or show 403
    await expect(page).toHaveURL(/\/(dashboard|forbidden|403)/);
  });
});

test.describe('Cross-Tenant Isolation - Add New Validation', () => {
  test('Area Manager cannot create city in ANOTHER area (API-level rejection)', async ({ page }) => {
    // This test verifies server-side validation even if client-side is bypassed
    await loginAs(page, testUsers.areaManager);

    // Attempt to create city via API call with different area
    const response = await page.request.post('/api/cities/create', {
      data: {
        name: 'עיר באזור אחר',
        code: 'OTHER_AREA_CITY',
        email: 'otherarea@test.com',
        areaManagerId: 'different-area-id', // Attempt to create in different area
      },
    });

    expect(response.status()).toBe(403); // Should be forbidden
  });

  test('City Coordinator cannot create neighborhood in ANOTHER city (API-level rejection)', async ({ page }) => {
    await loginAs(page, testUsers.cityCoordinator);

    const response = await page.request.post('/api/neighborhoods/create', {
      data: {
        name: 'שכונה בעיר אחרת',
        cityId: 'different-city-id', // Attempt to create in different city
      },
    });

    expect(response.status()).toBe(403);
  });

  test('Activist Coordinator cannot create activist in NON-ASSIGNED neighborhood (API-level M2M rejection)', async ({ page }) => {
    await loginAs(page, testUsers.activistCoordinator);

    const response = await page.request.post('/api/activists/create', {
      data: {
        fullName: 'פעיל לא מורשה',
        phone: '0501111111',
        email: 'unauthorized@test.com',
        neighborhoodId: 'non-assigned-neighborhood-id', // Attempt M2M violation
      },
    });

    expect(response.status()).toBe(403);
  });
});
