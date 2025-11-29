/**
 * Comprehensive API Test Suite
 *
 * This file contains automated tests for all server actions.
 * Run with: npx tsx tests/integration/api-test-suite.ts
 */

import { prisma } from '@/lib/prisma';
import { seedTestData, cleanupTestData, assertions, db } from './test-helpers';
import { createUser, listUsers, getUserById, updateUser, deleteUser } from '@/app/actions/users';
import { createCorporation, listCorporations, getCorporationById } from '@/app/actions/corporations';
import { createSite, listSites, getSiteById } from '@/app/actions/sites';
import { createWorker, listWorkers, getWorkerById, bulkCreateWorkers } from '@/app/actions/workers';
import { createInvitation, acceptInvitation, listInvitations } from '@/app/actions/invitations';
import { getDashboardStats, getQuickStats } from '@/app/actions/dashboard';

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: string[] = [];

// Test runner helper
async function test(name: string, fn: () => Promise<void>) {
  totalTests++;
  try {
    await fn();
    passedTests++;
    console.log(`✅ ${name}`);
  } catch (error) {
    failedTests++;
    const message = error instanceof Error ? error.message : String(error);
    failures.push(`${name}: ${message}`);
    console.log(`❌ ${name}: ${message}`);
  }
}

// ============================================
// USER MANAGEMENT TESTS
// ============================================

async function testUserManagement() {
  console.log('\n🧪 Testing User Management APIs...\n');

  await test('Create User - Valid input', async () => {
    const result = await createUser({
      email: 'newuser@acme.com',
      name: 'New Test User',
      password: 'Password123!',
      role: 'SUPERVISOR',
      corporationId: testData.corporation.id,
      siteId: testData.site.id,
    });

    assertions.assertSuccess(result);
    if (!result.user) throw new Error('User not created');
    if (result.user.email !== 'newuser@acme.com') throw new Error('Email mismatch');
  });

  await test('Create User - Duplicate email fails', async () => {
    const result = await createUser({
      email: 'newuser@acme.com', // Same as above
      name: 'Another User',
      password: 'Password123!',
      role: 'SUPERVISOR',
      corporationId: testData.corporation.id,
    });

    assertions.assertError(result, 'already exists');
  });

  await test('List Users - Returns users', async () => {
    const result = await listUsers();
    assertions.assertSuccess(result);
    if (!result.users || result.users.length === 0) {
      throw new Error('No users returned');
    }
  });

  await test('Get User By ID - Returns user details', async () => {
    const result = await getUserById(testData.users.manager.id);
    assertions.assertSuccess(result);
    if (!result.user) throw new Error('User not found');
    if (result.user.email !== 'manager@acme.com') throw new Error('Wrong user');
  });

  await test('Update User - Updates successfully', async () => {
    const result = await updateUser(testData.users.supervisor.id, {
      name: 'Updated Supervisor Name',
      phone: '0501234567',
    });

    assertions.assertSuccess(result);
    if (!result.user) throw new Error('User not updated');
    if (result.user.name !== 'Updated Supervisor Name') throw new Error('Name not updated');
  });

  await test('Delete User - Deletes successfully', async () => {
    // Create a user to delete
    const createResult = await createUser({
      email: 'delete-me@acme.com',
      name: 'Delete Me',
      password: 'Password123!',
      role: 'SUPERVISOR',
      corporationId: testData.corporation.id,
    });

    if (!createResult.user) throw new Error('User not created');

    const deleteResult = await deleteUser(createResult.user.id);
    assertions.assertSuccess(deleteResult);

    // Verify deleted
    const user = await db.getUserByEmail('delete-me@acme.com');
    if (user) throw new Error('User not deleted');
  });
}

// ============================================
// CORPORATION MANAGEMENT TESTS
// ============================================

async function testCorporationManagement() {
  console.log('\n🏢 Testing Corporation Management APIs...\n');

  await test('Create Corporation - Valid input', async () => {
    const result = await createCorporation({
      name: 'Test Corporation',
      code: 'TESTCORP',
      description: 'A test corporation',
    });

    assertions.assertSuccess(result);
    if (!result.corporation) throw new Error('Corporation not created');
    if (result.corporation.code !== 'TESTCORP') throw new Error('Code mismatch');
  });

  await test('Create Corporation - Duplicate code fails', async () => {
    const result = await createCorporation({
      name: 'Another Corp',
      code: 'TESTCORP', // Duplicate
      description: 'Test',
    });

    assertions.assertError(result, 'already exists');
  });

  await test('List Corporations - Returns corporations', async () => {
    const result = await listCorporations();
    assertions.assertSuccess(result);
    if (!result.corporations || result.corporations.length === 0) {
      throw new Error('No corporations returned');
    }
  });

  await test('Get Corporation By ID - Returns details', async () => {
    const result = await getCorporationById(testData.corporation.id);
    assertions.assertSuccess(result);
    if (!result.corporation) throw new Error('Corporation not found');
    if (result.corporation.code !== 'ACME') throw new Error('Wrong corporation');
  });
}

