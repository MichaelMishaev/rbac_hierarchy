import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function addTestSuperAdmin() {
  console.log('🔧 Adding test super admin to Railway development database...');

  const hashedPassword = await bcrypt.hash('12345678', 10);

  try {
    const testSuperAdmin = await prisma.user.upsert({
      where: { email: 'test@test.com' },
      update: {
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        isSuperAdmin: true,
        isActive: true,
      },
      create: {
        email: 'test@test.com',
        fullName: 'Test Super Admin',
        passwordHash: hashedPassword,
        role: 'SUPERADMIN',
        phone: '+972-50-TEST-000',
        isActive: true,
        isSuperAdmin: true,
      },
    });

    console.log('✅ Test Super Admin created/updated successfully!');
    console.log(`   Email: ${testSuperAdmin.email}`);
    console.log(`   Name: ${testSuperAdmin.fullName}`);
    console.log(`   Role: ${testSuperAdmin.role}`);
    console.log(`   Is Super Admin: ${testSuperAdmin.isSuperAdmin}`);
    console.log(`   Password: 12345678`);
  } catch (error) {
    console.error('❌ Failed to create test super admin:', error);
    throw error;
  }
}

addTestSuperAdmin()
  .then(async () => {
    await prisma.$disconnect();
    console.log('\n🎉 Done!');
  })
  .catch(async (e) => {
    console.error('❌ Script failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
