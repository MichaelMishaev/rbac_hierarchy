/**
 * E2E Tests: Activist Creation Validation
 *
 * Tests all scenarios for creating workers with activist coordinator assignment rules:
 * - Neighborhood with 0 supervisors → supervisorId must be null
 * - Neighborhood with ≥1 supervisors → supervisorId required
 * - Activist Coordinator must be assigned to site
 * - Activist Coordinator must be active
 */

import { test, expect } from '@playwright/test';
import { setupActivistCoordinatorTestData, cleanupActivistCoordinatorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker } from '@/app/actions/activists';
import { prisma } from '@/lib/prisma';

test.describe('Worker Creation - Activist Coordinator Assignment Rules', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupActivistCoordinatorTestData();
  });

  test.afterAll(async () => {
    await cleanupActivistCoordinatorTestData(testData);
  });

  test('Scenario 1: Create activist in neighborhood with NO activist coordinators - activistCoordinatorId must be NULL', async () => {
    const result = await createWorker({
      fullName: 'Worker A1',
      phone: '1234567890',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
      activistCoordinatorId: undefined, // Not provided
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBeNull();

    // Cleanup
    if (result.worker) {
      await prisma.activist.delete({ where: { id: result.worker.id } });
    }
  });

  test('Scenario 2: Create activist in neighborhood with NO activist coordinators - REJECT if supervisorId provided', async () => {
    const result = await createWorker({
      fullName: 'Worker A2',
      phone: '1234567891',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
      activistCoordinatorId: testData.activistCoordinator1.id, // Invalid - neighborhood has no activist coordinators
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Site has no activist coordinators');
  });

  test('Scenario 3: Create activist in neighborhood with ONE activist coordinator - activistCoordinatorId REQUIRED', async () => {
    const result = await createWorker({
      fullName: 'Worker B1',
      phone: '1234567892',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: undefined, // Missing required field
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 4: Create activist in neighborhood with ONE activist coordinator - SUCCESS with valid supervisor', async () => {
    const result = await createWorker({
      fullName: 'Worker B2',
      phone: '1234567893',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBe(testData.activistCoordinator1.id);

    // Cleanup
    if (result.worker) {
      await prisma.activist.delete({ where: { id: result.worker.id } });
    }
  });

  test('Scenario 5: Create activist with activist coordinator NOT assigned to neighborhood - REJECT', async () => {
    const result = await createWorker({
      fullName: 'Worker B3',
      phone: '1234567894',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator2.id, // Activist Coordinator 2 not assigned to Neighborhood B
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not assigned to this site');
  });

  test('Scenario 6: Create activist with inactive activist coordinator - REJECT', async () => {
    // Deactivate activist coordinator 1
    await prisma.activistCoordinator.update({
      where: { id: testData.activistCoordinator1.id },
      data: { isActive: false },
    });

    const result = await createWorker({
      fullName: 'Worker B4',
      phone: '1234567895',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
      activistCoordinatorId: testData.activistCoordinator1.id,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('inactive');

    // Reactivate
    await prisma.activistCoordinator.update({
      where: { id: testData.activistCoordinator1.id },
      data: { isActive: true },
    });
  });

  test('Scenario 7: Create activist in neighborhood with MULTIPLE supervisors - REQUIRE manual selection', async () => {
    const result = await createWorker({
      fullName: 'Worker C1',
      phone: '1234567896',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
      activistCoordinatorId: undefined, // Missing required field
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 8: Create activist in neighborhood with MULTIPLE supervisors - SUCCESS with valid selection', async () => {
    const result = await createWorker({
      fullName: 'Worker C2',
      phone: '1234567897',
      position: 'Laborer',
      neighborhoodId: testData.neighborhoodWithMultipleActivistCoordinators.id,
      activistCoordinatorId: testData.activistCoordinator2.id,
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBe(testData.activistCoordinator2.id);

    // Cleanup
    if (result.worker) {
      await prisma.activist.delete({ where: { id: result.worker.id } });
    }
  });
});
