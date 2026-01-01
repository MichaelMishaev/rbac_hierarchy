/**
 * E2E Tests: Activist Coordinator Neighborhood Assignment & Auto-Assignment
 *
 * Tests all scenarios for activist coordinator assignment to sites:
 * - First activist coordinator added → auto-assign ALL workers
 * - Additional supervisors → no auto-assignment
 * - Load balancing on auto-assignment
 * - Audit logging
 */

import { test, expect } from '@playwright/test';
import { setupActivistCoordinatorTestData, cleanupActivistCoordinatorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker } from '@/app/actions/activists';
import { assignSupervisorToSite } from '@/app/actions/activist-coordinator-neighborhoods';
import { prisma } from '@/lib/prisma';

test.describe('Supervisor Neighborhood Assignment - Auto-Assignment Triggers', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupActivistCoordinatorTestData();
  });

  test.afterAll(async () => {
    await cleanupActivistCoordinatorTestData(testData);
  });

  test('Scenario 1: Assign FIRST activist coordinator to neighborhood with orphan workers - AUTO-ASSIGN ALL', async () => {
    // Create 5 orphan workers in Neighborhood A (no activist coordinators)
    const workers = await Promise.all([
      createWorker({ fullName: 'Orphan 1', phone: '8881111111', position: 'Worker', neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id }),
      createWorker({ fullName: 'Orphan 2', phone: '8881111112', position: 'Worker', neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id }),
      createWorker({ fullName: 'Orphan 3', phone: '8881111113', position: 'Worker', neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id }),
      createWorker({ fullName: 'Orphan 4', phone: '8881111114', position: 'Worker', neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id }),
      createWorker({ fullName: 'Orphan 5', phone: '8881111115', position: 'Worker', neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id }),
    ]);

    expect(workers.every(w => w.success)).toBe(true);
    expect(workers.every(w => w.worker?.supervisorId === null)).toBe(true);

    // Assign first activist coordinator to Neighborhood A
    const result = await assignSupervisorToSite(testData.activistCoordinator1.id, testData.neighborhoodWithNoActivistCoordinators.id);

    expect(result.success).toBe(true);
    expect(result.workersAutoAssigned).toBe(5);
    expect(result.message).toContain('5 worker(s) automatically assigned');

    // Verify all workers now assigned to supervisor1
    const updatedWorkers = await prisma.activist.findMany({
      where: {
        id: { in: workers.map(w => w.worker!.id) },
      },
    });

    expect(updatedWorkers.every(w => w.supervisorId === testData.activistCoordinator1.id)).toBe(true);

    // Verify audit log created
    const auditLog = await prisma.auditLog.findFirst({
      where: {
        action: 'AUTO_ASSIGN_WORKERS',
        entityId: testData.neighborhoodWithNoActivistCoordinators.id,
      },
      orderBy: { createdAt: 'desc' },
    });

    expect(auditLog).toBeDefined();
    expect(auditLog?.after).toMatchObject({
      activistCoordinatorId: testData.activistCoordinator1.id,
      reason: 'First activist coordinator added to site',
    });

    // Cleanup
    await prisma.activist.deleteMany({
      where: { id: { in: workers.map(w => w.worker!.id) } },
    });

    await prisma.activistCoordinatorNeighborhood.delete({
      where: {
        supervisorId_neighborhoodId: {
          activistCoordinatorId: testData.activistCoordinator1.id,
          neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
        },
      },
    });
  });

  test('Scenario 2: Assign SECOND activist coordinator to neighborhood - NO auto-assignment', async () => {
    // Neighborhood B already has supervisor1
    // Verify current state
    const beforeCount = await prisma.activistCoordinatorNeighborhood.count({
      where: { neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id },
    });
    expect(beforeCount).toBe(1);

    // Try to assign supervisor2 (would be second supervisor)
    const result = await assignSupervisorToSite(testData.activistCoordinator2.id, testData.neighborhoodWithOneActivistCoordinator.id);

    expect(result.success).toBe(true);
    expect(result.workersAutoAssigned).toBe(0); // No auto-assignment
    expect(result.message).not.toContain('automatically assigned');

    // Cleanup
    await prisma.activistCoordinatorNeighborhood.delete({
      where: {
        supervisorId_neighborhoodId: {
          activistCoordinatorId: testData.activistCoordinator2.id,
          neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        },
      },
    });
  });

  test('Scenario 3: Assign activist coordinator already assigned to neighborhood - REJECT', async () => {
    // Neighborhood B already has supervisor1
    const result = await assignSupervisorToSite(testData.activistCoordinator1.id, testData.neighborhoodWithOneActivistCoordinator.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('already assigned');
  });

  test('Scenario 4: Assign activist coordinator from different city - REJECT', async () => {
    // Create another city with supervisor
    const otherCorp = await prisma.city.create({
      data: { name: 'Other Corp', code: 'OTHER', isActive: true },
    });

    const otherUser = await prisma.user.create({
      data: {
        email: 'other-supervisor@test.com',
        fullName: 'Other Supervisor',
        passwordHash: 'hash',
        role: 'ACTIVIST_COORDINATOR',
      },
    });

    const otherSupervisor = await prisma.activistCoordinator.create({
      data: {
        userId: otherUser.id,
        cityId: otherCorp.id,
        title: 'Other',
        isActive: true,
      },
    });

    // Try to assign to Neighborhood A (different corp)
    const result = await assignSupervisorToSite(otherSupervisor.id, testData.neighborhoodWithNoActivistCoordinators.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('same corporation');

    // Cleanup
    await prisma.activistCoordinator.delete({ where: { id: otherSupervisor.id } });
    await prisma.user.delete({ where: { id: otherUser.id } });
    await prisma.city.delete({ where: { id: otherCorp.id } });
  });

  test('Scenario 5: Auto-assign with empty neighborhood - NO workers assigned', async () => {
    // Neighborhood A has no workers currently
    const workerCount = await prisma.activist.count({
      where: {
        neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
        isActive: true,
      },
    });
    expect(workerCount).toBe(0);

    // Check if supervisor1 already assigned (from previous test cleanup)
    const existingAssignment = await prisma.activistCoordinatorNeighborhood.findUnique({
      where: {
        supervisorId_neighborhoodId: {
          activistCoordinatorId: testData.activistCoordinator1.id,
          neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
        },
      },
    });

    if (!existingAssignment) {
      const result = await assignSupervisorToSite(testData.activistCoordinator1.id, testData.neighborhoodWithNoActivistCoordinators.id);

      expect(result.success).toBe(true);
      expect(result.workersAutoAssigned).toBe(0);

      // Cleanup
      await prisma.activistCoordinatorNeighborhood.delete({
        where: {
          supervisorId_neighborhoodId: {
            activistCoordinatorId: testData.activistCoordinator1.id,
            neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
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
        fullName: `Bulk Activist ${i}`,
        phone: `777${i.toString().padStart(7, '0')}`,
        position: 'Bulk Test',
        neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
      });
      if (result.success && result.worker) {
        workers.push(result.worker);
      }
    }

    expect(workers.length).toBe(100);

    // Measure auto-assignment time
    const startTime = Date.now();

    // Check if supervisor1 already assigned
    const existingAssignment = await prisma.activistCoordinatorNeighborhood.findUnique({
      where: {
        supervisorId_neighborhoodId: {
          activistCoordinatorId: testData.activistCoordinator1.id,
          neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
        },
      },
    });

    if (!existingAssignment) {
      const result = await assignSupervisorToSite(testData.activistCoordinator1.id, testData.neighborhoodWithNoActivistCoordinators.id);

      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.workersAutoAssigned).toBe(100);
      expect(duration).toBeLessThan(5000); // Should complete in < 5 seconds

      console.log(`Auto-assigned 100 workers in ${duration}ms`);

      // Cleanup
      await prisma.activistCoordinatorNeighborhood.delete({
        where: {
          supervisorId_neighborhoodId: {
            activistCoordinatorId: testData.activistCoordinator1.id,
            neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
          },
        },
      });
    }

    // Cleanup workers
    await prisma.activist.deleteMany({
      where: { id: { in: workers.map(w => w.id) } },
    });
  });
});
