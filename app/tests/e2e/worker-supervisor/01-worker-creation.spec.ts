/**
 * E2E Tests: Worker Creation Validation
 *
 * Tests all scenarios for creating workers with supervisor assignment rules:
 * - Site with 0 supervisors → supervisorId must be null
 * - Site with ≥1 supervisors → supervisorId required
 * - Supervisor must be assigned to site
 * - Supervisor must be active
 */

import { test, expect } from '@playwright/test';
import { setupWorkerSupervisorTestData, cleanupWorkerSupervisorTestData, type TestScenarioData } from './fixtures/test-data';
import { createWorker } from '@/app/actions/workers';
import { prisma } from '@/lib/prisma';

test.describe('Worker Creation - Supervisor Assignment Rules', () => {
  let testData: TestScenarioData;

  test.beforeAll(async () => {
    testData = await setupWorkerSupervisorTestData();
  });

  test.afterAll(async () => {
    await cleanupWorkerSupervisorTestData(testData);
  });

  test('Scenario 1: Create worker in site with NO supervisors - supervisorId must be NULL', async () => {
    const result = await createWorker({
      fullName: 'Worker A1',
      phone: '1234567890',
      position: 'Laborer',
      siteId: testData.siteWithNoSupervisors.id,
      supervisorId: undefined, // Not provided
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBeNull();

    // Cleanup
    if (result.worker) {
      await prisma.worker.delete({ where: { id: result.worker.id } });
    }
  });

  test('Scenario 2: Create worker in site with NO supervisors - REJECT if supervisorId provided', async () => {
    const result = await createWorker({
      fullName: 'Worker A2',
      phone: '1234567891',
      position: 'Laborer',
      siteId: testData.siteWithNoSupervisors.id,
      supervisorId: testData.supervisor1.id, // Invalid - site has no supervisors
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Site has no supervisors');
  });

  test('Scenario 3: Create worker in site with ONE supervisor - supervisorId REQUIRED', async () => {
    const result = await createWorker({
      fullName: 'Worker B1',
      phone: '1234567892',
      position: 'Laborer',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: undefined, // Missing required field
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 4: Create worker in site with ONE supervisor - SUCCESS with valid supervisor', async () => {
    const result = await createWorker({
      fullName: 'Worker B2',
      phone: '1234567893',
      position: 'Laborer',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBe(testData.supervisor1.id);

    // Cleanup
    if (result.worker) {
      await prisma.worker.delete({ where: { id: result.worker.id } });
    }
  });

  test('Scenario 5: Create worker with supervisor NOT assigned to site - REJECT', async () => {
    const result = await createWorker({
      fullName: 'Worker B3',
      phone: '1234567894',
      position: 'Laborer',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor2.id, // Supervisor 2 not assigned to Site B
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('not assigned to this site');
  });

  test('Scenario 6: Create worker with inactive supervisor - REJECT', async () => {
    // Deactivate supervisor 1
    await prisma.supervisor.update({
      where: { id: testData.supervisor1.id },
      data: { isActive: false },
    });

    const result = await createWorker({
      fullName: 'Worker B4',
      phone: '1234567895',
      position: 'Laborer',
      siteId: testData.siteWithOneSupervisor.id,
      supervisorId: testData.supervisor1.id,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('inactive');

    // Reactivate
    await prisma.supervisor.update({
      where: { id: testData.supervisor1.id },
      data: { isActive: true },
    });
  });

  test('Scenario 7: Create worker in site with MULTIPLE supervisors - REQUIRE manual selection', async () => {
    const result = await createWorker({
      fullName: 'Worker C1',
      phone: '1234567896',
      position: 'Laborer',
      siteId: testData.siteWithMultipleSupervisors.id,
      supervisorId: undefined, // Missing required field
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Worker must be assigned to a supervisor');
  });

  test('Scenario 8: Create worker in site with MULTIPLE supervisors - SUCCESS with valid selection', async () => {
    const result = await createWorker({
      fullName: 'Worker C2',
      phone: '1234567897',
      position: 'Laborer',
      siteId: testData.siteWithMultipleSupervisors.id,
      supervisorId: testData.supervisor2.id,
    });

    expect(result.success).toBe(true);
    expect(result.worker).toBeDefined();
    expect(result.worker?.supervisorId).toBe(testData.supervisor2.id);

    // Cleanup
    if (result.worker) {
      await prisma.worker.delete({ where: { id: result.worker.id } });
    }
  });
});
