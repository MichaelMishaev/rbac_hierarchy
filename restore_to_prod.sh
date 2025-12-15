#!/bin/bash

# Railway Production Database Restoration Script
# This script deletes production data and restores from local database dump

set -e

echo "🗄️  Database Restoration to Production"
echo "======================================"
echo ""

# Production database credentials
PROD_DB_URL="postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@postgres.railway.internal:5432/railway"
SQL_FILE="backups/20251215/local_db_export.sql"

# Check if SQL file exists
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ Error: SQL dump file not found at $SQL_FILE"
    exit 1
fi

echo "📦 SQL Dump: $SQL_FILE"
echo "📊 File size: $(du -h $SQL_FILE | cut -f1)"
echo "📝 Line count: $(wc -l < $SQL_FILE) lines"
echo ""

echo "⚠️  WARNING: This will DELETE all data in production database!"
echo "Press Ctrl+C to cancel, or Enter to continue..."
read

echo ""
echo "🗑️  Step 1: Dropping and recreating database schema..."
echo "------------------------------------------------------"

# Create a script to drop all tables and recreate schema
cat > /tmp/drop_all.sql <<'EOF'
-- Drop all tables in correct order (respecting foreign keys)
DROP TABLE IF EXISTS "PushSubscription" CASCADE;
DROP TABLE IF EXISTS "TaskAssignment" CASCADE;
DROP TABLE IF EXISTS "Task" CASCADE;
DROP TABLE IF EXISTS "AttendanceRecord" CASCADE;
DROP TABLE IF EXISTS "Activist" CASCADE;
DROP TABLE IF EXISTS "ActivistCoordinatorNeighborhood" CASCADE;
DROP TABLE IF EXISTS "ActivistCoordinator" CASCADE;
DROP TABLE IF EXISTS "Neighborhood" CASCADE;
DROP TABLE IF EXISTS "CityCoordinator" CASCADE;
DROP TABLE IF EXISTS "City" CASCADE;
DROP TABLE IF EXISTS "AreaManager" CASCADE;
DROP TABLE IF EXISTS "Invitation" CASCADE;
DROP TABLE IF EXISTS "UserToken" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- Confirm cleanup
SELECT 'All tables dropped successfully' as status;
EOF

echo "Executing cleanup script..."
railway run --environment production -- psql "$PROD_DB_URL" -f /tmp/drop_all.sql

echo ""
echo "✅ Production database cleaned"
echo ""
echo "📥 Step 2: Restoring local database to production..."
echo "------------------------------------------------------"

# Upload and restore the SQL dump
railway run --environment production -- psql "$PROD_DB_URL" < "$SQL_FILE"

echo ""
echo "✅ Database restored successfully!"
echo ""
echo "🔍 Step 3: Verifying restoration..."
echo "------------------------------------------------------"

# Verify data
cat > /tmp/verify.sql <<'EOF'
SELECT
  'Users' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'AreaManagers', COUNT(*) FROM "AreaManager"
UNION ALL
SELECT 'Cities', COUNT(*) FROM "City"
UNION ALL
SELECT 'CityCoordinators', COUNT(*) FROM "CityCoordinator"
UNION ALL
SELECT 'ActivistCoordinators', COUNT(*) FROM "ActivistCoordinator"
UNION ALL
SELECT 'Neighborhoods', COUNT(*) FROM "Neighborhood"
UNION ALL
SELECT 'Activists', COUNT(*) FROM "Activist"
ORDER BY table_name;
EOF

railway run --environment production -- psql "$PROD_DB_URL" -f /tmp/verify.sql

echo ""
echo "🎉 Production database restoration complete!"
echo ""
echo "Next steps:"
echo "1. Visit https://app.rbac.shop and verify login works"
echo "2. Check that all data is visible in the UI"
echo "3. Test RBAC permissions"
echo ""
