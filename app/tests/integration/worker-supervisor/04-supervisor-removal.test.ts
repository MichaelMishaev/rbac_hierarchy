/**
 * Supervisor Removal & Reassignment Tests
 */

import { prisma } from '@/lib/prisma';
import { canRemoveSupervisorFromSite, reassignWorkersFromRemovedSupervisor } from '@/lib/supervisor-worker-assignment';
import type { TestData } from './test-setup';
import { assert } from './test-setup';

export async function testSupervisorRemoval(testData: TestData, result: { passed: number; failed: number; errors: string[] }) {
  // Test 1: Cannot remove supervisor with workers
  try {
    // Create worker assigned to supervisor1
    const worker = await prisma.worker.create({
      data: {
        fullName: 'Worker for Removal Test',
        phone: '4444444444',
        position: 'Worker',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithOneSupervisor.id,
        supervisorId: testData.supervisor1.id,
        isActive: true,
      },
    });

    const canRemove = await canRemoveSupervisorFromSite(testData.supervisor1.id, testData.siteWithOneSupervisor.id);
    assert(canRemove.canRemove === false && canRemove.workerCount! > 0, 'Scenario 1: Blocks removal of supervisor with workers', result);

    await prisma.worker.delete({ where: { id: worker.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 1 failed: ${error}`);
  }

  // Test 2: Can remove supervisor without workers
  try {
    const canRemove = await canRemoveSupervisorFromSite(testData.supervisor1.id, testData.siteWithOneSupervisor.id);
    assert(canRemove.canRemove === true, 'Scenario 2: Allows removal of supervisor without workers', result);
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 2 failed: ${error}`);
  }

  // Test 3: Reassignment logic (last supervisor)
  try {
    // Create test site with one supervisor
    const testSite = await prisma.site.create({
      data: {
        name: 'Test Removal Site',
        corporationId: testData.corporation.id,
        address: 'Test',
        city: 'Test',
        isActive: true,
      },
    });

    await prisma.supervisorSite.create({
      data: {
        supervisorId: testData.supervisor1.id,
        siteId: testSite.id,
        corporationId: testData.corporation.id,
        legacySupervisorUserId: testData.supervisor1.userId,
      },
    });

    const worker = await prisma.worker.create({
      data: {
        fullName: 'Worker Reassign Test',
        phone: '5555555555',
        position: 'Worker',
        corporationId: testData.corporation.id,
        siteId: testSite.id,
        supervisorId: testData.supervisor1.id,
        isActive: true,
      },
    });

    // Remove supervisor (last one in site)
    const reassignResult = await reassignWorkersFromRemovedSupervisor(
      testSite.id,
      testData.supervisor1.id,
      'test-user-id',
      'test@test.com',
      'SUPERADMIN'
    );

    assert(reassignResult.success === true && reassignResult.workersReassigned === 1, 'Scenario 3: Reassigns workers when last supervisor removed', result);

    // Verify worker supervisorId is now null
    const updatedWorker = await prisma.worker.findUnique({ where: { id: worker.id } });
    assert(updatedWorker?.supervisorId === null, 'Scenario 3b: Worker supervisorId cleared after last supervisor removed', result);

    // Cleanup
    await prisma.worker.delete({ where: { id: worker.id } });
    await prisma.supervisorSite.deleteMany({ where: { siteId: testSite.id } });
    await prisma.site.delete({ where: { id: testSite.id } });
  } catch (error) {
    result.failed++;
    result.errors.push(`Scenario 3 failed: ${error}`);
  }
}
