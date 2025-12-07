import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function verifyTestUsers() {
  const testEmails = [
    'admin@rbac.shop',
    'david.cohen@electra-tech.co.il',
    'moshe.israeli@electra-tech.co.il'
  ];

  for (const email of testEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        email: true,
        fullName: true,
        role: true,
        passwordHash: true
      }
    });

    if (!user) {
      console.log(`❌ MISSING: ${email}`);
      continue;
    }

    // Test password
    const password = email === 'admin@rbac.shop' ? 'admin123' :
                    email === 'david.cohen@electra-tech.co.il' ? 'manager123' : 'supervisor123';
    const isValid = await bcrypt.compare(password, user.passwordHash || '');

    console.log(`${isValid ? '✅' : '❌'} ${email} - Role: ${user.role} - Password: ${isValid ? 'VALID' : 'INVALID'}`);
  }

  await prisma.$disconnect();
}

verifyTestUsers().catch(console.error);
