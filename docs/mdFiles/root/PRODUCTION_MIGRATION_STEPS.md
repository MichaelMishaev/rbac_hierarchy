# Production Database Migration Steps

## ⚠️ CRITICAL: Run these commands on Railway Production Database

### Option 1: Railway Web Console (Recommended)
1. Go to https://railway.app
2. Select your project: `rbac_proj`
3. Click on PostgreSQL database service
4. Click "Data" tab or "Query" tab
5. Copy and paste the SQL below:

```sql
-- Step 1: Add city_coordinator_id column (nullable - safe)
ALTER TABLE neighborhoods
ADD COLUMN city_coordinator_id TEXT;

-- Step 2: Add unique constraint for composite FK
ALTER TABLE city_coordinators
ADD CONSTRAINT city_coordinators_id_city_id_key UNIQUE (id, city_id);

-- Step 3: Add foreign key constraint
ALTER TABLE neighborhoods
ADD CONSTRAINT neighborhoods_city_coordinator_id_city_id_fkey
FOREIGN KEY (city_coordinator_id, city_id)
REFERENCES city_coordinators(id, city_id)
ON DELETE SET NULL;

-- Step 4: Add index
CREATE INDEX neighborhoods_city_coordinator_id_idx ON neighborhoods(city_coordinator_id);

-- Step 5: Assign existing neighborhoods to first coordinator
UPDATE neighborhoods n
SET city_coordinator_id = (
  SELECT id FROM city_coordinators cc
  WHERE cc.city_id = n.city_id
  LIMIT 1
)
WHERE city_coordinator_id IS NULL;
```

6. Click "Run" or "Execute"

### Option 2: Railway CLI (if accessible)
```bash
railway login
railway link
railway run psql -c "$(cat migrations/add_city_coordinator_to_neighborhoods.sql)"
```

### Verification Query
After running migration, verify with:

```sql
SELECT
  c.name as city_name,
  COUNT(DISTINCT cc.id) as coordinators_count,
  COUNT(n.id) as neighborhoods_count,
  COUNT(DISTINCT n.city_coordinator_id) as assigned_coordinators
FROM cities c
LEFT JOIN city_coordinators cc ON cc.city_id = c.id
LEFT JOIN neighborhoods n ON n.city_id = c.id
GROUP BY c.id, c.name;
```

Expected result: Every neighborhood should have a city_coordinator_id assigned.

### After Migration
1. Verify all neighborhoods have city_coordinator_id
2. Test the application at production URL
3. Check org-tree displays correctly with no duplicates

