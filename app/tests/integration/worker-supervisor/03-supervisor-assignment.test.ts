/**
 * Supervisor Assignment & Auto-Assignment Tests
 */

import { prisma } from '@/lib/prisma';
import { getSiteSupervisorCount, autoAssignWorkersToFirstSupervisor, findLeastLoadedSupervisor } from '@/lib/supervisor-worker-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testSupervisorAssignment(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Get supervisor count
  try {
    const count = await getSiteSupervisorCount(testData.siteWithOneSupervisor.id);
    assert(count === 1, 'Scenario 1: Correctly counts supervisors in site', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Auto-assign workers to first supervisor
  try {
    // Create orphan workers in site with no supervisors
    const workers = await Promise.all([
      prisma.worker.create({
        data: {
          fullName: 'Orphan Worker 1',
          phone: '3333333331',
          position: 'Worker',
          corporationId: testData.corporation.id,
          siteId: testData.siteWithNoSupervisors.id,
          supervisorId: null,
          isActive: true,
        },
      }),
      prisma.worker.create({
        data: {
          fullName: 'Orphan Worker 2',
          phone: '3333333332',
          position: 'Worker',
          corporationId: testData.corporation.id,
          siteId: testData.siteWithNoSupervisors.id,
          supervisorId: null,
          isActive: true,
        },
      }),
    ]);

    // Auto-assign to supervisor1
    const autoAssignResult = await autoAssignWorkersToFirstSupervisor(
      testData.siteWithNoSupervisors.id,
      testData.supervisor1.id,
      'test-user-id',
      'test@test.com',
      'SUPERADMIN'
    );

    assert(autoAssignResult.success === true && autoAssignResult.workersUpdated === 2, 'Scenario 2: Auto-assigns workers to first supervisor', result);

    // Cleanup
    await prisma.worker.deleteMany({ where: { id: { in: workers.map(w => w.id) } } });
    await prisma.supervisorSite.deleteMany({
      where: {
        supervisorId: testData.supervisor1.id,
        siteId: testData.siteWithNoSupervisors.id,
      },
    });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Find least-loaded supervisor
  try {
    const leastLoaded = await findLeastLoadedSupervisor(testData.siteWithMultipleSupervisors.id);
    assert(leastLoaded !== null, 'Scenario 3: Finds least-loaded supervisor', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }
}
