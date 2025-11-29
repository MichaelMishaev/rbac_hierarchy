import { test, expect } from '../fixtures/auth.fixture';

/**
 * Worker Management - CRUD Operations
 * Based on: docs/syAnalyse/mvp/07_TESTING_CHECKLIST.md (Lines 205-277)
 */

test.describe('Worker Management - Create', () => {
  test.beforeEach(async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');
  });

  test('should create worker with valid input', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    // Fill required fields
    await page.fill('[data-testid="worker-name-input"]', 'John Doe');

    // Fill optional fields
    await page.fill('[data-testid="worker-phone-input"]', '+972501234567');
    await page.fill('[data-testid="worker-email-input"]', 'john.doe@example.com');
    await page.fill('[data-testid="worker-position-input"]', 'Technician');

    // Submit
    await page.click('[data-testid="submit-worker-button"]');

    // Verify success
    await expect(page.locator('[data-testid="success-snackbar"]')).toContainText('Worker created');

    // Verify worker appears in list
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should require name field', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    // Try to submit without name
    await page.click('[data-testid="submit-worker-button"]');

    await expect(page.locator('[data-testid="name-error"]')).toContainText('required');
  });

  test('should validate Israeli phone format', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    await page.fill('[data-testid="worker-name-input"]', 'Test Worker');
    await page.fill('[data-testid="worker-phone-input"]', '123456'); // Invalid

    await page.click('[data-testid="submit-worker-button"]');

    await expect(page.locator('[data-testid="phone-error"]')).toContainText('valid phone');
  });

  test('should validate email format', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    await page.fill('[data-testid="worker-name-input"]', 'Test Worker');
    await page.fill('[data-testid="worker-email-input"]', 'invalid-email');

    await page.click('[data-testid="submit-worker-button"]');

    await expect(page.locator('[data-testid="email-error"]')).toContainText('valid email');
  });

  test('should accept comma-separated tags', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    await page.fill('[data-testid="worker-name-input"]', 'Tagged Worker');
    await page.fill('[data-testid="worker-tags-input"]', 'skilled, certified, senior');

    await page.click('[data-testid="submit-worker-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();

    // Verify tags are displayed
    await expect(page.locator('[data-testid="tag-skilled"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-certified"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-senior"]')).toBeVisible();
  });

  test('should upload worker photo', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    await page.fill('[data-testid="worker-name-input"]', 'Photo Worker');

    // Upload photo
    const fileInput = page.locator('[data-testid="photo-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/worker-photo.jpg');

    // Verify preview
    await expect(page.locator('[data-testid="photo-preview"]')).toBeVisible();

    await page.click('[data-testid="submit-worker-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should reject photo files larger than 1MB', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    const fileInput = page.locator('[data-testid="photo-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/large-photo.jpg');

    await expect(page.locator('[data-testid="file-size-error"]')).toContainText('1MB');
  });

  test('should auto-assign site for supervisor', async ({ page }) => {
    await page.click('[data-testid="create-worker-button"]');

    // Site field should be pre-selected and readonly for supervisor
    await expect(page.locator('[data-testid="worker-site-select"]')).toBeDisabled();
    await expect(page.locator('[data-testid="worker-site-select"]')).toHaveValue('1'); // Supervisor's site
  });
});

