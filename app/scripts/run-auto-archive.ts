/**
 * Auto-Archive Task Assignments - Cron Job Script
 * v2.2: Dual Retention Policy (90 days normal, 365 days deleted)
 *
 * This script runs the auto_archive_old_tasks() PostgreSQL function
 * Can be run manually or via cron job (Railway, Docker, systemd)
 *
 * Usage:
 *   Manual: node scripts/run-auto-archive.ts
 *   Cron (Railway): 0 2 * * * (runs at 2 AM daily)
 *   Cron (Docker): Add to docker-compose.yml
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runAutoArchive() {
  try {
    console.log('[Auto-Archive] Starting task auto-archive...');
    console.log('[Auto-Archive] Timestamp:', new Date().toISOString());

    // Run the PostgreSQL function
    const result = await prisma.$queryRaw<
      Array<{
        archived_count: number;
        normal_archived: number;
        deleted_archived: number;
      }>
    >`SELECT * FROM auto_archive_old_tasks()`;

    if (result.length > 0) {
      const stats = result[0];
      console.log('[Auto-Archive] Results:');
      console.log(`  Total archived: ${stats.archived_count}`);
      console.log(`  Normal tasks (90 days): ${stats.normal_archived}`);
      console.log(`  Deleted tasks (365 days): ${stats.deleted_archived}`);

      if (stats.archived_count > 0) {
        console.log('[Auto-Archive] ✅ SUCCESS - Tasks archived');
      } else {
        console.log('[Auto-Archive] ℹ️  No tasks to archive');
      }
    } else {
      console.log('[Auto-Archive] ⚠️  Function returned no results');
    }
  } catch (error) {
    console.error('[Auto-Archive] ❌ ERROR:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if executed directly
if (require.main === module) {
  runAutoArchive()
    .then(() => {
      console.log('[Auto-Archive] Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Auto-Archive] Script failed:', error);
      process.exit(1);
    });
}

export default runAutoArchive;
