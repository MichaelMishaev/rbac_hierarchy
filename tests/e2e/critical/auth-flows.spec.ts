import { test, expect } from '@playwright/test';

/**
 * CRITICAL TEST SUITE: Authentication & Session
 * 
 * These tests MUST pass on every PR.
 * Failure = AUTH ISSUE (broken login, session leaks)
 * 
 * Tests:
 * 6. Login works for all roles
 * 7. Session persists after page refresh
 * 8. Unauthorized access returns 403 (not crash)
 */

test.describe('Authentication & Session (Critical)', () => {

  // ============================================
  // TEST 6: Login for All Roles
  // ============================================
  test('SuperAdmin login works', async ({ page }) => {
    await page.goto('/he/login');
    
    await page.fill('[data-testid="email-input"]', 'superadmin@election.test');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Should see SuperAdmin-specific content
    await expect(page.locator('text=מערכת הבחירות')).toBeVisible(); // "Election System"
    
    // Should see Cities tab (SuperAdmin only)
    await expect(page.locator('[data-testid="nav-cities"]')).toBeVisible();
  });

  test('Area Manager login works', async ({ page }) => {
    await page.goto('/he/login');
    
    await page.fill('[data-testid="email-input"]', 'area.manager@election.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Should see role-appropriate dashboard
    await expect(page.locator('text=לוח בקרה')).toBeVisible(); // "Dashboard"
    
    // Should see Cities tab (Area Manager has access)
    await expect(page.locator('[data-testid="nav-cities"]')).toBeVisible();
  });

  test('City Coordinator login works', async ({ page }) => {
    await page.goto('/he/login');
    
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Should see dashboard
    await expect(page.locator('text=לוח בקרה')).toBeVisible();
    
    // Should NOT see Cities tab (City Coordinator cannot access)
    await expect(page.locator('[data-testid="nav-cities"]')).not.toBeVisible();
    
    // Should see Neighborhoods tab
    await expect(page.locator('[data-testid="nav-neighborhoods"]')).toBeVisible();
  });

  test('Activist Coordinator login works', async ({ page }) => {
    await page.goto('/he/login');
    
    await page.fill('[data-testid="email-input"]', 'activist.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Should see dashboard
    await expect(page.locator('text=לוח בקרה')).toBeVisible();
    
    // Should NOT see Cities tab
    await expect(page.locator('[data-testid="nav-cities"]')).not.toBeVisible();
    
    // Should see limited navigation
    await expect(page.locator('[data-testid="nav-activists"]')).toBeVisible();
  });

  // ============================================
  // TEST 7: Session Persistence
  // ============================================
  test('Session persists after page refresh', async ({ page }) => {
    // Login
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Verify logged in
    await expect(page.locator('text=לוח בקרה')).toBeVisible();
    
    // Refresh page
    await page.reload();
    
    // Should STILL be on dashboard (not redirected to login)
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('text=לוח בקרה')).toBeVisible();
    
    // Session should still be valid (can navigate)
    await page.click('[data-testid="nav-neighborhoods"]');
    await page.waitForURL(/\/neighborhoods/);
    await expect(page.locator('text=שכונות')).toBeVisible(); // "Neighborhoods"
  });

  test('Session persists across navigation', async ({ page, context }) => {
    // Login
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'superadmin@election.test');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Navigate through multiple pages
    await page.click('[data-testid="nav-cities"]');
    await page.waitForURL(/\/cities/);
    
    await page.click('[data-testid="nav-neighborhoods"]');
    await page.waitForURL(/\/neighborhoods/);
    
    await page.click('[data-testid="nav-activists"]');
    await page.waitForURL(/\/activists/);
    
    // Open new tab with same session
    const newPage = await context.newPage();
    await newPage.goto('/he/dashboard');
    
    // Should be automatically logged in (shared session)
    await expect(newPage).toHaveURL(/\/dashboard/);
    await expect(newPage.locator('text=מערכת הבחירות')).toBeVisible();
    
    await newPage.close();
  });

  // ============================================
  // TEST 8: Unauthorized Access Handling
  // ============================================
  test('Unauthorized access to protected route returns 403', async ({ page }) => {
    // Visit protected route without login
    await page.goto('/he/dashboard');
    
    // Should redirect to login (not crash)
    await expect(page).toHaveURL(/\/login/);
    
    // No error page or crash
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Error')).not.toBeVisible();
  });

  test('Insufficient permissions show Access Denied (not crash)', async ({ page }) => {
    // Login as City Coordinator
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Try to access SuperAdmin-only route
    await page.goto('/he/cities');
    
    // Should show Access Denied (not 500 error)
    await expect(page.locator('text=Access Denied')).toBeVisible();
    
    // Should NOT crash or show error page
    await expect(page.locator('text=500')).not.toBeVisible();
    await expect(page.locator('text=Application Error')).not.toBeVisible();
  });

  test('Invalid credentials show error message', async ({ page }) => {
    await page.goto('/he/login');
    
    // Try invalid credentials
    await page.fill('[data-testid="email-input"]', 'invalid@user.com');
    await page.fill('[data-testid="password-input"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');
    
    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should show error message (not crash)
    await expect(page.locator('text=אימייל או סיסמה שגויים')).toBeVisible(); // "Invalid email or password"
    
    // Should NOT crash
    await expect(page.locator('text=500')).not.toBeVisible();
  });

  test('Logout clears session completely', async ({ page }) => {
    // Login
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
    
    // Try to access protected route
    await page.goto('/he/dashboard');
    
    // Should redirect back to login (session cleared)
    await expect(page).toHaveURL(/\/login/);
  });

});