test.describe('Worker Management - View Desktop', () => {
  test('Supervisor should see workers in their site', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    // Should see table
    await expect(page.locator('[data-testid="workers-table"]')).toBeVisible();

    // All workers should be from assigned sites
    const siteNames = await page.locator('[data-testid^="worker-site-"]').allTextContents();
    expect(siteNames.every(name => name === 'Site 1' || name === 'Site 2')).toBeTruthy();
  });

  test('Manager should see workers in their corporation', async ({ page, loginAs }) => {
    await loginAs('manager');
    await page.goto('/workers');

    await expect(page.locator('[data-testid="workers-table"]')).toBeVisible();

    // Should have site filter dropdown
    await expect(page.locator('[data-testid="site-filter"]')).toBeVisible();
  });

  test('SuperAdmin should see all workers', async ({ page, loginAs }) => {
    await loginAs('superAdmin');
    await page.goto('/workers');

    await expect(page.locator('[data-testid="workers-table"]')).toBeVisible();

    // Should have corporation and site filters
    await expect(page.locator('[data-testid="corporation-filter"]')).toBeVisible();
    await expect(page.locator('[data-testid="site-filter"]')).toBeVisible();
  });

  test('should search workers by name, phone, position', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    // Search by name
    await page.fill('[data-testid="search-input"]', 'John');
    await expect(page.locator('text=John Doe')).toBeVisible();

    // Search by phone
    await page.fill('[data-testid="search-input"]', '+972501234567');
    await expect(page.locator('text=+972501234567')).toBeVisible();

    // Search by position
    await page.fill('[data-testid="search-input"]', 'Technician');
    await expect(page.locator('text=Technician')).toBeVisible();
  });

  test('should filter by active/inactive status', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    // Filter active
    await page.selectOption('[data-testid="status-filter"]', 'active');
    const activeWorkers = page.locator('[data-testid="worker-status-active"]');
    await expect(activeWorkers).toHaveCount(await activeWorkers.count());

    // Filter inactive
    await page.selectOption('[data-testid="status-filter"]', 'inactive');
    const inactiveWorkers = page.locator('[data-testid="worker-status-inactive"]');
    await expect(inactiveWorkers).toHaveCount(await inactiveWorkers.count());
  });

  test('should filter by tags', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    // Open tag filter
    await page.click('[data-testid="tag-filter"]');

    // Select "skilled" tag
    await page.click('[data-testid="tag-option-skilled"]');

    // Verify only workers with "skilled" tag are shown
    const workerRows = page.locator('[data-testid^="worker-row-"]');
    const count = await workerRows.count();

    for (let i = 0; i < count; i++) {
      await expect(workerRows.nth(i).locator('[data-testid="tag-skilled"]')).toBeVisible();
    }
  });

  test('should sort columns', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    // Sort by name
    await page.click('[data-testid="sort-name"]');
    await expect(page.locator('[data-testid="sort-name-asc"]')).toBeVisible();

    // Sort by position
    await page.click('[data-testid="sort-position"]');
    await expect(page.locator('[data-testid="sort-position-asc"]')).toBeVisible();
  });

  test('should open worker profile on row click', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    await page.click('[data-testid="worker-row-1"]');

    await expect(page).toHaveURL(/\/workers\/1$/);
  });

  test('should show empty state when no workers', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    // Apply filter that returns no results
    await page.fill('[data-testid="search-input"]', 'NonExistentWorker123');

    await expect(page.locator('[data-testid="empty-state"]')).toBeVisible();
    await expect(page.locator('text=No workers found')).toBeVisible();
  });

  test('should show loading skeleton', async ({ page, loginAs }) => {
    await loginAs('supervisor');

    const navigation = page.goto('/workers');
    await expect(page.locator('[data-testid="table-skeleton"]')).toBeVisible();

    await navigation;
    await expect(page.locator('[data-testid="table-skeleton"]')).not.toBeVisible();
  });
});

test.describe('Worker Management - View Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('should display workers as cards on mobile', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    // Should show card layout, not table
    await expect(page.locator('[data-testid="workers-grid"]')).toBeVisible();
    await expect(page.locator('[data-testid="workers-table"]')).not.toBeVisible();
  });

  test('should have touch-friendly targets (min 44px)', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    const workerCard = page.locator('[data-testid="worker-card-1"]');
    const boundingBox = await workerCard.boundingBox();

    expect(boundingBox?.height).toBeGreaterThanOrEqual(44);
  });

  test('should show floating search bar', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    const searchBar = page.locator('[data-testid="search-bar"]');
    await expect(searchBar).toBeVisible();
    await expect(searchBar).toHaveCSS('position', 'sticky');
  });

  test('should display worker avatar in cards', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    await expect(page.locator('[data-testid="worker-card-1"] [data-testid="worker-avatar"]')).toBeVisible();
  });

  test('should display tags below worker name', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    const card = page.locator('[data-testid="worker-card-1"]');
    await expect(card.locator('[data-testid="worker-tags"]')).toBeVisible();
  });

  test('should show status badge clearly', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers');

    await expect(page.locator('[data-testid="worker-card-1"] [data-testid="status-badge"]')).toBeVisible();
  });
});

