/**
 * Activist Coordinator Assignment & Auto-Assignment Tests
 */

import { prisma } from '@/lib/prisma';
import { getSiteSupervisorCount, autoAssignWorkersToFirstSupervisor, findLeastLoadedSupervisor } from '@/lib/activist-coordinator-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testActivistCoordinatorAssignment(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Get activist coordinator count
  try {
    const count = await getSiteSupervisorCount(testData.neighborhoodWithOneActivistCoordinator.id);
    assert(count === 1, 'Scenario 1: Correctly counts supervisors in site', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Auto-assign workers to first supervisor
  try {
    // Create orphan workers in neighborhood with no activist coordinators
    const workers = await Promise.all([
      prisma.activist.create({
        data: {
          fullName: 'Orphan Activist 1',
          phone: '3333333331',
          position: 'Worker',
          cityId: testData.city.id,
          neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
          activistCoordinatorId: null,
          isActive: true,
        },
      }),
      prisma.activist.create({
        data: {
          fullName: 'Orphan Activist 2',
          phone: '3333333332',
          position: 'Worker',
          cityId: testData.city.id,
          neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
          activistCoordinatorId: null,
          isActive: true,
        },
      }),
    ]);

    // Auto-assign to supervisor1
    const autoAssignResult = await autoAssignWorkersToFirstSupervisor(
      testData.neighborhoodWithNoActivistCoordinators.id,
      testData.activistCoordinator1.id,
      'test-user-id',
      'test@test.com',
      'SUPERADMIN'
    );

    assert(autoAssignResult.success === true && autoAssignResult.workersUpdated === 2, 'Scenario 2: Auto-assigns workers to first supervisor', result);

    // Cleanup
    await prisma.activist.deleteMany({ where: { id: { in: workers.map(w => w.id) } } });
    await prisma.activistCoordinatorNeighborhood.deleteMany({
      where: {
        activistCoordinatorId: testData.activistCoordinator1.id,
        neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
      },
    });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Find least-loaded supervisor
  try {
    const leastLoaded = await findLeastLoadedSupervisor(testData.neighborhoodWithMultipleActivistCoordinators.id);
    assert(leastLoaded !== null, 'Scenario 3: Finds least-loaded supervisor', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }
}
