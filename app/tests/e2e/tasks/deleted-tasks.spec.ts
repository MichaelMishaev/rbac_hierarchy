/**
 * E2E Tests: Deleted Task Handling
 * v2.2: Task Broadcast System
 *
 * Tests:
 * - Status change blocked on deleted tasks (CRITICAL FIX #1)
 * - Deleted tasks display greyed-out (CRITICAL FIX #3)
 * - Sender delete within 1-hour window
 * - Legal compliance (audit trail)
 */

import { test, expect } from '@playwright/test';
import { testUsers, getAuthenticatedContext } from '../fixtures/auth.fixture';
import { prisma } from '@/lib/prisma';

// FIX: Cleanup hook - delete test tasks after each test to prevent pollution
test.afterEach(async () => {
  // Delete all tasks created in tests
  await prisma.taskAssignment.deleteMany({
    where: {
      task: {
        body: {
          contains: 'Task to',
        },
      },
    },
  });
  await prisma.task.deleteMany({
    where: {
      body: {
        contains: 'Task to',
      },
    },
  });
});

test.describe('Deleted Tasks - Status Change Block', () => {
  test('TC-TASK-002: should block status changes on deleted tasks', async ({ page, baseURL }) => {
    // This test verifies CRITICAL FIX #1: Status changes MUST be blocked on deleted tasks

    // 1. Login as City Coordinator and create task
    const managerRequest = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await managerRequest.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task to be deleted - status change block test',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // 2. Sender deletes task (within 1 hour)
    const deleteResponse = await managerRequest.delete(`/api/tasks/${task_id}`);

    expect(deleteResponse.status()).toBe(200);

    // FIX: Add wait for database to sync after delete
    await page.waitForTimeout(500);

    // 3. Login as Activist Coordinator (recipient)
    const supervisorRequest = await getAuthenticatedContext(page, testUsers.activistCoordinator, baseURL || 'http://localhost:3000');

    // 4. Try to change status to 'read' - SHOULD FAIL
    const updateResponse = await supervisorRequest.patch(`/api/tasks/${task_id}/status`, {
      data: { status: 'read' },
    });

    // 5. Verify 400 error
    expect(updateResponse.status()).toBe(400);
    const error = await updateResponse.json();
    expect(error.error).toContain('לא ניתן לשנות סטטוס של משימה שנמחקה');

    // 6. Get activist coordinator user ID from database
    const supervisorUser = await prisma.user.findUnique({
      where: { email: testUsers.activistCoordinator.email },
    });

    // FIX: Verify activist coordinator user exists (seed data check)
    expect(supervisorUser).toBeDefined();

    // Verify status unchanged in database
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId: BigInt(task_id),
        targetUserId: supervisorUser!.id,
      },
    });

    expect(assignment).toBeDefined();
    expect(assignment!.status).toBe('unread'); // Still unread
    expect(assignment!.readAt).toBeNull();
    expect(assignment!.deletedForRecipientAt).not.toBeNull(); // Marked as deleted

    await managerRequest.dispose();
    await supervisorRequest.dispose();
  });

  test('should also block acknowledge status on deleted tasks', async ({ page, baseURL }) => {
    // Create and delete task
    const managerRequest = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const task = await managerRequest.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task to test acknowledge block on deletion',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await task.json();

    await managerRequest.delete(`/api/tasks/${task_id}`);

    // Try to acknowledge
    const supervisorRequest = await getAuthenticatedContext(page, testUsers.activistCoordinator, baseURL || 'http://localhost:3000');

    const acknowledgeResponse = await supervisorRequest.patch(`/api/tasks/${task_id}/status`, {
      data: { status: 'acknowledged' },
    });

    expect(acknowledgeResponse.status()).toBe(400);

    await managerRequest.dispose();
    await supervisorRequest.dispose();
  });

  test('should also block archive status on deleted tasks', async ({ page, baseURL }) => {
    // Create and delete task
    const managerRequest = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const task = await managerRequest.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task to test archive block on deletion',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await task.json();

    await managerRequest.delete(`/api/tasks/${task_id}`);

    // Try to archive
    const supervisorRequest = await getAuthenticatedContext(page, testUsers.activistCoordinator, baseURL || 'http://localhost:3000');

    const archiveResponse = await supervisorRequest.patch(`/api/tasks/${task_id}/status`, {
      data: { status: 'archived' },
    });

    expect(archiveResponse.status()).toBe(400);

    await managerRequest.dispose();
    await supervisorRequest.dispose();
  });
});

