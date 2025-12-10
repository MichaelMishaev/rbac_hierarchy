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
import { testUsers, loginAs, getAuthenticatedContext } from '../fixtures/auth.fixture';
import { prisma } from '@/lib/prisma';

// FIX: Cleanup hook - delete test tasks after each test to prevent pollution
test.afterEach(async () => {
  // Delete all tasks created in tests
  await prisma.taskAssignment.deleteMany({
    where: {
      task: {
        body: {
          contains: 'Test task',
        },
      },
    },
  });
  await prisma.task.deleteMany({
    where: {
      OR: [
        { body: { contains: 'Test task' } },
        { body: { contains: 'Task from' } },
        { body: { contains: 'Task for' } },
        { body: { contains: 'Attempt to' } },
        { body: { contains: 'Short' } },
      ],
    },
  });
});

test.describe('Task Creation - Recipients Count Insert Order', () => {
  test('TC-TASK-001: should compute recipients_count before inserting task', async ({ page, baseURL }) => {
    // This test verifies CRITICAL FIX #2: Recipients count must be computed FIRST
    // to avoid constraint violation (recipients_count > 0)

    // 1. Login as City City Coordinator (has access to supervisors)
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    // 2. Create task with "all under me"
    const createResponse = await request.post('/api/tasks', {
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

    // FIX: Add wait for database to sync
    await page.waitForTimeout(500);

    // 5. Verify task in database has correct count
    const task = await prisma.task.findUnique({
      where: { id: BigInt(data.task_id) },
      include: { assignments: true },
    });

    expect(task).toBeDefined();
    expect(task!.recipientsCount).toBe(task!.assignments.length);
    expect(task!.recipientsCount).toBe(data.recipients_count);

    await request.dispose();
  });

  test('should create task with specific recipients', async ({ page, baseURL }) => {
    // 1. Login as City Manager
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    // 2. Get available recipients
    const recipientsResponse = await request.get('/api/tasks/available-recipients');

    const { recipients } = await recipientsResponse.json();
    expect(recipients.length).toBeGreaterThan(0);

    // 3. Select available recipients (Corp 1 has only 1 supervisor)
    const selectedIds = recipients.slice(0, recipients.length).map((r: any) => r.user_id);
    const expectedCount = selectedIds.length;

    // 4. Create task with specific recipients
    const createResponse = await request.post('/api/tasks', {
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
    expect(data.recipients_count).toBe(expectedCount);

    // FIX: Add wait for database to sync
    await page.waitForTimeout(500);

    // 6. Verify assignments in database
    const assignments = await prisma.taskAssignment.findMany({
      where: { taskId: BigInt(data.task_id) },
    });

    expect(assignments.length).toBe(expectedCount);
    expect(assignments.every((a) => selectedIds.includes(a.targetUserId))).toBe(true);

    await request.dispose();
  });
});

test.describe('Task Creation - RBAC Permissions', () => {
  test('TC-TASK-004: SuperAdmin can send tasks', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.superAdmin, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task from SuperAdmin',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(201);
    await request.dispose();
  });

  test('TC-TASK-004: Area City Coordinator can send tasks', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.areaManager, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task from Area Manager',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(201);
    await request.dispose();
  });

  test('TC-TASK-004: City City Coordinator can send tasks', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task from City Manager',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    expect(createResponse.status()).toBe(201);
    await request.dispose();
  });

  test('TC-TASK-004: Activist Coordinator CANNOT send tasks', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.activistCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
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

    await request.dispose();
  });
});

test.describe('Task Creation - Validation', () => {
  test('should reject task with body too short', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
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

    await request.dispose();
  });

  test('should reject task with execution date in past', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
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

    await request.dispose();
  });

  test('should reject task with no recipients when send_to = selected', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    const createResponse = await request.post('/api/tasks', {
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

    await request.dispose();
  });
});

test.describe('Task Creation - Audit Logging', () => {
  test('should create audit log entry when task is created', async ({ page, baseURL }) => {
    const request = await getAuthenticatedContext(page, testUsers.cityCoordinator, baseURL || 'http://localhost:3000');

    // FIX: Get user ID from database instead of DOM
    const managerUser = await prisma.user.findUnique({
      where: { email: testUsers.cityCoordinator.email },
    });

    expect(managerUser).toBeDefined();

    const createResponse = await request.post('/api/tasks', {
      data: {
        type: 'Task',
        body: 'Task for audit log test - this is a longer description to pass validation',
        execution_date: '2025-12-15',
        send_to: 'all',
      },
    });

    const { task_id } = await createResponse.json();

    // FIX: Add wait for database to sync after async write
    await page.waitForTimeout(500);

    // Verify audit log entry
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        entity: 'task',
        entityId: task_id,
        action: 'CREATE',
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog!.after).toBeDefined();
    const after = auditLog!.after as any;
    expect(after.task_id).toBe(task_id);
    expect(after.body_preview).toContain('Task for audit log test');

    await request.dispose();
  });
});
