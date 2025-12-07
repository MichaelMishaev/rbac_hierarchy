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
import { prisma } from '@/lib/prisma';

test.describe('Deleted Tasks - Status Change Block', () => {
  test('TC-TASK-002: should block status changes on deleted tasks', async ({ request }) => {
    // This test verifies CRITICAL FIX #1: Status changes MUST be blocked on deleted tasks

    // 1. Login as Manager and create task
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: managerToken, userId: managerId } = await managerLogin.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: {
        type: 'Task',
        body: 'Task to be deleted - status change block test',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // 2. Sender deletes task (within 1 hour)
    const deleteResponse = await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    expect(deleteResponse.status()).toBe(200);

    // 3. Login as Supervisor (recipient)
    const supervisorLogin = await request.post('/api/auth/login', {
      data: {
        email: 'supervisor@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: supervisorToken, userId: supervisorId } = await supervisorLogin.json();

    // 4. Try to change status to 'read' - SHOULD FAIL
    const updateResponse = await request.patch(`/api/tasks/${task_id}/status`, {
      headers: { Authorization: `Bearer ${supervisorToken}` },
      data: { status: 'read' },
    });

    // 5. Verify 400 error
    expect(updateResponse.status()).toBe(400);
    const error = await updateResponse.json();
    expect(error.error).toContain('לא ניתן לשנות סטטוס של משימה שנמחקה');

    // 6. Verify status unchanged in database
    const assignment = await prisma.taskAssignment.findFirst({
      where: {
        taskId: BigInt(task_id),
        targetUserId: supervisorId,
      },
    });

    expect(assignment).toBeDefined();
    expect(assignment!.status).toBe('unread'); // Still unread
    expect(assignment!.readAt).toBeNull();
    expect(assignment!.deletedForRecipientAt).not.toBeNull(); // Marked as deleted
  });

  test('should also block acknowledge status on deleted tasks', async ({ request }) => {
    // Create and delete task
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: managerToken } = await managerLogin.json();

    const task = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: {
        type: 'Task',
        body: 'Task to test acknowledge block on deletion',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await task.json();

    await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    // Try to acknowledge
    const supervisorLogin = await request.post('/api/auth/login', {
      data: {
        email: 'supervisor@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: supervisorToken } = await supervisorLogin.json();

    const acknowledgeResponse = await request.patch(`/api/tasks/${task_id}/status`, {
      headers: { Authorization: `Bearer ${supervisorToken}` },
      data: { status: 'acknowledged' },
    });

    expect(acknowledgeResponse.status()).toBe(400);
  });

  test('should also block archive status on deleted tasks', async ({ request }) => {
    // Create and delete task
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: managerToken } = await managerLogin.json();

    const task = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: {
        type: 'Task',
        body: 'Task to test archive block on deletion',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await task.json();

    await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    // Try to archive
    const supervisorLogin = await request.post('/api/auth/login', {
      data: {
        email: 'supervisor@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: supervisorToken } = await supervisorLogin.json();

    const archiveResponse = await request.patch(`/api/tasks/${task_id}/status`, {
      headers: { Authorization: `Bearer ${supervisorToken}` },
      data: { status: 'archived' },
    });

    expect(archiveResponse.status()).toBe(400);
  });
});

test.describe('Deleted Tasks - Sender Deletion', () => {
  test('should allow sender to delete task within 1 hour', async ({ request }) => {
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await managerLogin.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task to be deleted within 1 hour',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id, recipients_count } = await createResponse.json();

    // Delete immediately (within 1 hour)
    const deleteResponse = await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(deleteResponse.status()).toBe(200);
    const deleteData = await deleteResponse.json();

    expect(deleteData.deleted).toBe(true);
    expect(deleteData.task_id).toBe(task_id);
    expect(deleteData.recipients_affected).toBe(recipients_count);

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
  });

  test('should reject deletion after 1 hour', async ({ request }) => {
    // Note: This test requires manipulating created_at, which may need a test helper

    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token, userId } = await managerLogin.json();

    // Create task
    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
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
    const deleteResponse = await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(deleteResponse.status()).toBe(400);
    const error = await deleteResponse.json();
    expect(error.error).toContain('תוך שעה');
  });

  test('should reject deletion if any recipient has acknowledged', async ({ request }) => {
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: managerToken } = await managerLogin.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: {
        type: 'Task',
        body: 'Task to be acknowledged then attempted deletion',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // Supervisor acknowledges task
    const supervisorLogin = await request.post('/api/auth/login', {
      data: {
        email: 'supervisor@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: supervisorToken, userId: supervisorId } = await supervisorLogin.json();

    // First mark as read, then acknowledge (proper flow)
    await request.patch(`/api/tasks/${task_id}/status`, {
      headers: { Authorization: `Bearer ${supervisorToken}` },
      data: { status: 'read' },
    });

    await request.patch(`/api/tasks/${task_id}/status`, {
      headers: { Authorization: `Bearer ${supervisorToken}` },
      data: { status: 'acknowledged' },
    });

    // Manager tries to delete - should fail
    const deleteResponse = await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    expect(deleteResponse.status()).toBe(400);
    const error = await deleteResponse.json();
    expect(error.error).toContain('אושרה');
  });

  test('should reject deletion by non-sender', async ({ request }) => {
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: managerToken } = await managerLogin.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: {
        type: 'Task',
        body: 'Task created by manager@corp1',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // Different manager tries to delete
    const otherManagerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp2.test',
        password: 'Test@1234',
      },
    });

    const { token: otherToken } = await otherManagerLogin.json();

    const deleteResponse = await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${otherToken}` },
    });

    expect(deleteResponse.status()).toBe(403);
    const error = await deleteResponse.json();
    expect(error.error).toContain('רק השולח');
  });
});

test.describe('Deleted Tasks - Inbox Display', () => {
  test('TC-TASK-003: deleted tasks should appear in inbox with is_deleted = true', async ({ request }) => {
    // Create and delete task
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: managerToken } = await managerLogin.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${managerToken}` },
      data: {
        type: 'Task',
        body: 'Task to verify deleted display in inbox',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    // Supervisor checks inbox
    const supervisorLogin = await request.post('/api/auth/login', {
      data: {
        email: 'supervisor@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token: supervisorToken } = await supervisorLogin.json();

    const inboxResponse = await request.get('/api/tasks/inbox', {
      headers: { Authorization: `Bearer ${supervisorToken}` },
    });

    const { tasks } = await inboxResponse.json();

    const deletedTask = tasks.find((t: any) => t.task_id === task_id);

    expect(deletedTask).toBeDefined();
    expect(deletedTask.is_deleted).toBe(true);
    expect(deletedTask.deleted_for_recipient_at).not.toBeNull();
    expect(deletedTask.body).toBe('המשימה נמחקה על ידי השולח'); // Placeholder text
  });

  test('deleted tasks should be filterable', async ({ request }) => {
    const supervisorLogin = await request.post('/api/auth/login', {
      data: {
        email: 'supervisor@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await supervisorLogin.json();

    // Get only deleted tasks
    const deletedResponse = await request.get('/api/tasks/inbox?status=deleted', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { tasks } = await deletedResponse.json();

    expect(tasks.every((t: any) => t.is_deleted === true)).toBe(true);
  });
});

test.describe('Deleted Tasks - Audit Trail', () => {
  test('should create audit log when task is deleted', async ({ request }) => {
    const managerLogin = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token, userId } = await managerLogin.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task for delete audit log test',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    await request.delete(`/api/tasks/${task_id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Verify audit log
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'task',
        entityId: task_id,
        action: 'DELETE',
        userId,
      },
    });

    expect(auditLog).toBeDefined();
    const after = auditLog!.after as any;
    expect(after.task_id).toBe(task_id);
    expect(after.deleted_at).toBeDefined();
    expect(after.recipients_affected).toBeGreaterThan(0);
  });
});
