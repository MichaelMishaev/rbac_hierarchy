/**
 * E2E Tests: Activist Coordinator Removal & Activist Reassignment
 *
 * Tests all scenarios for removing supervisors:
 * - Block removal if activist coordinator has active workers
 * - Delete activist coordinator → auto-reassign to least-loaded (load balancing)
 * - Delete last activist coordinator → workers back to neighborhood (supervisorId = null)
 * - Audit logging
 */

import { test, expect } from '@playwright/test';
import { setupActivistCoordinatorTestData, cleanupActivistCoordinatorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker } from '@/app/actions/activists';
import { removeSupervisorFromSite, deleteSupervisor, assignSupervisorToSite } from '@/app/actions/activist-coordinator-neighborhoods';
import { prisma } from '@/lib/prisma';

test.describe('Supervisor Removal - Activist Reassignment Logic', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupActivistCoordinatorTestData();
  });

  test.afterAll(async () => {
    await cleanupActivistCoordinatorTestData(testData);
  });

  test('Scenario 1: Try to remove activist coordinator with active workers - BLOCKED', async () => {
    // Create activist assigned to supervisor1 in Neighborhood B
    const workerResult = await createWorker({
      fullName: 'Worker for Removal Test 1',
      phone: '6661111111',
      position: 'Test Worker',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    expect(workerResult.success).toBe(true);
    const activist = workerResult.worker!;

    // Try to remove supervisor1 from Neighborhood B
    const result = await removeSupervisorFromSite(testData.activistCoordinator1.id, testData.neighborhoodWithOneActivistCoordinator.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot remove supervisor');
    expect(result.error).toContain('1 active worker');
    expect(result.workerCount).toBe(1);

    // Cleanup
    await prisma.activist.delete({ where: { id: worker.id } });
  });

  test('Scenario 2: Remove activist coordinator with NO workers - SUCCESS', async () => {
    // Neighborhood B currently has supervisor1 but no workers
    const workerCount = await prisma.activist.count({
      where: {
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        activistCoordinatorId: testData.activistCoordinator1.id,
        isActive: true,
      },
    });
    expect(workerCount).toBe(0);

    // Assign supervisor2 to Neighborhood B first (so it's not last supervisor)
    await assignSupervisorToSite(testData.activistCoordinator2.id, testData.neighborhoodWithOneActivistCoordinator.id);

    // Now remove supervisor1
    const result = await removeSupervisorFromSite(testData.activistCoordinator1.id, testData.neighborhoodWithOneActivistCoordinator.id);

    expect(result.success).toBe(true);
    expect(result.message).toContain('removed from site');

    // Restore original state
    await assignSupervisorToSite(testData.activistCoordinator1.id, testData.neighborhoodWithOneActivistCoordinator.id);
    await removeSupervisorFromSite(testData.activistCoordinator2.id, testData.neighborhoodWithOneActivistCoordinator.id);
  });

  test('Scenario 3: Delete ONLY activist coordinator in neighborhood → workers back to neighborhood (supervisorId = null)', async () => {
    // Create test neighborhood with 1 supervisor
    const testSite = await prisma.neighborhood.create({
      data: {
        name: 'Test Neighborhood - Single Supervisor',
        cityId: testData.corporation.id,
        address: 'Test',
        city: 'Test',
        isActive: true,
      },
    });

    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: testData.activistCoordinator1.id,
        neighborhoodId: testSite.id,
        cityId: testData.corporation.id,
        legacySupervisorUserId: testData.activistCoordinator1User.id,
      },
    });

    // Create 3 workers assigned to supervisor1
    const workers = await Promise.all([
      createWorker({ fullName: 'Worker 1', phone: '5551111111', position: 'W', neighborhoodId: testSite.id, activistCoordinatorId: testData.activistCoordinator1.id }),
      createWorker({ fullName: 'Worker 2', phone: '5551111112', position: 'W', neighborhoodId: testSite.id, activistCoordinatorId: testData.activistCoordinator1.id }),
      createWorker({ fullName: 'Worker 3', phone: '5551111113', position: 'W', neighborhoodId: testSite.id, activistCoordinatorId: testData.activistCoordinator1.id }),
    ]);

    expect(workers.every(w => w.success)).toBe(true);

    // Delete supervisor1 (will trigger reassignment)
    const result = await deleteSupervisor(testData.activistCoordinator1.id);

    expect(result.success).toBe(true);
    expect(result.reassignmentResults).toBeDefined();

    // Verify workers now have supervisorId = null (back to site)
    const updatedWorkers = await prisma.activist.findMany({
      where: { id: { in: workers.map(w => w.worker!.id) } },
    });

    expect(updatedWorkers.every(w => w.supervisorId === null)).toBe(true);

    // Reactivate supervisor1 for other tests
    await prisma.activistCoordinator.update({
      where: { id: testData.activistCoordinator1.id },
      data: { isActive: true },
    });

    // Restore activist coordinator assignment
    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: testData.activistCoordinator1.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        cityId: testData.corporation.id,
        legacySupervisorUserId: testData.activistCoordinator1User.id,
      },
    });

    // Cleanup
    await prisma.activist.deleteMany({ where: { id: { in: workers.map(w => w.worker!.id) } } });
    await prisma.activistCoordinatorNeighborhood.deleteMany({ where: { neighborhoodId: testSite.id } });
    await prisma.neighborhood.delete({ where: { id: testSite.id } });
  });

  test('Scenario 4: Delete NON-LAST activist coordinator → reassign to least-loaded (load balancing)', async () => {
    // Create test neighborhood with 2 supervisors
    const testSite = await prisma.neighborhood.create({
      data: {
        name: 'Test Neighborhood - Multiple Supervisors',
        cityId: testData.corporation.id,
        address: 'Test',
        city: 'Test',
        isActive: true,
      },
    });

    await prisma.activistCoordinatorNeighborhood.createMany({
      data: [
        { activistCoordinatorId: testData.activistCoordinator1.id, neighborhoodId: testSite.id, cityId: testData.corporation.id, legacySupervisorUserId: testData.activistCoordinator1User.id },
        { activistCoordinatorId: testData.activistCoordinator2.id, neighborhoodId: testSite.id, cityId: testData.corporation.id, legacySupervisorUserId: testData.activistCoordinator2User.id },
      ],
    });

    // Create workers: 10 for supervisor1, 2 for supervisor2
    const workers1 = [];
    for (let i = 0; i < 10; i++) {
      const result = await createWorker({
        fullName: `Worker S1-${i}`,
        phone: `444111${i.toString().padStart(4, '0')}`,
        position: 'W',
        neighborhoodId: testSite.id,
        activistCoordinatorId: testData.activistCoordinator1.id,
      });
      if (result.success) workers1.push(result.worker!);
    }

    const workers2 = [];
    for (let i = 0; i < 2; i++) {
      const result = await createWorker({
        fullName: `Worker S2-${i}`,
        phone: `444222${i.toString().padStart(4, '0')}`,
        position: 'W',
        neighborhoodId: testSite.id,
        activistCoordinatorId: testData.activistCoordinator2.id,
      });
      if (result.success) workers2.push(result.worker!);
    }

    expect(workers1.length).toBe(10);
    expect(workers2.length).toBe(2);

    // Delete supervisor1 (heavily loaded)
    const result = await deleteSupervisor(testData.activistCoordinator1.id);

    expect(result.success).toBe(true);

    // Verify: All 10 workers from supervisor1 reassigned to supervisor2 (least loaded)
    const reassignedWorkers = await prisma.activist.findMany({
      where: { id: { in: workers1.map(w => w.id) } },
    });

    expect(reassignedWorkers.every(w => w.supervisorId === testData.activistCoordinator2.id)).toBe(true);

    // Supervisor2 now has 12 workers total (2 original + 10 reassigned)
    const supervisor2WorkerCount = await prisma.activist.count({
      where: {
        neighborhoodId: testSite.id,
        activistCoordinatorId: testData.activistCoordinator2.id,
        isActive: true,
      },
    });

    expect(supervisor2WorkerCount).toBe(12);

    // Reactivate supervisor1
    await prisma.activistCoordinator.update({
      where: { id: testData.activistCoordinator1.id },
      data: { isActive: true },
    });

    // Restore supervisor1 assignment to original site
    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: testData.activistCoordinator1.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        cityId: testData.corporation.id,
        legacySupervisorUserId: testData.activistCoordinator1User.id,
      },
    });

    // Cleanup
    await prisma.activist.deleteMany({ where: { neighborhoodId: testSite.id } });
    await prisma.activistCoordinatorNeighborhood.deleteMany({ where: { neighborhoodId: testSite.id } });
    await prisma.neighborhood.delete({ where: { id: testSite.id } });
  });

  test('Scenario 5: Delete activist coordinator assigned to MULTIPLE sites → reassign in all sites', async () => {
    // Create 2 test sites
    const site1 = await prisma.neighborhood.create({
      data: { name: 'Multi-Site Test 1', cityId: testData.corporation.id, address: 'A', city: 'A', isActive: true },
    });

    const site2 = await prisma.neighborhood.create({
      data: { name: 'Multi-Site Test 2', cityId: testData.corporation.id, address: 'B', city: 'B', isActive: true },
    });

    // Assign supervisor1 to both sites
    await prisma.activistCoordinatorNeighborhood.createMany({
      data: [
        { activistCoordinatorId: testData.activistCoordinator1.id, neighborhoodId: site1.id, cityId: testData.corporation.id, legacySupervisorUserId: testData.activistCoordinator1User.id },
        { activistCoordinatorId: testData.activistCoordinator1.id, neighborhoodId: site2.id, cityId: testData.corporation.id, legacySupervisorUserId: testData.activistCoordinator1User.id },
      ],
    });

    // Create workers in both sites assigned to supervisor1
    const worker1 = await createWorker({
      fullName: 'Multi-Site Activist 1',
      phone: '3331111111',
      position: 'W',
      neighborhoodId: site1.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    const worker2 = await createWorker({
      fullName: 'Multi-Site Activist 2',
      phone: '3332222222',
      position: 'W',
      neighborhoodId: site2.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    expect(worker1.success && worker2.success).toBe(true);

    // Delete supervisor1
    const result = await deleteSupervisor(testData.activistCoordinator1.id);

    expect(result.success).toBe(true);
    expect(result.reassignmentResults).toHaveLength(2); // 2 sites processed

    // Verify both workers now have supervisorId = null (both sites had only 1 supervisor)
    const updatedWorkers = await prisma.activist.findMany({
      where: { id: { in: [worker1.worker!.id, worker2.worker!.id] } },
    });

    expect(updatedWorkers.every(w => w.supervisorId === null)).toBe(true);

    // Reactivate supervisor1
    await prisma.activistCoordinator.update({
      where: { id: testData.activistCoordinator1.id },
      data: { isActive: true },
    });

    // Restore supervisor1 assignment to original site
    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: testData.activistCoordinator1.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        cityId: testData.corporation.id,
        legacySupervisorUserId: testData.activistCoordinator1User.id,
      },
    });

    // Cleanup
    await prisma.activist.deleteMany({ where: { neighborhoodId: { in: [site1.id, site2.id] } } });
    await prisma.activistCoordinatorNeighborhood.deleteMany({ where: { neighborhoodId: { in: [site1.id, site2.id] } } });
    await prisma.neighborhood.deleteMany({ where: { id: { in: [site1.id, site2.id] } } });
  });
});
