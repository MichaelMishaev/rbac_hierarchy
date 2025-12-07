import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyTestUsers() {
  const testUsers = [
    { email: 'david.cohen@electra-tech.co.il', password: 'manager123', expectedRole: 'MANAGER' },
    { email: 'sara.levi@binuy.co.il', password: 'manager123', expectedRole: 'MANAGER' },
    { email: 'orna.hadad@taim-food.co.il', password: 'manager123', expectedRole: 'MANAGER' },
    { email: 'moshe.israeli@electra-tech.co.il', password: 'supervisor123', expectedRole: 'SUPERVISOR' },
    { email: 'yossi.mizrahi@binuy.co.il', password: 'supervisor123', expectedRole: 'SUPERVISOR' }
  ];

  console.log('\nVerifying test users for fixed tests:\n');

  for (const testUser of testUsers) {
    const user = await prisma.user.findUnique({
      where: { email: testUser.email },
      select: {
        email: true,
        fullName: true,
        role: true,
        passwordHash: true
      }
    });

    if (!user) {
      console.log(`❌ MISSING: ${testUser.email}`);
      continue;
    }

    const passwordValid = await bcrypt.compare(testUser.password, user.passwordHash || '');
    const roleMatches = user.role === testUser.expectedRole;

    const status = passwordValid && roleMatches ? '✅' : '❌';
    console.log(`${status} ${testUser.email}`);
    console.log(`   Name: ${user.fullName}`);
    console.log(`   Role: ${user.role} ${roleMatches ? '✓' : `✗ (expected ${testUser.expectedRole})`}`);
    console.log(`   Password: ${passwordValid ? 'VALID' : 'INVALID'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

verifyTestUsers().catch(console.error);
