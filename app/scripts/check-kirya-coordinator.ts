import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkKiryaCoordinator() {
  try {
    const neighborhood = await prisma.neighborhood.findFirst({
      where: { name: 'הקריה' },
      include: {
        activistCoordinatorAssignments: {
          include: {
            activistCoordinator: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!neighborhood) {
      console.log('❌ Neighborhood "הקריה" not found');
      return;
    }

    console.log(`\n✅ Neighborhood: ${neighborhood.name}`);
    console.log(`📍 Assigned Coordinators:\n`);

    if (neighborhood.activistCoordinatorAssignments.length === 0) {
      console.log('   ⚠️  No coordinators assigned');
    } else {
      neighborhood.activistCoordinatorAssignments.forEach((assignment) => {
        console.log(`   ✅ ${assignment.activistCoordinator.user.fullName} (${assignment.activistCoordinator.user.email})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkKiryaCoordinator();
