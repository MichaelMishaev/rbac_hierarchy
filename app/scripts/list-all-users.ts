import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      fullName: true,
      role: true,
      isSuperAdmin: true,
      managerOf: {
        select: {
          corporationId: true,
          corporation: {
            select: {
              name: true
            }
          }
        }
      },
      supervisorOf: {
        select: {
          corporationId: true,
          corporation: {
            select: {
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      email: 'asc'
    }
  });

  console.log(`\nTotal users: ${users.length}\n`);

  for (const user of users) {
    console.log(`${user.email}`);
    console.log(`  Name: ${user.fullName}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  SuperAdmin: ${user.isSuperAdmin ? 'YES' : 'NO'}`);
    if (user.managerOf.length > 0) {
      console.log(`  Manager of: ${user.managerOf.map(m => `${m.corporation.name} (${m.corporationId})`).join(', ')}`);
    }
    if (user.supervisorOf.length > 0) {
      console.log(`  Supervisor of: ${user.supervisorOf.map(s => `${s.corporation.name} (${s.corporationId})`).join(', ')}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

listAllUsers().catch(console.error);
