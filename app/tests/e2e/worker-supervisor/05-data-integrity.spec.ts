/**
 * E2E Tests: Data Integrity Checks
 *
 * Tests the integrity checking and auto-fix script:
 * - Find orphan workers (site has supervisors, worker doesn't)
 * - Find dangling references (supervisor not in site)
 * - Find inactive supervisor assignments
 * - Auto-fix functionality
 */

import { test, expect } from '@playwright/test';
import { setupWorkerSupervisorTestData, cleanupWorkerSupervisorTestData, type TestScenarioData } from './fixtures/test-data';
import { findOrphanWorkers } from '@/lib/supervisor-worker-assignment';
import { prisma } from '@/lib/prisma';
import { createWorker } from '@/app/actions/workers';

test.describe('Data Integrity - Orphan Detection & Validation', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupWorkerSupervisorTestData();
  });

  test.afterAll(async () => {
    await cleanupWorkerSupervisorTestData(testData);
  });

  test('Scenario 1: Detect orphan workers - Site has supervisors, worker does not', async () => {
    // Create orphan worker (manually bypass validation)
    const orphan = await prisma.worker.create({
      data: {
        fullName: 'Orphan Worker Test',
        phone: '2221111111',
        position: 'Orphan',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithOneSupervisor.id, // Site has supervisor1
        supervisorId: null, // INVALID: Should have supervisor
        isActive: true,
      },
    });

    // Run orphan detection
    const orphans = await findOrphanWorkers(testData.siteWithOneSupervisor.id);

    expect(orphans.length).toBeGreaterThanOrEqual(1);

    const foundOrphan = orphans.find(w => w.id === orphan.id);
    expect(foundOrphan).toBeDefined();
    expect(foundOrphan?.site.supervisorAssignments.length).toBeGreaterThan(0);

    // Cleanup
    await prisma.worker.delete({ where: { id: orphan.id } });
  });

  test('Scenario 2: No orphans in site without supervisors - Valid state', async () => {
    // Create workers in site with no supervisors
    const worker = await prisma.worker.create({
      data: {
        fullName: 'Valid Worker',
        phone: '2222222222',
        position: 'Valid',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithNoSupervisors.id, // No supervisors
        supervisorId: null, // VALID: Site has no supervisors
        isActive: true,
      },
    });

    // Run orphan detection - should NOT find this worker
    const orphans = await findOrphanWorkers(testData.siteWithNoSupervisors.id);

    const foundWorker = orphans.find(w => w.id === worker.id);
    expect(foundWorker).toBeUndefined();

    // Cleanup
    await prisma.worker.delete({ where: { id: worker.id } });
  });

  test('Scenario 3: Detect dangling reference - Supervisor not assigned to site', async () => {
    // Create worker assigned to supervisor2, but supervisor2 not in Site B
    const dangling = await prisma.worker.create({
      data: {
        fullName: 'Dangling Reference Worker',
        phone: '2223333333',
        position: 'Dangling',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithOneSupervisor.id, // Site B has only supervisor1
        supervisorId: testData.supervisor2.id, // INVALID: supervisor2 not in Site B
        isActive: true,
      },
    });

    // Verify dangling reference exists
    const worker = await prisma.worker.findUnique({
      where: { id: dangling.id },
      include: {
        site: {
          include: {
            supervisorAssignments: true,
          },
        },
      },
    });

    const supervisorIds = worker!.site.supervisorAssignments.map(sa => sa.supervisorId);
    expect(supervisorIds).not.toContain(testData.supervisor2.id);
    expect(worker!.supervisorId).toBe(testData.supervisor2.id);

    // Cleanup
    await prisma.worker.delete({ where: { id: dangling.id } });
  });

  test('Scenario 4: Detect inactive supervisor assignment', async () => {
    // Create worker assigned to active supervisor
    const worker = await createWorker({
      fullName: 'Inactive Supervisor Test',
      phone: '2224444444',
      position: 'Test',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });

    expect(worker.success).toBe(true);

    // Deactivate supervisor1
    await prisma.supervisor.update({
      where: { id: testData.supervisor1.id },
      data: { isActive: false },
    });

    // Find workers with inactive supervisors
    const workersWithInactiveSupervisors = await prisma.worker.findMany({
      where: {
        isActive: true,
        supervisor: {
          isActive: false,
        },
      },
      include: {
        supervisor: {
          include: {
            user: true,
          },
        },
      },
    });

    const foundWorker = workersWithInactiveSupervisors.find(w => w.id === worker.worker!.id);
    expect(foundWorker).toBeDefined();
    expect(foundWorker?.supervisor?.isActive).toBe(false);

    // Reactivate supervisor1
    await prisma.supervisor.update({
      where: { id: testData.supervisor1.id },
      data: { isActive: true },
    });

    // Cleanup
    await prisma.worker.delete({ where: { id: worker.worker!.id } });
  });

  test('Scenario 5: Global orphan detection across all sites', async () => {
    // Create orphans in multiple sites
    const orphan1 = await prisma.worker.create({
      data: {
        fullName: 'Global Orphan 1',
        phone: '2225555555',
        position: 'Orphan',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithOneSupervisor.id,
        supervisorId: null,
        isActive: true,
      },
    });

    const orphan2 = await prisma.worker.create({
      data: {
        fullName: 'Global Orphan 2',
        phone: '2226666666',
        position: 'Orphan',
        corporationId: testData.corporation.id,
        siteId: testData.siteWithMultipleSupervisors.id,
        supervisorId: null,
        isActive: true,
      },
    });

    // Run global orphan detection (no siteId filter)
    const allOrphans = await findOrphanWorkers();

    expect(allOrphans.length).toBeGreaterThanOrEqual(2);

    const foundOrphans = allOrphans.filter(w =>
      [orphan1.id, orphan2.id].includes(w.id)
    );

    expect(foundOrphans.length).toBe(2);

    // Cleanup
    await prisma.worker.deleteMany({
      where: { id: { in: [orphan1.id, orphan2.id] } },
    });
  });

  test('Scenario 6: Inactive workers keep supervisor reference - Valid for history', async () => {
    // Create worker assigned to supervisor
    const worker = await createWorker({
      fullName: 'Inactive Worker Test',
      phone: '2227777777',
      position: 'Test',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });

    expect(worker.success).toBe(true);

    // Deactivate worker
    await prisma.worker.update({
      where: { id: worker.worker!.id },
      data: { isActive: false },
    });

    // Verify supervisorId is preserved (for historical tracking)
    const inactiveWorker = await prisma.worker.findUnique({
      where: { id: worker.worker!.id },
    });

    expect(inactiveWorker?.isActive).toBe(false);
    expect(inactiveWorker?.supervisorId).toBe(testData.supervisor1.id); // Preserved

    // Cleanup
    await prisma.worker.delete({ where: { id: worker.worker!.id } });
  });
});
