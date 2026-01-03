#!/bin/bash
# ============================================
# Apply session_events table migration to Railway
# ============================================
# Usage:
#   ./scripts/migrate-session-events-railway.sh development
#   ./scripts/migrate-session-events-railway.sh production
# ============================================

set -e  # Exit on error

ENVIRONMENT=${1:-development}
MIGRATION_FILE="prisma/migrations/manual/create_session_events_table.sql"

echo "🚀 Applying session_events migration to Railway ($ENVIRONMENT)..."
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if migration file exists
if [ ! -f "$MIGRATION_FILE" ]; then
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo "📄 Migration file: $MIGRATION_FILE"
echo "🌍 Environment: $ENVIRONMENT"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Aborted"
    exit 1
fi

# Run migration on Railway
echo ""
echo "🔄 Running migration..."
railway run --environment "$ENVIRONMENT" bash -c "psql \$DATABASE_URL -f $MIGRATION_FILE"

echo ""
echo "✅ Migration completed!"
echo ""
echo "Next steps:"
echo "  1. Verify table exists in Railway dashboard"
echo "  2. Enable session tracking: NEXT_PUBLIC_ENABLE_SESSION_TRACKING=true"
echo "  3. Deploy and test"
