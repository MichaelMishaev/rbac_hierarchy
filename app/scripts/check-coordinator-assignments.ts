import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCoordinatorAssignments() {
  try {
    console.log('🔍 Checking Activist Coordinator Neighborhood Assignments...\n');

    // 1. Get all activist coordinators
    const coordinators = await prisma.activistCoordinator.findMany({
      where: { isActive: true },
      include: {
        user: true,
        city: true,
        neighborhoodAssignments: {
          include: {
            neighborhood: true,
          },
        },
      },
    });

    console.log(`Found ${coordinators.length} active activist coordinators\n`);

    let coordinatorsWithoutAssignments = 0;

    for (const coordinator of coordinators) {
      const assignmentCount = coordinator.neighborhoodAssignments.length;

      if (assignmentCount === 0) {
        coordinatorsWithoutAssignments++;
        console.log(`❌ NO ASSIGNMENTS: ${coordinator.user.fullName} (${coordinator.user.email})`);
        console.log(`   City: ${coordinator.city.name}`);
        console.log(`   Coordinator ID: ${coordinator.id}`);
        console.log(`   User ID: ${coordinator.userId}\n`);
      } else {
        console.log(`✅ ${coordinator.user.fullName} (${coordinator.user.email})`);
        console.log(`   City: ${coordinator.city.name}`);
        console.log(`   Assigned neighborhoods (${assignmentCount}):`);
        coordinator.neighborhoodAssignments.forEach((assignment) => {
          console.log(`     - ${assignment.neighborhood.name} (ID: ${assignment.neighborhoodId})`);
        });
        console.log();
      }
    }

    console.log('\n📊 Summary:');
    console.log(`   Total coordinators: ${coordinators.length}`);
    console.log(`   Coordinators with assignments: ${coordinators.length - coordinatorsWithoutAssignments}`);
    console.log(`   Coordinators WITHOUT assignments: ${coordinatorsWithoutAssignments}`);

    if (coordinatorsWithoutAssignments > 0) {
      console.log('\n⚠️  WARNING: Some coordinators have NO neighborhood assignments!');
      console.log('   These coordinators will not be able to see or check in any activists.');
      console.log('   Run fix-all-neighborhoods.ts to assign neighborhoods to coordinators.');
    } else {
      console.log('\n✅ All coordinators have neighborhood assignments!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCoordinatorAssignments();
