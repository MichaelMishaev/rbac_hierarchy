/**
 * Activist Update Validation Tests
 */

import { prisma } from '@/lib/prisma';
import { validateActivistCoordinatorAssignment } from '@/lib/activist-coordinator-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testActivistUpdates(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Move activist from neighborhood WITHOUT supervisors to neighborhood WITH supervisors
  try {
    const activist = await prisma.activist.create({
      data: {
        fullName: 'Test Activist Move 1',
        phone: '2222222222',
        position: 'Worker',
        cityId: testData.city.id,
        neighborhoodId: testData.neighborhoodWithNoActivistCoordinators.id,
        activistCoordinatorId: null,
        isActive: true,
      },
    });

    // Validate that moving to neighborhood with supervisors requires supervisor
    const validation = await validateActivistCoordinatorAssignment(testData.neighborhoodWithOneActivistCoordinator.id, null);
    assert(validation.valid === false, 'Scenario 1: Moving to neighborhood with supervisors requires supervisor', result);

    await prisma.activist.delete({ where: { id: worker.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Cannot clear supervisorId in neighborhood WITH supervisors
  try {
    const validation = await validateActivistCoordinatorAssignment(testData.neighborhoodWithOneActivistCoordinator.id, null);
    assert(validation.valid === false, 'Scenario 2: Cannot clear supervisorId in neighborhood with supervisors', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Can clear supervisorId in neighborhood WITHOUT supervisors
  try {
    const validation = await validateActivistCoordinatorAssignment(testData.neighborhoodWithNoActivistCoordinators.id, null);
    assert(validation.valid === true, 'Scenario 3: Can clear supervisorId in neighborhood without supervisors', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }
}
