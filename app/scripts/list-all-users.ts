import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listAllUsers() {
  const users = await prisma.user.findMany({
    select: {
      email: true,
      fullName: true,
      role: true,
      isSuperAdmin: true,
      coordinatorOf: {
        select: {
          cityId: true,
          city: {
            select: {
              name: true
            }
          }
        }
      },
      activistCoordinatorOf: {
        select: {
          cityId: true,
          city: {
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
    if (user.coordinatorOf.length > 0) {
      console.log(`  City Coordinator of: ${user.coordinatorOf.map(m => `${m.city.name} (${m.cityId})`).join(', ')}`);
    }
    if (user.activistCoordinatorOf.length > 0) {
      console.log(`  Activist Coordinator of: ${user.activistCoordinatorOf.map(s => `${s.city.name} (${s.cityId})`).join(', ')}`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

listAllUsers().catch(console.error);
