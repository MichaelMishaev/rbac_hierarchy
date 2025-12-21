/**
 * Debug script to check haifa@gmail.com org tree data
 */

import { prisma } from '../lib/prisma';

async function debugHaifaOrgTree() {
  const email = 'haifa@gmail.com';

  console.log('🔍 Debugging org tree for:', email);
  console.log('---');

  // Get user
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      activistCoordinatorOf: {
        include: {
          city: true,
          neighborhoodAssignments: {
            include: {
              neighborhood: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    console.log('❌ User not found!');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Full Name:', user.fullName);
  console.log('  Role:', user.role);
  console.log('---');

  console.log('🔍 Activist Coordinator Data:');
  if (!user.activistCoordinatorOf || user.activistCoordinatorOf.length === 0) {
    console.log('❌ NO ACTIVIST_COORDINATOR RECORD FOUND!');
    console.log('');
    console.log('This user has role ACTIVIST_COORDINATOR but no activistCoordinator record.');
    console.log('');
    console.log('💡 ROOT CAUSE: User was created but activistCoordinator relation was not created.');
    console.log('');
    console.log('🔧 FIX NEEDED:');
    console.log('  1. Create activistCoordinator record for this user');
    console.log('  2. Assign to a city');
    console.log('  3. Assign to neighborhoods');
  } else {
    console.log('✅ Activist Coordinator Records:', user.activistCoordinatorOf.length);
    user.activistCoordinatorOf.forEach((ac, index) => {
      console.log(`\n  Record ${index + 1}:`);
      console.log('    ID:', ac.id);
      console.log('    City:', ac.city?.name || 'N/A');
      console.log('    City ID:', ac.cityId);
      console.log('    Title:', ac.title || 'N/A');
      console.log('    Active:', ac.isActive);
      console.log('    Neighborhood Assignments:', ac.neighborhoodAssignments.length);

      if (ac.neighborhoodAssignments.length === 0) {
        console.log('    ⚠️  WARNING: No neighborhoods assigned!');
      } else {
        ac.neighborhoodAssignments.forEach((na, naIndex) => {
          console.log(`      ${naIndex + 1}. ${na.neighborhood.name}`);
        });
      }
    });
  }

  console.log('---');
  console.log('📊 Summary:');

  if (!user.activistCoordinatorOf || user.activistCoordinatorOf.length === 0) {
    console.log('❌ CRITICAL: Missing activistCoordinator record');
    console.log('   This causes "Failed to fetch organizational tree" error');
    console.log('   API returns 403: Activist Coordinator not assigned to any neighborhoods');
  } else if (user.activistCoordinatorOf.some(ac => ac.neighborhoodAssignments.length === 0)) {
    console.log('⚠️  WARNING: Activist Coordinator exists but has no neighborhoods');
    console.log('   This will also cause org tree error');
  } else {
    console.log('✅ Activist Coordinator properly configured');
  }

  await prisma.$disconnect();
}

debugHaifaOrgTree().catch(console.error);
