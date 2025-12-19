import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const testAccounts = [
  { email: 'admin@election.test', role: 'SuperAdmin (SA)' },
  { email: 'sarah.cohen@telaviv-district.test', role: 'Area Manager (AM)' },
  { email: 'david.levi@telaviv.test', role: 'City Coordinator (CC)' },
  { email: 'rachel.bendavid@telaviv.test', role: 'Activist Coordinator (AC)' },
];

async function main() {
  console.log('🔐 Testing all login credentials with password: admin123\n');

  for (const account of testAccounts) {
    const user = await prisma.user.findUnique({
      where: { email: account.email },
      select: { email: true, passwordHash: true, fullName: true, role: true },
    });

    if (!user) {
      console.log(`❌ ${account.role}: User not found (${account.email})`);
      continue;
    }

    const matches = await bcrypt.compare('admin123', user.passwordHash || '');

    if (matches) {
      console.log(`✅ ${account.role}: ${user.fullName} (${user.role})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Password: admin123 ✓\n`);
    } else {
      console.log(`❌ ${account.role}: Password does NOT match admin123`);
      console.log(`   Email: ${user.email}\n`);
    }
  }

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📝 Summary:');
  console.log('All accounts use password: admin123');
  console.log('\n🌐 Test at: http://localhost:3200/login');
  console.log('⚠️  Remember to HARD REFRESH (Cmd+Shift+R) your browser!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
