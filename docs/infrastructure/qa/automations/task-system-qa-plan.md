# Task Broadcast System - QA Automation Plan v2.2

**System:** Task Broadcast System (One-Way Communication)
**Version:** 2.2 (Production-Ready with 4 Critical Fixes)
**Created:** 2025-12-07
**Test Framework:** Playwright E2E
**Language:** Hebrew-first, RTL

---

## 🎯 Testing Objectives

1. **Data Integrity** - Verify recipients_count constraint and insert order
2. **RBAC Enforcement** - Ensure role-based permissions are enforced
3. **Deleted Tasks** - Verify greyed-out display and status change blocking
4. **Legal Compliance** - Audit trail and deleted task visibility
5. **UX/UI** - Hebrew RTL interface, spam prevention modal

---

## 🔴 Critical Test Cases (MUST PASS)

### 1. Recipients Count Insert Order (CRITICAL FIX #2)
**Test ID:** TC-TASK-001
**Priority:** P0 (Blocker)
**Description:** Verify task creation computes recipients_count BEFORE insert

**Test Steps:**
```typescript
test('should compute recipients_count before inserting task', async ({ request }) => {
  // 1. Login as Corporation Manager
  const authToken = await loginAs('corporation_manager@test.com');

  // 2. Create task with "all under me"
  const response = await request.post('/api/tasks', {
    headers: { Authorization: `Bearer ${authToken}` },
    data: {
      type: 'Task',
      body: 'Test task with recipients count validation',
      execution_date: '2025-12-15',
      send_to: 'all',
    },
  });

  // 3. Verify success (201 Created)
  expect(response.status()).toBe(201);
  const data = await response.json();

  // 4. Verify recipients_count > 0
  expect(data.recipients_count).toBeGreaterThan(0);

  // 5. Verify task in database has correct count
  const task = await prisma.task.findUnique({
    where: { id: BigInt(data.task_id) },
    include: { assignments: true },
  });

  expect(task.recipientsCount).toBe(task.assignments.length);
});
```

**Expected Result:**
- ✅ Task created successfully
- ✅ recipients_count matches actual assignments
- ✅ No constraint violation error

**Failure Scenario:**
- ❌ Error: "recipients_count must be > 0"
- ❌ Insert fails due to wrong order

---

### 2. Status Change Blocked on Deleted Tasks (CRITICAL FIX #1)
**Test ID:** TC-TASK-002
**Priority:** P0 (Blocker)
**Description:** Verify status changes are blocked on deleted tasks

**Test Steps:**
```typescript
test('should block status changes on deleted tasks', async ({ request, page }) => {
  // 1. Login as Manager and create task
  const managerToken = await loginAs('manager@test.com');
  const task = await createTask(managerToken, {
    body: 'Task to be deleted',
    execution_date: '2025-12-15',
    send_to: 'all',
  });

  // 2. Sender deletes task (within 1 hour)
  const deleteResponse = await request.delete(`/api/tasks/${task.task_id}`, {
    headers: { Authorization: `Bearer ${managerToken}` },
  });
  expect(deleteResponse.status()).toBe(200);

  // 3. Login as Supervisor (recipient)
  const supervisorToken = await loginAs('supervisor@test.com');

  // 4. Try to change status to 'read'
  const updateResponse = await request.patch(`/api/tasks/${task.task_id}/status`, {
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
      taskId: BigInt(task.task_id),
      targetUserId: supervisorUserId,
    },
  });
  expect(assignment.status).toBe('unread'); // Still unread
  expect(assignment.readAt).toBeNull();
});
```

**Expected Result:**
- ✅ Status change returns 400 error
- ✅ Error message: "לא ניתן לשנות סטטוס של משימה שנמחקה"
- ✅ Status remains unchanged in database

---

### 3. Deleted Tasks Display as Greyed-Out (CRITICAL FIX #3)
**Test ID:** TC-TASK-003
**Priority:** P0 (Blocker)
**Description:** Verify deleted tasks remain visible with greyed-out UI

**Test Steps:**
```typescript
test('should display deleted tasks as greyed-out in inbox', async ({ page }) => {
  // 1. Manager creates and deletes task
  const managerToken = await loginAs('manager@test.com');
  const task = await createAndDeleteTask(managerToken, {
    body: 'Task to be deleted and shown greyed',
    execution_date: '2025-12-15',
  });

  // 2. Login as Supervisor (recipient)
  await page.goto('/login');
  await loginAsSupervisor(page);

  // 3. Navigate to inbox
  await page.goto('/tasks/inbox');

  // 4. Verify deleted task is visible
  const taskCard = page.locator(`[data-testid="task-${task.task_id}"]`);
  await expect(taskCard).toBeVisible();

  // 5. Verify greyed-out styling
  await expect(taskCard).toHaveCSS('opacity', '0.5');
  await expect(taskCard).toHaveCSS('background-color', 'rgb(245, 245, 245)');

  // 6. Verify placeholder text
  await expect(taskCard.locator('.task-body')).toContainText(
    'המשימה נמחקה על ידי השולח'
  );

  // 7. Verify "נמחק על ידי השולח" label
  await expect(taskCard.locator('.deleted-label')).toBeVisible();

  // 8. Verify action buttons are disabled/hidden
  await expect(taskCard.locator('button:has-text("סמן כנקרא")')).not.toBeVisible();
  await expect(taskCard.locator('button:has-text("אשר")')).not.toBeVisible();
});
```

