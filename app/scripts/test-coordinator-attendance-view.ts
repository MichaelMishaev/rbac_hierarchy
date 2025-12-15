import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testCoordinatorView() {
  try {
    console.log('🔍 Testing Activist Coordinator Attendance View...\n');

    // Test with Rachel Ben-David (rachel.bendavid@telaviv.test)
    const testUser = await prisma.user.findUnique({
      where: { email: 'rachel.bendavid@telaviv.test' },
      include: {
        activistCoordinatorOf: {
          include: {
            neighborhoodAssignments: {
              include: {
                neighborhood: {
                  include: {
                    activists: {
                      where: { isActive: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!testUser) {
      console.error('❌ Test user not found');
      return;
    }

    console.log(`✅ Testing with user: ${testUser.fullName} (${testUser.email})`);
    console.log(`   Role: ${testUser.role}`);
    console.log(`   User ID: ${testUser.id}\n`);

    // Get their coordinator record
    const coordinatorRecord = testUser.activistCoordinatorOf[0];
    if (!coordinatorRecord) {
      console.error('❌ User is not an activist coordinator');
      return;
    }

    console.log(`📋 Activist Coordinator Record:`);
    console.log(`   Coordinator ID: ${coordinatorRecord.id}`);
    console.log(`   City ID: ${coordinatorRecord.cityId}\n`);

    // Check neighborhood assignments
    console.log(`🗺️  Neighborhood Assignments:`);
    const assignedNeighborhoods = coordinatorRecord.neighborhoodAssignments;
    console.log(`   Total assigned: ${assignedNeighborhoods.length}\n`);

    assignedNeighborhoods.forEach((assignment, index) => {
      console.log(`   ${index + 1}. ${assignment.neighborhood.name}`);
      console.log(`      Neighborhood ID: ${assignment.neighborhoodId}`);
      console.log(`      City ID: ${assignment.cityId}`);
      console.log(`      Legacy User ID in assignment: ${assignment.legacyActivistCoordinatorUserId}`);
      console.log(`      Activists in this neighborhood: ${assignment.neighborhood.activists.length}`);
      assignment.neighborhood.activists.forEach((activist) => {
        console.log(`        - ${activist.fullName} (${activist.phone || 'no phone'})`);
      });
      console.log();
    });

    // Now simulate the attendance query
    console.log('---\n');
    console.log('🔍 Simulating getTodaysAttendance query...\n');

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Step 1: Get coordinator neighborhoods (as the attendance action does)
    const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
      where: { legacyActivistCoordinatorUserId: testUser.id },
      select: { neighborhoodId: true },
    });
    const coordinatorNeighborhoodIds = activistCoordinatorNeighborhoods.map((acn) => acn.neighborhoodId);

    console.log(`📍 Coordinator neighborhood IDs (from legacyActivistCoordinatorUserId):`);
    console.log(`   ${coordinatorNeighborhoodIds.join(', ')}`);
    console.log(`   Total: ${coordinatorNeighborhoodIds.length}\n`);

    // Step 2: Query attendance records for today
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: {
        date: new Date(today),
        neighborhoodId: { in: coordinatorNeighborhoodIds },
      },
      include: {
        activist: true,
        neighborhood: true,
      },
    });

    console.log(`📊 Attendance records for today:`);
    console.log(`   Total: ${attendanceRecords.length}\n`);

    // Step 3: Query unchecked activists
    const checkedInActivistIds = attendanceRecords.map((r) => r.activistId);

    const uncheckedActivists = await prisma.activist.findMany({
      where: {
        isActive: true,
        id: { notIn: checkedInActivistIds },
        neighborhoodId: { in: coordinatorNeighborhoodIds },
      },
      include: {
        neighborhood: true,
      },
    });

    console.log(`👥 Unchecked activists:`);
    console.log(`   Total: ${uncheckedActivists.length}\n`);

    if (uncheckedActivists.length === 0) {
      console.log('⚠️  NO ACTIVISTS FOUND!');
      console.log('\nDebugging...\n');

      // Check if there are ANY activists in these neighborhoods
      const allActivists = await prisma.activist.findMany({
        where: {
          neighborhoodId: { in: coordinatorNeighborhoodIds },
        },
        include: {
          neighborhood: true,
        },
      });

      console.log(`   Total activists in coordinator's neighborhoods (including inactive): ${allActivists.length}`);
      allActivists.forEach((activist) => {
        console.log(`     - ${activist.fullName} | Neighborhood: ${activist.neighborhood.name} | Active: ${activist.isActive}`);
      });
    } else {
      uncheckedActivists.forEach((activist) => {
        console.log(`   - ${activist.fullName}`);
        console.log(`     Neighborhood: ${activist.neighborhood.name}`);
        console.log(`     Active: ${activist.isActive}`);
      });
    }

    console.log('\n✅ Test complete!');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testCoordinatorView();
