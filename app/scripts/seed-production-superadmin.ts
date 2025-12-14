#!/usr/bin/env tsx
/**
 * Production SuperAdmin Seed Script
 *
 * Creates ONLY the SuperAdmin user for production environment.
 * Safe to run multiple times (uses upsert).
 *
 * Usage:
 *   npm run db:seed:prod-admin
 *
 * IMPORTANT: Change password after first login!
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Creating Production SuperAdmin...');

  // Hash password
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Create SuperAdmin (upsert - safe to run multiple times)
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@election.test' },
    update: {
      // Update password if user already exists
      passwordHash: hashedPassword,
      isActive: true,
      isSuperAdmin: true,
    },
    create: {
      email: 'admin@election.test',
      fullName: 'מנהל מערכת ראשי',
      passwordHash: hashedPassword,
      role: 'SUPERADMIN',
      phone: '+972-50-000-0000',
      isActive: true,
      isSuperAdmin: true,
    },
  });

  console.log('✅ Production SuperAdmin created successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('   Email:    admin@election.test');
  console.log('   Password: admin123');
  console.log('\n⚠️  SECURITY WARNING:');
  console.log('   Please change this password immediately after first login!');
  console.log(`   User ID: ${superAdmin.id}`);
  console.log('\n🎉 Production setup complete!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
