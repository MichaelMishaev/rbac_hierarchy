import { prisma } from '../lib/prisma';

async function checkHaifaAssignments() {
  console.log('🔍 Checking haifa@gmail.com assignments...\n');

  // 1. Get user
  const user = await prisma.user.findUnique({
    where: { email: 'haifa@gmail.com' },
    select: { id: true, fullName: true, role: true },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  console.log('✅ User found:', user);
  console.log('');

  // 2. Get activist coordinator record
  const ac = await prisma.activistCoordinator.findFirst({
    where: { userId: user.id },
    select: { id: true, cityId: true, isActive: true },
  });

  if (!ac) {
    console.log('❌ No ActivistCoordinator record found!');
    return;
  }

  console.log('✅ ActivistCoordinator found:', ac);
  console.log('');

  // 3. Check M2M assignments
  const assignments = await prisma.activistCoordinatorNeighborhood.findMany({
    where: { activistCoordinatorId: ac.id },
    include: {
      neighborhood: {
        select: { id: true, name: true, isActive: true },
      },
    },
  });

  console.log(`📊 M2M Assignments: ${assignments.length}`);
  if (assignments.length === 0) {
    console.log('❌ NO NEIGHBORHOODS ASSIGNED VIA M2M TABLE!');
  } else {
    console.log('\nAssigned neighborhoods:');
    assignments.forEach((a, idx) => {
      console.log(`  ${idx + 1}. ${a.neighborhood.name} (${a.neighborhood.isActive ? 'Active' : 'Inactive'})`);
    });
  }

  // 4. Check legacy field assignments (old way)
  console.log('\n🔍 Checking legacy field assignments...');
  const legacyAssignments = await prisma.activistCoordinatorNeighborhood.findMany({
    where: { legacyActivistCoordinatorUserId: user.id },
    include: {
      neighborhood: {
        select: { name: true },
      },
    },
  });

  console.log(`📊 Legacy assignments: ${legacyAssignments.length}`);
  if (legacyAssignments.length > 0) {
    console.log('\nLegacy assigned neighborhoods:');
    legacyAssignments.forEach((a, idx) => {
      console.log(`  ${idx + 1}. ${a.neighborhood.name}`);
    });
  }

  await prisma.$disconnect();
}

checkHaifaAssignments().catch(console.error);
