#!/bin/bash
# ============================================
# Railway Build Hook - Auto-run migrations
# ============================================
# This script runs automatically when Railway deploys from GitHub
# Railway detects this file and executes it before starting the app
# ============================================

set -e  # Exit on error

# Set version from version.json
if [ -f "version.json" ]; then
    VERSION=$(grep -oP '"version":\s*"\K[^"]+' version.json || echo "1.1.1")
    export NEXT_PUBLIC_APP_VERSION="$VERSION"
    echo "📦 App Version: $VERSION"
fi

echo "🚂 Railway: Running database migrations..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not set, skipping migrations"
    exit 0
fi

# Check if session_events table exists
echo "📊 Checking if session_events table exists..."
TABLE_EXISTS=$(psql "$DATABASE_URL" -tAc "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'session_events');")

if [ "$TABLE_EXISTS" = "f" ]; then
    echo "⚠️  session_events table not found, creating it..."
    psql "$DATABASE_URL" -f prisma/migrations/manual/create_session_events_table.sql
    echo "✅ session_events table created"
else
    echo "✅ session_events table already exists, skipping"
fi

# Run Prisma migrations (for any other schema changes)
echo "🔄 Running Prisma migrations..."
npx prisma generate
npx prisma db push --skip-generate

echo "✅ All migrations completed"
