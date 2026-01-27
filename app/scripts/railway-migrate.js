#!/usr/bin/env node
/**
 * Railway Migration Script (Node.js)
 * Runs database migrations before deployment
 * Uses Prisma to execute SQL (no psql needed)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Set version from version.json and record deployment
try {
  const versionPath = path.join(__dirname, '../version.json');
  if (fs.existsSync(versionPath)) {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    process.env.NEXT_PUBLIC_APP_VERSION = versionData.version;
    console.log(`📦 App Version: ${versionData.version}`);
    console.log(`⚙️  SW Version: ${versionData.serviceWorkerVersion}`);

    // Generate BUILD_ID for Railway deployment
    const buildDate = new Date().toISOString().split('T')[0];
    const gitSha = process.env.RAILWAY_GIT_COMMIT_SHA?.substring(0, 7) || 'unknown';
    const buildId = `${buildDate}-${gitSha}`;
    process.env.NEXT_PUBLIC_BUILD_ID = buildId;
    console.log(`🏗️  Build ID: ${buildId}`);

    // Record deployment in version.json
    const deployment = {
      buildId,
      appVersion: versionData.version,
      swVersion: versionData.serviceWorkerVersion,
      branch: process.env.RAILWAY_GIT_BRANCH || 'unknown',
      environment: process.env.RAILWAY_ENVIRONMENT || 'production',
      deployedAt: new Date().toISOString(),
      gitSha,
    };

    // Add deployment to history (keep last 20)
    versionData.deployments = versionData.deployments || [];
    versionData.deployments.unshift(deployment);
    versionData.deployments = versionData.deployments.slice(0, 20);

    // Write back to version.json
    fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2));
    console.log('✅ Recorded deployment in version.json');
  }
} catch (error) {
  console.log('⚠️  Could not update version.json:', error.message);
}

async function main() {
  console.log('🚂 Railway: Running database migrations...');

  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    console.log('❌ DATABASE_URL not set, skipping migrations');
    process.exit(0);
  }

  const prisma = new PrismaClient();

  try {
    // Check if session_events table exists
    console.log('📊 Checking if session_events table exists...');

    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'session_events'
      ) as exists
    `;

    const tableExists = result[0].exists;

    if (!tableExists) {
      console.log('⚠️  session_events table not found, creating it...');

      // Create table
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "session_events" (
          "id" TEXT PRIMARY KEY,
          "session_id" TEXT NOT NULL,
          "user_id" TEXT,
          "event_type" TEXT NOT NULL,
          "page" TEXT,
          "element" TEXT,
          "form_name" TEXT,
          "form_data" JSONB,
          "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "user_agent" TEXT,
          "city_id" TEXT,
          "load_time" INTEGER
        )
      `;

      // Create indexes
      const indexes = [
        'CREATE INDEX IF NOT EXISTS "session_events_session_id_idx" ON "session_events"("session_id")',
        'CREATE INDEX IF NOT EXISTS "session_events_user_id_idx" ON "session_events"("user_id")',
        'CREATE INDEX IF NOT EXISTS "session_events_timestamp_idx" ON "session_events"("timestamp" DESC)',
        'CREATE INDEX IF NOT EXISTS "session_events_event_type_idx" ON "session_events"("event_type")',
        'CREATE INDEX IF NOT EXISTS "session_events_session_id_timestamp_idx" ON "session_events"("session_id", "timestamp" DESC)',
      ];

      for (const indexSql of indexes) {
        await prisma.$executeRawUnsafe(indexSql);
      }

      console.log('✅ session_events table created with 5 indexes');
    } else {
      console.log('✅ session_events table already exists, skipping');
    }

    // Performance optimization indexes (2026-01-27)
    console.log('📊 Applying performance optimization indexes...');
    const performanceIndexes = [
      // Index for Activist queries filtered by coordinator and neighborhood
      'CREATE INDEX IF NOT EXISTS "activists_coordinator_neighborhood_idx" ON "activists"("activist_coordinator_id", "neighborhood_id")',
      // Index for AttendanceRecord queries filtered by neighborhood, date, and status
      'CREATE INDEX IF NOT EXISTS "attendance_records_neighborhood_date_status_idx" ON "attendance_records"("neighborhood_id", "date", "status")',
    ];

    for (const indexSql of performanceIndexes) {
      try {
        await prisma.$executeRawUnsafe(indexSql);
      } catch (err) {
        // Index might already exist, that's fine
        console.log(`  Index already exists or skipped: ${err.message}`);
      }
    }
    console.log('✅ Performance indexes applied');

    await prisma.$disconnect();
    console.log('✅ All migrations completed');
    process.exit(0);

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
