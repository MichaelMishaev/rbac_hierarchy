import { test as base, expect } from '@playwright/test';

/**
 * User credentials for different roles (Production credentials)
 * These match the production seed data
 */
export const testUsers = {
  superAdmin: {
    email: 'admin@election.test',
    password: 'admin123',
    role: 'SUPERADMIN',
    displayName: 'מנהל מערכת ראשי',
  },
  areaManager: {
    email: 'sarah.cohen@telaviv-district.test',
    password: 'area123',
    role: 'AREA_MANAGER',
    displayName: 'מנהלת אזור - שרה כהן',
    regionName: 'מחוז תל אביב',
  },
  cityCoordinator: {
    email: 'david.levi@telaviv.test',
    password: 'manager123',
    role: 'CITY_COORDINATOR',
    displayName: 'רכז עיר - דוד לוי (תל אביב)',
    cityName: 'תל אביב-יפו',
  },
  activistCoordinator: {
    email: 'rachel.bendavid@telaviv.test',
    password: 'supervisor123',
    role: 'ACTIVIST_COORDINATOR',
    displayName: 'רכזת פעילים - רחל בן-דוד',
    neighborhoods: ['פלורנטין', 'נווה צדק'],
  },
};

/**
 * Extended test fixture with authentication helpers
 */
type AuthFixtures = {
  authenticatedPage: any;
  loginAs: (role: keyof typeof testUsers) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await use(page);
  },

  loginAs: async ({ page }, use) => {
    const login = async (role: keyof typeof testUsers) => {
      const user = testUsers[role];

      // Navigate to login page
      await page.goto('/login');

      // Fill in credentials
      await page.fill('[data-testid="email-input"]', user.email);
      await page.fill('[data-testid="password-input"]', user.password);

      // Click login button
      await page.click('[data-testid="login-button"]');

      // Wait for navigation to dashboard
      await page.waitForURL('/dashboard');

      // SuperAdmin has access to all cities and regions
      if (role === 'superAdmin' && user.role === 'SUPERADMIN') {
        // Dashboard should show system-wide overview
        await expect(page.locator('h1')).toBeVisible();
      }
    };

    await use(login);
  },
});

export { expect };
