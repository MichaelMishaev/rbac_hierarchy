/**
 * Test Setup for Activist-ActivistCoordinator Integration Tests
 */

import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export interface TestData {
  city: any;
  neighborhoodWithNoActivistCoordinators: any;
  neighborhoodWithOneActivistCoordinator: any;
  neighborhoodWithMultipleActivistCoordinators: any;
  activistCoordinator1: any;
  activistCoordinator2: any;
  activistCoordinator3: any;
  cityCoordinator: any;
  cityCoordinatorUser: any;
}

/**
 * Setup test data
 */
export async function setupActivistCoordinatorTestData(): Promise<TestData> {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  const timestamp = Date.now();

  // City Coordinator user
  const cityCoordinatorUser = await prisma.user.create({
    data: {
      email: `integration-test-manager-${timestamp}@test.com`,
      fullName: 'Integration Test City Coordinator',
      passwordHash,
      role: 'CITY_COORDINATOR',
      isActive: true,
    },
  });

  // Corporation
  const city = await prisma.city.create({
    data: {
      name: 'Integration Test City',
      code: 'TEST_CORP_' + timestamp,
      isActive: true,
    },
  });

  // Manager
  const cityCoordinator = await prisma.cityCoordinator.create({
    data: {
      userId: cityCoordinatorUser.id,
      cityId: city.id,
      title: 'Test City Coordinator',
      isActive: true,
    },
  });

  // Activist Coordinator users
  const coord1User = await prisma.user.create({
    data: {
      email: `supervisor1-${timestamp}@integration-test.com`,
      fullName: 'Activist Coordinator One',
      passwordHash,
      role: 'ACTIVIST_COORDINATOR',
      isActive: true,
    },
  });

  const coord2User = await prisma.user.create({
    data: {
      email: `supervisor2-${timestamp}@integration-test.com`,
      fullName: 'Activist Coordinator Two',
      passwordHash,
      role: 'ACTIVIST_COORDINATOR',
      isActive: true,
    },
  });

  const coord3User = await prisma.user.create({
    data: {
      email: `supervisor3-${timestamp}@integration-test.com`,
      fullName: 'Activist Coordinator Three',
      passwordHash,
      role: 'ACTIVIST_COORDINATOR',
      isActive: true,
    },
  });

  // Activist Coordinators
  const activistCoordinator1 = await prisma.activistCoordinator.create({
    data: {
      userId: coord1User.id,
      cityId: city.id,
      title: 'Supervisor 1',
      isActive: true,
    },
  });

  const activistCoordinator2 = await prisma.activistCoordinator.create({
    data: {
      userId: coord2User.id,
      cityId: city.id,
      title: 'Supervisor 2',
      isActive: true,
    },
  });

  const activistCoordinator3 = await prisma.activistCoordinator.create({
    data: {
      userId: coord3User.id,
      cityId: city.id,
      title: 'Supervisor 3',
      isActive: true,
    },
  });

  // Neighborhood 1: No supervisors
  const neighborhoodWithNoActivistCoordinators = await prisma.neighborhood.create({
    data: {
      name: 'Test Neighborhood A - No Activist Coordinators',
      cityId: city.id,
      address: 'Address A',
      city: 'City A',
      isActive: true,
    },
  });

  // Neighborhood 2: One supervisor
  const neighborhoodWithOneActivistCoordinator = await prisma.neighborhood.create({
    data: {
      name: 'Test Neighborhood B - One Activist Coordinator',
      cityId: city.id,
      address: 'Address B',
      city: 'City B',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.create({
    data: {
      activistCoordinatorId: activistCoordinator1.id,
      neighborhoodId: neighborhoodWithOneActivistCoordinator.id,
      cityId: city.id,
      legacyActivistCoordinatorUserId: coord1User.id,
    },
  });

  // Neighborhood 3: Multiple supervisors
  const neighborhoodWithMultipleActivistCoordinators = await prisma.neighborhood.create({
    data: {
      name: 'Test Neighborhood C - Multiple Activist Coordinators',
      cityId: city.id,
      address: 'Address C',
      city: 'City C',
      isActive: true,
    },
  });

  await prisma.activistCoordinatorNeighborhood.createMany({
    data: [
      { activistCoordinatorId: activistCoordinator2.id, neighborhoodId: neighborhoodWithMultipleActivistCoordinators.id, cityId: city.id, legacyActivistCoordinatorUserId: coord2User.id },
      { activistCoordinatorId: activistCoordinator3.id, neighborhoodId: neighborhoodWithMultipleActivistCoordinators.id, cityId: city.id, legacyActivistCoordinatorUserId: coord3User.id },
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
    cityCoordinator,
    cityCoordinatorUser,
  };
}

/**
 * Cleanup test data
 */
export async function cleanupActivistCoordinatorTestData(testData: TestData) {
  await prisma.activist.deleteMany({ where: { cityId: testData.city.id } });
  await prisma.activistCoordinatorNeighborhood.deleteMany({ where: { cityId: testData.city.id } });
  await prisma.activistCoordinator.deleteMany({ where: { cityId: testData.city.id } });
  await prisma.cityCoordinator.deleteMany({ where: { cityId: testData.city.id } });
  await prisma.neighborhood.deleteMany({ where: { cityId: testData.city.id } });
  await prisma.city.delete({ where: { id: testData.city.id } });
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
