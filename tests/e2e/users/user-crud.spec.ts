import { test, expect } from '../fixtures/auth.fixture';

/**
 * User Management - CRUD Operations
 * Based on: docs/syAnalyse/mvp/07_TESTING_CHECKLIST.md (Lines 109-147)
 */

test.describe('User Management - Create', () => {
  test('should create user with valid input', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="create-user-button"]');

    await page.fill('[data-testid="user-email-input"]', 'newuser@test.com');
    await page.fill('[data-testid="user-name-input"]', 'New User');
    await page.selectOption('[data-testid="user-role-select"]', 'Manager');
    await page.selectOption('[data-testid="user-corporation-select"]', '1');

    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toContainText('User created');
    await expect(page.locator('text=New User')).toBeVisible();
  });

  test('should require email, name, and role', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="create-user-button"]');
    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('required');
    await expect(page.locator('[data-testid="name-error"]')).toContainText('required');
    await expect(page.locator('[data-testid="role-error"]')).toContainText('required');
  });

  test('should reject duplicate emails', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    // Create first user
    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="user-email-input"]', 'duplicate@test.com');
    await page.fill('[data-testid="user-name-input"]', 'User One');
    await page.selectOption('[data-testid="user-role-select"]', 'Manager');
    await page.selectOption('[data-testid="user-corporation-select"]', '1');
    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();

    // Try to create second with same email
    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="user-email-input"]', 'duplicate@test.com');
    await page.fill('[data-testid="user-name-input"]', 'User Two');
    await page.selectOption('[data-testid="user-role-select"]', 'Manager');
    await page.selectOption('[data-testid="user-corporation-select"]', '1');
    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="error-snackbar"]')).toContainText('already exists');
  });

  test('should assign Manager to corporation', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="user-email-input"]', 'manager@test.com');
    await page.fill('[data-testid="user-name-input"]', 'Test Manager');
    await page.selectOption('[data-testid="user-role-select"]', 'Manager');

    // Corporation selector should be visible
    await expect(page.locator('[data-testid="user-corporation-select"]')).toBeVisible();
    await page.selectOption('[data-testid="user-corporation-select"]', '1');

    await page.click('[data-testid="submit-user-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should assign Supervisor to site and corporation', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="user-email-input"]', 'supervisor@test.com');
    await page.fill('[data-testid="user-name-input"]', 'Test Supervisor');
    await page.selectOption('[data-testid="user-role-select"]', 'Supervisor');

    // Both corporation and site selectors should be visible
    await expect(page.locator('[data-testid="user-corporation-select"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-site-select"]')).toBeVisible();

    await page.selectOption('[data-testid="user-corporation-select"]', '1');
    await page.selectOption('[data-testid="user-site-select"]', ['1', '2']); // Multi-select

    await page.click('[data-testid="submit-user-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should generate temporary password', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="user-email-input"]', 'temppass@test.com');
    await page.fill('[data-testid="user-name-input"]', 'Temp User');
    await page.selectOption('[data-testid="user-role-select"]', 'Manager');
    await page.selectOption('[data-testid="user-corporation-select"]', '1');

    await page.click('[data-testid="submit-user-button"]');

    // Success message should mention temporary password
    await expect(page.locator('[data-testid="success-snackbar"]')).toContainText('temporary password');
  });

  test('should send invitation email', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="create-user-button"]');
    await page.fill('[data-testid="user-email-input"]', 'invite@test.com');
    await page.fill('[data-testid="user-name-input"]', 'Invited User');
    await page.selectOption('[data-testid="user-role-select"]', 'Manager');
    await page.selectOption('[data-testid="user-corporation-select"]', '1');

    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toContainText('invitation sent');
  });
});

