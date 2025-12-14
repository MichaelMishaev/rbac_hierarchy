import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkNeighborhoods() {
  try {
    // Get all neighborhoods with coordinator counts
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
            name: true,
          },
        },
      },
    });

    console.log('\n📊 Neighborhood Coordinator Status:\n');
    console.log('='.repeat(80));

    const withoutCoordinators: any[] = [];

    neighborhoods.forEach((n) => {
      const coordCount = n._count.activistCoordinatorAssignments;
      const status = coordCount === 0 ? '❌ NO COORDINATORS' : `✅ ${coordCount} coordinator(s)`;

      console.log(`${status.padEnd(25)} | ${n.name.padEnd(30)} | ${n.cityRelation.name}`);

      if (coordCount === 0) {
        withoutCoordinators.push(n);
      }
    });

    console.log('='.repeat(80));
    console.log(`\n📈 Summary:`);
    console.log(`   Total neighborhoods: ${neighborhoods.length}`);
    console.log(`   With coordinators: ${neighborhoods.length - withoutCoordinators.length}`);
    console.log(`   WITHOUT coordinators: ${withoutCoordinators.length}`);

    if (withoutCoordinators.length > 0) {
      console.log(`\n⚠️  Neighborhoods needing coordinators:`);
      withoutCoordinators.forEach(n => {
        console.log(`   - ${n.name} (${n.cityRelation.name})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkNeighborhoods();
