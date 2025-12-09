/**
 * E2E Tests: Worker Update Validation
 *
 * Tests all scenarios for updating workers:
 * - Site change clears supervisorId (require manual reselection)
 * - Cannot set supervisorId=null in site with supervisors
 * - Supervisor must be assigned to worker's site
 * - Validation after site changes
 */

import { test, expect } from '@playwright/test';
import { setupWorkerSupervisorTestData, cleanupWorkerSupervisorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker, updateWorker } from '@/app/actions/workers';
import { prisma } from '@/lib/prisma';

test.describe('Worker Updates - Site Change & Supervisor Validation', () => {
  let testData: TestScenarioData;
  let workerInSiteA: any; // Site with no supervisors
  let workerInSiteB: any; // Site with one supervisor

  test.beforeAll(async () => {
    testData = await setupWorkerSupervisorTestData();

    // Create test workers
    const resultA = await createWorker({
      fullName: 'Worker Update Test A',
      phone: '9990001111',
      position: 'Test Worker',
      siteId: testData.siteWithNoSupervisors.id,
    });
    workerInSiteA = resultA.worker;

    const resultB = await createWorker({
      fullName: 'Worker Update Test B',
      phone: '9990002222',
      position: 'Test Worker',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });
    workerInSiteB = resultB.worker;
  });

  test.afterAll(async () => {
    await cleanupWorkerSupervisorTestData(testData);
  });

  test('Scenario 1: Move worker from site with NO supervisors to site WITH supervisors - supervisorId cleared', async () => {
    const result = await updateWorker(workerInSiteA.id, {
      siteId: testData.siteWithOneSupervisor.id,
      // Note: supervisorId not provided - should be cleared
    });

    expect(result.success).toBe(false); // Should fail because new site requires supervisor
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 2: Move worker from site WITH supervisors to site with NO supervisors - supervisorId cleared', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      siteId: testData.siteWithNoSupervisors.id,
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBeNull(); // Auto-cleared

    // Move back for other tests
    await updateWorker(workerInSiteB.id, {
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });
  });

  test('Scenario 3: Move worker between sites WITH supervisors - must reselect supervisor', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      siteId: testData.siteWithMultipleSupervisors.id,
      // supervisorId not provided - should fail
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 4: Move worker and assign to valid supervisor in new site - SUCCESS', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      siteId: testData.siteWithMultipleSupervisors.id,
      supervisorId: testData.supervisor2.id, // Supervisor 2 is in Site C
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBe(testData.supervisor2.id);
    expect(result.worker?.siteId).toBe(testData.siteWithMultipleSupervisors.id);

    // Move back
    await updateWorker(workerInSiteB.id, {
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });
  });

  test('Scenario 5: Try to clear supervisorId in site WITH supervisors - REJECT', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      supervisorId: null,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 6: Change supervisor within same site - SUCCESS', async () => {
    // First, add supervisor1 to Site C
    await prisma.supervisorSite.create({
      data: {
        supervisorId: testData.supervisor1.id,
        siteId: testData.siteWithMultipleSupervisors.id,
        corporationId: testData.corporation.id,
        legacySupervisorUserId: testData.supervisor1User.id,
      },
    });

    // Create worker in Site C with supervisor 2
    const createResult = await createWorker({
      fullName: 'Worker Change Supervisor Test',
      phone: '9990003333',
      position: 'Test Worker',
      siteId: testData.siteWithMultipleSupervisors.id,
      supervisorId: testData.supervisor2.id,
    });

    expect(createResult.success).toBe(true);
    const worker = createResult.worker!;

    // Change to supervisor 1 (same site)
    const updateResult = await updateWorker(worker.id, {
      supervisorId: testData.supervisor1.id,
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.worker?.supervisorId).toBe(testData.supervisor1.id);

    // Cleanup
    await prisma.worker.delete({ where: { id: worker.id } });
    await prisma.supervisorSite.delete({
      where: {
        supervisorId_siteId: {
          supervisorId: testData.supervisor1.id,
          siteId: testData.siteWithMultipleSupervisors.id,
        },
      },
    });
  });

  test('Scenario 7: Try to assign supervisor from different site - REJECT', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      supervisorId: testData.supervisor2.id, // Supervisor 2 not in Site B
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not assigned to this site');
  });

  test('Scenario 8: Update worker info without changing site or supervisor - SUCCESS', async () => {
    const result = await updateWorker(workerInSiteB.id, {
      fullName: 'Worker Update Test B - Updated',
      position: 'Senior Worker',
    });

    expect(result.success).toBe(true);
    expect(result.worker?.fullName).toBe('Worker Update Test B - Updated');
    expect(result.worker?.supervisorId).toBe(testData.supervisor1.id); // Unchanged
    expect(result.worker?.siteId).toBe(testData.siteWithOneSupervisor.id); // Unchanged
  });
});
