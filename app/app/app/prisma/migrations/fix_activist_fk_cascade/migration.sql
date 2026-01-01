-- Migration: Fix Activist ActivistCoordinator FK Cascade Issue
-- Bug: Deleting an ActivistCoordinator user causes NULL constraint violation
-- Root Cause: Composite FK tries to NULL both activistCoordinatorId AND cityId during cascade
-- Fix: Replace composite FK with single-column FK
--
-- Date: 2026-01-01
-- Author: System
-- Risk Level: 🔸 MEDIUM (schema change, but data preserved)
-- Related: Bug #34 (same pattern in Neighborhood table)

-- ============================================
-- STEP 1: Drop old composite FK constraint
-- ============================================
ALTER TABLE "activists"
DROP CONSTRAINT IF EXISTS "activists_activist_coordinator_id_city_id_fkey";

-- ============================================
-- STEP 2: Create new single-column FK constraint
-- ============================================
ALTER TABLE "activists"
ADD CONSTRAINT "activists_activist_coordinator_id_fkey"
FOREIGN KEY ("activist_coordinator_id")
REFERENCES "activist_coordinators"("id")
ON UPDATE CASCADE
ON DELETE SET NULL;

-- ============================================
-- VERIFICATION
-- ============================================
-- Check that the new FK exists:
-- SELECT conname, contype, confdeltype
-- FROM pg_constraint
-- WHERE conname = 'activists_activist_coordinator_id_fkey';
-- Expected: confdeltype = 'n' (SET NULL)
