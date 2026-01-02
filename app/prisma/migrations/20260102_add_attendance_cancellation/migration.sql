-- Add cancellation tracking columns to attendance_records
-- Required for PROD database (already exists in DEV)

BEGIN;

-- Add cancelled_at column (timestamp when record was cancelled)
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- Add cancelled_by column (user who cancelled the attendance)
ALTER TABLE attendance_records
  ADD COLUMN IF NOT EXISTS cancelled_by TEXT;

-- Add foreign key constraint for cancelled_by
-- Only add if it doesn't already exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'attendance_records_cancelled_by_fkey'
  ) THEN
    ALTER TABLE attendance_records
      ADD CONSTRAINT attendance_records_cancelled_by_fkey
      FOREIGN KEY (cancelled_by)
      REFERENCES users(id)
      ON UPDATE CASCADE
      ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
