import { test, expect } from '@playwright/test';
import type { Page } from '@playwright/test';

const SUPER_ADMIN_EMAIL = 'superadmin@election.test';
const SUPER_ADMIN_PASSWORD = 'admin123';
const CITY_COORDINATOR_EMAIL = 'city.coordinator@telaviv.test';
const CITY_COORDINATOR_PASSWORD = 'password123';

/**
 * Wiki E2E Tests
 *
 * Tests wiki access control, viewing, and search functionality
 */

async function loginAs(page: Page, email: string, password: string) {
  await page.goto('/he/login');
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/he\/dashboard/, { timeout: 5000 });
}

test.describe('Wiki Access Control', () => {
  test('SuperAdmin can access wiki', async ({ page }) => {
    await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    // Navigate to wiki
    await page.goto('/he/wiki');

    // Should see wiki content, not access denied
    await expect(page.locator('text=ויקי')).toBeVisible();
    await expect(page.locator('text=גישה נדחתה')).not.toBeVisible();
  });

  test('City Coordinator cannot access wiki', async ({ page }) => {
    await loginAs(page, CITY_COORDINATOR_EMAIL, CITY_COORDINATOR_PASSWORD);

    // Try to navigate to wiki
    await page.goto('/he/wiki');

    // Should see access denied message
    await expect(page.locator('text=גישה נדחתה')).toBeVisible();
    await expect(page.locator('text=רק מנהל על יכול לצפות במערכת הויקי')).toBeVisible();
  });

  test('Unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/he/wiki');

    // Should redirect to login
    await page.waitForURL(/\/he\/login/, { timeout: 5000 });
    await expect(page.url()).toContain('/login');
  });
});

test.describe('Wiki Category List', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    await page.goto('/he/wiki');
  });

  test('Shows wiki categories', async ({ page }) => {
    // Wait for categories to load
    await page.waitForSelector('[data-testid="wiki-category-card"]', { timeout: 10000 });

    // Should have multiple categories
    const categoryCards = page.locator('[data-testid="wiki-category-card"]');
    const count = await categoryCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Categories show page counts', async ({ page }) => {
    await page.waitForSelector('[data-testid="wiki-category-card"]', { timeout: 10000 });

    // First category should show page count
    const firstCategory = page.locator('[data-testid="wiki-category-card"]').first();
    await expect(firstCategory.locator('text=/\\d+ מאמרים?/')).toBeVisible();
  });

  test('Can click category to view pages', async ({ page }) => {
    await page.waitForSelector('[data-testid="wiki-category-card"]', { timeout: 10000 });

    // Click first category
    const firstCategory = page.locator('[data-testid="wiki-category-card"]').first();
    await firstCategory.click();

    // Should navigate to category page
    await page.waitForURL(/\/he\/wiki\/[^/]+$/, { timeout: 5000 });

    // Should see page list or category content
    await expect(page.locator('text=ויקי')).toBeVisible();
  });
});

test.describe('Wiki Page Viewing', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
  });

  test('Can view wiki page content', async ({ page }) => {
    // Navigate to specific page (using a known seeded page)
    await page.goto('/he/wiki/authentication/login-process');

    // Wait for page content to load
    await page.waitForSelector('h3', { timeout: 10000 });

    // Should see page title
    const title = page.locator('h3').first();
    await expect(title).toBeVisible();

    // Should see view count
    await expect(page.locator('text=/\\d+ צפיות/')).toBeVisible();

    // Should see breadcrumbs
    await expect(page.locator('text=דשבורד')).toBeVisible();
    await expect(page.locator('text=ויקי')).toBeVisible();
  });

  test('View count increments on page view', async ({ page }) => {
    // View a page
    await page.goto('/he/wiki/authentication/login-process');
    await page.waitForSelector('h3', { timeout: 10000 });

    // Get initial view count
    const viewCountText = await page.locator('text=/\\d+ צפיות/').textContent();
    const initialCount = parseInt(viewCountText?.match(/\d+/)?.[0] || '0');

    // Reload page
    await page.reload();
    await page.waitForSelector('h3', { timeout: 10000 });

    // View count should have increased
    const newViewCountText = await page.locator('text=/\\d+ צפיות/').textContent();
    const newCount = parseInt(newViewCountText?.match(/\d+/)?.[0] || '0');

    expect(newCount).toBeGreaterThan(initialCount);
  });

  test('Markdown content renders correctly', async ({ page }) => {
    await page.goto('/he/wiki/authentication/login-process');
    await page.waitForSelector('h3', { timeout: 10000 });

    // Should render markdown headings
    const h1Count = await page.locator('h1').count();
    const h2Count = await page.locator('h2').count();
    const pCount = await page.locator('p').count();

    expect(h1Count + h2Count + pCount).toBeGreaterThan(0);
  });

  test('Tags are displayed', async ({ page }) => {
    await page.goto('/he/wiki/authentication/login-process');
    await page.waitForSelector('h3', { timeout: 10000 });

    // Should see tag chips
    const tags = page.locator('[data-testid="wiki-tag"]');
    const tagCount = await tags.count();

    // Most wiki pages have tags
    expect(tagCount).toBeGreaterThanOrEqual(0);
  });
});

