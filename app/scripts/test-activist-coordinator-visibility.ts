/**
 * Manual Test: Activist Coordinator Voter Visibility
 *
 * Verifies that Activist Coordinators can see:
 * 1. Voters they inserted themselves
 * 2. Voters inserted by activists they supervise
 */

import { PrismaClient } from '@prisma/client';
import type { UserContext } from '../lib/voters/core/types';
import { VoterVisibilityService } from '../lib/voters/visibility/service';

const prisma = new PrismaClient();

async function testActivistCoordinatorVisibility() {
  console.log('🧪 Testing Activist Coordinator Voter Visibility\n');

  try {
    // Step 1: Find Rachel (Activist Coordinator)
    const rachel = await prisma.user.findFirst({
      where: {
        email: 'rachel.bendavid@telaviv.test',
      },
      include: {
        activistCoordinatorOf: true,
      },
    });

    if (!rachel || !rachel.activistCoordinatorOf[0]) {
      console.error('❌ Rachel not found or not an Activist Coordinator');
      return;
    }

    console.log('✅ Found Rachel Ben-David:');
    console.log(`   - Email: ${rachel.email}`);
    console.log(`   - Role: ${rachel.role}`);
    console.log(`   - Coordinator ID: ${rachel.activistCoordinatorOf[0].id}\n`);

    // Step 2: Find activists supervised by Rachel
    const activists = await prisma.activist.findMany({
      where: {
        activistCoordinatorId: rachel.activistCoordinatorOf[0].id,
        isActive: true,
      },
      include: {
        user: true,
      },
    });

    console.log(`📋 Found ${activists.length} activists supervised by Rachel:\n`);
    for (const activist of activists) {
      console.log(`   - ${activist.fullName} (Phone: ${activist.phone})`);
      if (activist.user) {
        console.log(`     User ID: ${activist.user.id}`);
      }
    }
    console.log('');

    // Step 3: Count voters inserted by Rachel
    const rachelVoters = await prisma.voter.count({
      where: {
        insertedByUserId: rachel.id,
        isActive: true,
      },
    });

    console.log(`📊 Rachel's own voters: ${rachelVoters}`);

    // Step 4: Count voters inserted by her activists
    const activistUserIds = activists
      .filter(a => a.userId)
      .map(a => a.userId as string);

    const activistVoters = await prisma.voter.count({
      where: {
        insertedByUserId: { in: activistUserIds },
        isActive: true,
      },
    });

    console.log(`📊 Activists' voters: ${activistVoters}\n`);

    // Step 5: Test visibility service
    const visibilityService = new VoterVisibilityService(prisma);

    const rachelContext: UserContext = {
      userId: rachel.id,
      role: 'ACTIVIST_COORDINATOR',
      fullName: rachel.fullName,
      activistCoordinatorId: rachel.activistCoordinatorOf[0].id,
    };

    // Get all voters
    const allVoters = await prisma.voter.findMany({
      where: { isActive: true },
      take: 100,
    });

    console.log(`🔍 Testing visibility for ${allVoters.length} voters...\n`);

    let canSeeOwn = 0;
    let canSeeActivists = 0;
    let cannotSee = 0;

    for (const voter of allVoters) {
      const result = await visibilityService.canSeeVoter(rachelContext, voter);

      if (result.canSee) {
        if (voter.insertedByUserId === rachel.id) {
          canSeeOwn++;
        } else if (activistUserIds.includes(voter.insertedByUserId)) {
          canSeeActivists++;
          console.log(`   ✅ Can see activist voter: ${voter.fullName} (inserted by: ${voter.insertedByUserName})`);
        }
      } else {
        cannotSee++;
      }
    }

    console.log('\n📊 Visibility Results:');
    console.log(`   ✅ Can see own voters: ${canSeeOwn}`);
    console.log(`   ✅ Can see activists' voters: ${canSeeActivists} (NEW FEATURE!)`);
    console.log(`   ❌ Cannot see: ${cannotSee}\n`);

    // Step 6: Test visibility filter (query optimization)
    const filter = visibilityService.getVisibilityFilter(rachelContext);

    const visibleVoters = await prisma.voter.findMany({
      where: {
        isActive: true,
        ...filter,
      },
    });

    console.log(`🔍 Query Filter Test:`);
    console.log(`   Voters visible via filter: ${visibleVoters.length}`);
    console.log(`   Expected (own + activists): ${rachelVoters + activistVoters}\n`);

    if (visibleVoters.length === rachelVoters + activistVoters) {
      console.log('✅ SUCCESS: Filter returns correct number of voters!\n');
    } else {
      console.log('⚠️  WARNING: Filter count mismatch!\n');
    }

    // Step 7: Detailed breakdown
    console.log('📋 Detailed Breakdown:');
    const ownVotersList = visibleVoters.filter(v => v.insertedByUserId === rachel.id);
    const activistVotersList = visibleVoters.filter(v => activistUserIds.includes(v.insertedByUserId));

    console.log(`   Own voters: ${ownVotersList.length}`);
    for (const voter of ownVotersList.slice(0, 3)) {
      console.log(`     - ${voter.fullName} (${voter.phone})`);
    }
    if (ownVotersList.length > 3) {
      console.log(`     ... and ${ownVotersList.length - 3} more`);
    }

    console.log(`   \n   Activists' voters: ${activistVotersList.length}`);
    for (const voter of activistVotersList.slice(0, 3)) {
      console.log(`     - ${voter.fullName} (${voter.phone}) - inserted by: ${voter.insertedByUserName}`);
    }
    if (activistVotersList.length > 3) {
      console.log(`     ... and ${activistVotersList.length - 3} more`);
    }

    console.log('\n✅ TEST COMPLETE!\n');

    if (canSeeActivists > 0) {
      console.log('🎉 SUCCESS: Activist Coordinator can see activists\' voters!');
      console.log('The hierarchical visibility fix is working correctly.\n');
    } else if (activistVoters === 0) {
      console.log('ℹ️  INFO: No activists have created voters yet.');
      console.log('Create test voters as an activist to fully test the feature.\n');
    } else {
      console.log('❌ FAIL: Activist Coordinator cannot see activists\' voters.');
      console.log('The visibility rules may need debugging.\n');
    }

  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testActivistCoordinatorVisibility();
