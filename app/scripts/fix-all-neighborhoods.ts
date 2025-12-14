import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAllNeighborhoods() {
  try {
    // Get all neighborhoods without coordinators
    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            activistCoordinatorAssignments: true,
          },
        },
        cityRelation: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const needsCoordinator = neighborhoods.filter(
      (n) => n._count.activistCoordinatorAssignments === 0
    );

    console.log(`\n🔧 Fixing ${needsCoordinator.length} neighborhoods without coordinators...\n`);

    let fixed = 0;
    let skipped = 0;

    for (const neighborhood of needsCoordinator) {
      // Find an active coordinator for this city
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
        console.log(`⚠️  ${neighborhood.name} - No coordinator available for ${neighborhood.cityRelation.name}`);
        skipped++;
        continue;
      }

      // Assign coordinator to neighborhood
      await prisma.activistCoordinatorNeighborhood.create({
        data: {
          activistCoordinatorId: coordinator.id,
          neighborhoodId: neighborhood.id,
          cityId: neighborhood.cityId,
          legacyActivistCoordinatorUserId: coordinator.userId,
        },
      });

      console.log(`✅ ${neighborhood.name} → ${coordinator.user.fullName}`);
      fixed++;
    }

    console.log(`\n📊 Results:`);
    console.log(`   ✅ Fixed: ${fixed}`);
    console.log(`   ⚠️  Skipped (no coordinator available): ${skipped}`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAllNeighborhoods();