**Expected Result:**
- ✅ Deleted task visible in inbox
- ✅ Greyed-out appearance (opacity 0.5)
- ✅ Placeholder text shown
- ✅ Action buttons disabled

---

### 4. RBAC Permissions - Who Can Send
**Test ID:** TC-TASK-004
**Priority:** P0 (Blocker)
**Description:** Verify only authorized roles can send tasks

**Test Matrix:**
| Sender Role          | Can Send? | Expected Status |
| -------------------- | --------- | --------------- |
| SuperAdmin           | ✅ Yes     | 201 Created     |
| Area Manager         | ✅ Yes     | 201 Created     |
| Corporation Manager  | ✅ Yes     | 201 Created     |
| Supervisor           | ❌ NO      | 403 Forbidden   |

**Test Steps:**
```typescript
test.describe('RBAC - Task Creation Permissions', () => {
  test('SuperAdmin can send tasks', async ({ request }) => {
    const token = await loginAs('superadmin@test.com');
    const response = await createTask(token, testTaskData);
    expect(response.status()).toBe(201);
  });

  test('Area Manager can send tasks', async ({ request }) => {
    const token = await loginAs('area_manager@test.com');
    const response = await createTask(token, testTaskData);
    expect(response.status()).toBe(201);
  });

  test('Corporation Manager can send tasks', async ({ request }) => {
    const token = await loginAs('corp_manager@test.com');
    const response = await createTask(token, testTaskData);
    expect(response.status()).toBe(201);
  });

  test('Supervisor CANNOT send tasks', async ({ request }) => {
    const token = await loginAs('supervisor@test.com');
    const response = await createTask(token, testTaskData);
    expect(response.status()).toBe(403);
    const error = await response.json();
    expect(error.error).toContain('מפקחים לא יכולים לשלוח משימות');
  });
});
```

---

### 5. Spam Prevention Confirmation Modal
**Test ID:** TC-TASK-005
**Priority:** P1 (High)
**Description:** Verify confirmation modal shows when recipients > 1

**Test Steps:**
```typescript
test('should show confirmation modal when sending to multiple recipients', async ({ page }) => {
  // 1. Login as Manager
  await page.goto('/login');
  await loginAsManager(page);

  // 2. Navigate to task creation form
  await page.goto('/tasks/new');

  // 3. Fill form
  await page.fill('[data-testid="task-body"]', 'Test task for 50 recipients');
  await page.fill('[data-testid="execution-date"]', '2025-12-15');
  await page.check('[data-testid="send-to-all"]');

  // 4. Click "Send Task"
  await page.click('[data-testid="send-task-button"]');

  // 5. Verify confirmation modal appears
  const modal = page.locator('[data-testid="confirmation-modal"]');
  await expect(modal).toBeVisible();

  // 6. Verify modal shows recipient count
  await expect(modal.locator('.recipient-count')).toContainText('50 נמענים');

  // 7. Verify breakdown by role
  await expect(modal.locator('.breakdown-role')).toContainText('מפקחים');

  // 8. Verify breakdown by corporation
  await expect(modal.locator('.breakdown-corporation')).toContainText('תאגיד');

  // 9. Cancel
  await page.click('[data-testid="modal-cancel"]');
  await expect(modal).not.toBeVisible();

  // 10. Send again and confirm
  await page.click('[data-testid="send-task-button"]');
  await page.click('[data-testid="modal-confirm"]');

  // 11. Verify success message
  await expect(page.locator('.success-message')).toBeVisible();
});
```

---

### 6. Auto-Archive Dual Retention (CRITICAL FIX #4)
**Test ID:** TC-TASK-006
**Priority:** P1 (High)
**Description:** Verify auto-archive with different retention periods

