/**
 * Debug script to verify password reset issue
 * Tests bcrypt hashing and comparison for the reported bug
 */

import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';

async function debugPasswordReset() {
  const email = 'michael1@cafon.com';
  const tempPassword = 'qwxcu5';

  console.log('🔍 Debugging password reset issue...');
  console.log('Email:', email);
  console.log('Temp Password:', tempPassword);
  console.log('Password length:', tempPassword.length);
  console.log('Password bytes:', Buffer.from(tempPassword).toString('hex'));
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
    },
  });

  if (!user) {
    console.log('❌ User not found in database!');
    return;
  }

  console.log('✅ User found:');
  console.log('  ID:', user.id);
  console.log('  Email:', user.email);
  console.log('  Full Name:', user.fullName);
  console.log('  Require Password Change:', user.requirePasswordChange);
  console.log('  Password Hash:', user.passwordHash?.substring(0, 60) + '...');
  console.log('---');

  if (!user.passwordHash) {
    console.log('❌ User has no password hash!');
    return;
  }

  // Test password comparison
  console.log('🔐 Testing password comparison...');

  // Test with exact password
  const isValidExact = await bcrypt.compare(tempPassword, user.passwordHash);
  console.log('  Exact match (qwxcu5):', isValidExact ? '✅ VALID' : '❌ INVALID');

  // Test with trimmed password
  const isValidTrimmed = await bcrypt.compare(tempPassword.trim(), user.passwordHash);
  console.log('  Trimmed match:', isValidTrimmed ? '✅ VALID' : '❌ INVALID');

  // Test with lowercase
  const isValidLower = await bcrypt.compare(tempPassword.toLowerCase(), user.passwordHash);
  console.log('  Lowercase match:', isValidLower ? '✅ VALID' : '❌ INVALID');

  // Test with uppercase
  const isValidUpper = await bcrypt.compare(tempPassword.toUpperCase(), user.passwordHash);
  console.log('  Uppercase match:', isValidUpper ? '✅ VALID' : '❌ INVALID');

  // Test with space before
  const isValidSpaceBefore = await bcrypt.compare(' ' + tempPassword, user.passwordHash);
  console.log('  Space before:', isValidSpaceBefore ? '✅ VALID' : '❌ INVALID');

  // Test with space after
  const isValidSpaceAfter = await bcrypt.compare(tempPassword + ' ', user.passwordHash);
  console.log('  Space after:', isValidSpaceAfter ? '✅ VALID' : '❌ INVALID');

  console.log('---');

  // Generate a fresh hash and test
  console.log('🔨 Testing fresh hash generation...');
  const freshHash = await bcrypt.hash(tempPassword, 10);
  const isFreshValid = await bcrypt.compare(tempPassword, freshHash);
  console.log('  Fresh hash comparison:', isFreshValid ? '✅ VALID' : '❌ INVALID');
  console.log('  Fresh hash:', freshHash.substring(0, 60) + '...');
  console.log('  Current hash:', user.passwordHash.substring(0, 60) + '...');
  console.log('  Hashes match:', freshHash === user.passwordHash ? '✅ YES' : '❌ NO (expected)');

  console.log('---');
  console.log('🔍 Root Cause Analysis:');

  if (!isValidExact) {
    console.log('❌ The stored password hash does NOT match the temp password "qwxcu5"');
    console.log('');
    console.log('Possible causes:');
    console.log('  1. Password was reset again with a different value');
    console.log('  2. Password hash corruption during save');
    console.log('  3. User copied password with extra characters');
    console.log('  4. Browser autocomplete interfering');
    console.log('');
    console.log('💡 Recommendation: Reset password again and test immediately');
  } else {
    console.log('✅ Password hash is correct!');
    console.log('');
    console.log('The issue is likely:');
    console.log('  - User typing extra spaces');
    console.log('  - Browser autocomplete adding characters');
    console.log('  - Copy-paste including invisible characters');
  }

  await prisma.$disconnect();
}

debugPasswordReset().catch(console.error);
