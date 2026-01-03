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

      // Read SQL file
      const sqlPath = path.join(__dirname, '../prisma/migrations/manual/create_session_events_table.sql');
      const sql = fs.readFileSync(sqlPath, 'utf8');

      // Split by semicolons and execute each statement
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      for (const statement of statements) {
        // Skip DO blocks (they're procedural, not standard SQL)
        if (statement.trim().toUpperCase().startsWith('DO $$')) {
          continue;
        }

        try {
          await prisma.$executeRawUnsafe(statement);
        } catch (error) {
          // Ignore errors for CREATE IF NOT EXISTS (table might exist)
          if (!error.message.includes('already exists')) {
            throw error;
          }
        }
      }

      console.log('✅ session_events table created');
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
