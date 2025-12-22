/**
 * Production SuperAdmin Creation Script
 *
 * USAGE:
 *   npx tsx scripts/add-superadmin.ts
 *
 * SAFETY:
 *   - Uses upsert to avoid duplicates
 *   - Only creates SuperAdmin (no test data)
 *   - Production-safe with DATABASE_URL
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🔐 Creating SuperAdmin in production...\n');

  const email = 'eg6715139@gmail.com';
  const password = 'eg246109';
  const fullName = 'מנהל מערכת ראשי';

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create or update SuperAdmin
    const superAdmin = await prisma.user.upsert({
      where: { email },
      update: {
        // If user exists, ensure SuperAdmin flags are set
        role: 'SUPERADMIN',
        isSuperAdmin: true,
        isActive: true,
        passwordHash: hashedPassword,
      },
      create: {
        email,
        fullName,
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        phone: '+972-50-000-0001',
        isActive: true,
        isSuperAdmin: true,
      },
    });

    console.log('✅ SuperAdmin created successfully!\n');
    console.log('📋 Details:');
    console.log(`   Email:    ${superAdmin.email}`);
    console.log(`   Name:     ${superAdmin.fullName}`);
    console.log(`   Role:     ${superAdmin.role}`);
    console.log(`   SuperAdmin: ${superAdmin.isSuperAdmin}`);
    console.log(`   Active:   ${superAdmin.isActive}`);
    console.log(`   Created:  ${superAdmin.createdAt}`);
    console.log('\n🔑 Login credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️  IMPORTANT: Change this password after first login!\n');

  } catch (error) {
    console.error('❌ Failed to create SuperAdmin:', error);
    throw error;
  }
}

async function main() {
  try {
    await createSuperAdmin();
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
