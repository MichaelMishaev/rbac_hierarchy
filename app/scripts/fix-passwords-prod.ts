import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🔐 [PRODUCTION] Updating test user passwords to admin123...\n');

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

  let updated = 0;
  let notFound = 0;

  for (const email of testUsers) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        console.log(`⚠️  User not found: ${email}`);
        notFound++;
        continue;
      }

      await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword },
      });

      console.log(`✅ Updated: ${email}`);
      updated++;
    } catch (error) {
      console.error(`❌ Error updating ${email}:`, error);
    }
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✓ Updated: ${updated} users`);
  console.log(`⚠ Not found: ${notFound} users`);
  console.log('✓ All test user passwords set to: admin123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
