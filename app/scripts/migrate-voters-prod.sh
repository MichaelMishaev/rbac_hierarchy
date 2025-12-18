#!/bin/bash
# Migration script to add voters tables to production Railway DB
# Run this with: railway run --service rbac_hierarchy bash scripts/migrate-voters-prod.sh

set -e

echo "🚀 Starting voters table migration..."

psql $DATABASE_URL <<'SQL'
-- Create voters table
CREATE TABLE IF NOT EXISTS "voters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "id_number" TEXT,
    "email" TEXT,
    "date_of_birth" DATE,
    "gender" TEXT,
    "voter_address" TEXT,
    "voter_city" TEXT,
    "voter_neighborhood" TEXT,
    "support_level" TEXT,
    "contact_status" TEXT,
    "priority" TEXT,
    "notes" TEXT,
    "last_contacted_at" TIMESTAMPTZ,
    "inserted_by_user_id" TEXT NOT NULL,
    "inserted_by_user_name" TEXT NOT NULL,
    "inserted_by_user_role" TEXT NOT NULL,
    "inserted_by_neighborhood_name" TEXT,
    "inserted_by_city_name" TEXT,
    "inserted_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_city_id" TEXT,
    "assigned_city_name" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deleted_at" TIMESTAMPTZ,
    "deleted_by_user_id" TEXT,
    "deleted_by_user_name" TEXT,
    "updated_at" TIMESTAMPTZ NOT NULL
);

-- Create voter edit history table
CREATE TABLE IF NOT EXISTS "voter_edit_history" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "voter_id" TEXT NOT NULL,
    "edited_by_user_id" TEXT NOT NULL,
    "edited_by_user_name" TEXT NOT NULL,
    "edited_by_user_role" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "old_value" TEXT,
    "new_value" TEXT,
    "edited_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for voters
CREATE INDEX IF NOT EXISTS "voters_phone_idx" ON "voters"("phone");
CREATE INDEX IF NOT EXISTS "voters_inserted_by_user_id_idx" ON "voters"("inserted_by_user_id");
CREATE INDEX IF NOT EXISTS "voters_is_active_idx" ON "voters"("is_active");
CREATE INDEX IF NOT EXISTS "voters_assigned_city_id_idx" ON "voters"("assigned_city_id");
CREATE INDEX IF NOT EXISTS "voters_support_level_idx" ON "voters"("support_level");
CREATE INDEX IF NOT EXISTS "voters_contact_status_idx" ON "voters"("contact_status");
CREATE INDEX IF NOT EXISTS "voters_last_contacted_at_idx" ON "voters"("last_contacted_at");
CREATE INDEX IF NOT EXISTS "voters_inserted_at_idx" ON "voters"("inserted_at" DESC);

-- Create indexes for voter_edit_history
CREATE INDEX IF NOT EXISTS "voter_edit_history_voter_id_idx" ON "voter_edit_history"("voter_id");
CREATE INDEX IF NOT EXISTS "voter_edit_history_edited_by_user_id_idx" ON "voter_edit_history"("edited_by_user_id");
CREATE INDEX IF NOT EXISTS "voter_edit_history_edited_at_idx" ON "voter_edit_history"("edited_at" DESC);

-- Add foreign key constraints
ALTER TABLE "voters"
  ADD CONSTRAINT IF NOT EXISTS "voters_assigned_city_id_fkey"
  FOREIGN KEY ("assigned_city_id") REFERENCES "cities"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "voters"
  ADD CONSTRAINT IF NOT EXISTS "voters_inserted_by_user_id_fkey"
  FOREIGN KEY ("inserted_by_user_id") REFERENCES "users"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "voter_edit_history"
  ADD CONSTRAINT IF NOT EXISTS "voter_edit_history_voter_id_fkey"
  FOREIGN KEY ("voter_id") REFERENCES "voters"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Verify tables exist
\dt voters*
SQL

echo "✅ Migration completed successfully!"
echo "📊 Verifying schema..."
psql $DATABASE_URL -c "\d voters" 2>&1 | head -20
