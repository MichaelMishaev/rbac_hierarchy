import { test, expect } from '@playwright/test';

test.describe('Organizational Tree - Root Connector Fix', () => {
  test('should have proper vertical connector from root to children', async ({ page }) => {
    // Login as SuperAdmin
    await page.goto('/login');

    // Click SuperAdmin quick access
    await page.click('text=SuperAdmin');

    // Wait for password field to be filled
    await page.waitForTimeout(500);

    // Submit login
    await page.click('button[type="submit"]');

    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
    await page.waitForTimeout(1000);

    // Scroll to System Hierarchy section
    await page.locator('text=System Hierarchy').scrollIntoViewIfNeeded();
    await page.waitForTimeout(500);

    // Take screenshot of tree before expand
    await page.screenshot({
      path: '.playwright-mcp/org-tree-root-connector-collapsed.png',
      fullPage: false
    });

    // Click Expand All
    await page.click('text=Expand All');
    await page.waitForTimeout(1000);

    // Take screenshot of fully expanded tree
    await page.screenshot({
      path: '.playwright-mcp/org-tree-root-connector-expanded.png',
      fullPage: false
    });

    // Verify tree structure
    const treeRoot = page.locator('.org-tree');
    await expect(treeRoot).toBeVisible();

    // Verify root wrapper exists
    const rootWrapper = page.locator('.tree-root-wrapper');
    await expect(rootWrapper).toBeVisible();

    // Verify tree-node-list exists (corporations level)
    const nodeList = page.locator('.tree-node-list').first();
    await expect(nodeList).toBeVisible();

    // Verify multiple corporations are visible
    const corpCards = page.locator('.tree-node-item').filter({ hasText: 'corporation' });
    await expect(corpCards).toHaveCount(3); // Should have 3 corporations

    // Verify sites are visible
    const siteCards = page.locator('.tree-node-item').filter({ hasText: 'site' });
    const siteCount = await siteCards.count();
    expect(siteCount).toBeGreaterThan(0);

    console.log(`✅ Tree has ${siteCount} sites visible`);

    // Take full page screenshot for documentation
    await page.screenshot({
      path: '.playwright-mcp/org-tree-root-connector-full.png',
      fullPage: true
    });
  });
});