**Test Steps:**
```typescript
test('should auto-archive with dual retention (90 days normal, 365 days deleted)', async () => {
  // 1. Create normal task (91 days old)
  const normalTask = await createTaskWithDate({
    body: 'Normal task 91 days old',
    created_at: new Date(Date.now() - 91 * 24 * 60 * 60 * 1000),
  });

  // 2. Create deleted task (366 days old)
  const deletedTask = await createAndDeleteTaskWithDate({
    body: 'Deleted task 366 days old',
    created_at: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000),
    deleted_at: new Date(Date.now() - 366 * 24 * 60 * 60 * 1000),
  });

  // 3. Run auto-archive function
  await prisma.$executeRaw`SELECT auto_archive_old_tasks()`;

  // 4. Verify normal task is archived
  const normalAssignment = await prisma.taskAssignment.findFirst({
    where: { taskId: normalTask.id },
  });
  expect(normalAssignment.status).toBe('archived');
  expect(normalAssignment.archivedAt).not.toBeNull();

  // 5. Verify deleted task is archived
  const deletedAssignment = await prisma.taskAssignment.findFirst({
    where: { taskId: deletedTask.id },
  });
  expect(deletedAssignment.status).toBe('archived');
  expect(deletedAssignment.archivedAt).not.toBeNull();

  // 6. Create deleted task (364 days old - should NOT archive)
  const recentDeletedTask = await createAndDeleteTaskWithDate({
    deleted_at: new Date(Date.now() - 364 * 24 * 60 * 60 * 1000),
  });

  // 7. Run auto-archive again
  await prisma.$executeRaw`SELECT auto_archive_old_tasks()`;

  // 8. Verify recent deleted task is NOT archived
  const recentAssignment = await prisma.taskAssignment.findFirst({
    where: { taskId: recentDeletedTask.id },
  });
  expect(recentAssignment.archivedAt).toBeNull();
});
```

---

## 📊 Test Coverage Matrix

| Feature                           | Unit | Integration | E2E | Status |
| --------------------------------- | ---- | ----------- | --- | ------ |
| Task creation (recipients_count)  | ✅    | ✅           | ✅   | ⏳ TODO |
| Recipient resolution (RBAC)       | ✅    | ✅           | ✅   | ⏳ TODO |
| Status update (deleted block)     | ✅    | ✅           | ✅   | ⏳ TODO |
| Task deletion (sender)            | ✅    | ✅           | ✅   | ⏳ TODO |
| Deleted task display (greyed)     | ❌    | ❌           | ✅   | ⏳ TODO |
| Spam prevention modal             | ❌    | ❌           | ✅   | ⏳ TODO |
| Auto-archive (dual retention)     | ✅    | ✅           | ❌   | ⏳ TODO |
| Audit logging                     | ✅    | ✅           | ❌   | ⏳ TODO |
| Hebrew RTL UI                     | ❌    | ❌           | ✅   | ⏳ TODO |
| Push notifications (PWA)          | ❌    | ✅           | ✅   | ⏳ TODO |

---

## 🔧 Test Data Setup

### Test Users (Fixtures)
```typescript
const testUsers = {
  superAdmin: {
    email: 'superadmin@task-test.com',
    password: 'Test@1234',
    role: 'SUPERADMIN',
  },
  areaManager: {
    email: 'area_manager@task-test.com',
    password: 'Test@1234',
    role: 'AREA_MANAGER',
    regionCode: 'IL-CENTER',
  },
  corporationManager: {
    email: 'corp_manager@task-test.com',
    password: 'Test@1234',
    role: 'MANAGER',
    corporationId: 'corp-test-1',
  },
  supervisor: {
    email: 'supervisor@task-test.com',
    password: 'Test@1234',
    role: 'SUPERVISOR',
    corporationId: 'corp-test-1',
    siteIds: ['site-test-1', 'site-test-2'],
  },
};
```

### Test Corporations
```typescript
const testCorporations = [
  {
    id: 'corp-test-1',
    name: 'תאגיד בדיקה א',
    code: 'TEST-A',
    areaManagerId: testUsers.areaManager.id,
  },
  {
    id: 'corp-test-2',
    name: 'תאגיד בדיקה ב',
    code: 'TEST-B',
    areaManagerId: testUsers.areaManager.id,
  },
];
```

---

## 🚀 Running Tests

### Local Environment
```bash
# Start Docker environment
make up

# Seed test data
cd app && npm run db:seed

# Run all E2E tests
npm run test:e2e

# Run specific test suite
npm run test:e2e -- task-creation

# Run in UI mode (debugging)
npm run test:e2e:ui

# Run in headed mode
npm run test:e2e:headed
```

### CI/CD Pipeline
```yaml
# .github/workflows/task-system-qa.yml
name: Task System QA

on:
  pull_request:
    paths:
      - 'app/api/tasks/**'
      - 'app/components/tasks/**'
      - 'tests/e2e/tasks/**'

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run test:e2e -- tasks/
```

---

## ✅ Acceptance Criteria

All tests MUST pass before production deployment:

1. ✅ Recipients count insert order (TC-TASK-001)
2. ✅ Status change blocked on deleted tasks (TC-TASK-002)
3. ✅ Deleted tasks display greyed-out (TC-TASK-003)
4. ✅ RBAC permissions enforced (TC-TASK-004)
5. ✅ Spam prevention modal shown (TC-TASK-005)
6. ✅ Auto-archive dual retention (TC-TASK-006)
7. ✅ Hebrew RTL interface verified
8. ✅ Audit logs complete
9. ✅ No data leakage between corporations
10. ✅ Push notifications sent (PWA)

---

## 🐛 Bug Tracking

All bugs found during QA MUST be documented in:
`/docs/infrastructure/bugs.md`

Include:
- Problem description
- Root cause
- Solution implemented
- Commit hash

---

**Last Updated:** 2025-12-07
**Status:** Ready for Implementation
**Next Step:** Create Playwright E2E test files
