import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 Updating test user passwords to admin123...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const testUsers = [
    'admin@election.test',
    'sarah.cohen@telaviv-district.test',
    'david.levi@telaviv.test',
    'rachel.bendavid@telaviv.test',
    'yael.cohen@telaviv.test',
    'moshe.israeli@ramatgan.test',
    'dan.carmel@ramatgan.test',
    'manager@north-district.test',
    'manager@haifa-district.test',
    'manager@center-district.test',
    'manager@jerusalem-district.test',
    'manager@south-district.test',
  ];

  for (const email of testUsers) {
    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });
    console.log(`✅ Updated password for: ${email}`);
  }

  console.log('\n✓ All test user passwords updated to admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
