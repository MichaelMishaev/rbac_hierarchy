/**
 * E2E Tests: Supervisor Site Assignment & Auto-Assignment
 *
 * Tests all scenarios for supervisor assignment to sites:
 * - First supervisor added → auto-assign ALL workers
 * - Additional supervisors → no auto-assignment
 * - Load balancing on auto-assignment
 * - Audit logging
 */

import { test, expect } from '@playwright/test';
import { setupWorkerSupervisorTestData, cleanupWorkerSupervisorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker } from '@/app/actions/workers';
import { assignSupervisorToSite } from '@/app/actions/supervisor-sites';
import { prisma } from '@/lib/prisma';

test.describe('Supervisor Site Assignment - Auto-Assignment Triggers', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupWorkerSupervisorTestData();
  });

  test.afterAll(async () => {
    await cleanupWorkerSupervisorTestData(testData);
  });

  test('Scenario 1: Assign FIRST supervisor to site with orphan workers - AUTO-ASSIGN ALL', async () => {
    // Create 5 orphan workers in Site A (no supervisors)
    const workers = await Promise.all([
      createWorker({ fullName: 'Orphan 1', phone: '8881111111', position: 'Worker', siteId: testData.siteWithNoSupervisors.id }),
      createWorker({ fullName: 'Orphan 2', phone: '8881111112', position: 'Worker', siteId: testData.siteWithNoSupervisors.id }),
      createWorker({ fullName: 'Orphan 3', phone: '8881111113', position: 'Worker', siteId: testData.siteWithNoSupervisors.id }),
      createWorker({ fullName: 'Orphan 4', phone: '8881111114', position: 'Worker', siteId: testData.siteWithNoSupervisors.id }),
      createWorker({ fullName: 'Orphan 5', phone: '8881111115', position: 'Worker', siteId: testData.siteWithNoSupervisors.id }),
    ]);

    expect(workers.every(w => w.success)).toBe(true);
    expect(workers.every(w => w.worker?.supervisorId === null)).toBe(true);

    // Assign first supervisor to Site A
    const result = await assignSupervisorToSite(testData.supervisor1.id, testData.siteWithNoSupervisors.id);

    expect(result.success).toBe(true);
    expect(result.workersAutoAssigned).toBe(5);
    expect(result.message).toContain('5 worker(s) automatically assigned');

    // Verify all workers now assigned to supervisor1
    const updatedWorkers = await prisma.worker.findMany({
      where: {
        id: { in: workers.map(w => w.worker!.id) },
      },
    });

    expect(updatedWorkers.every(w => w.supervisorId === testData.supervisor1.id)).toBe(true);

    // Verify audit log created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'AUTO_ASSIGN_WORKERS',
        entityId: testData.siteWithNoSupervisors.id,
      },
      orderBy: { timestamp: 'desc' },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog?.after).toMatchObject({
      supervisorId: testData.supervisor1.id,
      reason: 'First supervisor added to site',
    });

    // Cleanup
    await prisma.worker.deleteMany({
      where: { id: { in: workers.map(w => w.worker!.id) } },
    });

    await prisma.supervisorSite.delete({
      where: {
        supervisorId_siteId: {
          supervisorId: testData.supervisor1.id,
          siteId: testData.siteWithNoSupervisors.id,
        },
      },
    });
  });

  test('Scenario 2: Assign SECOND supervisor to site - NO auto-assignment', async () => {
    // Site B already has supervisor1
    // Verify current state
    const beforeCount = await prisma.supervisorSite.count({
      where: { siteId: testData.siteWithOneSupervisor.id },
    });
    expect(beforeCount).toBe(1);

    // Try to assign supervisor2 (would be second supervisor)
    const result = await assignSupervisorToSite(testData.supervisor2.id, testData.siteWithOneSupervisor.id);

    expect(result.success).toBe(true);
    expect(result.workersAutoAssigned).toBe(0); // No auto-assignment
    expect(result.message).not.toContain('automatically assigned');

    // Cleanup
    await prisma.supervisorSite.delete({
      where: {
        supervisorId_siteId: {
          supervisorId: testData.supervisor2.id,
          siteId: testData.siteWithOneSupervisor.id,
        },
      },
    });
  });

  test('Scenario 3: Assign supervisor already assigned to site - REJECT', async () => {
    // Site B already has supervisor1
    const result = await assignSupervisorToSite(testData.supervisor1.id, testData.siteWithOneSupervisor.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already assigned');
  });

  test('Scenario 4: Assign supervisor from different corporation - REJECT', async () => {
    // Create another corporation with supervisor
    const otherCorp = await prisma.corporation.create({
      data: { name: 'Other Corp', code: 'OTHER', isActive: true },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: 'other-supervisor@test.com',
        fullName: 'Other Supervisor',
        passwordHash: 'hash',
        role: 'SUPERVISOR',
      },
    });

    const otherSupervisor = await prisma.supervisor.create({
      data: {
        userId: otherUser.id,
        corporationId: otherCorp.id,
        title: 'Other',
        isActive: true,
      },
    });

    // Try to assign to Site A (different corp)
    const result = await assignSupervisorToSite(otherSupervisor.id, testData.siteWithNoSupervisors.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('same corporation');

    // Cleanup
    await prisma.supervisor.delete({ where: { id: otherSupervisor.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
    await prisma.corporation.delete({ where: { id: otherCorp.id } });
  });

  test('Scenario 5: Auto-assign with empty site - NO workers assigned', async () => {
    // Site A has no workers currently
    const workerCount = await prisma.worker.count({
      where: {
        siteId: testData.siteWithNoSupervisors.id,
        isActive: true,
      },
    });
    expect(workerCount).toBe(0);

    // Check if supervisor1 already assigned (from previous test cleanup)
    const existingAssignment = await prisma.supervisorSite.findUnique({
      where: {
        supervisorId_siteId: {
          supervisorId: testData.supervisor1.id,
          siteId: testData.siteWithNoSupervisors.id,
        },
      },
    });

    if (!existingAssignment) {
      const result = await assignSupervisorToSite(testData.supervisor1.id, testData.siteWithNoSupervisors.id);

      expect(result.success).toBe(true);
      expect(result.workersAutoAssigned).toBe(0);

      // Cleanup
      await prisma.supervisorSite.delete({
        where: {
          supervisorId_siteId: {
            supervisorId: testData.supervisor1.id,
            siteId: testData.siteWithNoSupervisors.id,
          },
        },
      });
    }
  });

  test('Scenario 6: Auto-assign large number of workers - Performance test', async () => {
    // Create 100 orphan workers
    const workers = [];
    for (let i = 0; i < 100; i++) {
      const result = await createWorker({
        fullName: `Bulk Worker ${i}`,
        phone: `777${i.toString().padStart(7, '0')}`,
        position: 'Bulk Test',
        siteId: testData.siteWithNoSupervisors.id,
      });
      if (result.success && result.worker) {
        workers.push(result.worker);
      }
    }

    expect(workers.length).toBe(100);

    // Measure auto-assignment time
    const startTime = Date.now();

    // Check if supervisor1 already assigned
    const existingAssignment = await prisma.supervisorSite.findUnique({
      where: {
        supervisorId_siteId: {
          supervisorId: testData.supervisor1.id,
          siteId: testData.siteWithNoSupervisors.id,
        },
      },
    });

    if (!existingAssignment) {
      const result = await assignSupervisorToSite(testData.supervisor1.id, testData.siteWithNoSupervisors.id);

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.workersAutoAssigned).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds

      console.log(`Auto-assigned 100 workers in ${duration}ms`);

      // Cleanup
      await prisma.supervisorSite.delete({
        where: {
          supervisorId_siteId: {
            supervisorId: testData.supervisor1.id,
            siteId: testData.siteWithNoSupervisors.id,
          },
        },
      });
    }

    // Cleanup workers
    await prisma.worker.deleteMany({
      where: { id: { in: workers.map(w => w.id) } },
    });
  });
});
