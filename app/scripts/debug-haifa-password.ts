/**
 * Debug script to verify haifa@gmail.com password
 */

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function debugHaifaPassword() {
  const email = 'haifa@gmail.com';
  const expectedPassword = 'admin0';

  console.log('🔍 Debugging haifa@gmail.com password...');
  console.log('Email:', email);
  console.log('Expected Password:', expectedPassword);
  console.log('---');

  // Get user from database
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      fullName: true,
      passwordHash: true,
      requirePasswordChange: true,
      role: true,
      createdAt: true,
    },
  });

  if (!user) {
    console.log('❌ User not found in database!');
    await prisma.$disconnect();
    return;
  }

  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Full Name:', user.fullName);
  console.log('  Role:', user.role);
  console.log('  Require Password Change:', user.requirePasswordChange);
  console.log('  Created At:', user.createdAt);
  console.log('  Password Hash:', user.passwordHash?.substring(0, 60) + '...');
  console.log('---');

  if (!user.passwordHash) {
    console.log('❌ User has no password hash!');
    await prisma.$disconnect();
    return;
  }

  // Test password comparisons
  console.log('🔐 Testing password comparisons...');

  // Test with exact expected password
  const isValidExact = await bcrypt.compare(expectedPassword, user.passwordHash);
  console.log(`  "${expectedPassword}":`, isValidExact ? '✅ VALID' : '❌ INVALID');

  // Test variations
  const variations = [
    'admin0',      // exact
    'admono0',     // typo from screenshot
    'admon0',      // missing 'i'
    'admin0 ',     // trailing space
    ' admin0',     // leading space
    'Admin0',      // capitalized
    'ADMIN0',      // all caps
  ];

  console.log('\n  Testing variations:');
  for (const variant of variations) {
    const isValid = await bcrypt.compare(variant, user.passwordHash);
    console.log(`    "${variant}":`, isValid ? '✅ VALID' : '❌ INVALID');
  }

  console.log('---');

  // Generate fresh hash with bcrypt.hash (what the code uses)
  console.log('🔨 Testing fresh hash generation...');
  const freshHash12 = await bcrypt.hash(expectedPassword, 12);
  const isFreshValid12 = await bcrypt.compare(expectedPassword, freshHash12);
  console.log('  Using hash(password, 12):');
  console.log('    Fresh hash comparison:', isFreshValid12 ? '✅ VALID' : '❌ INVALID');
  console.log('    Fresh hash:', freshHash12.substring(0, 60) + '...');

  // Also test with rounds=10 (what password-reset.ts uses)
  const freshHash10 = await bcrypt.hash(expectedPassword, 10);
  const isFreshValid10 = await bcrypt.compare(expectedPassword, freshHash10);
  console.log('  Using hash(password, 10):');
  console.log('    Fresh hash comparison:', isFreshValid10 ? '✅ VALID' : '❌ INVALID');
  console.log('    Fresh hash:', freshHash10.substring(0, 60) + '...');

  console.log('---');
  console.log('📊 Analysis:');

  if (isValidExact) {
    console.log('✅ Password hash is CORRECT for "admin0"');
    console.log('');
    console.log('The issue is likely:');
    console.log('  - User typing wrong password');
    console.log('  - Browser autocomplete interference');
    console.log('  - Copy-paste with invisible characters');
  } else {
    console.log('❌ Password hash does NOT match "admin0"');
    console.log('');
    console.log('Possible causes:');
    console.log('  1. Password was generated with different value');
    console.log('  2. Password hash corruption during save');
    console.log('  3. Wrong bcrypt rounds used');
    console.log('  4. Code bug in createActivistCoordinatorQuick');
  }

  await prisma.$disconnect();
}

debugHaifaPassword().catch(console.error);
