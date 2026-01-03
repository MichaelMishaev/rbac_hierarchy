-- ============================================
-- SESSION EVENTS TABLE MIGRATION (SAFE)
-- ============================================
-- This script is idempotent - safe to run multiple times
-- Use: psql $DATABASE_URL -f create_session_events_table.sql
-- Or: railway run --environment development psql $DATABASE_URL -f create_session_events_table.sql
-- ============================================

-- Create session_events table if not exists
CREATE TABLE IF NOT EXISTS "session_events" (
  "id" TEXT PRIMARY KEY,
  "session_id" TEXT NOT NULL,
  "user_id" TEXT,
  "event_type" TEXT NOT NULL,

  -- Event data
  "page" TEXT,
  "element" TEXT,
  "form_name" TEXT,
  "form_data" JSONB,

  -- Context
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "user_agent" TEXT,
  "city_id" TEXT,

  -- Performance
  "load_time" INTEGER
);

-- Create indexes if not exist (PostgreSQL 9.5+)
CREATE INDEX IF NOT EXISTS "session_events_session_id_idx"
  ON "session_events"("session_id");

CREATE INDEX IF NOT EXISTS "session_events_user_id_idx"
  ON "session_events"("user_id");

CREATE INDEX IF NOT EXISTS "session_events_timestamp_idx"
  ON "session_events"("timestamp" DESC);

CREATE INDEX IF NOT EXISTS "session_events_event_type_idx"
  ON "session_events"("event_type");

CREATE INDEX IF NOT EXISTS "session_events_session_id_timestamp_idx"
  ON "session_events"("session_id", "timestamp" DESC);

-- Verify table was created
DO $$
DECLARE
  table_exists BOOLEAN;
  index_count INTEGER;
BEGIN
  -- Check if table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'session_events'
  ) INTO table_exists;

  IF table_exists THEN
    RAISE NOTICE '✅ session_events table exists';

    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE tablename = 'session_events';

    RAISE NOTICE '✅ % indexes created', index_count;
  ELSE
    RAISE EXCEPTION '❌ session_events table creation failed';
  END IF;
END $$;

-- Show table info
SELECT
  'session_events' as table_name,
  COUNT(*) as total_records,
  MIN(timestamp) as oldest_event,
  MAX(timestamp) as newest_event
FROM "session_events";
