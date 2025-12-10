/**
 * Data Integrity Tests
 */

import { prisma } from '@/lib/prisma';
import { findOrphanWorkers } from '@/lib/activist-coordinator-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testDataIntegrity(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Detect orphan workers
  try {
    // Create orphan activist (site has supervisor, activist doesn't)
    const orphan = await prisma.activist.create({
      data: {
        fullName: 'Orphan Activist Integrity Test',
        phone: '6666666666',
        position: 'Orphan',
        cityId: testData.city.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id, // Neighborhood has supervisor
        activistCoordinatorId: null, // INVALID: Should have supervisor
        isActive: true,
      },
    });

    const orphans = await findOrphanWorkers(testData.neighborhoodWithOneActivistCoordinator.id);
    const foundOrphan = orphans.find(w => w.id === orphan.id);

    assert(foundOrphan !== undefined, 'Scenario 1: Detects orphan workers', result);

    await prisma.activist.delete({ where: { id: orphan.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: No orphans in neighborhood without supervisors (valid state)
  try {
    const activist = await prisma.activist.create({
      data: {
        fullName: 'Valid Activist Integrity Test',
        phone: '7777777777',
        position: 'Valid',
        cityId: testData.city.id,
        neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id, // No supervisors
        activistCoordinatorId: null, // VALID
        isActive: true,
      },
    });

    const orphans = await findOrphanWorkers(testData.neighborhoodWithNoActivistCoordinators.id);
    const foundWorker = orphans.find(w => w.id === worker.id);

    assert(foundWorker === undefined, 'Scenario 2: Does not flag workers in sites without supervisors', result);

    await prisma.activist.delete({ where: { id: worker.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Global orphan detection
  try {
    const orphans = await findOrphanWorkers();
    assert(orphans !== null && Array.isArray(orphans), 'Scenario 3: Global orphan detection works', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }
}
