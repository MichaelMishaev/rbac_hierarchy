/**
 * Production Super Admin Creation Script
 * ⚠️ ONLY for production database - creates super admin user
 *
 * Usage: npx tsx scripts/add-prod-superadmin.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const PROD_DATABASE_URL = 'postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@switchyard.proxy.rlwy.net:20055/railway';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: PROD_DATABASE_URL,
    },
  },
});

async function createSuperAdmin() {
  const email = 'Rahamim707@gmail.com';
  const password = '@Avi2468';
  const fullName = 'Super Admin';

  try {
    console.log('🔍 Checking if user already exists...');

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('⚠️  User already exists!');
      console.log(`User ID: ${existingUser.id}`);
      console.log(`Email: ${existingUser.email}`);
      console.log(`Role: ${existingUser.role}`);
      console.log(`Is Super Admin: ${existingUser.isSuperAdmin}`);

      // Update to super admin if not already
      if (!existingUser.isSuperAdmin || existingUser.role !== 'SUPERADMIN') {
        console.log('🔄 Updating user to SUPERADMIN...');
        const updated = await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            role: 'SUPERADMIN',
            isSuperAdmin: true,
          },
        });
        console.log('✅ User updated to SUPERADMIN successfully!');
        return updated;
      } else {
        console.log('✅ User is already a SUPERADMIN');
        return existingUser;
      }
    }

    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);

    console.log('📝 Creating super admin user...');
    const superAdmin = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        fullName,
        role: 'SUPERADMIN',
        isSuperAdmin: true,
      },
    });

    console.log('✅ Super admin created successfully!');
    console.log('═══════════════════════════════════');
    console.log(`User ID: ${superAdmin.id}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log(`Full Name: ${superAdmin.fullName}`);
    console.log(`Role: ${superAdmin.role}`);
    console.log(`Is Super Admin: ${superAdmin.isSuperAdmin}`);
    console.log('═══════════════════════════════════');
    console.log('🎉 You can now login with these credentials!');

    return superAdmin;
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createSuperAdmin()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