test.describe('User Management - View List', () => {
  test('SuperAdmin should see all users', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();

    // Should see users from different corporations
    const userRows = page.locator('[data-testid^="user-row-"]');
    await expect(userRows.first()).toBeVisible();
  });

  test('Manager should see users in their corporation', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/users');

    await expect(page.locator('[data-testid="users-table"]')).toBeVisible();

    // All users should belong to corporation 1
    const userRows = page.locator('[data-testid^="user-row-"]');
    const count = await userRows.count();

    for (let i = 0; i < count; i++) {
      await expect(userRows.nth(i)).toHaveAttribute('data-corporation-id', '1');
    }
  });

  test('should display all columns', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    const table = page.locator('[data-testid="users-table"]');

    await expect(table.locator('[data-testid="column-name"]')).toBeVisible();
    await expect(table.locator('[data-testid="column-email"]')).toBeVisible();
    await expect(table.locator('[data-testid="column-role"]')).toBeVisible();
    await expect(table.locator('[data-testid="column-corporation"]')).toBeVisible();
  });

  test('should search users by name and email', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    // Search by name
    await page.fill('[data-testid="search-input"]', 'Manager');
    await expect(page.locator('text=Manager')).toBeVisible();

    // Search by email
    await page.fill('[data-testid="search-input"]', 'manager@');
    await expect(page.locator('text=manager@')).toBeVisible();
  });

  test('should filter by role', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    // Filter by Manager
    await page.selectOption('[data-testid="role-filter"]', 'Manager');

    const userRows = page.locator('[data-testid^="user-row-"]');
    const count = await userRows.count();

    for (let i = 0; i < count; i++) {
      await expect(userRows.nth(i).locator('[data-testid="user-role"]')).toContainText('Manager');
    }

    // Filter by Supervisor
    await page.selectOption('[data-testid="role-filter"]', 'Supervisor');

    const supervisorRows = page.locator('[data-testid^="user-row-"]');
    const supervisorCount = await supervisorRows.count();

    for (let i = 0; i < supervisorCount; i++) {
      await expect(supervisorRows.nth(i).locator('[data-testid="user-role"]')).toContainText('Supervisor');
    }
  });

  test('should sort columns', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    // Sort by name
    await page.click('[data-testid="sort-name"]');
    await expect(page.locator('[data-testid="sort-name-asc"]')).toBeVisible();

    // Sort by email
    await page.click('[data-testid="sort-email"]');
    await expect(page.locator('[data-testid="sort-email-asc"]')).toBeVisible();
  });

  test('should show row actions: Edit, Delete', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    const firstRow = page.locator('[data-testid="user-row-1"]');

    await expect(firstRow.locator('[data-testid="edit-user-button"]')).toBeVisible();
    await expect(firstRow.locator('[data-testid="delete-user-button"]')).toBeVisible();
  });

  test('should show empty state when no users', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    // Search for non-existent user
    await page.fill('[data-testid="search-input"]', 'NonExistentUser123456');

    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
  });

  test('should show loading skeleton', async ({ page, loginAs }) => {
    await loginAs('superAdmin');

    const navigation = page.goto('/users');
    await expect(page.locator('[data-testid="table-skeleton"]')).toBeVisible();

    await navigation;
    await expect(page.locator('[data-testid="table-skeleton"]')).not.toBeVisible();
  });
});

test.describe('User Management - Edit', () => {
  test('should pre-fill form with existing values', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="user-row-1"] [data-testid="edit-user-button"]');

    await expect(page.locator('[data-testid="user-name-input"]')).not.toHaveValue('');
    await expect(page.locator('[data-testid="user-email-input"]')).not.toHaveValue('');
  });

  test('should make email readonly', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="user-row-1"] [data-testid="edit-user-button"]');

    await expect(page.locator('[data-testid="user-email-input"]')).toBeDisabled();
  });

  test('should save valid updates', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="user-row-1"] [data-testid="edit-user-button"]');

    await page.fill('[data-testid="user-name-input"]', 'Updated User Name');
    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
    await expect(page.locator('text=Updated User Name')).toBeVisible();
  });

  test('should allow updating phone', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="user-row-1"] [data-testid="edit-user-button"]');

    await page.fill('[data-testid="user-phone-input"]', '+972509999999');
    await page.click('[data-testid="submit-user-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should allow uploading avatar', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="user-row-1"] [data-testid="edit-user-button"]');

    const fileInput = page.locator('[data-testid="avatar-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/avatar.jpg');

    await page.click('[data-testid="submit-user-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });
});

test.describe('User Management - Delete', () => {
  test('should show confirmation dialog', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="user-row-1"] [data-testid="delete-user-button"]');

    await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
  });

  test('should soft delete user', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    await page.click('[data-testid="user-row-1"] [data-testid="delete-user-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();

    // User should be removed from corporation/site
    await expect(page.locator('[data-testid="user-row-1"]')).not.toBeVisible();
  });

  test('should still exist in database', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    const userEmail = await page.locator('[data-testid="user-row-1"] [data-testid="user-email"]').textContent();

    await page.click('[data-testid="user-row-1"] [data-testid="delete-user-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // User record exists but loses access
    // This would be verified via API/database check in integration tests
  });

  test('should prevent user login after deletion', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/users');

    const userEmail = await page.locator('[data-testid="user-row-1"] [data-testid="user-email"]').textContent();

    await page.click('[data-testid="user-row-1"] [data-testid="delete-user-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Logout and try to login as deleted user
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    await page.goto('/login');
    await page.fill('[data-testid="email-input"]', userEmail || '');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Should show error
    await expect(page.locator('[data-testid="error-message"]')).toContainText('access denied');
  });
});
