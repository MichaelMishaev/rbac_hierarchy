/**
 * E2E Tests: Supervisor Removal & Worker Reassignment
 *
 * Tests all scenarios for removing supervisors:
 * - Block removal if supervisor has active workers
 * - Delete supervisor → auto-reassign to least-loaded (load balancing)
 * - Delete last supervisor → workers back to site (supervisorId = null)
 * - Audit logging
 */

import { test, expect } from '@playwright/test';
import { setupWorkerSupervisorTestData, cleanupWorkerSupervisorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker } from '@/app/actions/workers';
import { removeSupervisorFromSite, deleteSupervisor, assignSupervisorToSite } from '@/app/actions/supervisor-sites';
import { prisma } from '@/lib/prisma';

test.describe('Supervisor Removal - Worker Reassignment Logic', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupWorkerSupervisorTestData();
  });

  test.afterAll(async () => {
    await cleanupWorkerSupervisorTestData(testData);
  });

  test('Scenario 1: Try to remove supervisor with active workers - BLOCKED', async () => {
    // Create worker assigned to supervisor1 in Site B
    const workerResult = await createWorker({
      fullName: 'Worker for Removal Test 1',
      phone: '6661111111',
      position: 'Test Worker',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });

    expect(workerResult.success).toBe(true);
    const worker = workerResult.worker!;

    // Try to remove supervisor1 from Site B
    const result = await removeSupervisorFromSite(testData.supervisor1.id, testData.siteWithOneSupervisor.id);

    expect(result.success).toBe(false);
    expect(result.error).toContain('Cannot remove supervisor');
    expect(result.error).toContain('1 active worker');
    expect(result.workerCount).toBe(1);

    // Cleanup
    await prisma.worker.delete({ where: { id: worker.id } });
  });

  test('Scenario 2: Remove supervisor with NO workers - SUCCESS', async () => {
    // Site B currently has supervisor1 but no workers
    const workerCount = await prisma.worker.count({
      where: {
        siteId: testData.siteWithOneSupervisor.id,
        supervisorId: testData.supervisor1.id,
        isActive: true,
      },
    });
    expect(workerCount).toBe(0);

    // Assign supervisor2 to Site B first (so it's not last supervisor)
    await assignSupervisorToSite(testData.supervisor2.id, testData.siteWithOneSupervisor.id);

    // Now remove supervisor1
    const result = await removeSupervisorFromSite(testData.supervisor1.id, testData.siteWithOneSupervisor.id);

    expect(result.success).toBe(true);
    expect(result.message).toContain('removed from site');

    // Restore original state
    await assignSupervisorToSite(testData.supervisor1.id, testData.siteWithOneSupervisor.id);
    await removeSupervisorFromSite(testData.supervisor2.id, testData.siteWithOneSupervisor.id);
  });

  test('Scenario 3: Delete ONLY supervisor in site → workers back to site (supervisorId = null)', async () => {
    // Create test site with 1 supervisor
    const testSite = await prisma.site.create({
      data: {
        name: 'Test Site - Single Supervisor',
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
      },
    });

    // Create 3 workers assigned to supervisor1
    const workers = await Promise.all([
      createWorker({ fullName: 'Worker 1', phone: '5551111111', position: 'W', siteId: testSite.id, supervisorId: testData.supervisor1.id }),
      createWorker({ fullName: 'Worker 2', phone: '5551111112', position: 'W', siteId: testSite.id, supervisorId: testData.supervisor1.id }),
      createWorker({ fullName: 'Worker 3', phone: '5551111113', position: 'W', siteId: testSite.id, supervisorId: testData.supervisor1.id }),
    ]);

    expect(workers.every(w => w.success)).toBe(true);

    // Delete supervisor1 (will trigger reassignment)
    const result = await deleteSupervisor(testData.supervisor1.id);

    expect(result.success).toBe(true);
    expect(result.reassignmentResults).toBeDefined();

    // Verify workers now have supervisorId = null (back to site)
    const updatedWorkers = await prisma.worker.findMany({
      where: { id: { in: workers.map(w => w.worker!.id) } },
    });

    expect(updatedWorkers.every(w => w.supervisorId === null)).toBe(true);

    // Reactivate supervisor1 for other tests
    await prisma.supervisor.update({
      where: { id: testData.supervisor1.id },
      data: { isActive: true },
    });

    // Restore supervisor assignment
    await prisma.supervisorSite.create({
      data: {
        supervisorId: testData.supervisor1.id,
        siteId: testData.siteWithOneSupervisor.id,
        corporationId: testData.corporation.id,
      },
    });

    // Cleanup
    await prisma.worker.deleteMany({ where: { id: { in: workers.map(w => w.worker!.id) } } });
    await prisma.supervisorSite.deleteMany({ where: { siteId: testSite.id } });
    await prisma.site.delete({ where: { id: testSite.id } });
  });

  test('Scenario 4: Delete NON-LAST supervisor → reassign to least-loaded (load balancing)', async () => {
    // Create test site with 2 supervisors
    const testSite = await prisma.site.create({
      data: {
        name: 'Test Site - Multiple Supervisors',
        corporationId: testData.corporation.id,
        address: 'Test',
        city: 'Test',
        isActive: true,
      },
    });

    await prisma.supervisorSite.createMany({
      data: [
        { supervisorId: testData.supervisor1.id, siteId: testSite.id, corporationId: testData.corporation.id },
        { supervisorId: testData.supervisor2.id, siteId: testSite.id, corporationId: testData.corporation.id },
      ],
    });

    // Create workers: 10 for supervisor1, 2 for supervisor2
    const workers1 = [];
    for (let i = 0; i < 10; i++) {
      const result = await createWorker({
        fullName: `Worker S1-${i}`,
        phone: `444111${i.toString().padStart(4, '0')}`,
        position: 'W',
        siteId: testSite.id,
        supervisorId: testData.supervisor1.id,
      });
      if (result.success) workers1.push(result.worker!);
    }

    const workers2 = [];
    for (let i = 0; i < 2; i++) {
      const result = await createWorker({
        fullName: `Worker S2-${i}`,
        phone: `444222${i.toString().padStart(4, '0')}`,
        position: 'W',
        siteId: testSite.id,
        supervisorId: testData.supervisor2.id,
      });
      if (result.success) workers2.push(result.worker!);
    }

    expect(workers1.length).toBe(10);
    expect(workers2.length).toBe(2);

    // Delete supervisor1 (heavily loaded)
    const result = await deleteSupervisor(testData.supervisor1.id);

    expect(result.success).toBe(true);

    // Verify: All 10 workers from supervisor1 reassigned to supervisor2 (least loaded)
    const reassignedWorkers = await prisma.worker.findMany({
      where: { id: { in: workers1.map(w => w.id) } },
    });

    expect(reassignedWorkers.every(w => w.supervisorId === testData.supervisor2.id)).toBe(true);

    // Supervisor2 now has 12 workers total (2 original + 10 reassigned)
    const supervisor2WorkerCount = await prisma.worker.count({
      where: {
        siteId: testSite.id,
        supervisorId: testData.supervisor2.id,
        isActive: true,
      },
    });

    expect(supervisor2WorkerCount).toBe(12);

    // Reactivate supervisor1
    await prisma.supervisor.update({
      where: { id: testData.supervisor1.id },
      data: { isActive: true },
    });

    // Restore supervisor1 assignment to original site
    await prisma.supervisorSite.create({
      data: {
        supervisorId: testData.supervisor1.id,
        siteId: testData.siteWithOneSupervisor.id,
        corporationId: testData.corporation.id,
      },
    });

    // Cleanup
    await prisma.worker.deleteMany({ where: { siteId: testSite.id } });
    await prisma.supervisorSite.deleteMany({ where: { siteId: testSite.id } });
    await prisma.site.delete({ where: { id: testSite.id } });
  });

  test('Scenario 5: Delete supervisor assigned to MULTIPLE sites → reassign in all sites', async () => {
    // Create 2 test sites
    const site1 = await prisma.site.create({
      data: { name: 'Multi-Site Test 1', corporationId: testData.corporation.id, address: 'A', city: 'A', isActive: true },
    });

    const site2 = await prisma.site.create({
      data: { name: 'Multi-Site Test 2', corporationId: testData.corporation.id, address: 'B', city: 'B', isActive: true },
    });

    // Assign supervisor1 to both sites
    await prisma.supervisorSite.createMany({
      data: [
        { supervisorId: testData.supervisor1.id, siteId: site1.id, corporationId: testData.corporation.id },
        { supervisorId: testData.supervisor1.id, siteId: site2.id, corporationId: testData.corporation.id },
      ],
    });

    // Create workers in both sites assigned to supervisor1
    const worker1 = await createWorker({
      fullName: 'Multi-Site Worker 1',
      phone: '3331111111',
      position: 'W',
      siteId: site1.id,
      supervisorId: testData.supervisor1.id,
    });

    const worker2 = await createWorker({
      fullName: 'Multi-Site Worker 2',
      phone: '3332222222',
      position: 'W',
      siteId: site2.id,
      supervisorId: testData.supervisor1.id,
    });

    expect(worker1.success && worker2.success).toBe(true);

    // Delete supervisor1
    const result = await deleteSupervisor(testData.supervisor1.id);

    expect(result.success).toBe(true);
    expect(result.reassignmentResults).toHaveLength(2); // 2 sites processed

    // Verify both workers now have supervisorId = null (both sites had only 1 supervisor)
    const updatedWorkers = await prisma.worker.findMany({
      where: { id: { in: [worker1.worker!.id, worker2.worker!.id] } },
    });

    expect(updatedWorkers.every(w => w.supervisorId === null)).toBe(true);

    // Reactivate supervisor1
    await prisma.supervisor.update({
      where: { id: testData.supervisor1.id },
      data: { isActive: true },
    });

    // Restore supervisor1 assignment to original site
    await prisma.supervisorSite.create({
      data: {
        supervisorId: testData.supervisor1.id,
        siteId: testData.siteWithOneSupervisor.id,
        corporationId: testData.corporation.id,
      },
    });

    // Cleanup
    await prisma.worker.deleteMany({ where: { siteId: { in: [site1.id, site2.id] } } });
    await prisma.supervisorSite.deleteMany({ where: { siteId: { in: [site1.id, site2.id] } } });
    await prisma.site.deleteMany({ where: { id: { in: [site1.id, site2.id] } } });
  });
});