// ============================================
// SITE MANAGEMENT TESTS
// ============================================

async function testSiteManagement() {
  console.log('\n🏭 Testing Site Management APIs...\n');

  await test('Create Site - Valid input', async () => {
    const result = await createSite({
      name: 'Test Site',
      city: 'Jerusalem',
      address: '123 Test Street',
      corporationId: testData.corporation.id,
    });

    assertions.assertSuccess(result);
    if (!result.site) throw new Error('Site not created');
    if (result.site.name !== 'Test Site') throw new Error('Name mismatch');
  });

  await test('List Sites - Returns sites', async () => {
    const result = await listSites();
    assertions.assertSuccess(result);
    if (!result.sites || result.sites.length === 0) {
      throw new Error('No sites returned');
    }
  });

  await test('Get Site By ID - Returns details', async () => {
    const result = await getSiteById(testData.site.id);
    assertions.assertSuccess(result);
    if (!result.site) throw new Error('Site not found');
    if (result.site.name !== 'Main Office') throw new Error('Wrong site');
  });

  await test('List Sites - Filters by city', async () => {
    const result = await listSites({ city: 'Tel Aviv' });
    assertions.assertSuccess(result);
    if (!result.sites) throw new Error('No sites returned');
    if (result.sites.length > 0 && !result.sites[0].city?.includes('Tel Aviv')) {
      throw new Error('Filter not working');
    }
  });
}

// ============================================
// WORKER MANAGEMENT TESTS
// ============================================

async function testWorkerManagement() {
  console.log('\n👷 Testing Worker Management APIs...\n');

  await test('Create Worker - Valid input', async () => {
    const result = await createWorker({
      name: 'Test Worker',
      position: 'Electrician',
      phone: '0501234567',
      siteId: testData.site.id,
      supervisorId: testData.users.supervisor.id,
    });

    assertions.assertSuccess(result);
    if (!result.worker) throw new Error('Worker not created');
    if (result.worker.name !== 'Test Worker') throw new Error('Name mismatch');
  });

  await test('List Workers - Returns workers', async () => {
    const result = await listWorkers();
    assertions.assertSuccess(result);
    if (!result.workers) throw new Error('No workers returned');
  });

  await test('Get Worker By ID - Returns details', async () => {
    const createResult = await createWorker({
      name: 'Worker to Fetch',
      siteId: testData.site.id,
      supervisorId: testData.users.supervisor.id,
    });

    if (!createResult.worker) throw new Error('Worker not created');

    const result = await getWorkerById(createResult.worker.id);
    assertions.assertSuccess(result);
    if (!result.worker) throw new Error('Worker not found');
    if (result.worker.name !== 'Worker to Fetch') throw new Error('Wrong worker');
  });

  await test('List Workers - Search filter works', async () => {
    const result = await listWorkers({ search: 'Electrician' });
    assertions.assertSuccess(result);
    if (!result.workers) throw new Error('No workers returned');
  });

  await test('Bulk Create Workers - Creates multiple', async () => {
    const result = await bulkCreateWorkers([
      {
        name: 'Bulk Worker 1',
        siteId: testData.site.id,
        position: 'Plumber',
      },
      {
        name: 'Bulk Worker 2',
        siteId: testData.site.id,
        position: 'Electrician',
      },
    ]);

    assertions.assertSuccess(result);
    if (!result.results) throw new Error('No results returned');
    if (result.results.successCount !== 2) {
      throw new Error(`Expected 2 successes, got ${result.results.successCount}`);
    }
  });
}

// ============================================
// INVITATION SYSTEM TESTS
// ============================================

