import { test, expect } from '@playwright/test';

test.describe('Tasks Page - Mobile Responsive', () => {
  test.use({
    viewport: { width: 375, height: 667 }, // iPhone SE size
  });

  test('should redirect /tasks to /tasks/inbox on mobile', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3200/login');
    await page.fill('input[name="email"]', 'superadmin@election.test');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');

    // Wait for redirect after login
    await page.waitForURL(/\/(dashboard|tasks)/);

    // Navigate to /tasks
    await page.goto('http://localhost:3200/tasks');

    // Should redirect to /tasks/inbox
    await expect(page).toHaveURL('http://localhost:3200/tasks/inbox');

    // Should not show "Under Construction"
    await expect(page.locator('text=Under Construction')).not.toBeVisible();
    await expect(page.locator('text=בבניה')).not.toBeVisible();

    // Should show task inbox content
    await expect(page.locator('text=משימות')).toBeVisible();
  });

  test('should display tasks inbox properly on mobile', async ({ page }) => {
    // Login
    await page.goto('http://localhost:3200/login');
    await page.fill('input[name="email"]', 'superadmin@election.test');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/(dashboard|tasks)/);

    // Go directly to inbox
    await page.goto('http://localhost:3200/tasks/inbox');

    // Check responsive layout
    const container = page.locator('main, [role="main"], body > div').first();
    await expect(container).toBeVisible();

    // Verify no horizontal scroll
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 1); // Allow 1px tolerance
  });
});
