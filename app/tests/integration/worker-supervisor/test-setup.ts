/**
 * Test Setup for Worker-Supervisor Integration Tests
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface TestData {
  corporation: any;
  siteWithNoSupervisors: any;
  siteWithOneSupervisor: any;
  siteWithMultipleSupervisors: any;
  supervisor1: any;
  supervisor2: any;
  supervisor3: any;
  manager: any;
  managerUser: any;
}

/**
 * Setup test data
 */
export async function setupWorkerSupervisorTestData(): Promise<TestData> {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  const timestamp = Date.now();

  // Manager user
  const managerUser = await prisma.user.create({
    data: {
      email: `integration-test-manager-${timestamp}@test.com`,
      fullName: 'Integration Test Manager',
      passwordHash,
      role: 'MANAGER',
      isActive: true,
    },
  });

  // Corporation
  const corporation = await prisma.corporation.create({
    data: {
      name: 'Integration Test Corporation',
      code: 'TEST_CORP_' + timestamp,
      isActive: true,
    },
  });

  // Manager
  const manager = await prisma.corporationManager.create({
    data: {
      userId: managerUser.id,
      corporationId: corporation.id,
      title: 'Test Manager',
      isActive: true,
    },
  });

  // Supervisor users
  const sup1User = await prisma.user.create({
    data: {
      email: `supervisor1-${timestamp}@integration-test.com`,
      fullName: 'Supervisor One',
      passwordHash,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  const sup2User = await prisma.user.create({
    data: {
      email: `supervisor2-${timestamp}@integration-test.com`,
      fullName: 'Supervisor Two',
      passwordHash,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  const sup3User = await prisma.user.create({
    data: {
      email: `supervisor3-${timestamp}@integration-test.com`,
      fullName: 'Supervisor Three',
      passwordHash,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  // Supervisors
  const supervisor1 = await prisma.supervisor.create({
    data: {
      userId: sup1User.id,
      corporationId: corporation.id,
      title: 'Supervisor 1',
      isActive: true,
    },
  });

  const supervisor2 = await prisma.supervisor.create({
    data: {
      userId: sup2User.id,
      corporationId: corporation.id,
      title: 'Supervisor 2',
      isActive: true,
    },
  });

  const supervisor3 = await prisma.supervisor.create({
    data: {
      userId: sup3User.id,
      corporationId: corporation.id,
      title: 'Supervisor 3',
      isActive: true,
    },
  });

  // Site 1: No supervisors
  const siteWithNoSupervisors = await prisma.site.create({
    data: {
      name: 'Test Site A - No Supervisors',
      corporationId: corporation.id,
      address: 'Address A',
      city: 'City A',
      isActive: true,
    },
  });

  // Site 2: One supervisor
  const siteWithOneSupervisor = await prisma.site.create({
    data: {
      name: 'Test Site B - One Supervisor',
      corporationId: corporation.id,
      address: 'Address B',
      city: 'City B',
      isActive: true,
    },
  });

  await prisma.supervisorSite.create({
    data: {
      supervisorId: supervisor1.id,
      siteId: siteWithOneSupervisor.id,
      corporationId: corporation.id,
      legacySupervisorUserId: sup1User.id,
    },
  });

  // Site 3: Multiple supervisors
  const siteWithMultipleSupervisors = await prisma.site.create({
    data: {
      name: 'Test Site C - Multiple Supervisors',
      corporationId: corporation.id,
      address: 'Address C',
      city: 'City C',
      isActive: true,
    },
  });

  await prisma.supervisorSite.createMany({
    data: [
      { supervisorId: supervisor2.id, siteId: siteWithMultipleSupervisors.id, corporationId: corporation.id, legacySupervisorUserId: sup2User.id },
      { supervisorId: supervisor3.id, siteId: siteWithMultipleSupervisors.id, corporationId: corporation.id, legacySupervisorUserId: sup3User.id },
    ],
  });

  return {
    corporation,
    siteWithNoSupervisors,
    siteWithOneSupervisor,
    siteWithMultipleSupervisors,
    supervisor1,
    supervisor2,
    supervisor3,
    manager,
    managerUser,
  };
}

/**
 * Cleanup test data
 */
export async function cleanupWorkerSupervisorTestData(testData: TestData) {
  await prisma.worker.deleteMany({ where: { corporationId: testData.corporation.id } });
  await prisma.supervisorSite.deleteMany({ where: { corporationId: testData.corporation.id } });
  await prisma.supervisor.deleteMany({ where: { corporationId: testData.corporation.id } });
  await prisma.corporationManager.deleteMany({ where: { corporationId: testData.corporation.id } });
  await prisma.site.deleteMany({ where: { corporationId: testData.corporation.id } });
  await prisma.corporation.delete({ where: { id: testData.corporation.id } });
  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'integration-test-manager@test.com',
          'supervisor1@integration-test.com',
          'supervisor2@integration-test.com',
          'supervisor3@integration-test.com',
        ],
      },
    },
  });
}

/**
 * Test assertion helper
 */
export function assert(condition: boolean, message: string, result: { passed: number; failed: number; errors: string[] }) {
  if (condition) {
    result.passed++;
    console.log(`  ✅ ${message}`);
  } else {
    result.failed++;
    result.errors.push(message);
    console.log(`  ❌ ${message}`);
  }
}
