-- ============================================
-- MIGRATION: Clean Orphaned Area Managers
-- ============================================
--
-- BUG: Bug #50 Regression - PROD-TypeError-a1f3d8e2
-- ERROR: Cannot read properties of null (reading 'fullName')
-- OCCURRENCE: 28 errors in 24 hours (2026-01-22)
--
-- ROOT CAUSE:
-- The area_managers table contains records where user_id references
-- deleted or soft-deleted users. When getAreaManagers() tries to access
-- user.fullName, it crashes with TypeError.
--
-- SCHEMA ISSUE:
-- Current schema uses "onDelete: SetNull", which sets user_id to NULL
-- when a user is deleted. This creates orphaned area_manager records.
--
-- PRODUCTION SCAN RESULT:
-- Query: SELECT COUNT(*) FROM area_managers WHERE user_id IS NOT NULL
--        AND NOT EXISTS (SELECT 1 FROM users WHERE id = area_managers.user_id AND is_active = true)
-- Result: 1 orphaned record
--
-- ============================================
-- SAFETY CHECKS
-- ============================================

-- Step 1: BACKUP - Show orphaned records before deletion (for audit)
SELECT
    am.id,
    am.user_id,
    am.region_name,
    am.region_code,
    am.is_active,
    am.created_at,
    (SELECT COUNT(*) FROM cities WHERE area_manager_id = am.id) as cities_count
FROM area_managers am
WHERE am.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = am.user_id AND u.is_active = true
  );

-- Step 2: Verify no active cities are assigned to orphaned area managers
-- (Should return 0 rows - if not, DO NOT RUN this migration)
SELECT
    c.id,
    c.name,
    c.code,
    am.region_name
FROM cities c
INNER JOIN area_managers am ON c.area_manager_id = am.id
WHERE am.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = am.user_id AND u.is_active = true
  )
  AND c.is_active = true;

-- ============================================
-- MIGRATION (DO NOT RUN WITHOUT APPROVAL)
-- ============================================

-- Step 3: Soft delete orphaned area_managers by setting is_active = false
-- This preserves data integrity per INV-DATA-001 (campaign analytics)
UPDATE area_managers
SET is_active = false,
    updated_at = NOW()
WHERE user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = am.user_id AND u.is_active = true
  );

-- Step 4: Verify cleanup (should return 0 rows)
SELECT COUNT(*) as remaining_orphaned_count
FROM area_managers am
WHERE am.is_active = true
  AND am.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = am.user_id AND u.is_active = true
  );

-- ============================================
-- ROLLBACK (If needed)
-- ============================================

-- To rollback, manually re-enable specific area_manager records:
-- UPDATE area_managers SET is_active = true WHERE id = '<area_manager_id>';

-- ============================================
-- POST-MIGRATION VERIFICATION
-- ============================================

-- 1. Check active area managers all have active users
SELECT
    COUNT(*) as active_area_managers_with_valid_users
FROM area_managers am
INNER JOIN users u ON am.user_id = u.id
WHERE am.is_active = true
  AND u.is_active = true;

-- 2. Check no orphaned records remain
SELECT
    COUNT(*) as orphaned_count_should_be_zero
FROM area_managers am
WHERE am.is_active = true
  AND am.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users u
    WHERE u.id = am.user_id AND u.is_active = true
  );

-- ============================================
-- NOTES
-- ============================================
--
-- This migration:
-- 1. Does NOT hard delete (preserves historical data)
-- 2. Uses soft delete (is_active = false)
-- 3. Only affects area_managers with deleted/inactive users
-- 4. Does NOT modify cities table
-- 5. Safe to run multiple times (idempotent)
--
-- After this migration:
-- 1. Apply Prisma schema fix (onDelete: Cascade)
-- 2. Deploy enhanced server action (query-level filter)
-- 3. Monitor error logs for 24-48 hours
--
-- ============================================
