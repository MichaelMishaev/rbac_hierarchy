import { test, expect } from '@playwright/test';

/**
 * CRITICAL TEST SUITE: RBAC Boundaries
 * 
 * These tests MUST pass on every PR.
 * Failure = SECURITY ISSUE (cross-city data leakage)
 * 
 * Tests:
 * 1. SuperAdmin sees all cities
 * 2. Area Manager CANNOT see other areas  
 * 3. City Coordinator CANNOT see other cities
 * 4. Activist Coordinator CANNOT see unassigned neighborhoods
 * 5. Cross-city queries return empty (not error)
 */

test.describe('RBAC Boundaries (Critical)', () => {
  
  // ============================================
  // TEST 1: SuperAdmin Access (Full System)
  // ============================================
  test('SuperAdmin sees all cities', async ({ page }) => {
    // Login as SuperAdmin
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'superadmin@election.test');
    await page.fill('[data-testid="password-input"]', 'admin123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to cities page
    await page.click('[data-testid="nav-cities"]');
    await page.waitForURL(/\/cities/);
    
    // SuperAdmin should see ALL cities (no filtering)
    const cityRows = page.locator('[data-testid="city-row"]');
    const count = await cityRows.count();
    
    // Should have multiple cities (at least 2 for test to be meaningful)
    expect(count).toBeGreaterThanOrEqual(2);
    
    // Verify no "Access Denied" message
    await expect(page.locator('text=Access Denied')).not.toBeVisible();
    await expect(page.locator('text=אין גישה')).not.toBeVisible();
  });

  // ============================================
  // TEST 2: Area Manager Scope Isolation  
  // ============================================
  test('Area Manager CANNOT see other areas', async ({ page }) => {
    // Login as Area Manager
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'area.manager@election.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Check org-tree API shows ONLY their area
    const orgTreeResponse = await page.request.get('/api/org-tree');
    expect(orgTreeResponse.ok()).toBeTruthy();
    
    const orgTree = await orgTreeResponse.json();
    
    // Root should be their area, NOT SuperAdmin
    expect(orgTree.type).toBe('area');
    
    // Should NOT contain other areas
    const areasInTree = JSON.stringify(orgTree);
    expect(areasInTree).not.toContain('"type":"superadmin"');
    
    // Navigate to cities and verify filtered
    await page.click('[data-testid="nav-cities"]');
    await page.waitForURL(/\/cities/);
    
    const cityRows = page.locator('[data-testid="city-row"]');
    const count = await cityRows.count();
    
    // Should only see cities in THEIR area (not all cities)
    // Exact count depends on seed data, but should be less than SuperAdmin
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThan(10); // Assuming SuperAdmin sees 10+
  });

  // ============================================
  // TEST 3: City Coordinator City Isolation
  // ============================================
  test('City Coordinator CANNOT see other cities', async ({ page }) => {
    // Login as City Coordinator (Tel Aviv)
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Cities tab should NOT be visible in navigation
    const citiesTab = page.locator('[data-testid="nav-cities"]');
    await expect(citiesTab).not.toBeVisible();
    
    // Direct access to /cities should show AccessDenied
    await page.goto('/he/cities');
    await expect(page.locator('text=Access Denied')).toBeVisible();
    
    // Org-tree should show ONLY their city as root
    const orgTreeResponse = await page.request.get('/api/org-tree');
    const orgTree = await orgTreeResponse.json();
    
    expect(orgTree.type).toBe('city');
    expect(orgTree.name).toContain('תל אביב'); // Hebrew for Tel Aviv
  });

  // ============================================
  // TEST 4: Activist Coordinator Neighborhood Isolation
  // ============================================
  test('Activist Coordinator CANNOT see unassigned neighborhoods', async ({ page }) => {
    // Login as Activist Coordinator
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'activist.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Navigate to neighborhoods
    await page.click('[data-testid="nav-neighborhoods"]');
    await page.waitForURL(/\/neighborhoods/);
    
    // Should only see ASSIGNED neighborhoods
    const neighborhoodRows = page.locator('[data-testid="neighborhood-row"]');
    const count = await neighborhoodRows.count();
    
    // Count should be limited (not all neighborhoods in city)
    expect(count).toBeGreaterThan(0);
    expect(count).toBeLessThanOrEqual(5); // Assuming coordinator has ≤5 neighborhoods
    
    // Verify org-tree shows only assigned neighborhoods
    const orgTreeResponse = await page.request.get('/api/org-tree');
    const orgTree = await orgTreeResponse.json();
    
    // Should have neighborhoods node with limited children
    const neighborhoodsNode = orgTree.children?.find((c: any) => c.type === 'neighborhoods');
    expect(neighborhoodsNode).toBeDefined();
    expect(neighborhoodsNode.children.length).toBe(count);
  });

  // ============================================
  // TEST 5: Cross-City Data Queries (Graceful Isolation)
  // ============================================
  test('Cross-city data queries return empty (not error)', async ({ page }) => {
    // Login as City Coordinator (Tel Aviv)
    await page.goto('/he/login');
    await page.fill('[data-testid="email-input"]', 'city.coordinator@telaviv.test');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');
    
    await page.waitForURL(/\/dashboard/);
    
    // Try to fetch activists from another city via API
    // (Using fake city ID that belongs to another coordinator)
    const response = await page.request.get('/api/activists?cityId=other-city-id-12345');
    
    // Should return 200 OK (not 403 or 500)
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    
    // Should return empty array (not error, not other city's data)
    expect(data.activists).toEqual([]);
    expect(data.total).toBe(0);
    
    // Should NOT throw error or return other city's data
    expect(data.error).toBeUndefined();
  });

});
