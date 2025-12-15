import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkMismatch() {
  try {
    console.log('🔍 Checking for activists in neighborhoods without coordinator assignments...\n');

    // Get all active activists
    const activists = await prisma.activist.findMany({
      where: { isActive: true },
      include: {
        neighborhood: {
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
        },
        city: true,
      },
    });

    console.log(`Total active activists: ${activists.length}\n`);

    let activistsInUnassignedNeighborhoods = 0;
    const problematicNeighborhoods = new Map<string, any>();

    for (const activist of activists) {
      const coordinatorCount = activist.neighborhood.activistCoordinatorAssignments.length;

      if (coordinatorCount === 0) {
        activistsInUnassignedNeighborhoods++;

        if (!problematicNeighborhoods.has(activist.neighborhood.id)) {
          problematicNeighborhoods.set(activist.neighborhood.id, {
            neighborhood: activist.neighborhood,
            activists: [],
          });
        }

        problematicNeighborhoods.get(activist.neighborhood.id)!.activists.push(activist);
      }
    }

    if (activistsInUnassignedNeighborhoods > 0) {
      console.log(`⚠️  Found ${activistsInUnassignedNeighborhoods} activists in neighborhoods WITHOUT coordinator assignments!\n`);

      problematicNeighborhoods.forEach((data, neighborhoodId) => {
        console.log(`❌ Neighborhood: ${data.neighborhood.name} (${data.neighborhood.city})`);
        console.log(`   ID: ${neighborhoodId}`);
        console.log(`   City ID: ${data.neighborhood.cityId}`);
        console.log(`   Activists (${data.activists.length}):`);
        data.activists.forEach((activist: any) => {
          console.log(`     - ${activist.fullName} (${activist.phone || 'no phone'})`);
        });
        console.log();
      });

      console.log('\n🔧 ISSUE: These activists are in neighborhoods that have NO coordinator assignments.');
      console.log('   Coordinators will NOT be able to see or check in these activists!');
      console.log('\n💡 SOLUTION: Assign coordinators to these neighborhoods using:');
      console.log('   - Through the UI: Edit the neighborhood and assign a coordinator');
      console.log('   - Or run: npx tsx scripts/fix-all-neighborhoods.ts');

    } else {
      console.log('✅ All activists are in neighborhoods with coordinator assignments!');
    }

    // Also check for activists assigned to a coordinator but in a neighborhood that coordinator doesn't have access to
    console.log('\n---\n');
    console.log('🔍 Checking for activists assigned to coordinators who don\'t have access to their neighborhoods...\n');

    const activistsWithCoordinator = await prisma.activist.findMany({
      where: {
        isActive: true,
        activistCoordinatorId: { not: null },
      },
      include: {
        activistCoordinator: {
          include: {
            user: true,
            neighborhoodAssignments: true,
          },
        },
        neighborhood: true,
      },
    });

    let mismatchedActivists = 0;

    for (const activist of activistsWithCoordinator) {
      if (!activist.activistCoordinator) continue;

      const coordinatorHasAccessToNeighborhood = activist.activistCoordinator.neighborhoodAssignments.some(
        (assignment) => assignment.neighborhoodId === activist.neighborhoodId
      );

      if (!coordinatorHasAccessToNeighborhood) {
        mismatchedActivists++;
        console.log(`❌ Activist: ${activist.fullName}`);
        console.log(`   Assigned Coordinator: ${activist.activistCoordinator.user.fullName}`);
        console.log(`   Activist's Neighborhood: ${activist.neighborhood.name}`);
        console.log(`   Problem: Coordinator does NOT have access to this neighborhood!`);
        console.log(`   Coordinator can access: ${activist.activistCoordinator.neighborhoodAssignments.map((a) => a.neighborhoodId).join(', ')}`);
        console.log();
      }
    }

    if (mismatchedActivists > 0) {
      console.log(`\n⚠️  Found ${mismatchedActivists} activists assigned to coordinators who don't have access to their neighborhoods!`);
      console.log('   These activists may have issues with attendance tracking.');
    } else {
      console.log('✅ All activists with coordinators are properly matched to neighborhoods!');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMismatch();
