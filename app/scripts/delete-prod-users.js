/**
 * PRODUCTION DELETION SCRIPT
 *
 * ⚠️ DANGER: This deletes ALL users except super admin from PRODUCTION
 */

const { PrismaClient } = require('@prisma/client');

const PROD_URL = 'postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@switchyard.proxy.rlwy.net:20055/railway';

const prisma = new PrismaClient({
  datasources: {
    db: { url: PROD_URL }
  }
});

async function deleteProductionUsers() {
  console.log('🚨 PRODUCTION DELETION SCRIPT 🚨\n');
  console.log('Database:', PROD_URL.replace(/:[^:@]+@/, ':***@'), '\n');

  try {
    // Step 1: Find super admin
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true, email: true, fullName: true }
    });

    if (superAdmins.length === 0) {
      console.error('❌ ERROR: No super admin found! ABORTING.');
      process.exit(1);
    }

    console.log('✅ Super admin to PRESERVE:');
    console.table(superAdmins);

    const superAdminIds = superAdmins.map(u => u.id);

    // Step 2: Delete in correct order
    console.log('\n🗑️  Starting deletion...\n');

    const results = {};

    // 1. Voters
    console.log('1️⃣  Deleting voters...');
    results.voters = await prisma.voter.deleteMany({
      where: { insertedByUserId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.voters.count} voters deleted\n`);

    // 2. Unlink activists
    console.log('2️⃣  Unlinking activists...');
    results.activistUnlink = await prisma.activist.updateMany({
      where: { activistCoordinatorId: { not: null } },
      data: { activistCoordinatorId: null }
    });
    console.log(`   ✅ ${results.activistUnlink.count} activists unlinked\n`);

    // 3. Activist coordinator neighborhoods
    console.log('3️⃣  Deleting coordinator assignments...');
    results.coordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.deleteMany({
      where: { legacyActivistCoordinatorUserId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.coordinatorNeighborhoods.count} assignments deleted\n`);

    // 4. Activist coordinators
    console.log('4️⃣  Deleting activist coordinators...');
    results.activistCoordinators = await prisma.activistCoordinator.deleteMany({
      where: { userId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.activistCoordinators.count} activist coordinators deleted\n`);

    // 5. Unlink neighborhoods from city coordinators
    console.log('5️⃣  Unlinking neighborhoods from city coordinators...');
    results.neighborhoodUnlink = await prisma.neighborhood.updateMany({
      where: { cityCoordinatorId: { not: null } },
      data: { cityCoordinatorId: null }
    });
    console.log(`   ✅ ${results.neighborhoodUnlink.count} neighborhoods unlinked\n`);

    // 6. City coordinators
    console.log('6️⃣  Deleting city coordinators...');
    results.cityCoordinators = await prisma.cityCoordinator.deleteMany({
      where: { userId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.cityCoordinators.count} city coordinators deleted\n`);

    // 7. Unlink area managers
    console.log('7️⃣  Unlinking area managers...');
    results.areaManagers = await prisma.areaManager.updateMany({
      where: { userId: { not: null, notIn: superAdminIds } },
      data: { userId: null }
    });
    console.log(`   ✅ ${results.areaManagers.count} area managers unlinked\n`);

    // 8. Invitations
    console.log('8️⃣  Deleting invitations...');
    results.invitations = await prisma.invitation.deleteMany({
      where: { createdById: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.invitations.count} invitations deleted\n`);

    // 9. User tokens
    console.log('9️⃣  Deleting user tokens...');
    results.tokens = await prisma.userToken.deleteMany({
      where: { userId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.tokens.count} tokens deleted\n`);

    // 10. Push subscriptions
    console.log('🔟 Deleting push subscriptions...');
    results.pushSubscriptions = await prisma.pushSubscription.deleteMany({
      where: { userId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.pushSubscriptions.count} push subscriptions deleted\n`);

    // 11. Tasks and assignments
    console.log('1️⃣1️⃣  Deleting task assignments...');
    results.taskAssignments = await prisma.taskAssignment.deleteMany({
      where: { targetUserId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.taskAssignments.count} task assignments deleted\n`);

    console.log('1️⃣2️⃣  Deleting tasks...');
    results.tasks = await prisma.task.deleteMany({
      where: { senderUserId: { notIn: superAdminIds } }
    });
    console.log(`   ✅ ${results.tasks.count} tasks deleted\n`);

    // 12. FINALLY - Delete users
    console.log('1️⃣3️⃣  🔥 DELETING USERS...');
    results.users = await prisma.user.deleteMany({
      where: { isSuperAdmin: false }
    });
    console.log(`   ✅ ${results.users.count} users DELETED\n`);

    console.log('📊 Deletion Summary:');
    console.table(results);

    // Verify
    const remaining = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, isSuperAdmin: true }
    });

    console.log('\n✅ REMAINING USERS:');
    console.table(remaining);

    if (remaining.length === superAdmins.length && remaining.every(u => u.isSuperAdmin)) {
      console.log('\n✅ SUCCESS! Only super admin remains.');
    } else {
      console.log('\n⚠️  WARNING: Unexpected user count!');
    }

  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

deleteProductionUsers()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
