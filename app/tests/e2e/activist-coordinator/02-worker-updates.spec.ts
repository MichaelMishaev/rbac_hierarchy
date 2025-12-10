/**
 * E2E Tests: Activist Update Validation
 *
 * Tests all scenarios for updating workers:
 * - Neighborhood change clears supervisorId (require manual reselection)
 * - Cannot set supervisorId=null in neighborhood with supervisors
 * - Activist Coordinator must be assigned to worker's site
 * - Validation after neighborhood changes
 */

import { test, expect } from '@playwright/test';
import { setupActivistCoordinatorTestData, cleanupActivistCoordinatorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker, updateWorker } from '@/app/actions/activists';
import { prisma } from '@/lib/prisma';

test.describe('Worker Updates - Neighborhood Change & Activist Coordinator Validation', () => {
  let testData: TestScenarioData;
  let workerInSiteA: any; // Neighborhood with no activist coordinators
  let workerInSiteB: any; // Neighborhood with one supervisor

  test.beforeAll(async () => {
    testData = await setupActivistCoordinatorTestData();

    // Create test workers
    const resultA = await createWorker({
      fullName: 'Worker Update Test A',
      phone: '9990001111',
      position: 'Test Worker',
      neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
    });
    workerInSiteA = resultA.worker;

    const resultB = await createWorker({
      fullName: 'Worker Update Test B',
      phone: '9990002222',
      position: 'Test Worker',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });
    workerInSiteB = resultB.worker;
  });

  test.afterAll(async () => {
    await cleanupActivistCoordinatorTestData(testData);
  });

  test('Scenario 1: Move activist from neighborhood with NO activist coordinators to neighborhood WITH supervisors - supervisorId cleared', async () => {
    const result = await updateWorker(workerInSiteA.id, {
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      // Note: supervisorId not provided - should be cleared
    });

    expect(result.success).toBe(false); // Should fail because new neighborhood requires supervisor
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 2: Move activist from neighborhood WITH supervisors to neighborhood with NO activist coordinators - supervisorId cleared', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBeNull(); // Auto-cleared

    // Move back for other tests
    await updateWorker(workerInSiteB.id, {
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });
  });

  test('Scenario 3: Move activist between sites WITH supervisors - must reselect supervisor', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
      // supervisorId not provided - should fail
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 4: Move activist and assign to valid activist coordinator in new neighborhood - SUCCESS', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
      activistCoordinatorId: testData.activistCoordinator2.id, // Activist Coordinator 2 is in Neighborhood C
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBe(testData.activistCoordinator2.id);
    expect(result.worker?.siteId).toBe(testData.neighborhoodWithMultipleActivistCoordinators.id);

    // Move back
    await updateWorker(workerInSiteB.id, {
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });
  });

  test('Scenario 5: Try to clear supervisorId in neighborhood WITH supervisors - REJECT', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      activistCoordinatorId: undefined,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 6: Change activist coordinator within same neighborhood - SUCCESS', async () => {
    // First, add supervisor1 to Neighborhood C
    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: testData.activistCoordinator1.id,
        neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
        cityId: testData.city.id,
        legacySupervisorUserId: testData.activistCoordinator1User.id,
      },
    });

    // Create activist in Neighborhood C with activist coordinator 2
    const createResult = await createWorker({
      fullName: 'Worker Change Activist Coordinator Test',
      phone: '9990003333',
      position: 'Test Worker',
      neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
      activistCoordinatorId: testData.activistCoordinator2.id,
    });

    expect(createResult.success).toBe(true);
    const activist = createResult.worker!;

    // Change to activist coordinator 1 (same site)
    const updateResult = await updateWorker(worker.id, {
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.worker?.supervisorId).toBe(testData.activistCoordinator1.id);

    // Cleanup
    await prisma.activist.delete({ where: { id: worker.id } });
    await prisma.activistCoordinatorNeighborhood.delete({
      where: {
        supervisorId_neighborhoodId: {
          activistCoordinatorId: testData.activistCoordinator1.id,
          neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
        },
      },
    });
  });

  test('Scenario 7: Try to assign activist coordinator from different neighborhood - REJECT', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      activistCoordinatorId: testData.activistCoordinator2.id, // Activist Coordinator 2 not in Neighborhood B
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not assigned to this site');
  });

  test('Scenario 8: Update activist info without changing neighborhood or activist coordinator - SUCCESS', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      fullName: 'Worker Update Test B - Updated',
      position: 'Senior Worker',
    });

    expect(result.success).toBe(true);
    expect(result.worker?.fullName).toBe('Worker Update Test B - Updated');
    expect(result.worker?.supervisorId).toBe(testData.activistCoordinator1.id); // Unchanged
    expect(result.worker?.siteId).toBe(testData.neighborhoodWithOneActivistCoordinator.id); // Unchanged
  });
});
