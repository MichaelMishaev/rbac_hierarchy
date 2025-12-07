/**
 * E2E Tests: Task Creation
 * v2.2: Task Broadcast System
 *
 * Tests:
 * - Recipients count insert order (CRITICAL FIX #2)
 * - RBAC permissions (who can send)
 * - Execution date validation
 * - Body validation
 */

import { test, expect } from '@playwright/test';
import { prisma } from '@/lib/prisma';

test.describe('Task Creation - Recipients Count Insert Order', () => {
  test('TC-TASK-001: should compute recipients_count before inserting task', async ({ request }) => {
    // This test verifies CRITICAL FIX #2: Recipients count must be computed FIRST
    // to avoid constraint violation (recipients_count > 0)

    // 1. Login as Corporation Manager (has access to supervisors)
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const { token } = await loginResponse.json();

    // 2. Create task with "all under me"
    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Test task - verify recipients count is computed before insert',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    // 3. Verify success (201 Created)
    expect(createResponse.status()).toBe(201);
    const data = await createResponse.json();

    // 4. Verify recipients_count > 0 (proves constraint passed)
    expect(data.recipients_count).toBeGreaterThan(0);
    expect(data.task_id).toBeDefined();

    // 5. Verify task in database has correct count
    const task = await prisma.task.findUnique({
      where: { id: BigInt(data.task_id) },
      include: { assignments: true },
    });

    expect(task).toBeDefined();
    expect(task!.recipientsCount).toBe(task!.assignments.length);
    expect(task!.recipientsCount).toBe(data.recipients_count);
  });

  test('should create task with specific recipients', async ({ request }) => {
    // 1. Login as Corporation Manager
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await loginResponse.json();

    // 2. Get available recipients
    const recipientsResponse = await request.get('/api/tasks/available-recipients', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const { recipients } = await recipientsResponse.json();
    expect(recipients.length).toBeGreaterThan(0);

    // 3. Select first 2 recipients
    const selectedIds = recipients.slice(0, 2).map((r: any) => r.user_id);

    // 4. Create task with specific recipients
    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task for specific recipients',
        execution_date: '2025-12-16',
        send_to: 'selected',
        recipient_user_ids: selectedIds,
      },
    });

    expect(createResponse.status()).toBe(201);
    const data = await createResponse.json();

    // 5. Verify recipients count matches
    expect(data.recipients_count).toBe(2);

    // 6. Verify assignments in database
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: BigInt(data.task_id) },
    });

    expect(assignments.length).toBe(2);
    expect(assignments.every((a) => selectedIds.includes(a.targetUserId))).toBe(true);
  });
});

test.describe('Task Creation - RBAC Permissions', () => {
  test('TC-TASK-004: SuperAdmin can send tasks', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'superadmin@hierarchy.test',
        password: 'SuperAdmin@1234',
      },
    });

    const { token } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task from SuperAdmin',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(201);
  });

  test('TC-TASK-004: Area Manager can send tasks', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'area_manager@region1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task from Area Manager',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(201);
  });

  test('TC-TASK-004: Corporation Manager can send tasks', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task from Corporation Manager',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(201);
  });

  test('TC-TASK-004: Supervisor CANNOT send tasks', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'supervisor@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Attempt to send task as Supervisor',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    // Verify 403 Forbidden
    expect(createResponse.status()).toBe(403);
    const error = await createResponse.json();
    expect(error.error).toContain('מפקחים לא יכולים לשלוח משימות');
  });
});

test.describe('Task Creation - Validation', () => {
  test('should reject task with body too short', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Short', // Less than 10 chars
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(400);
    const error = await createResponse.json();
    expect(error.error).toContain('תיאור המשימה חייב להכיל');
  });

  test('should reject task with execution date in past', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task with past execution date',
        execution_date: '2020-01-01', // Past date
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(400);
    const error = await createResponse.json();
    expect(error.error).toContain('תאריך ביצוע לא יכול להיות בעבר');
  });

  test('should reject task with no recipients when send_to = selected', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task with no recipients selected',
        execution_date: '2025-12-15',
        send_to: 'selected',
        recipient_user_ids: [], // Empty array
      },
    });

    expect(createResponse.status()).toBe(400);
    const error = await createResponse.json();
    expect(error.error).toContain('לפחות נמען אחד');
  });
});

test.describe('Task Creation - Audit Logging', () => {
  test('should create audit log entry when task is created', async ({ request }) => {
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'manager@corp1.test',
        password: 'Test@1234',
      },
    });

    const { token, userId } = await loginResponse.json();

    const createResponse = await request.post('/api/tasks', {
      headers: { Authorization: `Bearer ${token}` },
      data: {
        type: 'Task',
        body: 'Task for audit log test',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // Verify audit log entry
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'task',
        entityId: task_id,
        action: 'CREATE',
        userId,
      },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog!.after).toBeDefined();
    const after = auditLog!.after as any;
    expect(after.task_id).toBe(task_id);
    expect(after.body_preview).toContain('Task for audit log test');
  });
});
