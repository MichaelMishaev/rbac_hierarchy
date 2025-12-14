import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Production Database Cleanup Script
 *
 * KEEPS:
 * - SuperAdmin user
 * - Cities
 * - Area Managers (regions)
 *
 * DELETES:
 * - All activists (workers)
 * - All activist coordinators
 * - All city coordinators
 * - All neighborhoods
 * - All non-SuperAdmin, non-AreaManager users
 * - All related data (tasks, attendance, etc.)
 */
async function cleanupProduction() {
  console.log('\n🧹 Starting Production Database Cleanup...\n');
  console.log('⚠️  This will DELETE all data except Cities, Areas, and SuperAdmin\n');

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

    // Step 9: Get Area Manager user IDs to preserve
    console.log('9️⃣  Getting Area Manager user IDs to preserve...');
    const areaManagers = await prisma.areaManager.findMany({
      select: { userId: true },
    });
    const areaManagerUserIds = areaManagers.map(am => am.userId);
    console.log(`   ℹ️  Found ${areaManagerUserIds.length} Area Manager users to preserve`);

    // Step 10: Delete invitations
    console.log('🔟 Deleting invitations...');
    const deletedInvitations = await prisma.invitation.deleteMany({});
    console.log(`   ✅ Deleted ${deletedInvitations.count} invitations`);

    // Step 11: Delete push subscriptions
    console.log('1️⃣1️⃣  Deleting push subscriptions...');
    const deletedSubscriptions = await prisma.pushSubscription.deleteMany({});
    console.log(`   ✅ Deleted ${deletedSubscriptions.count} push subscriptions`);

    // Step 12: Delete users (except SuperAdmin and Area Managers)
    console.log('1️⃣2️⃣  Deleting users (except SuperAdmin and Area Managers)...');
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        AND: [
          { isSuperAdmin: false },
          { id: { notIn: areaManagerUserIds } },
        ],
      },
    });
    console.log(`   ✅ Deleted ${deletedUsers.count} users`);

    // Step 13: Count remaining data
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

    console.log('\n✅ Production cleanup completed successfully!\n');

  } catch (error) {
    console.error('\n❌ Error during cleanup:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupProduction()
  .then(() => {
    console.log('Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed:', error);
    process.exit(1);
  });
