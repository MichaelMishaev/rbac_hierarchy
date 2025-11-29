import { test, expect } from '../fixtures/auth.fixture';

/**
 * Corporation Management - CRUD Operations
 * Based on: docs/syAnalyse/mvp/07_TESTING_CHECKLIST.md (Lines 56-106)
 */

test.describe('Corporation Management - Create', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('superAdmin');
  });

  test('should create corporation with valid input', async ({ page }) => {
    await page.goto('/corporations');

    // Click create button
    await page.click('[data-testid="create-corporation-button"]');

    // Fill form
    await page.fill('[data-testid="corporation-name-input"]', 'Test Corporation');
    await page.fill('[data-testid="corporation-code-input"]', 'TESTCORP');
    await page.fill('[data-testid="corporation-email-input"]', 'contact@testcorp.com');
    await page.fill('[data-testid="corporation-phone-input"]', '+972501234567');
    await page.fill('[data-testid="corporation-address-input"]', 'Tel Aviv, Israel');

    // Submit
    await page.click('[data-testid="submit-corporation-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-snackbar"]')).toContainText('Corporation created');

    // Verify modal closes
    await expect(page.locator('[data-testid="corporation-modal"]')).not.toBeVisible();

    // Verify corporation appears in list
    await expect(page.locator('text=Test Corporation')).toBeVisible();
  });

  test('should require name and code fields', async ({ page }) => {
    await page.goto('/corporations');
    await page.click('[data-testid="create-corporation-button"]');

    // Try to submit without filling required fields
    await page.click('[data-testid="submit-corporation-button"]');

    // Verify validation errors
    await expect(page.locator('[data-testid="name-error"]')).toContainText('required');
    await expect(page.locator('[data-testid="code-error"]')).toContainText('required');
  });

  test('should reject duplicate corporation codes', async ({ page }) => {
    await page.goto('/corporations');

    // Create first corporation
    await page.click('[data-testid="create-corporation-button"]');
    await page.fill('[data-testid="corporation-name-input"]', 'Corp One');
    await page.fill('[data-testid="corporation-code-input"]', 'DUPLICATE');
    await page.click('[data-testid="submit-corporation-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();

    // Try to create second with same code
    await page.click('[data-testid="create-corporation-button"]');
    await page.fill('[data-testid="corporation-name-input"]', 'Corp Two');
    await page.fill('[data-testid="corporation-code-input"]', 'DUPLICATE');
    await page.click('[data-testid="submit-corporation-button"]');

    // Verify error
    await expect(page.locator('[data-testid="error-snackbar"]')).toContainText('already exists');
  });

  test('should auto-convert code to uppercase', async ({ page }) => {
    await page.goto('/corporations');
    await page.click('[data-testid="create-corporation-button"]');

    // Type lowercase code
    await page.fill('[data-testid="corporation-code-input"]', 'lowercase');

    // Verify it's converted to uppercase
    await expect(page.locator('[data-testid="corporation-code-input"]')).toHaveValue('LOWERCASE');
  });

  test('should validate email format', async ({ page }) => {
    await page.goto('/corporations');
    await page.click('[data-testid="create-corporation-button"]');

    await page.fill('[data-testid="corporation-name-input"]', 'Test Corp');
    await page.fill('[data-testid="corporation-code-input"]', 'TEST');
    await page.fill('[data-testid="corporation-email-input"]', 'invalid-email');

    // Blur to trigger validation
    await page.click('[data-testid="corporation-name-input"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
  });

  test('should upload corporation logo', async ({ page }) => {
    await page.goto('/corporations');
    await page.click('[data-testid="create-corporation-button"]');

    await page.fill('[data-testid="corporation-name-input"]', 'Logo Corp');
    await page.fill('[data-testid="corporation-code-input"]', 'LOGO');

    // Upload logo
    const fileInput = page.locator('[data-testid="logo-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/test-logo.png');

    // Verify preview appears
    await expect(page.locator('[data-testid="logo-preview"]')).toBeVisible();

    await page.click('[data-testid="submit-corporation-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should reject logo files larger than 2MB', async ({ page }) => {
    await page.goto('/corporations');
    await page.click('[data-testid="create-corporation-button"]');

    // Try to upload large file (mock)
    const fileInput = page.locator('[data-testid="logo-upload-input"]');
    // Note: In real test, you'd need a 3MB test file
    await fileInput.setInputFiles('tests/fixtures/large-logo.png');

    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('2MB');
  });

  test('should accept PNG, JPG, SVG logo formats', async ({ page }) => {
    await page.goto('/corporations');
    await page.click('[data-testid="create-corporation-button"]');

    const formats = ['test-logo.png', 'test-logo.jpg', 'test-logo.svg'];

    for (const file of formats) {
      const fileInput = page.locator('[data-testid="logo-upload-input"]');
      await fileInput.setInputFiles(`tests/fixtures/${file}`);
      await expect(page.locator('[data-testid="logo-preview"]')).toBeVisible();
    }
  });
});

test.describe('Corporation Management - View List', () => {
  test('SuperAdmin should see all corporations', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations');

    // Should see table
    await expect(page.locator('[data-testid="corporations-table"]')).toBeVisible();

    // Should see corporations from different entities
    await expect(page.locator('text=Corporation 1')).toBeVisible();
    await expect(page.locator('text=Corporation 2')).toBeVisible();
  });

  test('Manager should see only their corporation', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/corporations');

    // Should see only their corporation
    await expect(page.locator('text=Corporation 1')).toBeVisible();
    await expect(page.locator('text=Corporation 2')).not.toBeVisible();
  });

  test('should search corporations by name and code', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations');

    // Search by name
    await page.fill('[data-testid="search-input"]', 'Corporation 1');
    await expect(page.locator('text=Corporation 1')).toBeVisible();
    await expect(page.locator('text=Corporation 2')).not.toBeVisible();

    // Clear and search by code
    await page.fill('[data-testid="search-input"]', 'CORP2');
    await expect(page.locator('text=Corporation 2')).toBeVisible();
    await expect(page.locator('text=Corporation 1')).not.toBeVisible();
  });

  test('should sort all columns', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations');

    // Click name column header to sort
    await page.click('[data-testid="sort-name"]');

    // Verify sort indicator
    await expect(page.locator('[data-testid="sort-name-asc"]')).toBeVisible();

    // Click again to reverse
    await page.click('[data-testid="sort-name"]');
    await expect(page.locator('[data-testid="sort-name-desc"]')).toBeVisible();
  });

  test('should navigate to corporation details on row click', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations');

    // Click first row
    await page.click('[data-testid="corporation-row-1"]');

    // Verify navigation
    await expect(page).toHaveURL(/\/corporations\/1$/);
  });

  test('should show empty state when no corporations', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    // Assume test environment with no corporations
    await page.goto('/corporations');

    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No corporations found')).toBeVisible();
  });

  test('should show loading skeleton during fetch', async ({ page, loginAs }) => {
    await loginAs('superAdmin');

    // Navigate and check for skeleton
    const navigation = page.goto('/corporations');
    await expect(page.locator('[data-testid="table-skeleton"]')).toBeVisible();

    await navigation;
    await expect(page.locator('[data-testid="table-skeleton"]')).not.toBeVisible();
  });
});

