import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    orderBy: { email: 'asc' },
    select: {
      email: true,
      fullName: true,
      role: true,
    },
  });

  console.log('\n📋 Current users in database:\n');
  console.log('Email'.padEnd(50), 'Full Name'.padEnd(30), 'Role');
  console.log('='.repeat(100));

  users.forEach(user => {
    console.log(
      user.email.padEnd(50),
      (user.fullName || 'N/A').padEnd(30),
      user.role
    );
  });

  console.log('\n✅ Total users:', users.length);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
