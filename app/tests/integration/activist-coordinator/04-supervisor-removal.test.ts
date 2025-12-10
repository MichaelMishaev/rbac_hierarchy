/**
 * Activist Coordinator Removal & Reassignment Tests
 */

import { prisma } from '@/lib/prisma';
import { canRemoveSupervisorFromSite, reassignWorkersFromRemovedSupervisor } from '@/lib/activist-coordinator-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testActivistCoordinatorRemoval(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Cannot remove activist coordinator with workers
  try {
    // Create activist assigned to supervisor1
    const activist = await prisma.activist.create({
      data: {
        fullName: 'Worker for Removal Test',
        phone: '4444444444',
        position: 'Worker',
        cityId: testData.city.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        activistCoordinatorId: testData.activistCoordinator1.id,
        isActive: true,
      },
    });

    const canRemove = await canRemoveSupervisorFromSite(testData.activistCoordinator1.id, testData.neighborhoodWithOneActivistCoordinator.id);
    assert(canRemove.canRemove === false && canRemove.workerCount! > 0, 'Scenario 1: Blocks removal of activist coordinator with workers', result);

    await prisma.activist.delete({ where: { id: worker.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Can remove activist coordinator without workers
  try {
    const canRemove = await canRemoveSupervisorFromSite(testData.activistCoordinator1.id, testData.neighborhoodWithOneActivistCoordinator.id);
    assert(canRemove.canRemove === true, 'Scenario 2: Allows removal of activist coordinator without workers', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Reassignment logic (last supervisor)
  try {
    // Create test neighborhood with one supervisor
    const testSite = await prisma.neighborhood.create({
      data: {
        name: 'Test Removal Site',
        cityId: testData.city.id,
        address: 'Test',
        city: 'Test',
        isActive: true,
      },
    });

    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: testData.activistCoordinator1.id,
        neighborhoodId: testSite.id,
        cityId: testData.city.id,
        legacyActivistCoordinatorUserId: testData.activistCoordinator1.userId,
      },
    });

    const activist = await prisma.activist.create({
      data: {
        fullName: 'Worker Reassign Test',
        phone: '5555555555',
        position: 'Worker',
        cityId: testData.city.id,
        neighborhoodId: testSite.id,
        activistCoordinatorId: testData.activistCoordinator1.id,
        isActive: true,
      },
    });

    // Remove activist coordinator (last one in site)
    const reassignResult = await reassignWorkersFromRemovedSupervisor(
      testSite.id,
      testData.activistCoordinator1.id,
      'test-user-id',
      'test@test.com',
      'SUPERADMIN'
    );

    assert(reassignResult.success === true && reassignResult.workersReassigned === 1, 'Scenario 3: Reassigns workers when last activist coordinator removed', result);

    // Verify activist supervisorId is now null
    const updatedWorker = await prisma.activist.findUnique({ where: { id: worker.id } });
    assert(updatedWorker?.supervisorId === null, 'Scenario 3b: Activist supervisorId cleared after last activist coordinator removed', result);

    // Cleanup
    await prisma.activist.delete({ where: { id: worker.id } });
    await prisma.activistCoordinatorNeighborhood.deleteMany({ where: { neighborhoodId: testSite.id } });
    await prisma.neighborhood.delete({ where: { id: testSite.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }
}
