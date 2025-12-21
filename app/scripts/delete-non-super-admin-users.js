/**
 * DANGEROUS OPERATION: Delete all users except super admin
 *
 * This script will:
 * 1. Identify the super admin user (is_super_admin = true)
 * 2. Delete ALL other users
 * 3. Prisma will handle cascading deletes automatically
 *
 * ⚠️ WARNING: This is irreversible!
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function deleteNonSuperAdminUsers() {
  console.log('🔍 Starting user deletion process...\n');

  try {
    // Step 1: Find super admin(s)
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true, email: true, fullName: true }
    });

    if (superAdmins.length === 0) {
      console.error('❌ ERROR: No super admin found! Aborting to prevent complete data loss.');
      process.exit(1);
    }

    console.log('✅ Super admin(s) to PRESERVE:');
    console.table(superAdmins);

    // Step 2: Count users to delete
    const usersToDelete = await prisma.user.findMany({
      where: { isSuperAdmin: false },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });

    console.log(`\n⚠️  Users to DELETE: ${usersToDelete.length}`);
    console.table(usersToDelete);

    // Step 3: Show related data that will be affected
    console.log('\n📊 Related data that will be affected:');

    const relatedCounts = {
      areaManagers: await prisma.areaManager.count({
        where: { userId: { not: null, notIn: superAdmins.map(u => u.id) } }
      }),
      cityCoordinators: await prisma.cityCoordinator.count({
        where: { userId: { notIn: superAdmins.map(u => u.id) } }
      }),
      activistCoordinators: await prisma.activistCoordinator.count({
        where: { userId: { notIn: superAdmins.map(u => u.id) } }
      }),
      activists: await prisma.activist.count({
        where: { userId: { not: null, notIn: superAdmins.map(u => u.id) } }
      }),
      invitations: await prisma.invitation.count({
        where: { createdById: { notIn: superAdmins.map(u => u.id) } }
      }),
      tasks: await prisma.task.count({
        where: { senderUserId: { notIn: superAdmins.map(u => u.id) } }
      }),
      taskAssignments: await prisma.taskAssignment.count({
        where: { targetUserId: { notIn: superAdmins.map(u => u.id) } }
      }),
      attendanceRecords: await prisma.attendanceRecord.count({
        where: {
          OR: [
            { checkedInById: { notIn: superAdmins.map(u => u.id) } },
            { lastEditedById: { not: null, notIn: superAdmins.map(u => u.id) } }
          ]
        }
      }),
      voters: await prisma.voter.count({
        where: { insertedByUserId: { notIn: superAdmins.map(u => u.id) } }
      })
    };

    console.table(relatedCounts);

    // Step 4: Execute deletion in correct order (bottom-up)
    console.log('\n🗑️  Executing deletion...\n');

    const deletionResults = {};

    // 1. Delete voters (they have Restrict constraint)
    console.log('1️⃣  Deleting voters...');
    deletionResults.voters = await prisma.voter.deleteMany({
      where: {
        insertedByUserId: { notIn: superAdmins.map(u => u.id) }
      }
    });
    console.log(`   ✅ Deleted ${deletionResults.voters.count} voters\n`);

    // 2. First, unlink activists from coordinators (set activistCoordinatorId to NULL)
    console.log('2️⃣  Unlinking activists from coordinators...');
    const unlinkedActivists = await prisma.activist.updateMany({
      where: {
        activistCoordinatorId: { not: null }
      },
      data: {
        activistCoordinatorId: null
      }
    });
    console.log(`   ✅ Unlinked ${unlinkedActivists.count} activists from coordinators\n`);

    // 3. Delete activist coordinator neighborhoods (M2M table)
    console.log('3️⃣  Deleting activist coordinator assignments...');
    deletionResults.coordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.deleteMany({
      where: {
        legacyActivistCoordinatorUserId: { notIn: superAdmins.map(u => u.id) }
      }
    });
    console.log(`   ✅ Deleted ${deletionResults.coordinatorNeighborhoods.count} coordinator assignments\n`);

    // 4. Delete activist coordinators
    console.log('4️⃣  Deleting activist coordinators...');
    deletionResults.activistCoordinators = await prisma.activistCoordinator.deleteMany({
      where: {
        userId: { notIn: superAdmins.map(u => u.id) }
      }
    });
    console.log(`   ✅ Deleted ${deletionResults.activistCoordinators.count} activist coordinators\n`);

    // 5. Delete city coordinators
    console.log('5️⃣  Deleting city coordinators...');
    deletionResults.cityCoordinators = await prisma.cityCoordinator.deleteMany({
      where: {
        userId: { notIn: superAdmins.map(u => u.id) }
      }
    });
    console.log(`   ✅ Deleted ${deletionResults.cityCoordinators.count} city coordinators\n`);

    // 6. Set area managers userId to null (they should persist)
    console.log('6️⃣  Unlinking area managers from deleted users...');
    deletionResults.areaManagers = await prisma.areaManager.updateMany({
      where: {
        userId: { not: null, notIn: superAdmins.map(u => u.id) }
      },
      data: {
        userId: null
      }
    });
    console.log(`   ✅ Unlinked ${deletionResults.areaManagers.count} area managers\n`);

    // 7. Delete all other user-related records (invitations, tokens, etc.)
    console.log('7️⃣  Deleting invitations...');
    deletionResults.invitations = await prisma.invitation.deleteMany({
      where: {
        createdById: { notIn: superAdmins.map(u => u.id) }
      }
    });
    console.log(`   ✅ Deleted ${deletionResults.invitations.count} invitations\n`);

    console.log('8️⃣  Deleting user tokens...');
    deletionResults.tokens = await prisma.userToken.deleteMany({
      where: {
        userId: { notIn: superAdmins.map(u => u.id) }
      }
    });
    console.log(`   ✅ Deleted ${deletionResults.tokens.count} tokens\n`);

    console.log('9️⃣  Deleting push subscriptions...');
    deletionResults.pushSubscriptions = await prisma.pushSubscription.deleteMany({
      where: {
        userId: { notIn: superAdmins.map(u => u.id) }
      }
    });
    console.log(`   ✅ Deleted ${deletionResults.pushSubscriptions.count} push subscriptions\n`);

    // 8. Finally, delete users
    console.log('🔟 Deleting users...');
    deletionResults.users = await prisma.user.deleteMany({
      where: {
        isSuperAdmin: false
      }
    });
    console.log(`   ✅ Successfully deleted ${deletionResults.users.count} users\n`);

    console.log('📊 Deletion summary:');
    console.table(deletionResults);

    // Step 5: Verify super admin still exists
    const remainingUsers = await prisma.user.findMany({
      select: { id: true, email: true, fullName: true, isSuperAdmin: true }
    });

    console.log('\n✅ Remaining users after deletion:');
    console.table(remainingUsers);

    if (remainingUsers.length === superAdmins.length) {
      console.log('\n✅ SUCCESS: Only super admin(s) remain');
    } else {
      console.log('\n⚠️  WARNING: User count mismatch!');
    }

  } catch (error) {
    console.error('\n❌ ERROR during deletion:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
deleteNonSuperAdminUsers()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:');
    console.error(error);
    process.exit(1);
  });
