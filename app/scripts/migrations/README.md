# Manual Migrations

Manual SQL migrations for situations where Prisma migrations aren't suitable.

## Session Events Table Migration

**File:** `create_session_events_table.sql`

Creates the `session_events` table for user journey tracking.

### Usage

#### Option 1: Using Railway CLI (Recommended)

```bash
# From app directory
cd /Users/michaelmishayev/Desktop/Projects/corporations/app

# Development
railway run --environment development psql $DATABASE_URL -f scripts/migrations/create_session_events_table.sql

# Production (CAREFUL!)
railway run --environment production psql $DATABASE_URL -f scripts/migrations/create_session_events_table.sql
```

#### Option 2: Using Helper Script

```bash
# From app directory
./scripts/migrate-session-events-railway.sh development
./scripts/migrate-session-events-railway.sh production
```

#### Option 3: Railway Dashboard

1. Go to Railway Dashboard → PostgreSQL service
2. Click "Query" tab
3. Copy/paste contents of `create_session_events_table.sql`
4. Click "Run Query"

#### Option 4: Local Testing

```bash
psql "postgresql://postgres:postgres_dev_password@localhost:5434/hierarchy_platform" -f scripts/migrations/create_session_events_table.sql
```

### Verification

After running migration:

```sql
-- Check table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'session_events';

-- Check indexes
SELECT indexname FROM pg_indexes WHERE tablename = 'session_events';

-- Check row count
SELECT COUNT(*) FROM session_events;
```

### Idempotency

This migration is **idempotent** - safe to run multiple times:
- Uses `CREATE TABLE IF NOT EXISTS`
- Uses `CREATE INDEX IF NOT EXISTS`
- Won't fail if table already exists

### When to Use

Use this migration when:
- Deploying session tracking feature to Railway for first time
- Database was reset/recreated without `session_events` table
- Getting 500 errors from `/api/session-event/*` endpoints

### After Migration

1. **Enable session tracking:**
   ```bash
   railway variables --set NEXT_PUBLIC_ENABLE_SESSION_TRACKING=true
   ```

2. **Redeploy application:**
   ```bash
   git push origin develop  # Auto-deploys to Railway
   ```

3. **Test endpoints:**
   - `GET /api/session-event/journey?sessionId=xxx&limit=20` → 200 OK
   - `POST /api/session-event` → 200 OK
