/**
 * Data Integrity Check: Worker-Supervisor Assignment
 *
 * Finds and reports violations of business rules:
 * 1. Orphan workers in sites with supervisors (supervisorId = null, but site has supervisors)
 * 2. Workers assigned to supervisors not in their site (dangling references)
 * 3. Workers assigned to inactive supervisors
 *
 * Usage:
 *   npx tsx scripts/check-worker-supervisor-integrity.ts [--fix]
 *
 * Options:
 *   --fix    Automatically fix issues (assign orphans, clear invalid refs)
 *   --report Generate detailed report
 */

import { prisma } from '../lib/prisma';
import { findOrphanWorkers } from '../lib/supervisor-worker-assignment';

interface IntegrityIssue {
  type: 'ORPHAN_WORKER' | 'DANGLING_REFERENCE' | 'INACTIVE_SUPERVISOR';
  workerId: string;
  workerName: string;
  siteId: string;
  siteName: string;
  supervisorId?: string | null;
  supervisorName?: string;
  details: string;
}

async function checkOrphanWorkers(): Promise<IntegrityIssue[]> {
  console.log('\n🔍 Checking for orphan workers (sites with supervisors, workers without)...');

  const orphans = await findOrphanWorkers();

  return orphans.map(worker => ({
    type: 'ORPHAN_WORKER' as const,
    workerId: worker.id,
    workerName: worker.fullName,
    siteId: worker.siteId,
    siteName: worker.site.name,
    supervisorId: null,
    details: `Worker has no supervisor, but site has ${worker.site.supervisorAssignments.length} supervisor(s)`,
  }));
}

async function checkDanglingReferences(): Promise<IntegrityIssue[]> {
  console.log('\n🔍 Checking for dangling supervisor references...');

  // Find workers with supervisorId not in their site's supervisor assignments
  const workers = await prisma.worker.findMany({
    where: {
      supervisorId: { not: null },
      isActive: true,
    },
    include: {
      supervisor: {
        include: {
          user: true,
        },
      },
      site: {
        include: {
          supervisorAssignments: {
            select: {
              supervisorId: true,
            },
          },
        },
      },
    },
  });

  const issues: IntegrityIssue[] = [];

  for (const worker of workers) {
    const assignedSupervisorIds = worker.site.supervisorAssignments.map(sa => sa.supervisorId);

    // Check if worker's supervisor is assigned to their site
    if (worker.supervisorId && !assignedSupervisorIds.includes(worker.supervisorId)) {
      issues.push({
        type: 'DANGLING_REFERENCE',
        workerId: worker.id,
        workerName: worker.fullName,
        siteId: worker.siteId,
        siteName: worker.site.name,
        supervisorId: worker.supervisorId,
        supervisorName: worker.supervisor?.user.fullName || 'Unknown',
        details: `Worker assigned to supervisor not in site (supervisor not in supervisorSites)`,
      });
    }
  }

  return issues;
}

