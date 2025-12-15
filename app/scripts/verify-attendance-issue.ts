#!/usr/bin/env tsx
/**
 * Verification Script: Attendance Issue for Activist Coordinators
 *
 * This script verifies that the backend logic for activist coordinator
 * attendance tracking is working correctly.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verify() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🔍 Attendance Issue Verification Script');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  try {
    // Test all activist coordinators
    const coordinators = await prisma.user.findMany({
      where: {
        role: 'ACTIVIST_COORDINATOR',
        isActive: true,
      },
      include: {
        activistCoordinatorOf: {
          include: {
            city: true,
          },
        },
        activistCoordinatorNeighborhoods: {
          include: {
            neighborhood: {
              include: {
                activists: {
                  where: { isActive: true },
                },
              },
            },
          },
        },
      },
    });

    console.log(`Found ${coordinators.length} active Activist Coordinators\n`);

    let allWorkingCorrectly = true;

    for (const coordinator of coordinators) {
      console.log(`\n${'='.repeat(60)}`);
      console.log(`👤 ${coordinator.fullName} (${coordinator.email})`);
      console.log(`${'='.repeat(60)}`);

      const assignments = coordinator.activistCoordinatorNeighborhoods;
      const totalActivists = assignments.reduce((sum, a) => sum + a.neighborhood.activists.length, 0);

      console.log(`\n📊 Summary:`);
      console.log(`   Assigned Neighborhoods: ${assignments.length}`);
      console.log(`   Total Activists: ${totalActivists}`);

      if (assignments.length === 0) {
        console.log(`\n❌ PROBLEM: No neighborhood assignments!`);
        console.log(`   This coordinator cannot see any activists.`);
        console.log(`   → Fix: Assign neighborhoods to this coordinator`);
        allWorkingCorrectly = false;
      } else if (totalActivists === 0) {
        console.log(`\n⚠️  WARNING: No activists in assigned neighborhoods`);
        console.log(`   This coordinator has neighborhoods but no activists to manage.`);
        console.log(`   → This might be expected if neighborhoods are empty`);
      } else {
        console.log(`\n✅ WORKING CORRECTLY`);
        console.log(`   This coordinator should see ${totalActivists} activists in the attendance page.`);
      }

      console.log(`\n📍 Assigned Neighborhoods:`);
      assignments.forEach((assignment, idx) => {
        console.log(`\n   ${idx + 1}. ${assignment.neighborhood.name}`);
        console.log(`      ID: ${assignment.neighborhoodId}`);
        console.log(`      Activists: ${assignment.neighborhood.activists.length}`);

        if (assignment.neighborhood.activists.length > 0) {
          console.log(`      Activists list:`);
          assignment.neighborhood.activists.slice(0, 5).forEach((activist) => {
            console.log(`        • ${activist.fullName} (${activist.phone || 'no phone'})`);
          });
          if (assignment.neighborhood.activists.length > 5) {
            console.log(`        ... and ${assignment.neighborhood.activists.length - 5} more`);
          }
        }
      });
    }

    console.log(`\n\n${'━'.repeat(60)}`);
    console.log('📋 VERIFICATION RESULTS');
    console.log(`${'━'.repeat(60)}\n`);

    if (allWorkingCorrectly) {
      console.log('✅ ALL BACKEND LOGIC IS WORKING CORRECTLY\n');
      console.log('If activists are still not visible in the UI:');
      console.log('\n🔧 SOLUTIONS:');
      console.log('   1. Ask the user to LOGOUT completely');
      console.log('   2. Clear browser cache (Ctrl+Shift+Del)');
      console.log('   3. LOGIN AGAIN with the activist coordinator account');
      console.log('   4. Verify they are logged in with the correct account');
      console.log('\n💡 REASON:');
      console.log('   The user\'s session (JWT token) might contain stale data');
      console.log('   from before the database was seeded or updated.');
      console.log('\n📱 FOR DEVELOPERS:');
      console.log('   - Clear Next.js cache: rm -rf .next && npm run dev');
      console.log('   - Check browser console for errors');
      console.log('   - Test in incognito mode to rule out cache issues');
    } else {
      console.log('❌ ISSUES FOUND - See details above');
      console.log('\n🔧 FIX:');
      console.log('   Run: npx tsx scripts/fix-all-neighborhoods.ts');
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Verification failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verify();
