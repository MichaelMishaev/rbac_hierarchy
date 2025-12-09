/**
 * Worker Update Validation Tests
 */

import { prisma } from '@/lib/prisma';
import { validateWorkerSupervisorAssignment } from '@/lib/activist-coordinator-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testWorkerUpdates(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Move worker from site WITHOUT supervisors to site WITH supervisors
  try {
    const worker = await prisma.worker.create({
      data: {
        fullName: 'Test Worker Move 1',
        phone: '2222222222',
        position: 'Worker',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithNoSupervisors.id,
        supervisorId: null,
        isActive: true,
      },
    });

    // Validate that moving to site with supervisors requires supervisor
    const validation = await validateWorkerSupervisorAssignment(testData.siteWithOneSupervisor.id, null);
    assert(validation.valid === false, 'Scenario 1: Moving to site with supervisors requires supervisor', result);

    await prisma.worker.delete({ where: { id: worker.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Cannot clear supervisorId in site WITH supervisors
  try {
    const validation = await validateWorkerSupervisorAssignment(testData.siteWithOneSupervisor.id, null);
    assert(validation.valid === false, 'Scenario 2: Cannot clear supervisorId in site with supervisors', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Can clear supervisorId in site WITHOUT supervisors
  try {
    const validation = await validateWorkerSupervisorAssignment(testData.siteWithNoSupervisors.id, null);
    assert(validation.valid === true, 'Scenario 3: Can clear supervisorId in site without supervisors', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }
}
