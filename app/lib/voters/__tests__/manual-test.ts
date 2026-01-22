/**
 * Manual Test Runner for Voter System
 *
 * Simple test script to verify the SOLID architecture works
 * Run with: npx tsx lib/voters/__tests__/manual-test.ts
 */

import { InMemoryVoterRepository } from '../repository/in-memory-repository';
import type { UserContext, CreateVoterInput } from '../core/types';
import {
  VoterVisibilityEngine,
  SuperAdminVisibilityRule,
  DirectInserterVisibilityRule,
  ActivistCoordinatorVisibilityRule,
} from '../visibility/rules';
import { guardCreateVoter, InvariantViolationError } from '../core/invariants';
import { createVoterSchema } from '../validation/schemas';

console.log('🧪 Starting Voter System Manual Tests...\n');

async function runTests() {
  const repository = new InMemoryVoterRepository();
  let passed = 0;
  let failed = 0;

  // Helper to run a test
  async function test(name: string, fn: () => Promise<void> | void) {
    try {
      await fn();
      console.log(`✅ ${name}`);
      passed++;
    } catch (error) {
      console.error(`❌ ${name}`);
      console.error(`   Error: ${error instanceof Error ? error.message : error}`);
      failed++;
    }
  }

  // Test 1: Create a voter
  await test('Create voter with valid data', async () => {
    const input: CreateVoterInput = {
      fullName: 'יוסי כהן',
      phone: '0501234567',
      insertedByUserId: 'user-1',
      insertedByUserName: 'רחל בן-דוד',
      insertedByUserRole: 'רכז פעילים',
      supportLevel: 'תומך',
    };

    const voter = await repository.create(input);
    if (!voter.id) throw new Error('Voter ID not generated');
    if (voter.fullName !== 'יוסי כהן') throw new Error('Name mismatch');
    if (!voter.isActive) throw new Error('Voter should be active');
  });

  // Test 2: Update voter and track history
  await test('Update voter and track edit history', async () => {
    const voter = await repository.create({
      fullName: 'דני לוי',
      phone: '0509876543',
      insertedByUserId: 'user-1',
      insertedByUserName: 'רחל',
      insertedByUserRole: 'רכז פעילים',
    });

    const updated = await repository.update(
      voter.id,
      { supportLevel: 'תומך' },
      { userId: 'user-2', fullName: 'דוד', role: 'CITY_COORDINATOR' }
    );

    if (updated.supportLevel !== 'תומך') throw new Error('Support level not updated');

    const withHistory = await repository.findByIdWithHistory(voter.id);
    if (!withHistory) throw new Error('Voter not found');
    if (withHistory.editHistory.length !== 1) throw new Error('Edit history not recorded');
    if (withHistory.editHistory[0].editedByUserName !== 'דוד') throw new Error('Editor name mismatch');
  });

  // Test 3: Soft delete
  await test('Soft delete a voter', async () => {
    const voter = await repository.create({
      fullName: 'מיכל שמיר',
      phone: '0502223333',
      insertedByUserId: 'user-1',
      insertedByUserName: 'רחל',
      insertedByUserRole: 'רכז פעילים',
    });

    const deleted = await repository.softDelete(voter.id, {
      userId: 'user-1',
      fullName: 'רחל',
    });

    if (deleted.isActive) throw new Error('Voter should be inactive after soft delete');
    if (!deleted.deletedAt) throw new Error('Deleted timestamp not set');
    if (deleted.deletedByUserId !== 'user-1') throw new Error('Deleted by user not recorded');
  });

  // Test 4: Find duplicates
  await test('Find duplicate voters by phone', async () => {
    await repository.create({
      fullName: 'אחד',
      phone: '0501111111',
      insertedByUserId: 'user-1',
      insertedByUserName: 'רחל',
      insertedByUserRole: 'רכז פעילים',
    });

    await repository.create({
      fullName: 'שניים',
      phone: '0501111111', // Duplicate!
      insertedByUserId: 'user-2',
      insertedByUserName: 'יעל',
      insertedByUserRole: 'רכז פעילים',
    });

    const duplicates = await repository.findByPhone('0501111111');
    if (duplicates.length !== 2) throw new Error(`Expected 2 duplicates, got ${duplicates.length}`);
  });

  // Test 5: Visibility - SuperAdmin
  await test('SuperAdmin can see all voters', async () => {
    const engine = new VoterVisibilityEngine([
      new SuperAdminVisibilityRule(),
      new DirectInserterVisibilityRule(),
    ]);

    const superAdmin: UserContext = {
      userId: 'super-1',
      email: 'superadmin@test.com',
      role: 'SUPERADMIN',
      fullName: 'מנהל על',
    };

    const voter = await repository.create({
      fullName: 'בוחר',
      phone: '0501234567',
      insertedByUserId: 'other-user',
      insertedByUserName: 'אחר',
      insertedByUserRole: 'רכז פעילים',
    });

    const result = await engine.canSee(superAdmin, voter);
    if (!result.canSee) throw new Error('SuperAdmin should see all voters');
    if (result.ruleName !== 'SuperAdminRule') throw new Error('Wrong rule applied');
  });

  // Test 6: Visibility - Direct inserter
  await test('User can see voters they inserted', async () => {
    const engine = new VoterVisibilityEngine([
      new SuperAdminVisibilityRule(),
      new DirectInserterVisibilityRule(),
    ]);

    const user: UserContext = {
      userId: 'user-1',
      email: 'user1@test.com',
      role: 'ACTIVIST_COORDINATOR',
      fullName: 'רחל',
    };

    const voter = await repository.create({
      fullName: 'בוחר',
      phone: '0501234567',
      insertedByUserId: 'user-1',
      insertedByUserName: 'רחל',
      insertedByUserRole: 'רכז פעילים',
    });

    const result = await engine.canSee(user, voter);
    if (!result.canSee) throw new Error('User should see their own voters');
    if (result.ruleName !== 'DirectInserterRule') throw new Error('Wrong rule applied');
  });

  // Test 7: Visibility - Denied
  await test('User cannot see other users voters', async () => {
    // Mock getUserHierarchy function
    const getUserHierarchy = async (userId: string) => {
      return { role: 'ACTIVIST_COORDINATOR', cityId: 'city-1' };
    };

    const engine = new VoterVisibilityEngine([
      new SuperAdminVisibilityRule(),
      new DirectInserterVisibilityRule(),
      new ActivistCoordinatorVisibilityRule(getUserHierarchy),
    ]);

    const user: UserContext = {
      userId: 'user-1',
      email: 'user1@test.com',
      role: 'ACTIVIST_COORDINATOR',
      fullName: 'רחל',
    };

    const voter = await repository.create({
      fullName: 'בוחר',
      phone: '0501234567',
      insertedByUserId: 'other-user',
      insertedByUserName: 'אחר',
      insertedByUserRole: 'רכז פעילים',
    });

    const result = await engine.canSee(user, voter);
    if (result.canSee) throw new Error('User should NOT see other users voters');
  });

  // Test 8: Invariant - Voter must have owner
  await test('INV-V01: Voter must have organizational owner', () => {
    const invalidInput = {
      fullName: 'בוחר',
      phone: '0501234567',
      insertedByUserId: '', // INVALID!
      insertedByUserName: '',
      insertedByUserRole: '',
    } as CreateVoterInput;

    try {
      guardCreateVoter(invalidInput);
      throw new Error('Should have thrown InvariantViolationError');
    } catch (error) {
      if (!(error instanceof InvariantViolationError)) {
        throw new Error('Should throw InvariantViolationError');
      }
      if (!error.message.includes('INV-V01')) {
        throw new Error('Should reference INV-V01');
      }
    }
  });

  // Test 9: Invariant - Phone format
  await test('Validate Israeli phone format', () => {
    const invalidInput = {
      fullName: 'בוחר',
      phone: '123', // INVALID!
      insertedByUserId: 'user-1',
      insertedByUserName: 'רחל',
      insertedByUserRole: 'רכז פעילים',
    } as CreateVoterInput;

    try {
      guardCreateVoter(invalidInput);
      throw new Error('Should have thrown InvariantViolationError');
    } catch (error) {
      if (!(error instanceof InvariantViolationError)) {
        throw new Error('Should throw InvariantViolationError');
      }
    }
  });

  // Test 10: Zod validation
  await test('Zod schema validates correct data', () => {
    const validData = {
      fullName: 'בוחר תקין',
      phone: '0501234567',
      supportLevel: 'תומך',
      contactStatus: 'נוצר קשר',
      priority: 'גבוה',
    };

    const result = createVoterSchema.safeParse(validData);
    if (!result.success) {
      throw new Error(`Validation failed: ${JSON.stringify(result.error.errors)}`);
    }
  });

  // Test 11: Statistics
  await test('Get voter statistics', async () => {
    const viewer: UserContext = {
      userId: 'super-1',
      email: 'superadmin@test.com',
      role: 'SUPERADMIN',
      fullName: 'מנהל על',
    };

    const stats = await repository.getStatistics(viewer);
    if (typeof stats.total !== 'number') throw new Error('Total should be a number');
    if (typeof stats.active !== 'number') throw new Error('Active should be a number');
  });

  // Test 12: Export to CSV
  await test('Export voters to CSV', async () => {
    const voter = await repository.create({
      fullName: 'בוחר לייצוא',
      phone: '0507777777',
      insertedByUserId: 'user-1',
      insertedByUserName: 'רחל',
      insertedByUserRole: 'רכז פעילים',
    });

    const csv = await repository.exportToCSV([voter]);
    if (!csv.includes('שם מלא')) throw new Error('CSV should include Hebrew headers');
    if (!csv.includes('בוחר לייצוא')) throw new Error('CSV should include voter name');
    if (!csv.includes('0507777777')) throw new Error('CSV should include phone number');
  });

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results:`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(50));

  if (failed === 0) {
    console.log('\n🎉 All tests passed! SOLID architecture is working perfectly!');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Please review the errors above.`);
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('\n💥 Fatal error running tests:');
  console.error(error);
  process.exit(1);
});
