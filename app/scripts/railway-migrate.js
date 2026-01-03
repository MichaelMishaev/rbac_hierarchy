#!/usr/bin/env node
/**
 * Railway Migration Script (Node.js)
 * Runs database migrations before deployment
 * Uses Prisma to execute SQL (no psql needed)
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Set version from version.json
try {
  const versionPath = path.join(__dirname, '../version.json');
  if (fs.existsSync(versionPath)) {
    const versionData = JSON.parse(fs.readFileSync(versionPath, 'utf8'));
    process.env.NEXT_PUBLIC_APP_VERSION = versionData.version;
    console.log(`📦 App Version: ${versionData.version}`);
  }
} catch (error) {
  console.log('⚠️  Could not read version.json, using default');
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
