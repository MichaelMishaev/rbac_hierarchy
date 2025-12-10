/**
 * Activist Creation Validation Tests
 */

import { prisma } from '@/lib/prisma';
import { validateActivistCoordinatorAssignment } from '@/lib/activist-coordinator-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testActivistCreation(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Create activist in neighborhood with NO activist coordinators - activistCoordinatorId must be NULL
  try {
    const validation = await validateActivistCoordinatorAssignment(testData.neighborhoodWithNoActivistCoordinators.id, undefined);
    assert(validation.valid === true, 'Scenario 1: Neighborhood with NO activist coordinators accepts null activistCoordinatorId', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Create activist in neighborhood with NO activist coordinators - REJECT if supervisorId provided
  try {
    const validation = await validateActivistCoordinatorAssignment(testData.neighborhoodWithNoActivistCoordinators.id, testData.activistCoordinator1.id);
    assert(validation.valid === false && Boolean(validation.error?.includes('no activist coordinators')), 'Scenario 2: Neighborhood with NO activist coordinators rejects activistCoordinatorId', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Create activist in neighborhood with ONE activist coordinator - activistCoordinatorId REQUIRED
  try {
    const validation = await validateActivistCoordinatorAssignment(testData.neighborhoodWithOneActivistCoordinator.id, undefined);
    assert(validation.valid === false && Boolean(validation.error?.includes('must be assigned')), 'Scenario 3: Neighborhood with supervisors requires activistCoordinatorId', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }

  // Test 4: Create activist with valid activist coordinator - SUCCESS
  try {
    const activist = await prisma.activist.create({
      data: {
        fullName: 'Test Activist Valid',
        phone: '1111111111',
        position: 'Worker',
        cityId: testData.city.id,
        neighborhoodId: testData.neighborhoodWithOneActivistCoordinator.id,
        activistCoordinatorId: testData.activistCoordinator1.id,
        isActive: true,
      },
    });

    assert(activist.activistCoordinatorId === testData.activistCoordinator1.id, 'Scenario 4: Activist created with valid supervisor', result);

    // Cleanup
    await prisma.activist.delete({ where: { id: worker.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 4 failed: ${error}`);
  }

  // Test 5: Activist Coordinator not assigned to neighborhood - REJECT
  try {
    const validation = await validateActivistCoordinatorAssignment(testData.neighborhoodWithOneActivistCoordinator.id, testData.activistCoordinator2.id);
    assert(validation.valid === false && Boolean(validation.error?.includes('not assigned to this site')), 'Scenario 5: Rejects activist coordinator not assigned to site', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 5 failed: ${error}`);
  }
}
