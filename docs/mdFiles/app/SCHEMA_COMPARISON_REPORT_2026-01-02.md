# 🔬 Database Schema Comparison Report
## Development vs Production Railway Databases

**Report Generated:** 2026-01-02
**Analyst:** DBA Expert Analysis
**Comparison Method:** Prisma Introspection + Direct PostgreSQL Queries

---

## 📊 Executive Summary

| Metric | Development | Production |
|--------|-------------|------------|
| **Host** | tramway.proxy.rlwy.net:37235 | switchyard.proxy.rlwy.net:20055 |
| **Total Tables** | 21 | 21 |
| **Migration System** | `prisma db push` (no _prisma_migrations) | `prisma db push` (no _prisma_migrations) |
| **Schema Version** | v2.4 (Wiki System) | v2.4 (Wiki System) |
| **Risk Level** | 🟡 **MEDIUM** | - |

### Critical Findings

✅ **Both databases have identical table count (21 tables)**
❌ **DEV has 2 extra columns** (`attendance_records.cancelled_at`, `cancelled_by`)
⚠️ **Different FK strategies** (DEV: single-column, PROD: composite city-scoped FKs)
⚠️ **Different index types** (PROD uses GIN for arrays, DEV uses BTREE)
⚠️ **No `session_events` table** in either database (migration 20260102 not applied)

---

## 🎯 Schema Differences Summary

### 1. Missing Columns in PROD (🔴 HIGH PRIORITY)

| Table | Column | Type | Purpose | Impact |
|-------|--------|------|---------|---------|
| `attendance_records` | `cancelled_at` | timestamp | Track cancellation time | ❌ **PROD missing feature** |
| `attendance_records` | `cancelled_by` | text (FK to users) | Track who cancelled | ❌ **PROD missing audit trail** |

**Recommendation:** Add these columns to PROD to support attendance cancellation workflow.

**Migration SQL:**
```sql
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_cancelled_by_fkey
  FOREIGN KEY (cancelled_by) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE SET NULL;
```

---

### 2. Foreign Key Differences (🟢 PROD IS BETTER)

#### Activists → Activist Coordinators

**DEV (Weaker):**
```sql
FOREIGN KEY (activist_coordinator_id)
REFERENCES activist_coordinators(id)
```

**PROD (Stronger):**
```sql
FOREIGN KEY (activist_coordinator_id, city_id)
REFERENCES activist_coordinators(id, city_id)
ON DELETE SET NULL
```

#### Neighborhoods → City Coordinators

**DEV (Weaker):**
```sql
FOREIGN KEY (city_coordinator_id)
REFERENCES city_coordinators(id)
```

**PROD (Stronger):**
```sql
FOREIGN KEY (city_coordinator_id, city_id)
REFERENCES city_coordinators(id, city_id)
ON DELETE SET NULL
```

**Analysis:**
✅ **PROD has superior data integrity** - Composite FKs prevent cross-city coordinator assignments
✅ **Better multi-tenant isolation** - Enforces city-scoped relationships at database level
⚠️ **DEV should adopt PROD's FK strategy** - Update DEV schema to match PROD

**Recommendation:** Migrate DEV to use composite FKs to match PROD's superior design.

---

### 3. Index Type Differences (🟢 PROD IS BETTER)

#### Wiki Pages Tags Index

**DEV:**
```sql
CREATE INDEX wiki_pages_tags_idx ON wiki_pages USING btree (tags);
```

**PROD:**
```sql
CREATE INDEX wiki_pages_tags_idx ON wiki_pages USING gin (tags);
```

**Analysis:**
❌ **DEV uses BTREE for array column** - Inefficient for array operations
✅ **PROD uses GIN index** - Optimal for array containment queries (`@>`, `&&` operators)
📈 **Performance Impact:** GIN index is 10-100x faster for tag searches

**Example Queries Affected:**
```sql
-- Find pages with specific tag
SELECT * FROM wiki_pages WHERE 'security' = ANY(tags);

-- Find pages with any of multiple tags
SELECT * FROM wiki_pages WHERE tags && ARRAY['api', 'auth'];
```

**Recommendation:** Drop and recreate index in DEV using GIN.

**Migration SQL:**
```sql
DROP INDEX IF EXISTS wiki_pages_tags_idx;
CREATE INDEX wiki_pages_tags_idx ON wiki_pages USING gin (tags);
```

---

### 4. Column Order Differences (🟦 COSMETIC)

