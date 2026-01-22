/**
 * SAFE User Soft-Delete Script
 *
 * ✅ COMPLIES WITH: INV-SEC-001 (No physical deletes)
 * ✅ Uses soft deletes (isActive = false) instead of hard deletes
 * ✅ NO hardcoded credentials - uses environment variables
 * ✅ Preserves data for audit trail
 *
 * Purpose: Safely deactivate users (except SuperAdmin) without data loss
 * Use case: Clean up test users, deactivate inactive accounts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SoftDeleteOptions {
  /** Preserve Area Managers (default: true) */
  preserveAreaManagers?: boolean;
  /** Preserve City Coordinators (default: false) */
  preserveCityCoordinators?: boolean;
  /** Preserve Activist Coordinators (default: false) */
  preserveActivistCoordinators?: boolean;
  /** Dry run mode - show what would be deleted without executing (default: false) */
  dryRun?: boolean;
}

/**
 * Soft-delete users by setting isActive = false
 * NEVER physically deletes data from the database
 */
async function softDeleteUsers(options: SoftDeleteOptions = {}) {
  const {
    preserveAreaManagers = true,
    preserveCityCoordinators = false,
    preserveActivistCoordinators = false,
    dryRun = false,
  } = options;

  console.log('\n🧹 Safe User Soft-Delete Script\n');
  console.log('⚙️  Configuration:');
  console.log(`   - Preserve Area Managers: ${preserveAreaManagers}`);
  console.log(`   - Preserve City Coordinators: ${preserveCityCoordinators}`);
  console.log(`   - Preserve Activist Coordinators: ${preserveActivistCoordinators}`);
  console.log(`   - Dry Run Mode: ${dryRun}\n`);

  if (dryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made\n');
  }

  try {
    // Step 1: Identify SuperAdmin users (ALWAYS preserved)
    console.log('1️⃣  Identifying SuperAdmin users to preserve...');
    const superAdmins = await prisma.user.findMany({
      where: { isSuperAdmin: true },
      select: { id: true, email: true, fullName: true },
    });

    if (superAdmins.length === 0) {
      console.error('❌ ERROR: No SuperAdmin found! ABORTING for safety.');
      process.exit(1);
    }

    console.log(`   ✅ Found ${superAdmins.length} SuperAdmin(s) to preserve:`);
    console.table(superAdmins);

    const superAdminIds = superAdmins.map((u) => u.id);

    // Step 2: Identify Area Managers to preserve (if requested)
    let areaManagerUserIds: string[] = [];
    if (preserveAreaManagers) {
      console.log('\n2️⃣  Identifying Area Manager users to preserve...');
      const areaManagers = await prisma.areaManager.findMany({
        where: { userId: { not: null } },
        select: { userId: true },
      });
      areaManagerUserIds = areaManagers
        .map((am) => am.userId)
        .filter((id): id is string => id !== null);
      console.log(`   ✅ Found ${areaManagerUserIds.length} Area Manager(s) to preserve`);
    }

    // Step 3: Identify City Coordinators to preserve (if requested)
    let cityCoordinatorUserIds: string[] = [];
    if (preserveCityCoordinators) {
      console.log('\n3️⃣  Identifying City Coordinator users to preserve...');
      const cityCoordinators = await prisma.cityCoordinator.findMany({
        select: { userId: true },
      });
      cityCoordinatorUserIds = cityCoordinators.map((cc) => cc.userId);
      console.log(`   ✅ Found ${cityCoordinatorUserIds.length} City Coordinator(s) to preserve`);
    }

    // Step 4: Identify Activist Coordinators to preserve (if requested)
    let activistCoordinatorUserIds: string[] = [];
    if (preserveActivistCoordinators) {
      console.log('\n4️⃣  Identifying Activist Coordinator users to preserve...');
      const activistCoordinators = await prisma.activistCoordinator.findMany({
        select: { userId: true },
      });
      activistCoordinatorUserIds = activistCoordinators.map((ac) => ac.userId);
      console.log(
        `   ✅ Found ${activistCoordinatorUserIds.length} Activist Coordinator(s) to preserve`
      );
    }

    // Combine all user IDs to preserve
    const preservedUserIds = [
      ...superAdminIds,
      ...areaManagerUserIds,
      ...cityCoordinatorUserIds,
      ...activistCoordinatorUserIds,
    ];

    console.log(`\n📋 Total users to preserve: ${preservedUserIds.length}`);

    // Step 5: Find users that will be soft-deleted
    console.log('\n5️⃣  Finding users to soft-delete...');
    const usersToDeactivate = await prisma.user.findMany({
      where: {
        id: { notIn: preservedUserIds },
        isActive: true, // Only deactivate active users
      },
      select: { id: true, email: true, fullName: true, isActive: true },
    });

    console.log(`   📊 Found ${usersToDeactivate.count || usersToDeactivate.length} users to soft-delete:`);
    if (usersToDeactivate.length > 0 && usersToDeactivate.length <= 20) {
      console.table(usersToDeactivate);
    } else if (usersToDeactivate.length > 20) {
      console.log(`   (Showing first 10 of ${usersToDeactivate.length})`);
      console.table(usersToDeactivate.slice(0, 10));
    }

    if (usersToDeactivate.length === 0) {
      console.log('\n✅ No users to soft-delete. All active users are preserved.');
      return;
    }

    // Step 6: Perform soft-delete (if not dry run)
    if (!dryRun) {
      console.log('\n6️⃣  Soft-deleting users (isActive = false)...');
      const result = await prisma.user.updateMany({
        where: {
          id: { notIn: preservedUserIds },
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      console.log(`   ✅ Soft-deleted ${result.count} users\n`);
    } else {
      console.log('\n6️⃣  DRY RUN - Would have soft-deleted users (skipped)\n');
    }

    // Step 7: Verify final state
    console.log('7️⃣  Verifying final state...');
    const activeUsers = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true, email: true, fullName: true, isSuperAdmin: true },
    });

    console.log(`\n✅ Active users remaining: ${activeUsers.length}`);
    if (activeUsers.length <= 10) {
      console.table(activeUsers);
    }

    const inactiveCount = await prisma.user.count({ where: { isActive: false } });
    console.log(`\n📊 Inactive users (soft-deleted): ${inactiveCount}`);

    console.log('\n✅ Soft-delete completed successfully!\n');
    console.log('💡 To permanently delete (NOT RECOMMENDED):');
    console.log('   Run: prisma.user.deleteMany({ where: { isActive: false } })');
    console.log('   ⚠️  This violates INV-SEC-001 and should only be done manually.\n');
  } catch (error) {
    console.error('\n❌ Error during soft-delete:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// ============================================================================
// CLI Execution
// ============================================================================

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const preserveAreaManagers = !args.includes('--no-area-managers');
const preserveCityCoordinators = args.includes('--preserve-city-coordinators');
const preserveActivistCoordinators = args.includes('--preserve-activist-coordinators');

console.log('\n🔧 CLI Arguments:');
console.log(`   ${args.join(' ') || '(none - using defaults)'}\n`);

softDeleteUsers({
  dryRun,
  preserveAreaManagers,
  preserveCityCoordinators,
  preserveActivistCoordinators,
})
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

/**
 * USAGE EXAMPLES:
 *
 * 1. Dry run (preview only, no changes):
 *    npm run ts-node scripts/soft-delete-users.ts --dry-run
 *
 * 2. Soft-delete all users except SuperAdmin + Area Managers:
 *    npm run ts-node scripts/soft-delete-users.ts
 *
 * 3. Soft-delete all users except SuperAdmin (including Area Managers):
 *    npm run ts-node scripts/soft-delete-users.ts --no-area-managers
 *
 * 4. Preserve City Coordinators too:
 *    npm run ts-node scripts/soft-delete-users.ts --preserve-city-coordinators
 *
 * 5. Preserve all coordinators:
 *    npm run ts-node scripts/soft-delete-users.ts --preserve-city-coordinators --preserve-activist-coordinators
 */
