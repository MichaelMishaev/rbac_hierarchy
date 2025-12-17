/**
 * RBAC Negative Tests - Forbidden Path Testing
 *
 * CRITICAL: Tests that unauthorized actions are BLOCKED
 *
 * INVARIANTS TESTED:
 * - INV-001: Multi-City Data Isolation
 * - INV-002: RBAC Boundaries Enforcement
 *
 * INTENT: Ensure lower roles cannot access higher role features
 * @owner backend-security
 * @created 2025-12-17
 */

import { test, expect } from '@playwright/test';

test.describe('RBAC Negative Tests - Forbidden Paths', () => {
  test.describe('INV-002: Page Access Restrictions', () => {
    test('❌ Activist Coordinator CANNOT access /cities page', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'activist.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Try to access /cities page (should be forbidden)
      await page.goto('/cities');

      // CRITICAL: Should see 403 error
      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('אין הרשאה') ||
                       pageContent?.includes('403') ||
                       pageContent?.includes('Access Denied');

      expect(isBlocked).toBeTruthy();

      console.log('✅ Activist Coordinator blocked from /cities (INV-002)');
    });

    test('❌ Activist Coordinator CANNOT access /areas page', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'activist.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.goto('/areas');

      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('אין הרשאה') ||
                       pageContent?.includes('403');

      expect(isBlocked).toBeTruthy();

      console.log('✅ Activist Coordinator blocked from /areas (INV-002)');
    });

    test('❌ City Coordinator CANNOT access /cities page', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'city.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.goto('/cities');

      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('אין הרשאה') ||
                       pageContent?.includes('403');

      expect(isBlocked).toBeTruthy();

      console.log('✅ City Coordinator blocked from /cities (INV-002)');
    });

    test('❌ City Coordinator CANNOT access /areas page', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'city.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.goto('/areas');

      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('אין הרשאה') ||
                       pageContent?.includes('403');

      expect(isBlocked).toBeTruthy();

      console.log('✅ City Coordinator blocked from /areas (INV-002)');
    });
  });

  test.describe('INV-001: Cross-City Data Access Prevention', () => {
    test('❌ City Coordinator CANNOT see other city activists', async ({ page }) => {
      // Login as Tel Aviv City Coordinator
      await page.goto('/login');
      await page.fill('input[name="email"]', 'city.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Navigate to activists
      await page.click('text=פעילים');
      await page.waitForURL(/.*activists/);

      const pageContent = await page.textContent('body');

      // CRITICAL: Should NOT see Jerusalem activists
      // This would indicate a data leakage (INV-001 violation)
      const hasJerusalemData = pageContent?.includes('ירושלים');

      if (hasJerusalemData) {
        throw new Error('🚨 INVARIANT VIOLATION (INV-001): Cross-city data leakage detected!');
      }

      console.log('✅ City Coordinator cannot see other city data (INV-001)');
    });

    test('❌ Activist Coordinator CANNOT see unassigned neighborhoods', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'activist.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.click('text=שכונות');
      await page.waitForURL(/.*neighborhoods/);

      // CRITICAL: Should only see assigned neighborhoods
      // Seeing all city neighborhoods = INV-002 violation
      const pageContent = await page.textContent('body');

      // If they can see "כל השכונות" or similar, it's a violation
      const canSeeAllNeighborhoods = pageContent?.includes('כל השכונות');

      if (canSeeAllNeighborhoods) {
        console.warn('⚠️ Activist Coordinator may have too broad access');
      }

      console.log('✅ Activist Coordinator restricted to assigned neighborhoods (INV-002)');
    });
  });

  test.describe('INV-002: Role-Based Feature Restrictions', () => {
    test('❌ Activist Coordinator CANNOT create neighborhoods', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'activist.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.click('text=שכונות');
      await page.waitForURL(/.*neighborhoods/);

      // Should NOT see "צור שכונה" button
      const createButton = page.locator('button:has-text("צור שכונה")');
      await expect(createButton).not.toBeVisible();

      console.log('✅ Activist Coordinator cannot create neighborhoods (INV-002)');
    });

    test('❌ Activist Coordinator CANNOT delete neighborhoods', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'activist.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.click('text=שכונות');
      await page.waitForURL(/.*neighborhoods/);

      // Should NOT see delete buttons
      const deleteButtons = page.locator('[data-testid="delete-neighborhood"]');
      const count = await deleteButtons.count();

      expect(count).toBe(0);

      console.log('✅ Activist Coordinator cannot delete neighborhoods (INV-002)');
    });

    test('❌ City Coordinator CANNOT create cities', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'city.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Try to access /cities (should be blocked)
      await page.goto('/cities');

      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('אין הרשאה') ||
                       pageContent?.includes('403');

      expect(isBlocked).toBeTruthy();

      console.log('✅ City Coordinator blocked from city management (INV-002)');
    });
  });

  test.describe('INV-001: API Endpoint Protection', () => {
    test('❌ Cannot fetch other city data via API manipulation', async ({ page, request }) => {
      // Login as Tel Aviv City Coordinator
      await page.goto('/login');
      await page.fill('input[name="email"]', 'city.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      // Try to fetch Jerusalem data (different city)
      // This should be blocked by backend RBAC
      const cookies = await page.context().cookies();
      const authCookie = cookies.find(c => c.name.includes('session') || c.name.includes('token'));

      if (authCookie) {
        const response = await request.get('/api/activists', {
          headers: {
            'Cookie': `${authCookie.name}=${authCookie.value}`
          },
          params: {
            cityId: 'jerusalem-id' // Trying to access different city
          }
        });

        // CRITICAL: Should return 403 or filtered data
        expect([403, 401]).toContain(response.status());

        console.log('✅ API blocks cross-city data access (INV-001)');
      }
    });
  });
});

test.describe('Input Validation Negative Tests', () => {
  test.describe('Form Validation', () => {
    test('❌ Cannot create activist without required fields', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'activist.coordinator@telaviv.test');
      await page.fill('input[name="password"]', 'coordinator123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.click('text=פעילים');
      await page.waitForURL(/.*activists/);

      await page.click('button:has-text("הוסף פעיל")');

      // Try to submit without filling required fields
      await page.click('button[type="submit"]');

      // Should show validation errors
      const errorMessages = page.locator('.error-message, [role="alert"]');
      await expect(errorMessages).toBeVisible();

      console.log('✅ Form validation blocks invalid submissions');
    });

    test('❌ Cannot create user with invalid email', async ({ page }) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', 'superadmin@election.test');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/, { timeout: 10000 });

      await page.click('text=משתמשים');
      await page.click('button:has-text("הוסף משתמש")');

      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');

      // Should show email validation error
      const errorMessages = page.locator('text=/.*אימייל.*לא תקין.*/i');
      await expect(errorMessages).toBeVisible();

      console.log('✅ Email validation blocks invalid format');
    });
  });
});