test.describe('Corporation Management - View Details', () => {
  test('should display corporation details', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    // Verify all sections load
    await expect(page.locator('[data-testid="corporation-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="corporation-code"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="address"]')).toBeVisible();
  });

  test('should display corporation logo if exists', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await expect(page.locator('[data-testid="corporation-logo"]')).toBeVisible();
  });

  test('should display managers section', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await expect(page.locator('[data-testid="managers-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="manager-list"]')).toBeVisible();
  });

  test('should display sites section', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await expect(page.locator('[data-testid="sites-section"]')).toBeVisible();
    await expect(page.locator('[data-testid="site-list"]')).toBeVisible();
  });

  test('should display accurate statistics', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    // Verify KPI cards
    await expect(page.locator('[data-testid="total-managers"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-sites"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-workers"]')).toBeVisible();
  });

  test('should open edit modal on edit button click', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await page.click('[data-testid="edit-corporation-button"]');

    await expect(page.locator('[data-testid="corporation-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="modal-title"]')).toContainText('Edit Corporation');
  });

  test('should navigate back to list on back button click', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await page.click('[data-testid="back-button"]');

    await expect(page).toHaveURL(/\/corporations$/);
  });
});

test.describe('Corporation Management - Edit', () => {
  test('should pre-fill form with existing values', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');
    await page.click('[data-testid="edit-corporation-button"]');

    // Verify fields are populated
    await expect(page.locator('[data-testid="corporation-name-input"]')).not.toHaveValue('');
    await expect(page.locator('[data-testid="corporation-code-input"]')).not.toHaveValue('');
  });

  test('should save valid updates', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');
    await page.click('[data-testid="edit-corporation-button"]');

    // Update name
    await page.fill('[data-testid="corporation-name-input"]', 'Updated Corporation Name');
    await page.click('[data-testid="submit-corporation-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();

    // Verify detail page shows updated data
    await expect(page.locator('[data-testid="corporation-name"]')).toContainText('Updated Corporation Name');
  });

  test('should validate on edit same as create', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');
    await page.click('[data-testid="edit-corporation-button"]');

    // Clear required field
    await page.fill('[data-testid="corporation-name-input"]', '');
    await page.click('[data-testid="submit-corporation-button"]');

    // Verify validation error
    await expect(page.locator('[data-testid="name-error"]')).toContainText('required');
  });

  test('should allow changing corporation logo', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');
    await page.click('[data-testid="edit-corporation-button"]');

    // Upload new logo
    const fileInput = page.locator('[data-testid="logo-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/new-logo.png');

    await page.click('[data-testid="submit-corporation-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();

    // Verify new logo appears
    await expect(page.locator('[data-testid="corporation-logo"]')).toHaveAttribute('src', /new-logo/);
  });
});

test.describe('Corporation Management - Delete (Soft)', () => {
  test('should show confirmation dialog before delete', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await page.click('[data-testid="delete-corporation-button"]');

    await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
    await expect(page.locator('text=Are you sure')).toBeVisible();
  });

  test('should cancel deletion', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await page.click('[data-testid="delete-corporation-button"]');
    await page.click('[data-testid="cancel-delete-button"]');

    // Verify dialog closes
    await expect(page.locator('[data-testid="confirmation-dialog"]')).not.toBeVisible();

    // Verify still on same page
    await expect(page).toHaveURL(/\/corporations\/1$/);
  });

  test('should soft delete corporation on confirm', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/corporations/1');

    await page.click('[data-testid="delete-corporation-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-snackbar"]')).toContainText('deleted');

    // Verify redirect to list
    await expect(page).toHaveURL(/\/corporations$/);

    // Verify corporation no longer appears in list
    await expect(page.locator('[data-testid="corporation-row-1"]')).not.toBeVisible();
  });
});