test.describe('Deleted Tasks - Sender Deletion', () => {
  test('should allow sender to delete task within 1 hour', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task to be deleted within 1 hour',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id, recipients_count } = await createResponse.json();

    // Delete immediately (within 1 hour)
    const deleteResponse = await request.delete(`/api/tasks/${task_id}`);

    expect(deleteResponse.status()).toBe(200);
    const deleteData = await deleteResponse.json();

    expect(deleteData.deleted).toBe(true);
    expect(deleteData.task_id).toBe(task_id);
    expect(deleteData.recipients_affected).toBe(recipients_count);

    // FIX: Add wait for database to sync after delete
    await page.waitForTimeout(500);

    // Verify task marked as deleted in database
    const task = await prisma.task.findUnique({
      where: { id: BigInt(task_id) },
    });

    expect(task!.deletedBySenderAt).not.toBeNull();

    // Verify all assignments marked with deleted_for_recipient_at
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: BigInt(task_id) },
    });

    expect(assignments.every((a) => a.deletedForRecipientAt !== null)).toBe(true);

    await request.dispose();
  });

  test('should reject deletion after 1 hour', async ({ page, baseURL }) => {
    // Note: This test manipulates created_at timestamp
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    // Create task
    const createResponse = await request.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task created over 1 hour ago',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // Manually set created_at to > 1 hour ago (test helper)
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    await prisma.task.update({
      where: { id: BigInt(task_id) },
      data: { createdAt: twoHoursAgo },
    });

    // Try to delete - should fail
    const deleteResponse = await request.delete(`/api/tasks/${task_id}`);

    expect(deleteResponse.status()).toBe(400);
    const error = await deleteResponse.json();
    expect(error.error).toContain('תוך שעה');

    await request.dispose();
  });

  test('should reject deletion if any recipient has acknowledged', async ({ page, baseURL }) => {
    const managerRequest = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await managerRequest.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task to be acknowledged then attempted deletion',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // Activist Coordinator acknowledges task
    const supervisorRequest = await getAuthenticatedContext(page, testUsers.activistCoordinator, baseURL || 'http://localhost:3000');

    // First mark as read, then acknowledge (proper flow)
    await supervisorRequest.patch(`/api/tasks/${task_id}/status`, {
      data: { status: 'read' },
    });

    await supervisorRequest.patch(`/api/tasks/${task_id}/status`, {
      data: { status: 'acknowledged' },
    });

    // City Coordinator tries to delete - should fail
    const deleteResponse = await managerRequest.delete(`/api/tasks/${task_id}`);

    expect(deleteResponse.status()).toBe(400);
    const error = await deleteResponse.json();
    expect(error.error).toContain('אושרה');

    await managerRequest.dispose();
    await supervisorRequest.dispose();
  });

  test('should reject deletion by non-sender', async ({ page, baseURL }) => {
    const managerRequest = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await managerRequest.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task created by manager@corp1',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // Get a different city coordinator (SuperAdmin in this case, who is not the sender)
    const otherRequest = await getAuthenticatedContext(page, testUsers.superAdmin, baseURL || 'http://localhost:3000');

    const deleteResponse = await otherRequest.delete(`/api/tasks/${task_id}`);

    expect(deleteResponse.status()).toBe(403);
    const error = await deleteResponse.json();
    expect(error.error).toContain('רק השולח');

    await managerRequest.dispose();
    await otherRequest.dispose();
  });
});

test.describe('Deleted Tasks - Inbox Display', () => {
  test('TC-TASK-003: deleted tasks should appear in inbox with is_deleted = true', async ({ page, baseURL }) => {
    // Create and delete task
    const managerRequest = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await managerRequest.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task to verify deleted display in inbox',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    await managerRequest.delete(`/api/tasks/${task_id}`);

    // FIX: Add wait for database to sync after delete
    await page.waitForTimeout(500);

    // Activist Coordinator checks inbox
    const supervisorRequest = await getAuthenticatedContext(page, testUsers.activistCoordinator, baseURL || 'http://localhost:3000');

    const inboxResponse = await supervisorRequest.get('/api/tasks/inbox');

    const { tasks } = await inboxResponse.json();

    const deletedTask = tasks.find((t: any) => t.task_id === task_id);

    expect(deletedTask).toBeDefined();
    expect(deletedTask.is_deleted).toBe(true);
    expect(deletedTask.deleted_for_recipient_at).not.toBeNull();
    expect(deletedTask.body).toBe('המשימה נמחקה על ידי השולח'); // Placeholder text

    await managerRequest.dispose();
    await supervisorRequest.dispose();
  });

  test('deleted tasks should be filterable', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.activistCoordinator, baseURL || 'http://localhost:3000');

    // Get only deleted tasks
    const deletedResponse = await request.get('/api/tasks/inbox?status=deleted');

    const { tasks } = await deletedResponse.json();

    expect(tasks.every((t: any) => t.is_deleted === true)).toBe(true);

    await request.dispose();
  });
});

test.describe('Deleted Tasks - Audit Trail', () => {
  test('should create audit log when task is deleted', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    // Get city coordinator user ID
    const managerUser = await prisma.user.findUnique({
      where: { email: testUsers.cityCoordinator.email },
    });

    const createResponse = await request.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task for delete audit log test',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    await request.delete(`/api/tasks/${task_id}`);

    // Verify audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'task',
        entityId: task_id,
        action: 'DELETE',
        userId: managerUser!.id,
      },
    });

    expect(auditLog).toBeDefined();
    const after = auditLog!.after as any;
    expect(after.task_id).toBe(task_id);
    expect(after.deleted_at).toBeDefined();
    expect(after.recipients_affected).toBeGreaterThan(0);

    await request.dispose();
  });
});