async function testInvitationSystem() {
  console.log('\n📨 Testing Invitation System APIs...\n');

  let invitationToken: string;

  await test('Create Invitation - Valid input', async () => {
    const result = await createInvitation({
      email: 'invited@test.com',
      role: 'SUPERVISOR',
      corporationId: testData.corporation.id,
      siteId: testData.site.id,
      message: 'Welcome to our team!',
    });

    assertions.assertSuccess(result);
    if (!result.invitation) throw new Error('Invitation not created');
    if (result.invitation.email !== 'invited@test.com') throw new Error('Email mismatch');
    invitationToken = result.invitation.token;
  });

  await test('List Invitations - Returns invitations', async () => {
    const result = await listInvitations();
    assertions.assertSuccess(result);
    if (!result.invitations || result.invitations.length === 0) {
      throw new Error('No invitations returned');
    }
  });

  await test('Accept Invitation - Creates user', async () => {
    const result = await acceptInvitation({
      token: invitationToken,
      name: 'Invited User',
      phone: '0509876543',
      password: 'SecurePass123!',
    });

    assertions.assertSuccess(result);
    if (!result.user) throw new Error('User not created');
    if (result.user.email !== 'invited@test.com') throw new Error('Wrong email');

    // Verify invitation marked as accepted
    const invitation = await db.getInvitationByEmail('invited@test.com');
    if (!invitation) throw new Error('Invitation not found');
    if (invitation.status !== 'ACCEPTED') throw new Error('Status not updated');
  });

  await test('Create Invitation - Duplicate email fails', async () => {
    const result = await createInvitation({
      email: 'invited@test.com', // Already accepted
      role: 'SUPERVISOR',
      corporationId: testData.corporation.id,
    });

    assertions.assertError(result, 'already exists');
  });
}

// ============================================
// DASHBOARD STATS TESTS
// ============================================

async function testDashboardStats() {
  console.log('\n📊 Testing Dashboard Stats APIs...\n');

  await test('Get Dashboard Stats - Returns stats', async () => {
    const result = await getDashboardStats();
    assertions.assertSuccess(result);
    if (!result.stats) throw new Error('No stats returned');
  });

  await test('Get Quick Stats - Returns optimized data', async () => {
    const result = await getQuickStats();
    assertions.assertSuccess(result);
    if (!result.stats) throw new Error('No stats returned');
  });
}

// ============================================
// AUDIT LOGGING TESTS
// ============================================

async function testAuditLogging() {
  console.log('\n📝 Testing Audit Logging...\n');

  await test('Audit Logs - Created for user creation', async () => {
    const beforeCount = await db.countAuditLogs({ action: 'CREATE_USER' });

    await createUser({
      email: 'audit-test@acme.com',
      name: 'Audit Test',
      password: 'Password123!',
      role: 'SUPERVISOR',
      corporationId: testData.corporation.id,
    });

    const afterCount = await db.countAuditLogs({ action: 'CREATE_USER' });
    if (afterCount <= beforeCount) {
      throw new Error('Audit log not created');
    }
  });

  await test('Audit Logs - Created for worker update', async () => {
    const createResult = await createWorker({
      name: 'Worker for Audit',
      siteId: testData.site.id,
      supervisorId: testData.users.supervisor.id,
    });

    if (!createResult.worker) throw new Error('Worker not created');

    const beforeCount = await db.countAuditLogs({ action: 'UPDATE_WORKER' });

    await updateWorker(createResult.worker.id, {
      position: 'Senior Electrician',
    });

    const afterCount = await db.countAuditLogs({ action: 'UPDATE_WORKER' });
    if (afterCount <= beforeCount) {
      throw new Error('Audit log not created for update');
    }
  });
}

// ============================================
// MAIN TEST RUNNER
// ============================================

let testData: any;

async function runAllTests() {
  console.log('🚀 Starting API Test Suite...\n');
  console.log('================================================\n');

  try {
    // Setup
    console.log('📦 Setting up test data...\n');
    await cleanupTestData();
    testData = await seedTestData();
    console.log('✅ Test data ready\n');

    // Run all test suites
    await testUserManagement();
    await testCorporationManagement();
    await testSiteManagement();
    await testWorkerManagement();
    await testInvitationSystem();
    await testDashboardStats();
    await testAuditLogging();

    // Summary
    console.log('\n================================================\n');
    console.log('📊 Test Results:\n');
    console.log(`Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

    if (failedTests > 0) {
      console.log('\n❌ Failures:\n');
      failures.forEach((failure) => {
        console.log(`  - ${failure}`);
      });
    }

    // Cleanup
    console.log('\n🧹 Cleaning up...\n');
    await cleanupTestData();
    console.log('✅ Cleanup complete\n');

    process.exit(failedTests > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if executed directly
if (require.main === module) {
  runAllTests();
}

export { runAllTests };
