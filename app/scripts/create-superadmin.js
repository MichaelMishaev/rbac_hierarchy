#!/usr/bin/env node
/**
 * Create SuperAdmin user in production
 * Usage: node scripts/create-superadmin.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  console.log('🔧 Creating SuperAdmin user...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  try {
    const superAdmin = await prisma.user.upsert({
      where: { email: 'superadmin@election.test' },
      update: {
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        isSuperAdmin: true,
        isActive: true,
      },
      create: {
        email: 'superadmin@election.test',
        fullName: 'מנהל מערכת',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        phone: '+972-50-000-0000',
        isActive: true,
        isSuperAdmin: true,
      },
    });

    console.log('✅ SuperAdmin created successfully!');
    console.log('   Email:', superAdmin.email);
    console.log('   Password: admin123');
    console.log('   Role:', superAdmin.role);
    console.log('   ID:', superAdmin.id);

  } catch (error) {
    console.error('❌ Failed to create SuperAdmin:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin()
  .then(() => {
    console.log('\n🎉 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error:', error);
    process.exit(1);
  });