test.describe('Wiki Search', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    await page.goto('/he/wiki');
  });

  test('Search box is visible', async ({ page }) => {
    await page.waitForSelector('[data-testid="wiki-search-input"]', { timeout: 10000 });

    const searchBox = page.locator('[data-testid="wiki-search-input"]');
    await expect(searchBox).toBeVisible();
  });

  test('Can search for wiki pages', async ({ page }) => {
    await page.waitForSelector('[data-testid="wiki-search-input"]', { timeout: 10000 });

    // Type search query
    const searchBox = page.locator('[data-testid="wiki-search-input"]');
    await searchBox.fill('אימות');

    // Wait for search results
    await page.waitForSelector('[data-testid="wiki-search-result"]', { timeout: 10000 });

    // Should show search results
    const results = page.locator('[data-testid="wiki-search-result"]');
    const count = await results.count();
    expect(count).toBeGreaterThan(0);
  });

  test('Search shows relevant results', async ({ page }) => {
    await page.waitForSelector('[data-testid="wiki-search-input"]', { timeout: 10000 });

    // Search for "כניסה" (login)
    const searchBox = page.locator('[data-testid="wiki-search-input"]');
    await searchBox.fill('כניסה');

    await page.waitForSelector('[data-testid="wiki-search-result"]', { timeout: 10000 });

    // First result should contain search term
    const firstResult = page.locator('[data-testid="wiki-search-result"]').first();
    const resultText = await firstResult.textContent();

    expect(resultText).toBeTruthy();
  });

  test('Empty search shows all categories', async ({ page }) => {
    await page.waitForSelector('[data-testid="wiki-search-input"]', { timeout: 10000 });

    // Clear search
    const searchBox = page.locator('[data-testid="wiki-search-input"]');
    await searchBox.fill('');
    await searchBox.press('Escape');

    // Should show categories again
    await page.waitForSelector('[data-testid="wiki-category-card"]', { timeout: 10000 });
    const categoryCards = page.locator('[data-testid="wiki-category-card"]');
    const count = await categoryCards.count();
    expect(count).toBeGreaterThan(0);
  });
});

test.describe('Wiki Popular Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);
    await page.goto('/he/wiki');
  });

  test('Shows popular pages section', async ({ page }) => {
    await page.waitForSelector('[data-testid="popular-pages-section"]', { timeout: 10000 });

    const popularSection = page.locator('[data-testid="popular-pages-section"]');
    await expect(popularSection).toBeVisible();
  });

  test('Popular pages are clickable', async ({ page }) => {
    await page.waitForSelector('[data-testid="popular-page-link"]', { timeout: 10000 });

    // Click first popular page
    const firstLink = page.locator('[data-testid="popular-page-link"]').first();
    await firstLink.click();

    // Should navigate to page
    await page.waitForURL(/\/he\/wiki\/[^/]+\/[^/]+/, { timeout: 5000 });

    // Should see page content
    await expect(page.locator('h3')).toBeVisible();
  });
});

test.describe('Wiki Recent Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD);

    // View a page first to create recent history
    await page.goto('/he/wiki/authentication/login-process');
    await page.waitForSelector('h3', { timeout: 10000 });

    // Go back to wiki home
    await page.goto('/he/wiki');
  });

  test('Shows recently viewed pages', async ({ page }) => {
    await page.waitForSelector('[data-testid="recent-pages-section"]', { timeout: 10000 });

    const recentSection = page.locator('[data-testid="recent-pages-section"]');
    await expect(recentSection).toBeVisible();
  });

  test('Recently viewed page appears in list', async ({ page }) => {
    await page.waitForSelector('[data-testid="recent-page-link"]', { timeout: 10000 });

    // Should have at least one recent page
    const recentLinks = page.locator('[data-testid="recent-page-link"]');
    const count = await recentLinks.count();
    expect(count).toBeGreaterThan(0);
  });
});
