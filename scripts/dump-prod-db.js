#!/usr/bin/env node

/**
 * Production Database Dump Script
 * Runs in Railway environment via `railway run node scripts/dump-prod-db.js`
 */

const { execSync } = require('child_process');
const fs = require('fs');

try {
  console.error('📊 Dumping production database...');

  // Get DATABASE_URL from environment (injected by Railway)
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found');
    process.exit(1);
  }

  // Execute pg_dump and output to stdout (Railway will capture this)
  const dump = execSync(`pg_dump "${dbUrl}" -Fc`, {
    maxBuffer: 100 * 1024 * 1024, // 100MB buffer
    stdio: ['pipe', 'pipe', 'inherit'] // stdout to pipe, stderr to console
  });

  // Write binary dump to stdout
  process.stdout.write(dump);

  console.error('✅ Database dump complete');
  process.exit(0);

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
