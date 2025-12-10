import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFailedTestUsers() {
  const failedEmails = [
    'city.coordinator@city2.test',  // Test 2 failure
    'city.coordinator@city3.test',  // Test 3 failure
    'activist.coordinator@city2.test' // Test 4 failure
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
        coordinatorOf: {
          select: {
            cityId: true
          }
        },
        activistCoordinatorOf: {
          select: {
            cityId: true
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
    console.log(`   City Coordinator of: ${user.coordinatorOf.map(m => m.cityId).join(', ') || 'none'}`);
    console.log(`   Activist Coordinator of: ${user.activistCoordinatorOf.map(s => s.cityId).join(', ') || 'none'}`);
    console.log('');
  }

  await prisma.$disconnect();
}

checkFailedTestUsers().catch(console.error);
