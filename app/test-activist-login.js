const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function testLogin() {
  console.log('Testing activist login...\n');

  const email = '0544345287@activist.login';
  const password = 'active0';

  console.log(`1. Looking for user: ${email}`);
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.log('❌ User not found!');
    await prisma.$disconnect();
    return;
  }

  console.log(`✅ User found: ${user.fullName} (${user.role})`);
  console.log(`   - Active: ${user.isActive}`);
  console.log(`   - Require password change: ${user.requirePasswordChange}`);

  if (!user.passwordHash) {
    console.log('❌ User has no password hash!');
    await prisma.$disconnect();
    return;
  }

  console.log(`\n2. Verifying password: "${password}"`);
  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    console.log('❌ Password is invalid!');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ Password is valid!');

  console.log(`\n3. Checking activist profile...`);
  const activist = await prisma.activist.findUnique({
    where: { userId: user.id },
    include: {
      neighborhood: {
        include: {
          cityRelation: true,
        },
      },
    },
  });

  if (!activist) {
    console.log('❌ No activist profile found!');
  } else {
    console.log(`✅ Activist profile found:`);
    console.log(`   - Full name: ${activist.fullName}`);
    console.log(`   - Phone: ${activist.phone}`);
    console.log(`   - Neighborhood: ${activist.neighborhood?.name || 'N/A'}`);
    console.log(`   - City: ${activist.neighborhood?.cityRelation?.name || 'N/A'}`);
  }

  console.log('\n✅ ALL CHECKS PASSED - Login should work!');
  await prisma.$disconnect();
}

testLogin().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});
