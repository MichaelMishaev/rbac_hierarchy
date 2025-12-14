import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AGGRESSIVE Database Cleanup Script
 *
 * KEEPS:
 * - SuperAdmin user (1 user)
 * - Cities (82 cities, areaManagerId set to NULL)
 *
 * DELETES:
 * - ALL Area Managers (role records)
 * - ALL Area Manager users
 * - All activists (workers)
 * - All activist coordinators
 * - All city coordinators
 * - All neighborhoods
 * - All non-SuperAdmin users
 * - All related data (tasks, attendance, etc.)
 */
async function cleanupAggressive() {
  console.log('\n🧹 Starting AGGRESSIVE Database Cleanup...\n');
  console.log('⚠️  This will DELETE ALL DATA except SuperAdmin user and Cities\n');

  try {
    // Step 1: Delete activists (workers)
    console.log('1️⃣  Deleting activists...');
    const deletedActivists = await prisma.activist.deleteMany({});
    console.log(`   ✅ Deleted ${deletedActivists.count} activists`);

    // Step 2: Delete task assignments
    console.log('2️⃣  Deleting task assignments...');
    const deletedTaskAssignments = await prisma.taskAssignment.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTaskAssignments.count} task assignments`);

    // Step 3: Delete tasks
    console.log('3️⃣  Deleting tasks...');
    const deletedTasks = await prisma.task.deleteMany({});
    console.log(`   ✅ Deleted ${deletedTasks.count} tasks`);

    // Step 4: Delete attendance records
    console.log('4️⃣  Deleting attendance records...');
    const deletedAttendance = await prisma.attendanceRecord.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAttendance.count} attendance records`);

    // Step 5: Delete activist coordinator neighborhood assignments (junction table)
    console.log('5️⃣  Deleting activist coordinator-neighborhood assignments...');
    const deletedAssignments = await prisma.activistCoordinatorNeighborhood.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAssignments.count} assignments`);

    // Step 6: Delete neighborhoods
    console.log('6️⃣  Deleting neighborhoods...');
    const deletedNeighborhoods = await prisma.neighborhood.deleteMany({});
    console.log(`   ✅ Deleted ${deletedNeighborhoods.count} neighborhoods`);

    // Step 7: Delete activist coordinators (role records)
    console.log('7️⃣  Deleting activist coordinators...');
    const deletedActivistCoordinators = await prisma.activistCoordinator.deleteMany({});
    console.log(`   ✅ Deleted ${deletedActivistCoordinators.count} activist coordinators`);

    // Step 8: Delete city coordinators (role records)
    console.log('8️⃣  Deleting city coordinators...');
    const deletedCityCoordinators = await prisma.cityCoordinator.deleteMany({});
    console.log(`   ✅ Deleted ${deletedCityCoordinators.count} city coordinators`);

    // Step 9: Remove Area Manager foreign keys from Cities
    console.log('9️⃣  Removing Area Manager assignments from cities...');
    const updatedCities = await prisma.city.updateMany({
      data: {
        areaManagerId: null,
      },
    });
    console.log(`   ✅ Removed Area Manager from ${updatedCities.count} cities`);

    // Step 10: Delete Area Managers (role records)
    console.log('🔟 Deleting Area Managers...');
    const deletedAreaManagers = await prisma.areaManager.deleteMany({});
    console.log(`   ✅ Deleted ${deletedAreaManagers.count} Area Managers`);

    // Step 11: Delete invitations
    console.log('1️⃣1️⃣  Deleting invitations...');
    const deletedInvitations = await prisma.invitation.deleteMany({});
    console.log(`   ✅ Deleted ${deletedInvitations.count} invitations`);

    // Step 12: Delete push subscriptions
    console.log('1️⃣2️⃣  Deleting push subscriptions...');
    const deletedSubscriptions = await prisma.pushSubscription.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSubscriptions.count} push subscriptions`);

    // Step 13: Delete ALL non-SuperAdmin users
    console.log('1️⃣3️⃣  Deleting all non-SuperAdmin users...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        isSuperAdmin: false,
      },
    });
    console.log(`   ✅ Deleted ${deletedUsers.count} users`);

    // Step 14: Count remaining data
    console.log('\n📊 Final Database State:');
    const [superAdminCount, areaManagerCount, citiesCount, usersCount] = await Promise.all([
      prisma.user.count({ where: { isSuperAdmin: true } }),
      prisma.areaManager.count(),
      prisma.city.count(),
      prisma.user.count(),
    ]);

    console.log(`   👤 Total Users: ${usersCount}`);
    console.log(`   🔐 SuperAdmin users: ${superAdminCount}`);
    console.log(`   🗺️  Area Managers: ${areaManagerCount}`);
    console.log(`   🏙️  Cities: ${citiesCount}`);
    console.log(`   📍 Neighborhoods: 0`);
    console.log(`   👥 Coordinators: 0`);
    console.log(`   🎯 Activists: 0`);

    console.log('\n✅ AGGRESSIVE cleanup completed successfully!');
    console.log('   Database contains ONLY SuperAdmin and Cities\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupAggressive()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
