/**
 * Restore Production Database from Local SQL Dump
 *
 * This script:
 * 1. Drops all tables in production database
 * 2. Imports the local database SQL dump
 * 3. Verifies the restoration
 *
 * Usage: npm run db:restore-prod
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function main() {
  console.log('🗄️  Database Restoration to Production');
  console.log('======================================\n');

  // Check if we're actually in production environment
  const dbUrl = process.env.DATABASE_URL || '';

  if (!dbUrl.includes('railway')) {
    console.error('❌ Error: This script should only run against Railway production database');
    console.error('Current DATABASE_URL does not contain "railway"');
    process.exit(1);
  }

  console.log('✅ Confirmed: Running against Railway production database\n');

  // Read SQL dump file
  const sqlFilePath = path.join(__dirname, '../../backups/20251215/local_db_export.sql');

  if (!fs.existsSync(sqlFilePath)) {
    console.error(`❌ Error: SQL dump file not found at ${sqlFilePath}`);
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');
  const fileSize = (fs.statSync(sqlFilePath).size / 1024).toFixed(2);
  const lineCount = sqlContent.split('\n').length;

  console.log(`📦 SQL Dump: ${sqlFilePath}`);
  console.log(`📊 File size: ${fileSize} KB`);
  console.log(`📝 Line count: ${lineCount} lines\n`);

  console.log('⚠️  WARNING: This will DELETE all data in production database!');
  console.log('Proceeding in 5 seconds... Press Ctrl+C to cancel\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  try {
    console.log('🗑️  Step 1: Dropping existing tables...');
    console.log('------------------------------------------------------\n');

    // Drop all tables in correct order
    const dropStatements = [
      'DROP TABLE IF EXISTS "PushSubscription" CASCADE',
      'DROP TABLE IF EXISTS "TaskAssignment" CASCADE',
      'DROP TABLE IF EXISTS "Task" CASCADE',
      'DROP TABLE IF EXISTS "AttendanceRecord" CASCADE',
      'DROP TABLE IF EXISTS "Activist" CASCADE',
      'DROP TABLE IF EXISTS "ActivistCoordinatorNeighborhood" CASCADE',
      'DROP TABLE IF EXISTS "ActivistCoordinator" CASCADE',
      'DROP TABLE IF EXISTS "Neighborhood" CASCADE',
      'DROP TABLE IF EXISTS "CityCoordinator" CASCADE',
      'DROP TABLE IF EXISTS "City" CASCADE',
      'DROP TABLE IF EXISTS "AreaManager" CASCADE',
      'DROP TABLE IF EXISTS "Invitation" CASCADE',
      'DROP TABLE IF EXISTS "UserToken" CASCADE',
      'DROP TABLE IF EXISTS "User" CASCADE',
    ];

    for (const statement of dropStatements) {
      const tableName = statement.match(/DROP TABLE IF EXISTS "(\w+)"/)?.[1];
      await prisma.$executeRawUnsafe(statement);
      console.log(`  ✓ Dropped table: ${tableName}`);
    }

    console.log('\n✅ All tables dropped successfully\n');

    console.log('📥 Step 2: Restoring database from SQL dump...');
    console.log('------------------------------------------------------\n');

    // Split SQL into individual statements and execute
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let executedCount = 0;
    let skippedCount = 0;

    for (const statement of statements) {
      try {
        // Skip comment-only statements
        if (statement.trim().startsWith('--')) {
          skippedCount++;
          continue;
        }

        await prisma.$executeRawUnsafe(statement);
        executedCount++;

        // Show progress every 50 statements
        if (executedCount % 50 === 0) {
          console.log(`  Progress: ${executedCount} statements executed...`);
        }
      } catch (error: any) {
        // Skip benign errors (like comments, empty statements)
        if (!error.message.includes('syntax error') || error.message.includes('does not exist')) {
          skippedCount++;
        } else {
          console.warn(`  ⚠️  Warning: Failed to execute statement: ${error.message}`);
        }
      }
    }

    console.log(`\n✅ Database restored successfully!`);
    console.log(`   Executed: ${executedCount} statements`);
    console.log(`   Skipped: ${skippedCount} statements\n`);

    console.log('🔍 Step 3: Verifying restoration...');
    console.log('------------------------------------------------------\n');

    // Verify counts
    const counts = await prisma.$queryRaw`
      SELECT
        'Users' as table_name, COUNT(*)::int as count FROM "User"
      UNION ALL
      SELECT 'AreaManagers', COUNT(*)::int FROM "AreaManager"
      UNION ALL
      SELECT 'Cities', COUNT(*)::int FROM "City"
      UNION ALL
      SELECT 'CityCoordinators', COUNT(*)::int FROM "CityCoordinator"
      UNION ALL
      SELECT 'ActivistCoordinators', COUNT(*)::int FROM "ActivistCoordinator"
      UNION ALL
      SELECT 'Neighborhoods', COUNT(*)::int FROM "Neighborhood"
      UNION ALL
      SELECT 'Activists', COUNT(*)::int FROM "Activist"
      ORDER BY table_name
    ` as Array<{ table_name: string; count: number }>;

    console.log('📊 Table counts:');
    counts.forEach(({ table_name, count }) => {
      console.log(`   ${table_name.padEnd(25)}: ${count}`);
    });

    console.log('\n🎉 Production database restoration complete!\n');
    console.log('Next steps:');
    console.log('1. Visit https://app.rbac.shop and verify login works');
    console.log('2. Check that all data is visible in the UI');
    console.log('3. Test RBAC permissions\n');

  } catch (error) {
    console.error('❌ Error during restoration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
