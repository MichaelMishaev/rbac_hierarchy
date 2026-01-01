/**
 * E2E Tests: Data Integrity Checks
 *
 * Tests the integrity checking and auto-fix script:
 * - Find orphan workers (site has supervisors, activist doesn't)
 * - Find dangling references (supervisor not in site)
 * - Find inactive activist coordinator assignments
 * - Auto-fix functionality
 */

import { test, expect } from '@playwright/test';
import { setupActivistCoordinatorTestData, cleanupActivistCoordinatorTestData, type TestScenarioData } from './fixtures/test-data';
import { findOrphanWorkers } from '@/lib/activist-coordinator-assignment';
import { prisma } from '@/lib/prisma';
import { createWorker } from '@/app/actions/activists';

test.describe('Data Integrity - Orphan Detection & Validation', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupActivistCoordinatorTestData();
  });

  test.afterAll(async () => {
    await cleanupActivistCoordinatorTestData(testData);
  });

  test('Scenario 1: Detect orphan workers - Neighborhood has supervisors, activist does not', async () => {
    // Create orphan activist (manually bypass validation)
    const orphan = await prisma.activist.create({
      data: {
        fullName: 'Orphan Activist Test',
        phone: '2221111111',
        position: 'Orphan',
        cityId: testData.corporation.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id, // Neighborhood has supervisor1
        activistCoordinatorId: null, // INVALID: Should have supervisor
        isActive: true,
      },
    });

    // Run orphan detection
    const orphans = await findOrphanWorkers(testData.neighborhoodWithOneActivistCoordinator.id);

    expect(orphans.length).toBeGreaterThanOrEqual(1);

    const foundOrphan = orphans.find(w => w.id === orphan.id);
    expect(foundOrphan).toBeDefined();
    expect(foundOrphan?.site.supervisorAssignments.length).toBeGreaterThan(0);

    // Cleanup
    await prisma.activist.delete({ where: { id: orphan.id } });
  });

  test('Scenario 2: No orphans in neighborhood without supervisors - Valid state', async () => {
    // Create workers in neighborhood with no activist coordinators
    const activist = await prisma.activist.create({
      data: {
        fullName: 'Valid Worker',
        phone: '2222222222',
        position: 'Valid',
        cityId: testData.corporation.id,
        neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id, // No supervisors
        activistCoordinatorId: null, // VALID: Neighborhood has no activist coordinators
        isActive: true,
      },
    });

    // Run orphan detection - should NOT find this worker
    const orphans = await findOrphanWorkers(testData.neighborhoodWithNoActivistCoordinators.id);

    const foundWorker = orphans.find(w => w.id === worker.id);
    expect(foundWorker).toBeUndefined();

    // Cleanup
    await prisma.activist.delete({ where: { id: worker.id } });
  });

  test('Scenario 3: Detect dangling reference - Activist Coordinator not assigned to site', async () => {
    // Create activist assigned to supervisor2, but supervisor2 not in Neighborhood B
    const dangling = await prisma.activist.create({
      data: {
        fullName: 'Dangling Reference Worker',
        phone: '2223333333',
        position: 'Dangling',
        cityId: testData.corporation.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id, // Neighborhood B has only supervisor1
        activistCoordinatorId: testData.activistCoordinator2.id, // INVALID: supervisor2 not in Neighborhood B
        isActive: true,
      },
    });

    // Verify dangling reference exists
    const activist = await prisma.activist.findUnique({
      where: { id: dangling.id },
      include: {
        site: {
          include: {
            supervisorAssignments: true,
          },
        },
      },
    });

    const supervisorIds = worker!.site.supervisorAssignments.map(sa => sa.supervisorId);
    expect(supervisorIds).not.toContain(testData.activistCoordinator2.id);
    expect(worker!.supervisorId).toBe(testData.activistCoordinator2.id);

    // Cleanup
    await prisma.activist.delete({ where: { id: dangling.id } });
  });

  test('Scenario 4: Detect inactive activist coordinator assignment', async () => {
    // Create activist assigned to active supervisor
    const activist = await createWorker({
      fullName: 'Inactive Activist Coordinator Test',
      phone: '2224444444',
      position: 'Test',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    expect(worker.success).toBe(true);

    // Deactivate supervisor1
    await prisma.activistCoordinator.update({
      where: { id: testData.activistCoordinator1.id },
      data: { isActive: false },
    });

    // Find workers with inactive supervisors
    const workersWithInactiveSupervisors = await prisma.activist.findMany({
      where: {
        isActive: true,
        supervisor: {
          isActive: false,
        },
      },
      include: {
        supervisor: {
          include: {
            user: true,
          },
        },
      },
    });

    const foundWorker = workersWithInactiveSupervisors.find(w => w.id === worker.worker!.id);
    expect(foundWorker).toBeDefined();
    expect(foundWorker?.supervisor?.isActive).toBe(false);

    // Reactivate supervisor1
    await prisma.activistCoordinator.update({
      where: { id: testData.activistCoordinator1.id },
      data: { isActive: true },
    });

    // Cleanup
    await prisma.activist.delete({ where: { id: worker.worker!.id } });
  });

  test('Scenario 5: Global orphan detection across all sites', async () => {
    // Create orphans in multiple sites
    const orphan1 = await prisma.activist.create({
      data: {
        fullName: 'Global Orphan 1',
        phone: '2225555555',
        position: 'Orphan',
        cityId: testData.corporation.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        activistCoordinatorId: null,
        isActive: true,
      },
    });

    const orphan2 = await prisma.activist.create({
      data: {
        fullName: 'Global Orphan 2',
        phone: '2226666666',
        position: 'Orphan',
        cityId: testData.corporation.id,
        neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
        activistCoordinatorId: null,
        isActive: true,
      },
    });

    // Run global orphan detection (no siteId filter)
    const allOrphans = await findOrphanWorkers();

    expect(allOrphans.length).toBeGreaterThanOrEqual(2);

    const foundOrphans = allOrphans.filter(w =>
      [orphan1.id, orphan2.id].includes(w.id)
    );

    expect(foundOrphans.length).toBe(2);

    // Cleanup
    await prisma.activist.deleteMany({
      where: { id: { in: [orphan1.id, orphan2.id] } },
    });
  });

  test('Scenario 6: Inactive workers keep activist coordinator reference - Valid for history', async () => {
    // Create activist assigned to supervisor
    const activist = await createWorker({
      fullName: 'Inactive Activist Test',
      phone: '2227777777',
      position: 'Test',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    expect(worker.success).toBe(true);

    // Deactivate worker
    await prisma.activist.update({
      where: { id: worker.worker!.id },
      data: { isActive: false },
    });

    // Verify supervisorId is preserved (for historical tracking)
    const inactiveWorker = await prisma.activist.findUnique({
      where: { id: worker.worker!.id },
    });

    expect(inactiveWorker?.isActive).toBe(false);
    expect(inactiveWorker?.supervisorId).toBe(testData.activistCoordinator1.id); // Preserved

    // Cleanup
    await prisma.activist.delete({ where: { id: worker.worker!.id } });
  });
});
