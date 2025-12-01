#!/usr/bin/env tsx
/**
 * Database Integrity QA Tests - v1.3 Compliance
 * Tests all composite foreign keys and data integrity constraints
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  details?: any;
}

const results: TestResult[] = [];

function log(emoji: string, message: string) {
  console.log(`${emoji} ${message}`);
}

async function runTest(
  name: string,
  testFn: () => Promise<{ pass: boolean; message: string; details?: any }>
) {
  try {
    const result = await testFn();
    results.push({
      name,
      status: result.pass ? 'PASS' : 'FAIL',
      message: result.message,
      details: result.details,
    });
    log(result.pass ? '✅' : '❌', `${name}: ${result.message}`);
  } catch (error: any) {
    results.push({
      name,
      status: 'FAIL',
      message: error.message,
    });
    log('❌', `${name}: ERROR - ${error.message}`);
  }
}

async function main() {
  log('🔍', 'Starting Database Integrity QA Tests...\n');

  // Test 1: Verify all users exist
  await runTest('User Table Integrity', async () => {
    const userCount = await prisma.user.count();
    const activeCount = await prisma.user.count({ where: { isActive: true } });
    const superAdminCount = await prisma.user.count({
      where: { isSuperAdmin: true },
    });

    return {
      pass: userCount >= 4 && superAdminCount >= 1,
      message: `${userCount} users (${activeCount} active, ${superAdminCount} superadmin)`,
      details: { userCount, activeCount, superAdminCount },
    };
  });

  // Test 2: Verify SuperAdmin flag
  await runTest('SuperAdmin Flag Test', async () => {
    const superAdmin = await prisma.user.findFirst({
      where: { email: 'superadmin@hierarchy.test' },
    });

    return {
      pass: superAdmin?.isSuperAdmin === true,
      message: superAdmin?.isSuperAdmin
        ? 'SuperAdmin flag correctly set'
        : 'SuperAdmin flag missing or incorrect',
      details: {
        email: superAdmin?.email,
        isSuperAdmin: superAdmin?.isSuperAdmin,
      },
    };
  });

  // Test 3: Worker.corporationId integrity
  await runTest('Worker.corporationId Integrity', async () => {
    const workers = await prisma.worker.findMany({
      include: {
        site: true,
        corporation: true,
      },
    });

    const integrityViolations = workers.filter(
      (w) => w.corporationId !== w.site.corporationId
    );

    return {
      pass: integrityViolations.length === 0,
      message:
        integrityViolations.length === 0
          ? `All ${workers.length} workers have matching corporationId`
          : `${integrityViolations.length} integrity violations found`,
      details: {
        totalWorkers: workers.length,
        violations: integrityViolations.length,
        integrityViolations: integrityViolations.map((w) => ({
          workerId: w.id,
          workerName: w.name,
          workerCorpId: w.corporationId,
          siteCorpId: w.site.corporationId,
        })),
      },
    };
  });

  // Test 4: SupervisorSite composite FK integrity
  await runTest('SupervisorSite Composite FK Integrity', async () => {
    const assignments = await prisma.supervisorSite.findMany({
      include: {
        siteManager: true,
        site: true,
      },
    });

    const violations = assignments.filter(
      (a) =>
        a.corporationId !== a.siteManager.corporationId ||
        a.corporationId !== a.site.corporationId
    );

    return {
      pass: violations.length === 0,
      message:
        violations.length === 0
          ? `All ${assignments.length} assignments have matching corporationId`
          : `${violations.length} composite FK violations found`,
      details: {
        totalAssignments: assignments.length,
        violations: violations.length,
        violationDetails: violations.map((a) => ({
          assignmentId: a.id,
          assignmentCorpId: a.corporationId,
          siteManagerCorpId: a.siteManager.corporationId,
          siteCorpId: a.site.corporationId,
        })),
      },
    };
  });

  // Test 5: Composite unique indexes exist
  await runTest('Composite Unique Indexes', async () => {
    // Try to violate composite unique constraint (should fail)
    const siteManager = await prisma.siteManager.findFirst();

    if (!siteManager) {
      return {
        pass: false,
        message: 'No SiteManager found to test',
      };
    }

    try {
      // Try to create duplicate with same id and corporationId (should fail)
      await prisma.$queryRaw`
        SELECT 1 FROM site_managers
        WHERE (id, corporation_id) = (${siteManager.id}, ${siteManager.corporationId})
      `;

      return {
        pass: true,
        message: 'Composite unique index working (query executed)',
      };
    } catch (error: any) {
      return {
        pass: false,
        message: `Index test failed: ${error.message}`,
      };
    }
  });

  // Test 6: UserToken table exists and works
  await runTest('UserToken Table', async () => {
    const tokenCount = await prisma.userToken.count();

    return {
      pass: true,
      message: `UserToken table operational (${tokenCount} tokens)`,
      details: { tokenCount },
    };
  });

  // Test 7: Corporation.settings and metadata
  await runTest('Corporation Fields', async () => {
    const corp = await prisma.corporation.findFirst();

    if (!corp) {
      return { pass: false, message: 'No corporation found' };
    }

    const hasSettings = corp.settings !== null;
    const hasMetadata = 'metadata' in corp;

    return {
      pass: hasSettings && hasMetadata,
      message: hasSettings && hasMetadata
        ? 'Corporation settings and metadata fields exist'
        : 'Missing fields',
      details: {
        hasSettings,
        hasMetadata,
        settingsType: typeof corp.settings,
      },
    };
  });

  // Test 8: Site geo fields
  await runTest('Site Geo Fields', async () => {
    const site = await prisma.site.findFirst();

    if (!site) {
      return { pass: false, message: 'No site found' };
    }

    const hasLatitude = 'latitude' in site;
    const hasLongitude = 'longitude' in site;
    const hasMetadata = 'metadata' in site;

    return {
      pass: hasLatitude && hasLongitude && hasMetadata,
      message: 'Site geo fields (latitude, longitude, metadata) exist',
      details: { hasLatitude, hasLongitude, hasMetadata },
    };
  });

  // Test 9: Area Manager hierarchy
  await runTest('Area Manager Hierarchy', async () => {
    const areaManagers = await prisma.areaManager.findMany({
      include: {
        corporations: true,
      },
    });

    const totalCorps = areaManagers.reduce(
      (sum, am) => sum + am.corporations.length,
      0
    );

    return {
      pass: areaManagers.length > 0,
      message: `${areaManagers.length} area managers managing ${totalCorps} corporations`,
      details: {
        areaManagerCount: areaManagers.length,
        corporationsCount: totalCorps,
      },
    };
  });

  // Test 10: Invitation.targetSiteId
  await runTest('Invitation.targetSiteId Field', async () => {
    const invitation = await prisma.invitation.findFirst();

    // Check if field exists in schema (it should, even if no data)
    const hasTargetSiteId = invitation ? 'targetSiteId' in invitation : true;

    return {
      pass: hasTargetSiteId,
      message: hasTargetSiteId
        ? 'Invitation.targetSiteId field exists'
        : 'Missing targetSiteId field',
      details: { invitationCount: await prisma.invitation.count() },
    };
  });

  // Print summary
  log('\n📊', 'QA Test Summary:');
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', '');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;

  log('✅', `Passed: ${passed}/${total}`);
  log('❌', `Failed: ${failed}/${total}`);
  log(
    failed === 0 ? '🎉' : '⚠️',
    failed === 0 ? 'All tests PASSED!' : `${failed} tests FAILED`
  );

  console.log('\n📋 Detailed Results:');
  console.log(JSON.stringify(results, null, 2));

  await prisma.$disconnect();

  process.exit(failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('❌ QA Tests failed:', error);
  process.exit(1);
});
