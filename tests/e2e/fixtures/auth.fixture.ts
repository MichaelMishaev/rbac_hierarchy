import { test as base, expect } from '@playwright/test';

/**
 * User credentials for different roles
 */
export const testUsers = {
  superAdmin: {
    email: 'superadmin@hierarchy.test',
    password: 'SuperAdmin123!',
    role: 'SuperAdmin',
  },
  manager: {
    email: 'manager@corp1.test',
    password: 'Manager123!',
    role: 'Manager',
    corporationId: '1',
  },
  supervisor: {
    email: 'supervisor@corp1.test',
    password: 'Supervisor123!',
    role: 'Supervisor',
    corporationId: '1',
    siteIds: ['1', '2'],
  },
  managerCorp2: {
    email: 'manager@corp2.test',
    password: 'Manager123!',
    role: 'Manager',
    corporationId: '2',
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

      // If user has multiple corporations (SuperAdmin), select the corporation
      if (role === 'superAdmin' && user.role === 'SuperAdmin') {
        // Corporation selector should be visible for SuperAdmin
        await expect(page.locator('[data-testid="corporation-selector"]')).toBeVisible();
      }
    };

    await use(login);
  },
});

export { expect };