async function checkInactiveSupervisors(): Promise<IntegrityIssue[]> {
  console.log('\n🔍 Checking for workers assigned to inactive supervisors...');

  const workers = await prisma.worker.findMany({
    where: {
      isActive: true,
      supervisor: {
        isActive: false,
      },
    },
    include: {
      supervisor: {
        include: {
          user: true,
        },
      },
      site: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  return workers.map(worker => ({
    type: 'INACTIVE_SUPERVISOR' as const,
    workerId: worker.id,
    workerName: worker.fullName,
    siteId: worker.siteId,
    siteName: worker.site.name,
    supervisorId: worker.supervisorId,
    supervisorName: worker.supervisor?.user.fullName || 'Unknown',
    details: `Worker assigned to inactive supervisor`,
  }));
}

async function fixOrphanWorkers(issues: IntegrityIssue[]): Promise<number> {
  console.log('\n🔧 Fixing orphan workers (assigning to least-loaded supervisors)...');

  let fixed = 0;

  // Group by site
  const bySite = issues.reduce((acc, issue) => {
    if (!acc[issue.siteId]) acc[issue.siteId] = [];
    acc[issue.siteId].push(issue);
    return acc;
  }, {} as Record<string, IntegrityIssue[]>);

  for (const [siteId, siteIssues] of Object.entries(bySite)) {
    // Find least-loaded supervisor for this site
    const { findLeastLoadedSupervisor } = await import('../lib/supervisor-worker-assignment');
    const targetSupervisorId = await findLeastLoadedSupervisor(siteId);

    if (!targetSupervisorId) {
      console.log(`  ⚠️  Site ${siteIssues[0].siteName}: No available supervisor`);
      continue;
    }

    // Update all orphan workers in this site
    const workerIds = siteIssues.map(i => i.workerId);

    await prisma.worker.updateMany({
      where: {
        id: { in: workerIds },
      },
      data: {
        supervisorId: targetSupervisorId,
      },
    });

    console.log(`  ✅ Site ${siteIssues[0].siteName}: Fixed ${workerIds.length} worker(s)`);
    fixed += workerIds.length;
  }

  return fixed;
}

async function fixDanglingReferences(issues: IntegrityIssue[]): Promise<number> {
  console.log('\n🔧 Fixing dangling references (clearing invalid supervisorId)...');

  const workerIds = issues.map(i => i.workerId);

  if (workerIds.length === 0) return 0;

  await prisma.worker.updateMany({
    where: {
      id: { in: workerIds },
    },
    data: {
      supervisorId: null,
    },
  });

  console.log(`  ✅ Cleared ${workerIds.length} dangling reference(s)`);
  return workerIds.length;
}

async function fixInactiveSupervisors(issues: IntegrityIssue[]): Promise<number> {
  console.log('\n🔧 Fixing inactive supervisor assignments...');

  let fixed = 0;

  // Group by site
  const bySite = issues.reduce((acc, issue) => {
    if (!acc[issue.siteId]) acc[issue.siteId] = [];
    acc[issue.siteId].push(issue);
    return acc;
  }, {} as Record<string, IntegrityIssue[]>);

  for (const [siteId, siteIssues] of Object.entries(bySite)) {
    // Check if site has active supervisors
    const { getSiteSupervisorCount, findLeastLoadedSupervisor } = await import('../lib/supervisor-worker-assignment');
    const activeCount = await getSiteSupervisorCount(siteId);

    if (activeCount > 0) {
      // Reassign to least-loaded active supervisor
      const targetSupervisorId = await findLeastLoadedSupervisor(siteId);

      if (targetSupervisorId) {
        const workerIds = siteIssues.map(i => i.workerId);

        await prisma.worker.updateMany({
          where: {
            id: { in: workerIds },
          },
          data: {
            supervisorId: targetSupervisorId,
          },
        });

        console.log(`  ✅ Site ${siteIssues[0].siteName}: Reassigned ${workerIds.length} worker(s)`);
        fixed += workerIds.length;
      }
    } else {
      // No active supervisors - clear supervisorId
      const workerIds = siteIssues.map(i => i.workerId);

      await prisma.worker.updateMany({
        where: {
          id: { in: workerIds },
        },
        data: {
          supervisorId: null,
        },
      });

      console.log(`  ✅ Site ${siteIssues[0].siteName}: Cleared ${workerIds.length} worker(s) (no active supervisors)`);
      fixed += workerIds.length;
    }
  }

  return fixed;
}

async function main() {
  const shouldFix = process.argv.includes('--fix');

  console.log('═══════════════════════════════════════════════════════');
  console.log('   Worker-Supervisor Data Integrity Check');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Mode: ${shouldFix ? '🔧 FIX' : '📊 REPORT ONLY'}`);

  try {
    // Run all checks
    const [orphanIssues, danglingIssues, inactiveIssues] = await Promise.all([
      checkOrphanWorkers(),
      checkDanglingReferences(),
      checkInactiveSupervisors(),
    ]);

    const totalIssues = orphanIssues.length + danglingIssues.length + inactiveIssues.length;

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   SUMMARY');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Total issues found: ${totalIssues}`);
    console.log(`  - Orphan workers: ${orphanIssues.length}`);
    console.log(`  - Dangling references: ${danglingIssues.length}`);
    console.log(`  - Inactive supervisors: ${inactiveIssues.length}`);

    if (totalIssues === 0) {
      console.log('\n✅ No integrity issues found! Database is clean.');
      process.exit(0);
    }

    // Print detailed report
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('   DETAILED REPORT');
    console.log('═══════════════════════════════════════════════════════');

    if (orphanIssues.length > 0) {
      console.log('\n❌ ORPHAN WORKERS:');
      orphanIssues.forEach(issue => {
        console.log(`  - ${issue.workerName} (Site: ${issue.siteName})`);
        console.log(`    ${issue.details}`);
      });
    }

    if (danglingIssues.length > 0) {
      console.log('\n❌ DANGLING REFERENCES:');
      danglingIssues.forEach(issue => {
        console.log(`  - ${issue.workerName} → ${issue.supervisorName} (Site: ${issue.siteName})`);
        console.log(`    ${issue.details}`);
      });
    }

    if (inactiveIssues.length > 0) {
      console.log('\n❌ INACTIVE SUPERVISOR ASSIGNMENTS:');
      inactiveIssues.forEach(issue => {
        console.log(`  - ${issue.workerName} → ${issue.supervisorName} (Site: ${issue.siteName})`);
        console.log(`    ${issue.details}`);
      });
    }

    // Fix issues if --fix flag provided
    if (shouldFix) {
      console.log('\n═══════════════════════════════════════════════════════');
      console.log('   APPLYING FIXES');
      console.log('═══════════════════════════════════════════════════════');

      const [orphansFixed, danglingFixed, inactiveFixed] = await Promise.all([
        fixOrphanWorkers(orphanIssues),
        fixDanglingReferences(danglingIssues),
        fixInactiveSupervisors(inactiveIssues),
      ]);

      const totalFixed = orphansFixed + danglingFixed + inactiveFixed;

      console.log('\n═══════════════════════════════════════════════════════');
      console.log('   FIX SUMMARY');
      console.log('═══════════════════════════════════════════════════════');
      console.log(`Total issues fixed: ${totalFixed}/${totalIssues}`);
      console.log(`  - Orphan workers assigned: ${orphansFixed}`);
      console.log(`  - Dangling references cleared: ${danglingFixed}`);
      console.log(`  - Inactive assignments fixed: ${inactiveFixed}`);
      console.log('\n✅ Database integrity restored!');
    } else {
      console.log('\n💡 Run with --fix flag to automatically fix these issues:');
      console.log('   npx tsx scripts/check-worker-supervisor-integrity.ts --fix');
    }

    process.exit(totalIssues > 0 && !shouldFix ? 1 : 0);
  } catch (error) {
    console.error('\n❌ Error during integrity check:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
