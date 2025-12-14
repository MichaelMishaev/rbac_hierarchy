#!/usr/bin/env tsx
/**
 * Test production login credentials
 * Simulates the exact logic from auth.config.ts
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function testLogin() {
  const email = 'admin@election.test';
  const password = 'admin123';

  console.log('🔍 Testing login for:', email);
  console.log('🔍 Password:', password);
  console.log('');

  try {
    // Step 1: Find user by email
    console.log('Step 1: Finding user by email...');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return;
    }

    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
      isActive: user.isActive,
    });
    console.log('');

    // Step 2: Check if passwordHash exists
    console.log('Step 2: Checking password hash...');
    if (!user.passwordHash) {
      console.log('❌ User has no password hash');
      return;
    }

    console.log('✅ Password hash exists');
    console.log('   Hash length:', user.passwordHash.length);
    console.log('   Hash preview:', user.passwordHash.substring(0, 20) + '...');
    console.log('');

    // Step 3: Verify password
    console.log('Step 3: Verifying password...');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      console.log('❌ Password does NOT match');
      console.log('');
      console.log('Debugging info:');
      console.log('  Expected password:', password);
      console.log('  Hash in database:', user.passwordHash);

      // Try generating a new hash to compare
      const testHash = await bcrypt.hash(password, 10);
      console.log('  New test hash:', testHash);

      const testMatch = await bcrypt.compare(password, testHash);
      console.log('  Test hash matches:', testMatch);

      return;
    }

    console.log('✅ Password matches!');
    console.log('');
    console.log('🎉 Login would succeed with these credentials');
    console.log('');
    console.log('User session data:');
    console.log({
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      isSuperAdmin: user.isSuperAdmin,
    });

  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testLogin();
