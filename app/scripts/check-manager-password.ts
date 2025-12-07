import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function checkManagerPassword() {
  const manager = await prisma.user.findUnique({
    where: { email: 'david.cohen@electra-tech.co.il' },
    select: {
      email: true,
      fullName: true,
      role: true,
      passwordHash: true
    }
  });

  if (!manager) {
    console.log('❌ Manager not found');
    return;
  }

  console.log('Manager found:', manager.email);
  console.log('Full name:', manager.fullName);
  console.log('Role:', manager.role);
  console.log('Password hash (first 20 chars):', manager.passwordHash?.substring(0, 20));

  // Test various password combinations
  const passwordsToTry = [
    'manager123',
    'Manager123',
    'admin123',
    'password123',
    'electra123'
  ];

  for (const password of passwordsToTry) {
    const isValid = await bcrypt.compare(password, manager.passwordHash || '');
    console.log(`  Testing "${password}": ${isValid ? '✅ VALID' : '❌ invalid'}`);
  }

  await prisma.$disconnect();
}

checkManagerPassword().catch(console.error);
