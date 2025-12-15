-- Migration: Add city_coordinator_id to neighborhoods table
-- Date: 2025-12-15
-- Description: Implements new hierarchy where neighborhoods belong to City Coordinators

-- Step 1: Add city_coordinator_id column to neighborhoods table (nullable, safe migration)
ALTER TABLE neighborhoods
ADD COLUMN city_coordinator_id TEXT;

-- Step 2: Add unique constraint to city_coordinators for composite FK support
ALTER TABLE city_coordinators
ADD CONSTRAINT city_coordinators_id_city_id_key UNIQUE (id, city_id);

-- Step 3: Add foreign key constraint with composite FK
ALTER TABLE neighborhoods
ADD CONSTRAINT neighborhoods_city_coordinator_id_city_id_fkey
FOREIGN KEY (city_coordinator_id, city_id)
REFERENCES city_coordinators(id, city_id)
ON DELETE SET NULL;

-- Step 4: Add index for performance
CREATE INDEX neighborhoods_city_coordinator_id_idx ON neighborhoods(city_coordinator_id);

-- Step 5: Assign existing neighborhoods to first City Coordinator in their city (DATA MIGRATION)
-- ⚠️ REVIEW THIS CAREFULLY - This assigns all unassigned neighborhoods to the first coordinator
UPDATE neighborhoods n
SET city_coordinator_id = (
  SELECT id FROM city_coordinators cc
  WHERE cc.city_id = n.city_id
  LIMIT 1
)
WHERE city_coordinator_id IS NULL;

-- Verification Query (run after migration to verify):
-- SELECT
--   c.name as city_name,
--   COUNT(DISTINCT cc.id) as coordinators_count,
--   COUNT(n.id) as neighborhoods_count,
--   COUNT(DISTINCT n.city_coordinator_id) as assigned_coordinators
-- FROM cities c
-- LEFT JOIN city_coordinators cc ON cc.city_id = c.id
-- LEFT JOIN neighborhoods n ON n.city_id = c.id
-- GROUP BY c.id, c.name;
