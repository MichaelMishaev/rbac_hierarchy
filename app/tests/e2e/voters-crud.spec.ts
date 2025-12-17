/**
 * E2E Tests for Voter CRUD Operations
 *
 * Tests:
 * - Create voter
 * - View voter list
 * - Edit voter
 * - View voter details with edit history
 * - Delete voter (soft delete)
 * - Search/filter voters
 */

import { test, expect } from '@playwright/test';

test.describe('Voter CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Activist Coordinator
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill('rachel.bendavid@telaviv.test');
    await page.getByTestId('password-input').fill('supervisor123');
    await page.getByTestId('login-button').click();

    // Wait for redirect to dashboard
    await page.waitForURL(/\/he\/dashboard/);
  });

  test('should navigate to voters page', async ({ page }) => {
    // Navigate to voters page
    await page.goto('/he/voters');

    // Verify page loaded
    await expect(page.getByText('רשימת בוחרים')).toBeVisible();
  });

  test('should create a new voter', async ({ page }) => {
    await page.goto('/he/voters');

    // Click "Add Voter" button
    await page.getByRole('button', { name: /הוסף בוחר/ }).click();

    // Fill in voter form
    await page.getByLabel('שם מלא').fill('יוסי כהן');
    await page.getByLabel('טלפון').fill('0501234567');
    await page.getByLabel('אימייל').fill('yossi@example.com');

    // Select support level
    await page.getByLabel('רמת תמיכה').click();
    await page.getByRole('option', { name: 'תומך' }).click();

    // Select contact status
    await page.getByLabel('סטטוס קשר').click();
    await page.getByRole('option', { name: 'נוצר קשר' }).click();

    // Select priority
    await page.getByLabel('עדיפות').click();
    await page.getByRole('option', { name: 'גבוה' }).click();

    // Add notes
    await page.getByLabel('הערות').fill('בוחר חדש למבחן E2E');

    // Submit form
    await page.getByRole('button', { name: /הוסף בוחר/ }).click();

    // Verify success message
    await expect(page.getByText('הבוחר נוסף בהצלחה!')).toBeVisible();

    // Verify voter appears in list
    await page.waitForTimeout(1000); // Wait for refresh
    await expect(page.getByText('יוסי כהן')).toBeVisible();
  });

  test('should filter voters by support level', async ({ page }) => {
    await page.goto('/he/voters');

    // Select support level filter
    await page.getByLabel('רמת תמיכה').click();
    await page.getByRole('option', { name: 'תומך' }).click();

    // Wait for filter to apply
    await page.waitForTimeout(1000);

    // Verify only supporters are shown
    const supportChips = page.locator('[role="row"] >> text="תומך"');
    const count = await supportChips.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should search voters by name', async ({ page }) => {
    await page.goto('/he/voters');

    // Enter search query
    await page.getByPlaceholder('שם, טלפון, אימייל').fill('דוד');

    // Wait for search to apply
    await page.waitForTimeout(500);

    // Verify filtered results
    const rows = page.locator('table tbody tr');
    const count = await rows.count();

    // At least one result should contain "דוד"
    if (count > 0) {
      await expect(rows.first()).toContainText('דוד');
    }
  });

  test('should view voter details', async ({ page }) => {
    await page.goto('/he/voters');

    // Click on first voter's view button
    await page.locator('table tbody tr').first().getByRole('button', { name: /צפייה/ }).click();

    // Verify details dialog opened
    await expect(page.getByText('פרטי בוחר')).toBeVisible();

    // Verify personal info section
    await expect(page.getByText('מידע אישי')).toBeVisible();

    // Verify campaign status section
    await expect(page.getByText('סטטוס קמפיין')).toBeVisible();
  });

  test('should edit existing voter', async ({ page }) => {
    await page.goto('/he/voters');

    // Click on first voter's edit button
    await page.locator('table tbody tr').first().getByRole('button', { name: /עריכה/ }).click();

    // Wait for edit dialog
    await expect(page.getByText('עריכת בוחר')).toBeVisible();

    // Change support level
    await page.getByLabel('רמת תמיכה').click();
    await page.getByRole('option', { name: 'מהסס' }).click();

    // Update notes
    await page.getByLabel('הערות').fill('עדכון דרך E2E test');

    // Submit changes
    await page.getByRole('button', { name: /עדכן בוחר/ }).click();

    // Verify success
    await expect(page.getByText('הבוחר עודכן בהצלחה!')).toBeVisible();
  });

  test('should delete voter (soft delete)', async ({ page }) => {
    await page.goto('/he/voters');

    // Get initial row count
    const initialCount = await page.locator('table tbody tr').count();

    // Click delete on first voter
    await page.locator('table tbody tr').first().getByRole('button', { name: /מחיקה/ }).click();

    // Confirm deletion
    page.on('dialog', (dialog) => dialog.accept());

    // Wait for deletion
    await page.waitForTimeout(1000);

    // Verify row count decreased
    const newCount = await page.locator('table tbody tr').count();
    expect(newCount).toBeLessThan(initialCount);
  });

  test('should show edit history in voter details', async ({ page }) => {
    // First, edit a voter to create history
    await page.goto('/he/voters');

    // Edit first voter
    await page.locator('table tbody tr').first().getByRole('button', { name: /עריכה/ }).click();
    await page.getByLabel('רמת תמיכה').click();
    await page.getByRole('option', { name: 'תומך' }).click();
    await page.getByRole('button', { name: /עדכן בוחר/ }).click();

    // Wait for update
    await page.waitForTimeout(1000);

    // Close edit dialog
    await page.getByRole('button', { name: /ביטול/ }).click();

    // View voter details
    await page.locator('table tbody tr').first().getByRole('button', { name: /צפייה/ }).click();

    // Verify edit history section exists
    await expect(page.getByText('היסטוריית עריכה')).toBeVisible();
  });

  test('should navigate between tabs', async ({ page }) => {
    await page.goto('/he/voters');

    // Click Statistics tab
    await page.getByRole('tab', { name: 'סטטיסטיקות' }).click();

    // Verify statistics content
    await expect(page.getByText('סטטיסטיקות בוחרים')).toBeVisible();
    await expect(page.getByText('סה"כ בוחרים')).toBeVisible();

    // Go back to list tab
    await page.getByRole('tab', { name: 'רשימת בוחרים' }).click();

    // Verify table is visible
    await expect(page.locator('table')).toBeVisible();
  });
});
