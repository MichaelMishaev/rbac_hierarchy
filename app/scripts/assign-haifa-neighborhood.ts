import { prisma } from '../lib/prisma';

async function assignHaifaNeighborhood() {
  console.log('🔧 Assigning neighborhood to haifa@gmail.com...\n');

  // 1. Get user and coordinator
  const user = await prisma.user.findUnique({
    where: { email: 'haifa@gmail.com' },
  });

  if (!user) {
    console.log('❌ User not found!');
    return;
  }

  const ac = await prisma.activistCoordinator.findFirst({
    where: { userId: user.id },
  });

  if (!ac) {
    console.log('❌ ActivistCoordinator not found!');
    return;
  }

  console.log('✅ User:', user.fullName);
  console.log('✅ Activist Coordinator ID:', ac.id);
  console.log('✅ City ID:', ac.cityId);
  console.log('');

  // 2. Get all neighborhoods in their city
  const neighborhoods = await prisma.neighborhood.findMany({
    where: {
      cityId: ac.cityId,
      isActive: true,
    },
    select: { id: true, name: true },
  });

  console.log(`📍 Found ${neighborhoods.length} active neighborhoods in Haifa:`);
  neighborhoods.forEach((n, index) => {
    console.log(`  ${index + 1}. ${n.name}`);
  });
  console.log('');

  if (neighborhoods.length === 0) {
    console.log('❌ No active neighborhoods found in Haifa!');
    console.log('💡 You need to create neighborhoods first via michael1@cafon.com (City Coordinator)');
    return;
  }

  // 3. Assign ALL neighborhoods to this coordinator (or just the first one)
  console.log('✅ Assigning ALL neighborhoods to haifa@gmail.com...\n');

  for (const neighborhood of neighborhoods) {
    // Check if already assigned
    const existing = await prisma.activistCoordinatorNeighborhood.findUnique({
      where: {
        activistCoordinatorId_neighborhoodId: {
          activistCoordinatorId: ac.id,
          neighborhoodId: neighborhood.id,
        },
      },
    });

    if (existing) {
      console.log(`  ⏭️  ${neighborhood.name} - Already assigned`);
      continue;
    }

    // Create assignment
    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId: ac.id,
        neighborhoodId: neighborhood.id,
        cityId: ac.cityId,
        legacyActivistCoordinatorUserId: user.id,
      },
    });

    console.log(`  ✅ ${neighborhood.name} - Assigned`);
  }

  console.log('\n✅ All neighborhoods assigned!');
  console.log('🔄 Now refresh the /neighborhoods page as haifa@gmail.com');

  await prisma.$disconnect();
}

assignHaifaNeighborhood().catch(console.error);
