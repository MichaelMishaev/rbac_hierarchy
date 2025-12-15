import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Simulate getTodaysAttendance logic
async function simulateGetTodaysAttendance(userId: string, userRole: string, isSuperAdmin: boolean) {
  try {
    const today = new Date().toISOString().split('T')[0];

    console.log(`\n🔍 Simulating getTodaysAttendance for user: ${userId}`);
    console.log(`   Role: ${userRole}`);
    console.log(`   SuperAdmin: ${isSuperAdmin}`);
    console.log(`   Date: ${today}\n`);

    // Step 1: Get user cities
    let userCities: string[] = [];
    let coordinatorNeighborhoodIds: string[] = [];

    if (!isSuperAdmin) {
      const [cityCoordinatorCities, activistCoordinatorCities] = await Promise.all([
        prisma.cityCoordinator.findMany({
          where: { userId, isActive: true },
          select: { cityId: true },
        }),
        prisma.activistCoordinator.findMany({
          where: { userId, isActive: true },
          select: { cityId: true },
        }),
      ]);

      const cityIds = [
        ...cityCoordinatorCities.map((m) => m.cityId),
        ...activistCoordinatorCities.map((s) => s.cityId),
      ];

      userCities = Array.from(new Set(cityIds));
      console.log(`📍 User cities: ${userCities.join(', ')}`);
    } else {
      console.log(`📍 SuperAdmin - all cities`);
    }

    // Step 2: For ACTIVIST_COORDINATOR, get neighborhoods
    if (userRole === 'ACTIVIST_COORDINATOR' && !isSuperAdmin) {
      const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { legacyActivistCoordinatorUserId: userId },
        select: { neighborhoodId: true },
      });
      coordinatorNeighborhoodIds = activistCoordinatorNeighborhoods.map((acn) => acn.neighborhoodId);
      console.log(`🗺️  Coordinator neighborhoods: ${coordinatorNeighborhoodIds.join(', ')}`);
      console.log(`   Total: ${coordinatorNeighborhoodIds.length}\n`);
    }

    // Step 3: Build WHERE clause for attendance
    const attendanceWhere: any = {
      date: new Date(today),
    };

    if (!isSuperAdmin) {
      attendanceWhere.cityId = { in: userCities };
    }

    if (userRole === 'ACTIVIST_COORDINATOR' && !isSuperAdmin) {
      attendanceWhere.neighborhoodId = { in: coordinatorNeighborhoodIds };
    }

    console.log(`📋 Attendance WHERE clause:`, JSON.stringify(attendanceWhere, null, 2));

    // Step 4: Fetch attendance records
    const records = await prisma.attendanceRecord.findMany({
      where: attendanceWhere,
      include: {
        activist: true,
        neighborhood: true,
      },
    });

    console.log(`\n✅ Found ${records.length} attendance records for today\n`);

    // Step 5: Get unchecked activists
    const checkedInActivistIds = records.map((r) => r.activistId);

    const uncheckedActivistsWhere: any = {
      isActive: true,
      id: { notIn: checkedInActivistIds },
    };

    if (userRole === 'ACTIVIST_COORDINATOR' && !isSuperAdmin) {
      uncheckedActivistsWhere.neighborhoodId = { in: coordinatorNeighborhoodIds };
    }

    if (!isSuperAdmin) {
      uncheckedActivistsWhere.cityId = { in: userCities };
    }

    console.log(`👥 Unchecked activists WHERE clause:`, JSON.stringify(uncheckedActivistsWhere, null, 2));

    const uncheckedActivists = await prisma.activist.findMany({
      where: uncheckedActivistsWhere,
      include: {
        neighborhood: true,
      },
    });

    console.log(`\n✅ Found ${uncheckedActivists.length} unchecked activists\n`);

    uncheckedActivists.forEach((activist, index) => {
      console.log(`   ${index + 1}. ${activist.fullName} | ${activist.neighborhood.name} | ${activist.phone || 'no phone'}`);
    });

    console.log(`\n📊 Summary:`);
    console.log(`   Total: ${records.length + uncheckedActivists.length}`);
    console.log(`   Present: ${records.length}`);
    console.log(`   Not checked in: ${uncheckedActivists.length}`);

    return {
      checkedIn: records,
      notCheckedIn: uncheckedActivists,
      summary: {
        total: records.length + uncheckedActivists.length,
        present: records.length,
        notPresent: uncheckedActivists.length,
        date: today,
      },
    };
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

async function main() {
  try {
    console.log('==================================================');
    console.log('Testing Attendance Action for Activist Coordinator');
    console.log('==================================================');

    // Test with Rachel Ben-David (Activist Coordinator)
    const rachel = await prisma.user.findUnique({
      where: { email: 'rachel.bendavid@telaviv.test' },
    });

    if (!rachel) {
      console.error('❌ Rachel not found');
      return;
    }

    await simulateGetTodaysAttendance(rachel.id, rachel.role, rachel.isSuperAdmin);

    console.log('\n\n==================================================');
    console.log('Testing for another Activist Coordinator (יוסי)');
    console.log('==================================================');

    const yossi = await prisma.user.findUnique({
      where: { email: 'dima3@gmail.com' },
    });

    if (yossi) {
      await simulateGetTodaysAttendance(yossi.id, yossi.role, yossi.isSuperAdmin);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
