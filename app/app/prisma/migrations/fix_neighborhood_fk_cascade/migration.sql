-- Migration: Fix Neighborhood City Coordinator FK Cascade Issue
-- Bug: Deleting a CityCoordinator user causes NULL constraint violation
-- Root Cause: Composite FK tries to NULL both cityCoordinatorId AND cityId during cascade
-- Fix: Replace composite FK with single-column FK
--
-- Date: 2026-01-01
-- Author: System
-- Risk Level: 🔸 MEDIUM (schema change, but data preserved)

-- ============================================
-- STEP 1: Drop old composite FK constraint
-- ============================================
ALTER TABLE "neighborhoods"
DROP CONSTRAINT IF EXISTS "neighborhoods_city_coordinator_id_city_id_fkey";

-- ============================================
-- STEP 2: Create new single-column FK constraint
-- ============================================
ALTER TABLE "neighborhoods"
ADD CONSTRAINT "neighborhoods_city_coordinator_id_fkey"
FOREIGN KEY ("city_coordinator_id")
REFERENCES "city_coordinators"("id")
ON UPDATE CASCADE
ON DELETE SET NULL;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that the new FK exists:
-- SELECT conname, contype, confdeltype
-- FROM pg_constraint
-- WHERE conname = 'neighborhoods_city_coordinator_id_fkey';
-- Expected: confdeltype = 'n' (SET NULL)
