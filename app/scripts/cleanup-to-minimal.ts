#!/usr/bin/env tsx
/**
 * AGGRESSIVE CLEANUP - Remove everything except:
 * - Cities (83 Israeli cities)
 * - Areas (6 Israeli districts)
 * - Users (1 SuperAdmin + 6 Area Managers = 7 total)
 *
 * This will DELETE:
 * - All neighborhoods
 * - All activists
 * - All activist coordinators
 * - All city coordinators
 * - All tasks and task assignments
 * - All attendance records
 * - All invitations
 * - All push subscriptions
 * - All user tokens
 * - All audit logs (optional)
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🧹 AGGRESSIVE CLEANUP - Minimal System State\n');
  console.log('⚠️  WARNING: This will delete EVERYTHING except:');
  console.log('   ✅ Cities (83 Israeli cities)');
  console.log('   ✅ Areas (6 Israeli districts)');
  console.log('   ✅ Users (1 SuperAdmin + 6 Area Managers)\n');
  console.log('═'.repeat(80) + '\n');

  // Step 1: Show current state
  console.log('📊 CURRENT DATABASE STATE:\n');

  const counts = {
    users: await prisma.user.count(),
    areas: await prisma.areaManager.count(),
    cities: await prisma.city.count(),
    cityCoordinators: await prisma.cityCoordinator.count(),
    activistCoordinators: await prisma.activistCoordinator.count(),
    neighborhoods: await prisma.neighborhood.count(),
    activists: await prisma.activist.count(),
    tasks: await prisma.task.count(),
    taskAssignments: await prisma.taskAssignment.count(),
    attendance: await prisma.attendanceRecord.count(),
    invitations: await prisma.invitation.count(),
    pushSubscriptions: await prisma.pushSubscription.count(),
    userTokens: await prisma.userToken.count(),
    coordinatorNeighborhoods: await prisma.activistCoordinatorNeighborhood.count(),
    auditLogs: await prisma.auditLog.count(),
  };

  console.log('Current counts:');
  console.log(`  👥 Users: ${counts.users}`);
  console.log(`  🗺️  Areas: ${counts.areas}`);
  console.log(`  🏙️  Cities: ${counts.cities}`);
  console.log(`  👔 City Coordinators: ${counts.cityCoordinators}`);
  console.log(`  🎯 Activist Coordinators: ${counts.activistCoordinators}`);
  console.log(`  🏘️  Neighborhoods: ${counts.neighborhoods}`);
  console.log(`  👤 Activists: ${counts.activists}`);
  console.log(`  📋 Tasks: ${counts.tasks}`);
  console.log(`  ✅ Task Assignments: ${counts.taskAssignments}`);
  console.log(`  🕐 Attendance Records: ${counts.attendance}`);
  console.log(`  📧 Invitations: ${counts.invitations}`);
  console.log(`  🔔 Push Subscriptions: ${counts.pushSubscriptions}`);
  console.log(`  🔑 User Tokens: ${counts.userTokens}`);
  console.log(`  🔗 Coordinator-Neighborhood Links: ${counts.coordinatorNeighborhoods}`);
  console.log(`  📝 Audit Logs: ${counts.auditLogs}`);

  console.log('\n' + '═'.repeat(80) + '\n');

  // Step 2: Identify what to keep
  const areaManagerUsers = await prisma.user.findMany({
    where: {
      OR: [
        { isSuperAdmin: true },
        { role: 'AREA_MANAGER' }
      ]
    },
    select: { id: true, email: true, fullName: true, role: true, isSuperAdmin: true },
  });

  console.log('✅ USERS TO KEEP (' + areaManagerUsers.length + '):');
  areaManagerUsers.forEach((u, i) => {
    const flag = u.isSuperAdmin ? '👑 SuperAdmin' : '🗺️  Area Manager';
    console.log(`   ${i + 1}. ${u.fullName} (${u.email}) - ${flag}`);
  });

  const usersToDelete = await prisma.user.findMany({
    where: {
      AND: [
        { isSuperAdmin: false },
        { role: { not: 'AREA_MANAGER' } }
      ]
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  console.log('\n❌ USERS TO DELETE (' + usersToDelete.length + '):');
  if (usersToDelete.length > 0) {
    usersToDelete.forEach((u, i) => {
      console.log(`   ${i + 1}. ${u.fullName} (${u.email}) - ${u.role}`);
    });
  } else {
    console.log('   (none)');
  }

  console.log('\n' + '═'.repeat(80) + '\n');
  console.log('🔄 STARTING CLEANUP...\n');

  const deleteUserIds = usersToDelete.map(u => u.id);

  // Step 3: Delete in transaction
  const result = await prisma.$transaction(async (tx) => {
    const deleted = {
      attendanceRecords: 0,
      taskAssignments: 0,
      tasks: 0,
      activists: 0,
      coordinatorNeighborhoods: 0,
      activistCoordinators: 0,
      cityCoordinators: 0,
      neighborhoods: 0,
      invitations: 0,
      pushSubscriptions: 0,
      userTokens: 0,
      users: 0,
    };

    // 1. Delete attendance records
    console.log('  1️⃣  Deleting attendance records...');
    const delAttendance = await tx.attendanceRecord.deleteMany({});
    deleted.attendanceRecords = delAttendance.count;
    console.log(`      ✓ Deleted ${delAttendance.count} attendance records`);

    // 2. Delete task assignments
    console.log('  2️⃣  Deleting task assignments...');
    const delTaskAssignments = await tx.taskAssignment.deleteMany({});
    deleted.taskAssignments = delTaskAssignments.count;
    console.log(`      ✓ Deleted ${delTaskAssignments.count} task assignments`);

    // 3. Delete tasks
    console.log('  3️⃣  Deleting tasks...');
    const delTasks = await tx.task.deleteMany({});
    deleted.tasks = delTasks.count;
    console.log(`      ✓ Deleted ${delTasks.count} tasks`);

    // 4. Delete activists
    console.log('  4️⃣  Deleting activists...');
    const delActivists = await tx.activist.deleteMany({});
    deleted.activists = delActivists.count;
    console.log(`      ✓ Deleted ${delActivists.count} activists`);

    // 5. Delete activist coordinator neighborhood assignments
    console.log('  5️⃣  Deleting activist coordinator-neighborhood links...');
    const delCoordNeighborhoods = await tx.activistCoordinatorNeighborhood.deleteMany({});
    deleted.coordinatorNeighborhoods = delCoordNeighborhoods.count;
    console.log(`      ✓ Deleted ${delCoordNeighborhoods.count} coordinator-neighborhood links`);

    // 6. Delete activist coordinators
    console.log('  6️⃣  Deleting activist coordinators...');
    const delActivistCoords = await tx.activistCoordinator.deleteMany({});
    deleted.activistCoordinators = delActivistCoords.count;
    console.log(`      ✓ Deleted ${delActivistCoords.count} activist coordinators`);

    // 7. Delete city coordinators
    console.log('  7️⃣  Deleting city coordinators...');
    const delCityCoords = await tx.cityCoordinator.deleteMany({});
    deleted.cityCoordinators = delCityCoords.count;
    console.log(`      ✓ Deleted ${delCityCoords.count} city coordinators`);

    // 8. Delete neighborhoods
    console.log('  8️⃣  Deleting neighborhoods...');
    const delNeighborhoods = await tx.neighborhood.deleteMany({});
    deleted.neighborhoods = delNeighborhoods.count;
    console.log(`      ✓ Deleted ${delNeighborhoods.count} neighborhoods`);

    // 9. Delete invitations
    console.log('  9️⃣  Deleting invitations...');
    const delInvitations = await tx.invitation.deleteMany({});
    deleted.invitations = delInvitations.count;
    console.log(`      ✓ Deleted ${delInvitations.count} invitations`);

    // 10. Delete push subscriptions
    console.log('  🔟 Deleting push subscriptions...');
    const delPushSubs = await tx.pushSubscription.deleteMany({});
    deleted.pushSubscriptions = delPushSubs.count;
    console.log(`      ✓ Deleted ${delPushSubs.count} push subscriptions`);

    // 11. Delete user tokens
    console.log('  1️⃣1️⃣  Deleting user tokens...');
    const delUserTokens = await tx.userToken.deleteMany({});
    deleted.userTokens = delUserTokens.count;
    console.log(`      ✓ Deleted ${delUserTokens.count} user tokens`);

    // 12. Delete non-area-manager users
    if (deleteUserIds.length > 0) {
      console.log('  1️⃣2️⃣  Deleting users (City Coordinators, Activist Coordinators)...');
      const delUsers = await tx.user.deleteMany({
        where: { id: { in: deleteUserIds } }
      });
      deleted.users = delUsers.count;
      console.log(`      ✓ Deleted ${delUsers.count} users`);
    } else {
      console.log('  1️⃣2️⃣  No additional users to delete');
    }

    // 13. Create audit log
    console.log('  1️⃣3️⃣  Creating audit log...');
    await tx.auditLog.create({
      data: {
        action: 'CLEANUP_TO_MINIMAL_STATE',
        entity: 'System',
        entityId: 'bulk',
        userId: areaManagerUsers.find(u => u.isSuperAdmin)?.id || areaManagerUsers[0].id,
        userEmail: areaManagerUsers.find(u => u.isSuperAdmin)?.email || areaManagerUsers[0].email,
        userRole: 'SUPERADMIN',
        before: counts,
        after: deleted,
      },
    });
    console.log('      ✓ Audit log created\n');

    return deleted;
  });

  // Step 4: Verify final state
  console.log('═'.repeat(80) + '\n');
  console.log('🔍 VERIFYING FINAL STATE...\n');

  const finalCounts = {
    users: await prisma.user.count(),
    areas: await prisma.areaManager.count(),
    cities: await prisma.city.count(),
    cityCoordinators: await prisma.cityCoordinator.count(),
    activistCoordinators: await prisma.activistCoordinator.count(),
    neighborhoods: await prisma.neighborhood.count(),
    activists: await prisma.activist.count(),
    tasks: await prisma.task.count(),
    taskAssignments: await prisma.taskAssignment.count(),
    attendance: await prisma.attendanceRecord.count(),
    invitations: await prisma.invitation.count(),
    pushSubscriptions: await prisma.pushSubscription.count(),
    userTokens: await prisma.userToken.count(),
  };

  console.log('📊 FINAL DATABASE STATE:\n');
  console.log('✅ KEPT:');
  console.log(`   👥 Users: ${finalCounts.users} (1 SuperAdmin + 6 Area Managers)`);
  console.log(`   🗺️  Areas: ${finalCounts.areas} (6 Israeli districts)`);
  console.log(`   🏙️  Cities: ${finalCounts.cities} (83 Israeli cities)`);
  console.log('\n❌ DELETED (should be 0):');
  console.log(`   👔 City Coordinators: ${finalCounts.cityCoordinators}`);
  console.log(`   🎯 Activist Coordinators: ${finalCounts.activistCoordinators}`);
  console.log(`   🏘️  Neighborhoods: ${finalCounts.neighborhoods}`);
  console.log(`   👤 Activists: ${finalCounts.activists}`);
  console.log(`   📋 Tasks: ${finalCounts.tasks}`);
  console.log(`   ✅ Task Assignments: ${finalCounts.taskAssignments}`);
  console.log(`   🕐 Attendance Records: ${finalCounts.attendance}`);
  console.log(`   📧 Invitations: ${finalCounts.invitations}`);
  console.log(`   🔔 Push Subscriptions: ${finalCounts.pushSubscriptions}`);
  console.log(`   🔑 User Tokens: ${finalCounts.userTokens}`);

  console.log('\n' + '═'.repeat(80) + '\n');

  // Final verification
  if (
    finalCounts.neighborhoods === 0 &&
    finalCounts.activists === 0 &&
    finalCounts.cityCoordinators === 0 &&
    finalCounts.activistCoordinators === 0 &&
    finalCounts.tasks === 0 &&
    finalCounts.taskAssignments === 0 &&
    finalCounts.attendance === 0 &&
    finalCounts.users === 7 &&
    finalCounts.areas === 6
  ) {
    console.log('✅ SUCCESS! Database is now in minimal state:');
    console.log('   ✅ 7 Users (1 SuperAdmin + 6 Area Managers)');
    console.log('   ✅ 6 Areas (Israeli districts)');
    console.log(`   ✅ ${finalCounts.cities} Cities (Israeli cities)`);
    console.log('   ✅ Everything else deleted');
  } else {
    console.log('⚠️  WARNING: Some data may not have been deleted:');
    if (finalCounts.users !== 7) console.log(`   - Users: Expected 7, got ${finalCounts.users}`);
    if (finalCounts.areas !== 6) console.log(`   - Areas: Expected 6, got ${finalCounts.areas}`);
    if (finalCounts.neighborhoods !== 0) console.log(`   - Neighborhoods: Expected 0, got ${finalCounts.neighborhoods}`);
    if (finalCounts.activists !== 0) console.log(`   - Activists: Expected 0, got ${finalCounts.activists}`);
    if (finalCounts.cityCoordinators !== 0) console.log(`   - City Coordinators: Expected 0, got ${finalCounts.cityCoordinators}`);
    if (finalCounts.activistCoordinators !== 0) console.log(`   - Activist Coordinators: Expected 0, got ${finalCounts.activistCoordinators}`);
  }

  console.log('\n📝 DELETION SUMMARY:');
  console.log(`   - Attendance Records: ${result.attendanceRecords}`);
  console.log(`   - Task Assignments: ${result.taskAssignments}`);
  console.log(`   - Tasks: ${result.tasks}`);
  console.log(`   - Activists: ${result.activists}`);
  console.log(`   - Coordinator-Neighborhood Links: ${result.coordinatorNeighborhoods}`);
  console.log(`   - Activist Coordinators: ${result.activistCoordinators}`);
  console.log(`   - City Coordinators: ${result.cityCoordinators}`);
  console.log(`   - Neighborhoods: ${result.neighborhoods}`);
  console.log(`   - Invitations: ${result.invitations}`);
  console.log(`   - Push Subscriptions: ${result.pushSubscriptions}`);
  console.log(`   - User Tokens: ${result.userTokens}`);
  console.log(`   - Users: ${result.users}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Cleanup failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