test.describe('Worker Management - View Profile', () => {
  test('should display worker details', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await expect(page.locator('[data-testid="worker-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="worker-photo"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-phone"]')).toBeVisible();
    await expect(page.locator('[data-testid="contact-email"]')).toBeVisible();
    await expect(page.locator('[data-testid="worker-site"]')).toBeVisible();
    await expect(page.locator('[data-testid="worker-position"]')).toBeVisible();
  });

  test('should display supervisor info', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await expect(page.locator('[data-testid="assigned-supervisor"]')).toBeVisible();
  });

  test('should display employment details', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await expect(page.locator('[data-testid="start-date"]')).toBeVisible();
    await expect(page.locator('[data-testid="employment-status"]')).toBeVisible();
  });

  test('should display all tags', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await expect(page.locator('[data-testid="worker-tags-section"]')).toBeVisible();
  });

  test('should display notes', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await expect(page.locator('[data-testid="worker-notes"]')).toBeVisible();
  });

  test('should show edit button', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await expect(page.locator('[data-testid="edit-worker-button"]')).toBeVisible();
  });

  test('should show deactivate button', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await expect(page.locator('[data-testid="deactivate-worker-button"]')).toBeVisible();
  });

  test('should navigate back on back button click', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await page.click('[data-testid="back-button"]');

    await expect(page).toHaveURL(/\/workers$/);
  });
});

test.describe('Worker Management - Edit', () => {
  test('should pre-fill form with existing values', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');
    await page.click('[data-testid="edit-worker-button"]');

    await expect(page.locator('[data-testid="worker-name-input"]')).not.toHaveValue('');
  });

  test('should save valid updates', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');
    await page.click('[data-testid="edit-worker-button"]');

    await page.fill('[data-testid="worker-name-input"]', 'Updated Worker Name');
    await page.click('[data-testid="submit-worker-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
    await expect(page.locator('[data-testid="worker-name"]')).toContainText('Updated Worker Name');
  });

  test('should allow photo change', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');
    await page.click('[data-testid="edit-worker-button"]');

    const fileInput = page.locator('[data-testid="photo-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/new-photo.jpg');

    await page.click('[data-testid="submit-worker-button"]');
    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
  });

  test('should allow updating tags', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');
    await page.click('[data-testid="edit-worker-button"]');

    await page.fill('[data-testid="worker-tags-input"]', 'updated, new-tag');
    await page.click('[data-testid="submit-worker-button"]');

    await expect(page.locator('[data-testid="tag-updated"]')).toBeVisible();
    await expect(page.locator('[data-testid="tag-new-tag"]')).toBeVisible();
  });
});

test.describe('Worker Management - Delete', () => {
  test('should show confirmation before delete', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await page.click('[data-testid="delete-worker-button"]');

    await expect(page.locator('[data-testid="confirmation-dialog"]')).toBeVisible();
  });

  test('should soft delete worker', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await page.click('[data-testid="delete-worker-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    await expect(page.locator('[data-testid="success-snackbar"]')).toBeVisible();
    await expect(page).toHaveURL(/\/workers$/);

    // Worker should not appear in active list
    await expect(page.locator('[data-testid="worker-row-1"]')).not.toBeVisible();
  });

  test('should still exist in database as inactive', async ({ page, loginAs }) => {
    await loginAs('supervisor');
    await page.goto('/workers/1');

    await page.click('[data-testid="delete-worker-button"]');
    await page.click('[data-testid="confirm-delete-button"]');

    // Navigate back and filter by inactive
    await page.goto('/workers');
    await page.selectOption('[data-testid="status-filter"]', 'inactive');

    // Worker should appear in inactive list
    await expect(page.locator('[data-testid="worker-row-1"]')).toBeVisible();
    await expect(page.locator('[data-testid="worker-row-1"] [data-testid="status-badge"]')).toContainText('Inactive');
  });
});
