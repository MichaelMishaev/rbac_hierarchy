/**
 * Auth Fixture for E2E Tests
 * Provides authenticated page and request contexts for different user roles
 */

import { test as base, expect, request as playwrightRequest } from '@playwright/test';
import type { Page, APIRequestContext } from '@playwright/test';

export interface AuthUser {
  email: string;
  password: string;
  role: string;
  name: string;
}

export const testUsers = {
  superAdmin: {
    email: 'admin@election.test',
    password: 'admin123',
    role: 'SUPERADMIN',
    name: 'מנהל מערכת ראשי',
  },
  areaManager: {
    email: 'sarah.cohen@telaviv-district.test',
    password: 'area123',
    role: 'AREA_MANAGER',
    name: 'מנהלת אזור - שרה כהן',
  },
  cityCoordinator: {
    email: 'david.levi@telaviv.test',
    password: 'city123',
    role: 'CITY_COORDINATOR',
    name: 'רכז עיר - דוד לוי (תל אביב)',
  },
  activistCoordinator: {
    email: 'rachel.bendavid@telaviv.test',
    password: 'activist123',
    role: 'ACTIVIST_COORDINATOR',
    name: 'רכזת פעילים - רחל בן-דוד',
  },
} as const;

/**
 * Login helper function
 * Logs in a user and returns the authenticated page with session cookies
 */
export async function loginAs(page: Page, user: AuthUser): Promise<void> {
  // FIX: Use locale-based routing (app uses /he/login and /he/dashboard)
  await page.goto('/he/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');

  // Wait for redirect to dashboard (means login succeeded)
  // Accept both /dashboard and /he/dashboard
  await page.waitForURL(/\/(he\/)?dashboard/, { timeout: 10000 });
}

/**
 * Get authenticated API context with session cookies
 * This allows making API requests with proper authentication
 */
export async function getAuthenticatedContext(
  page: Page,
  user: AuthUser,
  baseURL: string
): Promise<APIRequestContext> {
  // First login to get session cookies
  await loginAs(page, user);

  // Get storage state (includes cookies)
  const storageState = await page.context().storageState();

  // Create new API context with the same cookies
  const context = await playwrightRequest.newContext({
    baseURL,
    storageState,
  });

  return context;
}

/**
 * Extended test fixture with authenticated contexts
 */
type AuthFixtures = {
  authenticatedRequest: APIRequestContext;
  loginAsUser: (user: AuthUser) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  authenticatedRequest: async ({ page, baseURL }, use) => {
    // Default to cityCoordinator for most tests
    const context = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');
    await use(context);
    await context.dispose();
  },

  loginAsUser: async ({ page }, use) => {
    await use(async (user: AuthUser) => {
      await loginAs(page, user);
    });
  },
});

export { expect };
