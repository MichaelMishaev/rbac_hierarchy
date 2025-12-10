import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCorporations() {
  const corps = await prisma.city.findMany({
    select: {
      id: true,
      name: true,
      coordinators: {
        select: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      },
      activistCoordinators: {
        select: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      }
    },
    orderBy: {
      name: 'asc'
    }
  });

  console.log(`\nTotal cities: ${corps.length}\n`);

  for (const corp of corps) {
    console.log(`${corp.name}`);
    console.log(`  ID: ${corp.id}`);
    console.log(`  City Coordinators: ${corp.coordinators.length}`);
    for (const m of corp.coordinators) {
      console.log(`    - ${m.user.email} (${m.user.fullName})`);
    }
    console.log(`  Activist Coordinators: ${corp.activistCoordinators.length}`);
    for (const s of corp.activistCoordinators) {
      console.log(`    - ${s.user.email} (${s.user.fullName})`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

listCorporations().catch(console.error);
