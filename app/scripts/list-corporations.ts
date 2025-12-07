import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listCorporations() {
  const corps = await prisma.corporation.findMany({
    select: {
      id: true,
      name: true,
      managers: {
        select: {
          user: {
            select: {
              email: true,
              fullName: true
            }
          }
        }
      },
      supervisors: {
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

  console.log(`\nTotal corporations: ${corps.length}\n`);

  for (const corp of corps) {
    console.log(`${corp.name}`);
    console.log(`  ID: ${corp.id}`);
    console.log(`  Managers: ${corp.managers.length}`);
    for (const m of corp.managers) {
      console.log(`    - ${m.user.email} (${m.user.fullName})`);
    }
    console.log(`  Supervisors: ${corp.supervisors.length}`);
    for (const s of corp.supervisors) {
      console.log(`    - ${s.user.email} (${s.user.fullName})`);
    }
    console.log('');
  }

  await prisma.$disconnect();
}

listCorporations().catch(console.error);
