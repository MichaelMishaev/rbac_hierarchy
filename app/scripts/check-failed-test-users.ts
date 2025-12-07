import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFailedTestUsers() {
  const failedEmails = [
    'manager@corp2.test',  // Test 2 failure
    'manager@corp3.test',  // Test 3 failure
    'supervisor@corp2.test' // Test 4 failure
  ];

  for (const email of failedEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        passwordHash: true,
        managerOf: {
          select: {
            corporationId: true
          }
        },
        supervisorOf: {
          select: {
            corporationId: true
          }
        }
      }
    });

    if (!user) {
      console.log(`❌ MISSING: ${email}`);
      continue;
    }

    console.log(`✅ ${email}`);
    console.log(`   Full Name: ${user.fullName}`);
    console.log(`   Role: ${user.role}`);
    console.log(`   Has Password: ${user.passwordHash ? 'YES' : 'NO'}`);
    console.log(`   Manager of: ${user.managerOf.map(m => m.corporationId).join(', ') || 'none'}`);
    console.log(`   Supervisor of: ${user.supervisorOf.map(s => s.corporationId).join(', ') || 'none'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkFailedTestUsers().catch(console.error);
