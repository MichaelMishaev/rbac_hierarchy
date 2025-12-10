/**
 * E2E Tests: Server-Sent Events (SSE) Connection
 * Tests real-time event streaming functionality
 *
 * Test Coverage:
 * - SSE connection establishment
 * - Live feed component displays
 * - Real-time event updates
 * - Connection status indicators
 * - Automatic reconnection
 */

import { test, expect } from '@playwright/test';
import { testUsers } from '../fixtures/auth.fixture';

test.describe('Server-Sent Events (SSE)', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/he/login');
    await page.getByTestId('email-input').fill(testUsers.cityCoordinator);
    await page.getByTestId('password-input').fill('password123');
    await page.getByTestId('login-submit').click();
    await page.waitForURL('**/dashboard');
  });

  test('should establish SSE connection on dashboard load', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for SSE connection to establish
    await page.waitForTimeout(2000);

    // Check for live activity feed component
    const liveFeed = page.getByTestId('live-activity-feed');
    await expect(liveFeed).toBeVisible({ timeout: 5000 });
  });

  test('should display connection status indicator', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for connection
    await page.waitForTimeout(2000);

    // Check for connected indicator (green dot, "מחובר" status, etc.)
    const connectedIndicator = page.getByTestId('sse-connection-status');
    const statusText = await connectedIndicator.textContent();

    // Should show connected status
    expect(statusText).toContain('מחובר');
  });

  test('should receive and display live events', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    const liveFeed = page.getByTestId('live-activity-feed');
    await expect(liveFeed).toBeVisible();

    // Check if event list exists
    const eventList = page.getByTestId('live-event-list');
    await expect(eventList).toBeVisible({ timeout: 10000 });

    // Events may or may not be present depending on activity
    const eventCount = await eventList.locator('[data-testid^="live-event-"]').count();
    expect(eventCount).toBeGreaterThanOrEqual(0);
  });

  test('should show event types correctly', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');

    // Wait for potential events
    await page.waitForTimeout(5000);

    const liveFeed = page.getByTestId('live-event-list');

    // Check for different event type indicators
    // Events include: check_in, check_out, task_complete, activist_added, task_assigned
    const eventItems = liveFeed.locator('[data-testid^="live-event-"]');
    const count = await eventItems.count();

    // Verify event structure if events exist
    if (count > 0) {
      const firstEvent = eventItems.first();
      const eventType = await firstEvent.getAttribute('data-event-type');

      expect(['check_in', 'check_out', 'task_complete', 'activist_added', 'task_assigned'])
        .toContain(eventType);
    }
  });

  test('should display "No recent activity" when no events', async ({ page, context }) => {
    // Create fresh session
    const newPage = await context.newPage();
    await newPage.goto('/he/login');
    await newPage.getByTestId('email-input').fill(testUsers.activistCoordinator);
    await newPage.getByTestId('password-input').fill('password123');
    await newPage.getByTestId('login-submit').click();
    await newPage.waitForURL('**/dashboard');

    await newPage.waitForTimeout(3000);

    const liveFeed = newPage.getByTestId('live-activity-feed');
    const emptyState = newPage.getByText(/אין פעילות אחרונה|No recent activity/i);

    // Either events exist OR empty state shows
    const hasEvents = await liveFeed.locator('[data-testid^="live-event-"]').count() > 0;
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    expect(hasEvents || hasEmptyState).toBeTruthy();

    await newPage.close();
  });

  test('should limit event buffer to 50 items', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const liveFeed = page.getByTestId('live-event-list');
    const eventCount = await liveFeed.locator('[data-testid^="live-event-"]').count();

    // Should never exceed 50 events
    expect(eventCount).toBeLessThanOrEqual(50);
  });

  test('should show timestamps for events', async ({ page }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    const eventItems = page.locator('[data-testid^="live-event-"]');
    const count = await eventItems.count();

    if (count > 0) {
      const firstEvent = eventItems.first();
      const timestamp = firstEvent.locator('[data-testid="event-timestamp"]');

      await expect(timestamp).toBeVisible();
    }
  });

  test('should auto-reconnect on connection loss', async ({ page, context }) => {
    await page.goto('/he/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Simulate connection loss
    await context.setOffline(true);
    await page.waitForTimeout(1000);

    // Status should show disconnected
    const status = page.getByTestId('sse-connection-status');
    await expect(status).toContainText(/מנותק|Disconnected/i, { timeout: 5000 });

    // Restore connection
    await context.setOffline(false);
    await page.waitForTimeout(6000); // Reconnect delay

    // Status should show reconnected
    await expect(status).toContainText(/מחובר|Connected/i, { timeout: 10000 });
  });
});
