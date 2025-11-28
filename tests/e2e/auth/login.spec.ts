import { test, expect } from '../fixtures/auth.fixture';

test.describe('Authentication', () => {
  test('SuperAdmin can login successfully', async ({ page, loginAs }) => {
    await loginAs('superAdmin');

    // Verify redirected to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify corporation selector is visible (SuperAdmin only)
    await expect(page.locator('[data-testid="corporation-selector"]')).toBeVisible();

    // Verify user greeting shows SuperAdmin role
    await expect(page.locator('[data-testid="user-greeting"]')).toContain('SuperAdmin');
  });

  test('Manager can login successfully', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Verify redirected to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify corporation selector is NOT visible (Manager scoped to single corp)
    await expect(page.locator('[data-testid="corporation-selector"]')).not.toBeVisible();

    // Verify user greeting shows Manager role
    await expect(page.locator('[data-testid="user-greeting"]')).toContain('Manager');
  });

  test('Supervisor can login successfully', async ({ page, loginAs }) => {
    await loginAs('supervisor');

    // Verify redirected to dashboard
    await expect(page).toHaveURL('/dashboard');

    // Verify limited sidebar options (no corporation management)
    await expect(page.locator('[data-testid="sidebar-corporations"]')).not.toBeVisible();

    // Verify user greeting shows Supervisor role
    await expect(page.locator('[data-testid="user-greeting"]')).toContain('Supervisor');
  });

  test('Invalid credentials show error', async ({ page }) => {
    await page.goto('/login');

    await page.fill('[data-testid="email-input"]', 'invalid@test.com');
    await page.fill('[data-testid="password-input"]', 'WrongPassword123!');
    await page.click('[data-testid="login-button"]');

    // Verify error message is displayed
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page.locator('[data-testid="login-error"]')).toContain('Invalid credentials');

    // Verify still on login page
    await expect(page).toHaveURL('/login');
  });

  test('JWT tokens are stored correctly', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Check that tokens are stored (implementation-specific)
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(accessToken).toBeTruthy();
    expect(refreshToken).toBeTruthy();
  });

  test('Logout clears tokens and redirects to login', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Click logout button
    await page.click('[data-testid="logout-button"]');

    // Verify redirected to login
    await expect(page).toHaveURL('/login');

    // Verify tokens are cleared
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('refreshToken'));

    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });
});
