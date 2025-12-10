/**
 * Test Data Fixtures for Activist-ActivistCoordinator Automation
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface TestScenarioData {
  city: any;
  neighborhoodWithNoActivistCoordinators: any;
  neighborhoodWithOneActivistCoordinator: any;
  neighborhoodWithMultipleActivistCoordinators: any;
  activistCoordinator1: any;
  activistCoordinator2: any;
  activistCoordinator3: any;
  activistCoordinator1User: any;
  activistCoordinator2User: any;
  activistCoordinator3User: any;
  cityCoordinator: any;
  cityCoordinatorUser: any;
}

/**
 * Setup comprehensive test data for all scenarios
 */
export async function setupActivistCoordinatorTestData(): Promise<TestScenarioData> {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);

  // Create manager user
  const cityCoordinatorUser = await prisma.user.create({
    data: {
      email: 'test-manager@worker-supervisor-test.com',
      fullName: 'Test City Coordinator',
      passwordHash,
      role: 'CITY_COORDINATOR',
      isActive: true,
    },
  });

  // Create corporation
  const city = await prisma.city.create({
    data: {
      name: 'Test City - Activist Coordinator Scenarios',
      code: 'TEST-WS',
      isActive: true,
    },
  });

  // Create manager
  const cityCoordinator = await prisma.cityCoordinator.create({
    data: {
      userId: managerUser.id,
      cityId: corporation.id,
      title: 'Test City Coordinator',
      isActive: true,
    },
  });

  // Create supervisor users
  const activistCoordinator1User = await prisma.user.create({
    data: {
      email: 'supervisor1@test.com',
      fullName: 'Activist Coordinator One',
      passwordHash,
      role: 'ACTIVIST_COORDINATOR',
      isActive: true,
    },
  });

  const activistCoordinator2User = await prisma.user.create({
    data: {
      email: 'supervisor2@test.com',
      fullName: 'Activist Coordinator Two',
      passwordHash,
      role: 'ACTIVIST_COORDINATOR',
      isActive: true,
    },
  });

  const activistCoordinator3User = await prisma.user.create({
    data: {
      email: 'supervisor3@test.com',
      fullName: 'Activist Coordinator Three',
      passwordHash,
      role: 'ACTIVIST_COORDINATOR',
      isActive: true,
    },
  });

  // Create supervisors
  const activistCoordinator1 = await prisma.activistCoordinator.create({
    data: {
      userId: supervisor1User.id,
      cityId: corporation.id,
      title: 'Supervisor 1',
      isActive: true,
    },
  });

  const activistCoordinator2 = await prisma.activistCoordinator.create({
    data: {
      userId: supervisor2User.id,
      cityId: corporation.id,
      title: 'Supervisor 2',
      isActive: true,
    },
  });

  const activistCoordinator3 = await prisma.activistCoordinator.create({
    data: {
      userId: supervisor3User.id,
      cityId: corporation.id,
      title: 'Supervisor 3',
      isActive: true,
    },
  });

  // Site 1: No supervisors
  const neighborhoodWithNoActivistCoordinators = await prisma.neighborhood.create({
    data: {
      name: 'Site A - No Supervisors',
      cityId: corporation.id,
      address: 'Address A',
      city: 'City A',
      isActive: true,
    },
  });

  // Site 2: One supervisor
  const neighborhoodWithOneActivistCoordinator = await prisma.neighborhood.create({
    data: {
      name: 'Site B - One Supervisor',
      cityId: corporation.id,
      address: 'Address B',
      city: 'City B',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.create({
    data: {
      activistCoordinatorId: supervisor1.id,
      neighborhoodId: siteWithOneSupervisor.id,
      cityId: corporation.id,
      legacySupervisorUserId: supervisor1User.id,
    },
  });

  // Site 3: Multiple supervisors
  const neighborhoodWithMultipleActivistCoordinators = await prisma.neighborhood.create({
    data: {
      name: 'Site C - Multiple Supervisors',
      cityId: corporation.id,
      address: 'Address C',
      city: 'City C',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.createMany({
    data: [
      {
        activistCoordinatorId: supervisor2.id,
        neighborhoodId: siteWithMultipleSupervisors.id,
        cityId: corporation.id,
        legacySupervisorUserId: supervisor2User.id,
      },
      {
        activistCoordinatorId: supervisor3.id,
        neighborhoodId: siteWithMultipleSupervisors.id,
        cityId: corporation.id,
        legacySupervisorUserId: supervisor3User.id,
      },
    ],
  });

  return {
    city,
    neighborhoodWithNoActivistCoordinators,
    neighborhoodWithOneActivistCoordinator,
    neighborhoodWithMultipleActivistCoordinators,
    activistCoordinator1,
    activistCoordinator2,
    activistCoordinator3,
    activistCoordinator1User,
    activistCoordinator2User,
    activistCoordinator3User,
    cityCoordinator,
    cityCoordinatorUser,
  };
}

/**
 * Cleanup test data
 */
export async function cleanupActivistCoordinatorTestData(testData: TestScenarioData) {
  // Delete in correct order due to foreign keys
  await prisma.activist.deleteMany({
    where: { cityId: testData.city.id },
  });

  await prisma.activistCoordinatorNeighborhood.deleteMany({
    where: { cityId: testData.city.id },
  });

  await prisma.activistCoordinator.deleteMany({
    where: { cityId: testData.city.id },
  });

  await prisma.cityCoordinator.deleteMany({
    where: { cityId: testData.city.id },
  });

  await prisma.neighborhood.deleteMany({
    where: { cityId: testData.city.id },
  });

  await prisma.city.delete({
    where: { id: testData.city.id },
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
