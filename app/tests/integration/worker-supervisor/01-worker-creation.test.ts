/**
 * Worker Creation Validation Tests
 */

import { prisma } from '@/lib/prisma';
import { validateWorkerSupervisorAssignment } from '@/lib/activist-coordinator-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testWorkerCreation(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Create worker in site with NO supervisors - supervisorId must be NULL
  try {
    const validation = await validateWorkerSupervisorAssignment(testData.siteWithNoSupervisors.id, undefined);
    assert(validation.valid === true, 'Scenario 1: Site with NO supervisors accepts null supervisorId', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Create worker in site with NO supervisors - REJECT if supervisorId provided
  try {
    const validation = await validateWorkerSupervisorAssignment(testData.siteWithNoSupervisors.id, testData.supervisor1.id);
    assert(validation.valid === false && Boolean(validation.error?.includes('no supervisors')), 'Scenario 2: Site with NO supervisors rejects supervisorId', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Create worker in site with ONE supervisor - supervisorId REQUIRED
  try {
    const validation = await validateWorkerSupervisorAssignment(testData.siteWithOneSupervisor.id, undefined);
    assert(validation.valid === false && Boolean(validation.error?.includes('must be assigned')), 'Scenario 3: Site with supervisors requires supervisorId', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }

  // Test 4: Create worker with valid supervisor - SUCCESS
  try {
    const worker = await prisma.worker.create({
      data: {
        fullName: 'Test Worker Valid',
        phone: '1111111111',
        position: 'Worker',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithOneSupervisor.id,
        supervisorId: testData.supervisor1.id,
        isActive: true,
      },
    });

    assert(worker.supervisorId === testData.supervisor1.id, 'Scenario 4: Worker created with valid supervisor', result);

    // Cleanup
    await prisma.worker.delete({ where: { id: worker.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 4 failed: ${error}`);
  }

  // Test 5: Supervisor not assigned to site - REJECT
  try {
    const validation = await validateWorkerSupervisorAssignment(testData.siteWithOneSupervisor.id, testData.supervisor2.id);
    assert(validation.valid === false && Boolean(validation.error?.includes('not assigned to this site')), 'Scenario 5: Rejects supervisor not assigned to site', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 5 failed: ${error}`);
  }
}