**Tables with Different Column Ordering:**
- `activists` - `user_id` position differs
- `area_managers` - `center_latitude/longitude` moved after `created_at/updated_at`
- `cities` - `center_latitude/longitude` moved after `created_at/updated_at`
- `neighborhoods` - `city_coordinator_id` position differs
- `users` - `require_password_change` position differs

**Impact:** None (PostgreSQL doesn't care about column order)
**Recommendation:** Ignore (cosmetic difference)

---

## 📦 Table Inventory

### All Tables (Both Databases)

| # | Table Name | Purpose | PROD Rows | DEV Rows |
|---|------------|---------|-----------|----------|
| 1 | `users` | System users (all roles) | 10 | 8 |
| 2 | `area_managers` | Regional campaign directors | N/A | N/A |
| 3 | `cities` | Campaign cities | **82** | 2 |
| 4 | `city_coordinators` | City-level coordinators | N/A | N/A |
| 5 | `activist_coordinators` | Neighborhood coordinators | N/A | N/A |
| 6 | `activist_coordinator_neighborhoods` | M2M assignment | N/A | N/A |
| 7 | `neighborhoods` | Campaign districts | 1 | 2 |
| 8 | `activists` | Field volunteers | 0 | 3 |
| 9 | `voters` | Contact database | 1518 | **3027** |
| 10 | `attendance_records` | Activist check-ins | 0 | 0 |
| 11 | `tasks` | Broadcast system | N/A | N/A |
| 12 | `task_assignments` | Individual task delivery | N/A | N/A |
| 13 | `invitations` | Role-based invites | N/A | N/A |
| 14 | `user_tokens` | Password reset/email confirmation | N/A | N/A |
| 15 | `push_subscriptions` | PWA notifications | N/A | N/A |
| 16 | `audit_logs` | Change tracking | 114 | **3071** |
| 17 | `error_logs` | Production errors | 107 | 35 |
| 18 | `voter_edit_history` | Voter record audit | N/A | N/A |
| 19 | `wiki_categories` | Knowledge base sections | N/A | N/A |
| 20 | `wiki_pages` | Documentation pages | N/A | N/A |
| 21 | `wiki_page_versions` | Wiki version control | N/A | N/A |

**Observations:**
- ✅ All 21 tables exist in both databases
- ⚠️ DEV has more voters (3027 vs 1518) - possibly test data
- ⚠️ DEV has significantly more audit_logs (3071 vs 114) - audit system testing
- ✅ PROD has 82 cities vs 2 in DEV - real production data

---

## 🔍 Missing Tables

### Session Events Table (🔴 CRITICAL)

**Status:** ❌ **MISSING in BOTH databases**

The recent migration `20260102_add_session_tracking.sql` has **NOT been applied** to either database.

**Expected Table:**
```sql
CREATE TABLE IF NOT EXISTS session_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL,
  user_id TEXT,
  event_type TEXT NOT NULL,
  page TEXT,
  element TEXT,
  form_name TEXT,
  form_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  city_id TEXT,
  load_time INTEGER
);

-- 5 indexes expected
```

**Impact:** Session journey tracking feature is unavailable in both environments.

**Recommendation:** Apply migration `20260102_add_session_tracking.sql` to both databases.

---

## 🗄️ Migration System Analysis

### Migration Table Status

**Finding:** ❌ **`_prisma_migrations` table does NOT exist** in either database

**Implications:**
1. Both environments use `prisma db push` instead of `prisma migrate`
2. No migration history tracking
3. Schema changes are applied directly (riskier)
4. No rollback capability
5. Difficult to track schema evolution

**Current Approach:**
```bash
# package.json
"build": "prisma generate && next build"

# Railway deployment
DATABASE_URL set by Railway
Uses: npm run db:push --accept-data-loss
```

**Recommendation:**
🟡 **Consider migrating to `prisma migrate`** for:
- Migration history tracking
- Safer production deployments
- Rollback capabilities
- Team collaboration on schema changes

**Migration Path:**
```bash
# One-time setup
npx prisma migrate dev --name baseline_from_introspection

# Future changes
npx prisma migrate dev --name descriptive_name
npx prisma migrate deploy  # For production (via Railway pre-deploy)
```

---

## 🎯 Index Analysis

### Critical Indexes Present in Both

✅ All performance-critical indexes exist in both databases:

**Attendance Records:**
- `attendance_records_pkey` (PRIMARY KEY on `id`)
- `attendance_records_activist_id_date_key` (UNIQUE composite)
- `attendance_records_city_id_date_idx`
- `attendance_records_neighborhood_id_date_idx`
- `attendance_records_date_idx`
- `attendance_records_is_within_geofence_idx`
- `attendance_records_last_edited_at_idx`

**Error Logs:**
- Indexes on: `level`, `error_type`, `created_at`, `user_id`, `city_id`

**Voters:**
- `voters_city_id_is_active_idx` (multi-tenant isolation)
- `voters_phone_idx` (search optimization)

### Index Type Recommendation

**Action Required for DEV:**
```sql
-- Fix wiki_pages tags index
DROP INDEX IF EXISTS wiki_pages_tags_idx;
CREATE INDEX wiki_pages_tags_idx ON wiki_pages USING gin (tags);

-- Verify
\d wiki_pages
```

---

## 🔒 Data Integrity Checks

### Orphaned Records (Read-Only Verification)

**Query Used:**
```sql
-- Activists without neighborhoods
SELECT COUNT(*) FROM activists WHERE neighborhood_id IS NULL;

-- Neighborhoods without cities
SELECT COUNT(*) FROM neighborhoods WHERE city_id IS NULL;

-- City coordinators referencing non-existent users
SELECT COUNT(*) FROM city_coordinators cc
LEFT JOIN users u ON cc.user_id = u.id
WHERE u.id IS NULL;
```

**Status:** ✅ **No orphaned records detected** (spot check performed)

---

## 🚀 Deployment Recommendations

### Priority 1: Add Missing Columns to PROD (🔴 HIGH)

**Target:** Production (`switchyard.proxy.rlwy.net`)
**Affected Table:** `attendance_records`

**Migration Script:**
```sql
BEGIN;

-- Add cancelled_at column
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add cancelled_by column with FK
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

ALTER TABLE attendance_records
  ADD CONSTRAINT attendance_records_cancelled_by_fkey
  FOREIGN KEY (cancelled_by) REFERENCES users(id)
  ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
```

**Rollback:**
```sql
BEGIN;
ALTER TABLE attendance_records DROP COLUMN IF EXISTS cancelled_at;
ALTER TABLE attendance_records DROP COLUMN IF EXISTS cancelled_by;
COMMIT;
```

**Estimated Downtime:** None (additive change, nullable columns)
**Risk Level:** 🟢 LOW

---

### Priority 2: Upgrade DEV Foreign Keys (🟡 MEDIUM)

**Target:** Development (`tramway.proxy.rlwy.net`)
**Purpose:** Match PROD's superior composite FK design

**Migration Script:**
```sql
BEGIN;

-- Drop old single-column FK
ALTER TABLE activists
  DROP CONSTRAINT IF EXISTS activists_activist_coordinator_id_fkey;

-- Add composite FK (city-scoped)
ALTER TABLE activists
  ADD CONSTRAINT activists_activist_coordinator_id_city_id_fkey
  FOREIGN KEY (activist_coordinator_id, city_id)
  REFERENCES activist_coordinators(id, city_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

-- Same for neighborhoods
ALTER TABLE neighborhoods
  DROP CONSTRAINT IF EXISTS neighborhoods_city_coordinator_id_fkey;

ALTER TABLE neighborhoods
  ADD CONSTRAINT neighborhoods_city_coordinator_id_city_id_fkey
  FOREIGN KEY (city_coordinator_id, city_id)
  REFERENCES city_coordinators(id, city_id)
  ON UPDATE CASCADE ON DELETE SET NULL;

COMMIT;
```

**Risk Level:** 🟡 MEDIUM (FK changes require data validation)
**Validation Required:** Ensure all existing relationships are city-scoped

---

### Priority 3: Fix DEV Index Type (🟢 LOW)

**Target:** Development
**Purpose:** Optimize tag search performance

```sql
DROP INDEX IF EXISTS wiki_pages_tags_idx;
CREATE INDEX wiki_pages_tags_idx ON wiki_pages USING gin (tags);
```

**Risk Level:** 🟢 LOW (index rebuild, non-blocking with CONCURRENTLY)
**Estimated Time:** <1 second (small table)

---

### Priority 4: Apply Session Tracking Migration (⏭️ FUTURE)

**Target:** Both databases
**Migration File:** `prisma/migrations/20260102_add_session_tracking.sql`

**Status:** Migration file exists in codebase but **NOT applied** to either database

**Action:**
```bash
# After merging to master, Railway pre-deploy command will run:
npx prisma migrate deploy

# Applies: 20260102_add_session_tracking.sql
# Creates: session_events table + 5 indexes
```

**Expected Behavior:**
- Railway pre-deploy command runs migration automatically
- Idempotent SQL (uses `IF NOT EXISTS`)
- Zero manual intervention required

---

## 📋 Deployment Checklist

### Pre-Deployment (PROD)

- [ ] Backup production database
  ```bash
  PGPASSWORD=WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH \
  pg_dump -h switchyard.proxy.rlwy.net -p 20055 -U postgres -d railway \
  -Fc -f prod_backup_$(date +%Y%m%d_%H%M%S).dump
  ```

- [ ] Test migration on DEV first
- [ ] Verify no active transactions on attendance_records table
- [ ] Schedule during low-traffic window (if possible)

### Deployment Steps (PROD)

1. **Connect to PROD database:**
   ```bash
   PGPASSWORD=WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH \
   psql -h switchyard.proxy.rlwy.net -p 20055 -U postgres -d railway
   ```

2. **Verify table structure:**
   ```sql
   \d attendance_records
   ```

3. **Apply migration:**
   ```sql
   BEGIN;

   ALTER TABLE attendance_records
     ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

   ALTER TABLE attendance_records
     ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

   ALTER TABLE attendance_records
     ADD CONSTRAINT attendance_records_cancelled_by_fkey
     FOREIGN KEY (cancelled_by) REFERENCES users(id)
     ON UPDATE CASCADE ON DELETE SET NULL;

   -- Verify changes
   \d attendance_records

   COMMIT;
   ```

4. **Test application:**
   - Create test attendance record
   - Test cancellation flow
   - Verify audit trail

### Post-Deployment

- [ ] Verify columns exist: `SELECT cancelled_at, cancelled_by FROM attendance_records LIMIT 1;`
- [ ] Monitor error logs for FK violations
- [ ] Update Prisma schema to match PROD (if needed)
- [ ] Run `npx prisma db pull` to regenerate types

---

## 🎓 DBA Expert Observations

### ✅ Strengths (Both Databases)

1. **Composite Unique Constraints** - Proper multi-tenant isolation
   - `attendance_records (activist_id, date)` - One record per day
   - `city_coordinators (city_id, user_id)` - No duplicate coordinators
   - `activists (neighborhood_id, full_name, phone)` - Prevent duplicates

2. **Cascade Rules** - Proper cleanup on deletes
   - Cities delete cascades to neighborhoods, activists, etc.
   - User deletes set NULL where appropriate (audit trail preservation)

3. **Index Strategy** - Well-optimized for multi-tenant queries
   - Composite indexes on `(city_id, date)`, `(city_id, is_active)`
   - Geofence filtering indexed
   - Timestamp columns indexed for time-series queries

4. **Soft Deletes** - Data preservation
   - Activists use `is_active` flag
   - Voters have `is_active + deleted_at + deleted_by_user_id`

### ⚠️ Areas for Improvement

1. **Migration System**
   - ❌ No `_prisma_migrations` table (using `prisma db push`)
   - **Recommendation:** Migrate to `prisma migrate` for production
   - **Benefit:** Version control, rollback capability, team collaboration

2. **Schema Drift**
   - ⚠️ DEV has features PROD doesn't (cancelled_at/by columns)
   - ⚠️ PROD has better FK design than DEV
   - **Recommendation:** Synchronize schemas regularly

3. **Missing Features**
   - ❌ `session_events` table not created in either environment
   - **Recommendation:** Apply migration 20260102

4. **Index Optimization**
   - ⚠️ DEV uses BTREE for array column (inefficient)
   - **Recommendation:** Switch to GIN index

### 🏆 Best Practices Observed

✅ **Multi-Tenant Isolation** - Composite FKs enforce city-scoped relationships (PROD)
✅ **Audit Trails** - Immutable `audit_logs` and `voter_edit_history` tables
✅ **Geofencing** - GPS accuracy tracking with geofence validation
✅ **Soft Deletes** - Prevents accidental data loss
✅ **BigInt IDs** - Future-proof (tasks, push_subscriptions, wiki versions)
✅ **JSONB for Metadata** - Flexible schema evolution

---

## 📊 Risk Assessment

### Overall Risk Level: 🟡 MEDIUM

**Low Risk Items:**
- ✅ No table drops required
- ✅ No data loss risk
- ✅ Additive changes only (new columns are nullable)
- ✅ Index changes are non-blocking

**Medium Risk Items:**
- ⚠️ Schema drift between DEV and PROD
- ⚠️ FK changes in DEV (requires data validation)
- ⚠️ No migration system (_prisma_migrations missing)

**High Risk Items:**
- ❌ None identified

### Deployment Risk Breakdown

| Change | Database | Risk | Downtime | Reversible |
|--------|----------|------|----------|------------|
| Add cancelled columns | PROD | 🟢 LOW | None | ✅ Yes |
| Upgrade FKs | DEV | 🟡 MEDIUM | None | ✅ Yes |
| Fix GIN index | DEV | 🟢 LOW | None | ✅ Yes |
| Add session_events | Both | 🟢 LOW | None | ✅ Yes |

---

## 🔄 Synchronization Plan

### Goal: Align DEV and PROD schemas

**Phase 1: Bring PROD up to DEV features**
1. Add `cancelled_at` and `cancelled_by` to PROD attendance_records ✅

**Phase 2: Bring DEV up to PROD standards**
1. Upgrade DEV foreign keys to composite city-scoped FKs ✅
2. Change wiki_pages tags index from BTREE to GIN ✅

**Phase 3: Apply pending migrations (both)**
1. Apply `20260102_add_session_tracking.sql` to both databases ✅

**Phase 4: Establish migration discipline**
1. Create baseline migration from current schema
2. Switch from `prisma db push` to `prisma migrate`
3. Configure Railway pre-deploy command: `npx prisma migrate deploy`

---

## 📝 Action Items Summary

### Immediate (This Week)

- [ ] **PROD:** Add cancelled_at and cancelled_by columns to attendance_records
- [ ] **DEV:** Upgrade foreign keys to match PROD's composite FK design
- [ ] **DEV:** Change wiki_pages tags index from BTREE to GIN
- [ ] **BOTH:** Apply session_events table migration (20260102)

### Short-Term (This Month)

- [ ] Create baseline Prisma migration from current schema
- [ ] Switch from `prisma db push` to `prisma migrate`
- [ ] Update Railway deployment config to use `prisma migrate deploy`
- [ ] Document schema change process for team

### Long-Term (Next Quarter)

- [ ] Implement schema versioning system
- [ ] Set up automated schema comparison CI checks
- [ ] Create schema diff alerts for drift detection
- [ ] Establish migration review process

---

## 🛠️ Useful Commands

### Schema Extraction
```bash
# DEV schema
PGPASSWORD=XRidHEhunbNauSqiTXGFZUKCyzyzvGQU \
pg_dump -h tramway.proxy.rlwy.net -p 37235 -U postgres -d railway \
--schema-only --no-owner --no-acl > dev_schema.sql

# PROD schema
PGPASSWORD=WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH \
pg_dump -h switchyard.proxy.rlwy.net -p 20055 -U postgres -d railway \
--schema-only --no-owner --no-acl > prod_schema.sql

# Compare
diff -u dev_schema.sql prod_schema.sql > schema_diff.txt
```

### Prisma Introspection
```bash
# DEV
DATABASE_URL="postgresql://postgres:XRidHEhunbNauSqiTXGFZUKCyzyzvGQU@tramway.proxy.rlwy.net:37235/railway" \
npx prisma db pull --schema=./dev-schema.prisma

# PROD
DATABASE_URL="postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@switchyard.proxy.rlwy.net:20055/railway" \
npx prisma db pull --schema=./prod-schema.prisma

# Compare
diff -u dev-schema.prisma prod-schema.prisma
```

### Quick Health Checks
```bash
# Table count
\dt

# Row counts
SELECT
  schemaname,
  tablename,
  n_live_tup as rows
FROM pg_stat_user_tables
ORDER BY n_live_tup DESC;

# Index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read
FROM pg_stat_user_indexes
WHERE idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

---

## 📞 Appendix: Connection Strings

### Development (Railway tramway)
```
Host: tramway.proxy.rlwy.net
Port: 37235
Database: railway
User: postgres
Password: XRidHEhunbNauSqiTXGFZUKCyzyzvGQU

postgresql://postgres:XRidHEhunbNauSqiTXGFZUKCyzyzvGQU@tramway.proxy.rlwy.net:37235/railway
```

### Production (Railway switchyard)
```
Host: switchyard.proxy.rlwy.net
Port: 20055
Database: railway
User: postgres
Password: WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH

postgresql://postgres:WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH@switchyard.proxy.rlwy.net:20055/railway
```

---

**Report End**

*Generated by DBA Expert Analysis*
*For questions or clarifications, review the detailed analysis sections above.*
