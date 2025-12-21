-- ⚠️ DESTRUCTIVE: Production Database Truncation Script
-- This will DELETE ALL DATA from production
--
-- Usage:
--   psql $PROD_DB_URL -f scripts/truncate-prod-db.sql
--
-- Recommended: Run backup first!
--   pg_dump $PROD_DB_URL > backup_$(date +%Y%m%d_%H%M%S).sql

-- Confirm database before proceeding
\echo ''
\echo '⚠️  WARNING: This will DELETE ALL DATA from the current database!'
\echo '📊 Current database:'
SELECT current_database();
\echo ''
\echo 'Press Ctrl+C to cancel, or press Enter to continue...'
\prompt 'Type YES to confirm: ' confirm

-- Truncate all tables in dependency order
\echo ''
\echo '🗑️  Truncating tables...'

TRUNCATE TABLE task_assignments CASCADE;
TRUNCATE TABLE tasks CASCADE;
TRUNCATE TABLE attendance_records CASCADE;
TRUNCATE TABLE voters CASCADE;
TRUNCATE TABLE activists CASCADE;
TRUNCATE TABLE activist_coordinator_neighborhoods CASCADE;
TRUNCATE TABLE activist_coordinators CASCADE;
TRUNCATE TABLE neighborhoods CASCADE;
TRUNCATE TABLE city_coordinators CASCADE;
TRUNCATE TABLE cities CASCADE;
TRUNCATE TABLE area_managers CASCADE;
TRUNCATE TABLE user_tokens CASCADE;
TRUNCATE TABLE push_subscriptions CASCADE;
TRUNCATE TABLE users CASCADE;

\echo '✅ All tables truncated'
\echo ''
\echo '📊 Verification (all should be 0):'
SELECT
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'area_managers', COUNT(*) FROM area_managers
UNION ALL
SELECT 'cities', COUNT(*) FROM cities
UNION ALL
SELECT 'neighborhoods', COUNT(*) FROM neighborhoods
UNION ALL
SELECT 'activists', COUNT(*) FROM activists
UNION ALL
SELECT 'voters', COUNT(*) FROM voters
UNION ALL
SELECT 'tasks', COUNT(*) FROM tasks;

\echo ''
\echo '✅ Truncation complete - database is now empty'
\echo ''
\echo '🚀 Next step: Run production seed'
\echo '   npm run db:seed:prod'
