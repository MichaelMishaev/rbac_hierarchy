/**
 * Test Data Fixtures for Worker-Supervisor Automation
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface TestScenarioData {
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
 * Setup comprehensive test data for all scenarios
 */
export async function setupWorkerSupervisorTestData(): Promise<TestScenarioData> {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  // Create manager user
  const managerUser = await prisma.user.create({
    data: {
      email: 'test-manager@worker-supervisor-test.com',
      fullName: 'Test Manager',
      passwordHash,
      role: 'MANAGER',
      isActive: true,
    },
  });

  // Create corporation
  const corporation = await prisma.corporation.create({
    data: {
      name: 'Test Corp - Worker Supervisor Scenarios',
      code: 'TEST-WS',
      isActive: true,
    },
  });

  // Create manager
  const manager = await prisma.corporationManager.create({
    data: {
      userId: managerUser.id,
      corporationId: corporation.id,
      title: 'Test Manager',
      isActive: true,
    },
  });

  // Create supervisor users
  const supervisor1User = await prisma.user.create({
    data: {
      email: 'supervisor1@test.com',
      fullName: 'Supervisor One',
      passwordHash,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  const supervisor2User = await prisma.user.create({
    data: {
      email: 'supervisor2@test.com',
      fullName: 'Supervisor Two',
      passwordHash,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  const supervisor3User = await prisma.user.create({
    data: {
      email: 'supervisor3@test.com',
      fullName: 'Supervisor Three',
      passwordHash,
      role: 'SUPERVISOR',
      isActive: true,
    },
  });

  // Create supervisors
  const supervisor1 = await prisma.supervisor.create({
    data: {
      userId: supervisor1User.id,
      corporationId: corporation.id,
      title: 'Supervisor 1',
      isActive: true,
    },
  });

  const supervisor2 = await prisma.supervisor.create({
    data: {
      userId: supervisor2User.id,
      corporationId: corporation.id,
      title: 'Supervisor 2',
      isActive: true,
    },
  });

  const supervisor3 = await prisma.supervisor.create({
    data: {
      userId: supervisor3User.id,
      corporationId: corporation.id,
      title: 'Supervisor 3',
      isActive: true,
    },
  });

  // Site 1: No supervisors
  const siteWithNoSupervisors = await prisma.site.create({
    data: {
      name: 'Site A - No Supervisors',
      corporationId: corporation.id,
      address: 'Address A',
      city: 'City A',
      isActive: true,
    },
  });

  // Site 2: One supervisor
  const siteWithOneSupervisor = await prisma.site.create({
    data: {
      name: 'Site B - One Supervisor',
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
      legacySupervisorUserId: supervisor1User.id,
    },
  });

  // Site 3: Multiple supervisors
  const siteWithMultipleSupervisors = await prisma.site.create({
    data: {
      name: 'Site C - Multiple Supervisors',
      corporationId: corporation.id,
      address: 'Address C',
      city: 'City C',
      isActive: true,
    },
  });

  await prisma.supervisorSite.createMany({
    data: [
      {
        supervisorId: supervisor2.id,
        siteId: siteWithMultipleSupervisors.id,
        corporationId: corporation.id,
        legacySupervisorUserId: supervisor2User.id,
      },
      {
        supervisorId: supervisor3.id,
        siteId: siteWithMultipleSupervisors.id,
        corporationId: corporation.id,
        legacySupervisorUserId: supervisor3User.id,
      },
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
    supervisor1User,
    supervisor2User,
    supervisor3User,
    manager,
    managerUser,
  };
}

/**
 * Cleanup test data
 */
export async function cleanupWorkerSupervisorTestData(testData: TestScenarioData) {
  // Delete in correct order due to foreign keys
  await prisma.worker.deleteMany({
    where: { corporationId: testData.corporation.id },
  });

  await prisma.supervisorSite.deleteMany({
    where: { corporationId: testData.corporation.id },
  });

  await prisma.supervisor.deleteMany({
    where: { corporationId: testData.corporation.id },
  });

  await prisma.corporationManager.deleteMany({
    where: { corporationId: testData.corporation.id },
  });

  await prisma.site.deleteMany({
    where: { corporationId: testData.corporation.id },
  });

  await prisma.corporation.delete({
    where: { id: testData.corporation.id },
  });

  await prisma.user.deleteMany({
    where: {
      email: {
        in: [
          'test-manager@worker-supervisor-test.com',
          'supervisor1@test.com',
          'supervisor2@test.com',
          'supervisor3@test.com',
        ],
      },
    },
  });
}
