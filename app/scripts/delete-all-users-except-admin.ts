#!/usr/bin/env tsx
/**
 * Delete all users except SuperAdmin (מנהל מערכת)
 *
 * This script calls the deleteAllUsersExceptSystemAdmin server action
 * and verifies the deletion was successful.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Deleting all users except SuperAdmin...\n');

  // First, show current users
  const beforeUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isSuperAdmin: true,
    },
    orderBy: { email: 'asc' },
  });

  console.log('📊 Current users in database:');
  console.log('─'.repeat(80));
  beforeUsers.forEach((user, i) => {
    const adminFlag = user.isSuperAdmin ? '👑 SuperAdmin' : '';
    console.log(`${i + 1}. ${user.fullName} (${user.email}) - ${user.role} ${adminFlag}`);
  });
  console.log('─'.repeat(80));
  console.log(`Total: ${beforeUsers.length} users\n`);

  // Identify users to keep
  const usersToKeep = beforeUsers.filter(
    (u) => u.role === 'SUPERADMIN' || u.isSuperAdmin === true
  );
  const usersToDelete = beforeUsers.filter(
    (u) => u.role !== 'SUPERADMIN' && u.isSuperAdmin !== true
  );

  console.log(`✅ Will KEEP ${usersToKeep.length} user(s):`);
  usersToKeep.forEach((u) => {
    console.log(`   - ${u.fullName} (${u.email})`);
  });
  console.log();

  console.log(`❌ Will DELETE ${usersToDelete.length} user(s):`);
  usersToDelete.forEach((u) => {
    console.log(`   - ${u.fullName} (${u.email})`);
  });
  console.log();

  if (usersToDelete.length === 0) {
    console.log('ℹ️  No users to delete. Only SuperAdmin exists.');
    return;
  }

  // Get all user IDs to delete
  const deleteIds = usersToDelete.map((u) => u.id);
  const keepAdminId = usersToKeep[0].id;

  // Perform deletion in a transaction
  console.log('🔄 Processing deletion...\n');

  const result = await prisma.$transaction(async (tx) => {
    // Step 1: Nullify city references to area managers (onDelete: Restrict constraint)
    console.log('  1️⃣  Nullifying city references to area managers...');
    const citiesUpdated = await tx.city.updateMany({
      where: {
        areaManagerId: { not: null },
        areaManager: {
          userId: { in: deleteIds }
        }
      },
      data: { areaManagerId: null },
    });
    console.log(`      ✓ Nullified ${citiesUpdated.count} city references`);

    // Step 2: Reassign attendance records (foreign key constraints)
    console.log('  2️⃣  Reassigning attendance records...');
    const reassigned1 = await tx.attendanceRecord.updateMany({
      where: { checkedInById: { in: deleteIds } },
      data: { checkedInById: keepAdminId },
    });
    const reassigned2 = await tx.attendanceRecord.updateMany({
      where: { lastEditedById: { in: deleteIds } },
      data: { lastEditedById: keepAdminId },
    });
    console.log(`      ✓ Reassigned ${reassigned1.count + reassigned2.count} attendance record FK references`);

    // Step 3: Area managers will automatically have userId set to NULL (onDelete: SetNull)
    // No need to delete area manager records - they persist independently

    // Step 4: Delete users (cascades will handle other related records, areas persist with NULL userId)
    console.log('  3️⃣  Deleting users...');
    const deleted = await tx.user.deleteMany({
      where: { id: { in: deleteIds } },
    });
    console.log(`      ✓ Deleted ${deleted.count} users`);

    // Step 4: Create audit log
    console.log('  4️⃣  Creating audit log...');
    await tx.auditLog.create({
      data: {
        action: 'DELETE_ALL_USERS_EXCEPT_SYSTEM_ADMIN',
        entity: 'User',
        entityId: 'bulk',
        userId: keepAdminId,
        userEmail: usersToKeep[0].email,
        userRole: 'SUPERADMIN',
        before: { deletedUserIds: deleteIds, deletedEmails: usersToDelete.map(u => u.email) },
        after: { keptUserIds: usersToKeep.map(u => u.id), keptEmails: usersToKeep.map(u => u.email) },
      },
    });
    console.log('      ✓ Audit log created\n');

    return deleted;
  });

  // Verify deletion
  console.log('🔍 Verifying deletion...\n');
  const afterUsers = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isSuperAdmin: true,
    },
    orderBy: { email: 'asc' },
  });

  console.log('📊 Remaining users in database:');
  console.log('─'.repeat(80));
  afterUsers.forEach((user, i) => {
    const adminFlag = user.isSuperAdmin ? '👑 SuperAdmin' : '';
    console.log(`${i + 1}. ${user.fullName} (${user.email}) - ${user.role} ${adminFlag}`);
  });
  console.log('─'.repeat(80));
  console.log(`Total: ${afterUsers.length} user(s)\n`);

  // Success summary
  console.log('✅ DELETION COMPLETE!');
  console.log(`   - Deleted: ${result.count} users`);
  console.log(`   - Remaining: ${afterUsers.length} user(s) (SuperAdmin only)`);
  console.log();

  // Final verification
  const nonAdminRemaining = afterUsers.filter(
    (u) => u.role !== 'SUPERADMIN' && u.isSuperAdmin !== true
  );

  if (nonAdminRemaining.length > 0) {
    console.error('❌ ERROR: Non-admin users still exist!');
    nonAdminRemaining.forEach((u) => {
      console.error(`   - ${u.fullName} (${u.email})`);
    });
    process.exit(1);
  } else {
    console.log('✅ VERIFIED: Only SuperAdmin user(s) remain in database');
    console.log('✅ No automatic seed script will restore deleted users (we disabled that!)');
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Script failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
