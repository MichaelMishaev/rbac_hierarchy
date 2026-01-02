-- Migration: Add Session Event Tracking Table
-- Date: 2026-01-02
-- Description: Adds session_events table for tracking user navigation, clicks, and form submissions
-- Safety: ADDITIVE ONLY - No existing tables modified, no data loss risk

-- Create session_events table
CREATE TABLE IF NOT EXISTS session_events (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    user_id TEXT,
    event_type TEXT NOT NULL,
    page TEXT,
    element TEXT,
    form_name TEXT,
    form_data JSONB,
    timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    user_agent TEXT,
    city_id TEXT,
    load_time INTEGER
);

-- Create indexes for fast queries
CREATE INDEX IF NOT EXISTS session_events_session_id_idx ON session_events(session_id);
CREATE INDEX IF NOT EXISTS session_events_user_id_idx ON session_events(user_id);
CREATE INDEX IF NOT EXISTS session_events_timestamp_idx ON session_events(timestamp DESC);
CREATE INDEX IF NOT EXISTS session_events_event_type_idx ON session_events(event_type);
CREATE INDEX IF NOT EXISTS session_events_session_id_timestamp_idx ON session_events(session_id, timestamp DESC);

-- Verify table was created
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'session_events') THEN
        RAISE EXCEPTION 'Migration failed: session_events table was not created';
    END IF;
    RAISE NOTICE 'Migration successful: session_events table created with % indexes',
        (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'session_events');
END $$;
