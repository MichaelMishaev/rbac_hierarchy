import { test, expect } from '@playwright/test';

/**
 * CRITICAL TEST SUITE: UI Rendering & Localization
 * 
 * These tests MUST pass on every PR.
 * Failure = UI BROKEN (Hebrew RTL, navigation)
 * 
 * Tests:
 * 9. Hebrew RTL renders correctly
 * 10. Navigation shows role-appropriate tabs
 */

test.describe('UI Rendering & Localization (Critical)', () => {

  // ============================================
  // TEST 9: Hebrew RTL Rendering
  // ============================================
  test('Dashboard renders in RTL with correct direction', async ({ page }) => {
    // Login
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'superadmin@election.test');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Check HTML dir attribute
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');
    
    // Check lang attribute
    const htmlLang = await page.getAttribute('html', 'lang');
    expect(htmlLang).toBe('he');
    
    // Verify main content has RTL direction
    const mainContent = page.locator('main');
    const mainDir = await mainContent.getAttribute('dir');
    expect(mainDir).toBe('rtl');
  });

  test('Hebrew text renders correctly in all components', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'superadmin@election.test');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Check Hebrew text is visible in navigation
    await expect(page.locator('text=ערים')).toBeVisible(); // "Cities"
    await expect(page.locator('text=שכונות')).toBeVisible(); // "Neighborhoods"
    await expect(page.locator('text=פעילים')).toBeVisible(); // "Activists"
    
    // Check Hebrew text in KPI cards
    await expect(page.locator('text=פעילים פעילים')).toBeVisible(); // "Active Activists"
    
    // Verify NO English text in UI (Hebrew-only system)
    const pageText = await page.textContent('body');
    expect(pageText).not.toContain('Dashboard'); // Should be לוח בקרה
    expect(pageText).not.toContain('Cities'); // Should be ערים
  });

  test('RTL layout alignment is correct', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Navigation should be on the RIGHT side (RTL)
    const nav = page.locator('nav[data-testid="main-navigation"]');
    const navBox = await nav.boundingBox();
    
    if (navBox) {
      // In RTL, navigation is typically on the right
      // Check that nav starts near the right edge
      const viewportSize = await page.viewportSize();
      if (viewportSize) {
        expect(navBox.x + navBox.width).toBeGreaterThan(viewportSize.width * 0.8);
      }
    }
  });

  test('Forms render correctly in RTL', async ({ page }) => {
    await page.goto('/he/login');
    
    // Login form should have RTL layout
    const form = page.locator('form');
    const formDir = await form.getAttribute('dir');
    expect(formDir).toBe('rtl');
    
    // Labels should be on the RIGHT of inputs (RTL)
    const emailLabel = page.locator('label[for*="email"]');
    await expect(emailLabel).toBeVisible();
    
    // Input placeholder should be in Hebrew
    const emailInput = page.locator('[data-testid="email-input"]');
    const placeholder = await emailInput.getAttribute('placeholder');
    expect(placeholder).toMatch(/אימייל|דואר/); // Hebrew for "email"
  });

  // ============================================
  // TEST 10: Role-Based Navigation
  // ============================================
  test('SuperAdmin sees all navigation tabs', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'superadmin@election.test');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // SuperAdmin should see ALL tabs
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-cities"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-neighborhoods"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-activists"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-users"]')).toBeVisible();
  });

  test('Area Manager sees correct navigation tabs', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'area.manager@election.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Area Manager should see Cities tab
    await expect(page.locator('[data-testid="nav-cities"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-neighborhoods"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-activists"]')).toBeVisible();
  });

  test('City Coordinator does NOT see Cities tab', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // City Coordinator should NOT see Cities tab
    await expect(page.locator('[data-testid="nav-cities"]')).not.toBeVisible();
    
    // Should see these tabs
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-neighborhoods"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-activists"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-users"]')).toBeVisible();
  });

  test('Activist Coordinator sees limited navigation', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'activist.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Should NOT see Cities tab
    await expect(page.locator('[data-testid="nav-cities"]')).not.toBeVisible();
    
    // Should see limited tabs
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-neighborhoods"]')).toBeVisible();
    await expect(page.locator('[data-testid="nav-activists"]')).toBeVisible();
    
    // May or may not see Users tab (depends on implementation)
  });

  test('Navigation tabs are clickable and functional', async ({ page }) => {
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Click through navigation tabs
    await page.click('[data-testid="nav-neighborhoods"]');
    await page.waitForURL(/\/neighborhoods/);
    await expect(page.locator('text=שכונות')).toBeVisible();
    
    await page.click('[data-testid="nav-activists"]');
    await page.waitForURL(/\/activists/);
    await expect(page.locator('text=פעילים')).toBeVisible();
    
    await page.click('[data-testid="nav-dashboard"]');
    await page.waitForURL(/\/dashboard/);
    await expect(page.locator('text=לוח בקרה')).toBeVisible();
  });

  test('Responsive layout works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Mobile menu should be visible
    const mobileMenuButton = page.locator('[data-testid="mobile-menu-button"]');
    await expect(mobileMenuButton).toBeVisible();
    
    // Click mobile menu
    await mobileMenuButton.click();
    
    // Navigation should appear
    await expect(page.locator('[data-testid="nav-dashboard"]')).toBeVisible();
    
    // Layout should still be RTL
    const htmlDir = await page.getAttribute('html', 'dir');
    expect(htmlDir).toBe('rtl');
  });

});
