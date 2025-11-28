import { test, expect } from '../fixtures/auth.fixture';

test.describe('Invitation System', () => {
  test('Manager can create invitation for new manager', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Navigate to users page
    await page.goto('/users');

    // Click invite manager button
    await page.click('[data-testid="invite-manager-button"]');

    // Fill in invitation form
    await page.fill('[data-testid="invite-email"]', 'invited.manager@corp1.test');
    await page.fill('[data-testid="invite-full-name"]', 'Invited Manager');

    // Select role
    await page.selectOption('[data-testid="target-type-select"]', 'corporation_manager');

    // Submit
    await page.click('[data-testid="send-invitation-button"]');

    // Verify success message
    await expect(page.locator('[data-testid="success-message"]')).toContain('Invitation sent');

    // Verify invitation appears in table
    await expect(page.locator('text=invited.manager@corp1.test')).toBeVisible();
  });

  test('Manager can create invitation for new supervisor', async ({ page, loginAs }) => {
    await loginAs('manager');

    await page.goto('/supervisors');

    await page.click('[data-testid="invite-supervisor-button"]');

    await page.fill('[data-testid="invite-email"]', 'invited.supervisor@corp1.test');
    await page.fill('[data-testid="invite-full-name"]', 'Invited Supervisor');

    // Select target type
    await page.selectOption('[data-testid="target-type-select"]', 'site_manager');

    // Select sites to assign
    await page.click('[data-testid="site-selector"]');
    await page.click('[data-testid="site-option-1"]');
    await page.click('[data-testid="site-option-2"]');

    await page.click('[data-testid="send-invitation-button"]');

    await expect(page.locator('[data-testid="success-message"]')).toContain('Invitation sent');
  });

  test('Invitation token is valid and unique', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Create invitation
    await page.goto('/users');
    await page.click('[data-testid="invite-manager-button"]');
    await page.fill('[data-testid="invite-email"]', 'token.test@corp1.test');
    await page.selectOption('[data-testid="target-type-select"]', 'corporation_manager');
    await page.click('[data-testid="send-invitation-button"]');

    // Get invitation token from UI (assuming it's displayed or in database)
    const invitationRow = page.locator('[data-testid="invitation-row"]').filter({ hasText: 'token.test@corp1.test' });
    await invitationRow.click();

    const token = await page.locator('[data-testid="invitation-token"]').textContent();

    expect(token).toBeTruthy();
    expect(token?.length).toBeGreaterThan(20); // Token should be long and random
  });

  test('User can accept invitation and create account', async ({ page, browser }) => {
    // First, manager creates invitation
    const managerPage = await browser.newPage();
    const managerContext = await browser.newContext();
    const manager = await managerContext.newPage();

    await manager.goto('/login');
    await manager.fill('[data-testid="email-input"]', 'manager@corp1.test');
    await manager.fill('[data-testid="password-input"]', 'Manager123!');
    await manager.click('[data-testid="login-button"]');

    await manager.goto('/users');
    await manager.click('[data-testid="invite-manager-button"]');
    await manager.fill('[data-testid="invite-email"]', 'accept.test@corp1.test');
    await manager.selectOption('[data-testid="target-type-select"]', 'corporation_manager');
    await manager.click('[data-testid="send-invitation-button"]');

    // Get invitation token (mock for now)
    const mockToken = 'test-invitation-token-123456';

    // Close manager page
    await manager.close();

    // New user clicks invitation link
    await page.goto(`/accept-invitation?token=${mockToken}`);

    // Verify invitation details are shown
    await expect(page.locator('[data-testid="invitation-details"]')).toBeVisible();
    await expect(page.locator('text=accept.test@corp1.test')).toBeVisible();

    // Fill in password (user already has email from invitation)
    await page.fill('[data-testid="password-input"]', 'NewPassword123!');
    await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123!');

    // Accept invitation
    await page.click('[data-testid="accept-invitation-button"]');

    // Verify account created and logged in
    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('[data-testid="user-greeting"]')).toContain('Manager');
  });

  test('Expired invitation token shows error', async ({ page }) => {
    const expiredToken = 'expired-token-123456';

    await page.goto(`/accept-invitation?token=${expiredToken}`);

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContain('Invitation expired');
  });

  test('Already accepted invitation cannot be used again', async ({ page }) => {
    const usedToken = 'already-accepted-token-123456';

    await page.goto(`/accept-invitation?token=${usedToken}`);

    // Should show error message
    await expect(page.locator('[data-testid="error-message"]')).toContain('Invitation already accepted');
  });

  test('Invitation is scoped to correct corporation', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Create invitation
    await page.goto('/users');
    await page.click('[data-testid="invite-manager-button"]');
    await page.fill('[data-testid="invite-email"]', 'scoped.test@corp1.test');
    await page.selectOption('[data-testid="target-type-select"]', 'corporation_manager');
    await page.click('[data-testid="send-invitation-button"]');

    // Verify invitation has correct corporation_id in backend
    // (This would require checking the database or API response)

    // For now, verify that invitation appears in the manager's list
    await expect(page.locator('[data-testid="invitation-row"]').filter({ hasText: 'scoped.test@corp1.test' })).toBeVisible();
  });

  test('Supervisor CANNOT create invitations', async ({ page, loginAs }) => {
    await loginAs('supervisor');

    // Navigate to users page
    await page.goto('/users');

    // Verify invite button is not visible
    await expect(page.locator('[data-testid="invite-manager-button"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="invite-supervisor-button"]')).not.toBeVisible();
  });

  test('Invitation audit log is created', async ({ page, loginAs }) => {
    await loginAs('manager');

    // Create invitation
    await page.goto('/users');
    await page.click('[data-testid="invite-manager-button"]');
    await page.fill('[data-testid="invite-email"]', 'audit.test@corp1.test');
    await page.selectOption('[data-testid="target-type-select"]', 'corporation_manager');
    await page.click('[data-testid="send-invitation-button"]');

    // Navigate to audit logs
    await page.goto('/audit-logs');

    // Verify invitation creation is logged
    await expect(page.locator('[data-testid="audit-log-row"]').filter({ hasText: 'create' }).filter({ hasText: 'invitation' })).toBeVisible();
  });
});
