import { prisma } from '../lib/prisma';

async function checkUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isSuperAdmin: true,
    },
    take: 10,
  });

  console.log('Users in database:');
  console.log(JSON.stringify(users, null, 2));

  console.log('\nTotal users:', users.length);
}

checkUsers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
