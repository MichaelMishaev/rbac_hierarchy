import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNeighborhoodCoordinator() {
  try {
    // 1. Find the neighborhood "גבעת התמרים"
    const neighborhood = await prisma.neighborhood.findFirst({
      where: { name: 'גבעת התמרים' },
    });

    if (!neighborhood) {
      console.error('❌ Neighborhood "גבעת התמרים" not found');
      return;
    }

    console.log('✅ Found neighborhood:', neighborhood.name, `(ID: ${neighborhood.id})`);

    // 2. Find activist coordinator for Tel Aviv
    const coordinator = await prisma.activistCoordinator.findFirst({
      where: {
        cityId: neighborhood.cityId,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    if (!coordinator) {
      console.error('❌ No active coordinator found for this city');
      return;
    }

    console.log('✅ Found coordinator:', coordinator.user.fullName, `(ID: ${coordinator.id})`);

    // 3. Check if already assigned
    const existing = await prisma.activistCoordinatorNeighborhood.findUnique({
      where: {
        activistCoordinatorId_neighborhoodId: {
          activistCoordinatorId: coordinator.id,
          neighborhoodId: neighborhood.id,
        },
      },
    });

    if (existing) {
      console.log('⚠️  Coordinator is already assigned to this neighborhood');
      return;
    }

    // 4. Assign coordinator to neighborhood
    const assignment = await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: coordinator.id,
        neighborhoodId: neighborhood.id,
        cityId: neighborhood.cityId,
        legacyActivistCoordinatorUserId: coordinator.userId,
      },
    });

    console.log('✅ Successfully assigned coordinator to neighborhood!');
    console.log('Assignment ID:', assignment.id);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixNeighborhoodCoordinator();
