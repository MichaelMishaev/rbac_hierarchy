#!/bin/bash

# ============================================
# Sync Production Database to Local
# ============================================
# This script safely downloads production database
# and restores it to your local environment.
#
# ⚠️  WARNING: This will REPLACE ALL LOCAL DATA!
# ============================================

set -e  # Exit on error

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
LOCAL_BACKUP="${BACKUP_DIR}/local-backup-${TIMESTAMP}.dump"
PROD_BACKUP="${BACKUP_DIR}/prod-backup-${TIMESTAMP}.dump"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Production → Local Database Sync                     ║"
echo "╔════════════════════════════════════════════════════════╗"
echo ""

# Step 1: Backup local database (safety)
echo -e "${YELLOW}[1/5] Backing up current local database...${NC}"
mkdir -p "$BACKUP_DIR"
docker-compose exec -T postgres pg_dump -U postgres -Fc hierarchy_platform > "$LOCAL_BACKUP"
echo -e "${GREEN}✅ Local backup saved: ${LOCAL_BACKUP}${NC}"
echo ""

# Step 2: Get production DATABASE_URL
echo -e "${YELLOW}[2/5] Getting production database URL...${NC}"
cd app
PROD_DB_URL=$(railway variables --json | jq -r '.DATABASE_URL')
echo -e "${GREEN}✅ Production database URL retrieved${NC}"
echo ""

# Step 3: Dump production database using Railway
echo -e "${YELLOW}[3/5] Downloading production database...${NC}"
echo "   This may take a few minutes depending on database size..."

# Use railway run to execute pg_dump command in deployment environment
# The -- tells railway to execute the command in the deployed container
railway run -- bash -c 'pg_dump "$DATABASE_URL" --format=custom' > "../${PROD_BACKUP}" 2>&1

if [ -s "../${PROD_BACKUP}" ]; then
    BACKUP_SIZE=$(du -h "../${PROD_BACKUP}" | cut -f1)
    echo -e "${GREEN}✅ Production backup downloaded (${BACKUP_SIZE}): ${PROD_BACKUP}${NC}"
else
    echo -e "${RED}❌ Production backup failed or is empty${NC}"
    exit 1
fi
echo ""

# Step 4: Clear local database
echo -e "${YELLOW}[4/5] Clearing local database...${NC}"
cd ..
docker-compose exec -T postgres psql -U postgres -d hierarchy_platform -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
echo -e "${GREEN}✅ Local database cleared${NC}"
echo ""

# Step 5: Restore production data to local
echo -e "${YELLOW}[5/5] Restoring production data to local database...${NC}"
docker-compose exec -T postgres pg_restore -U postgres -d hierarchy_platform -v < "$PROD_BACKUP"
echo -e "${GREEN}✅ Production data restored to local database${NC}"
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✅ SYNC COMPLETE                                     ║"
echo "╔════════════════════════════════════════════════════════╗"
echo ""
echo "📊 Backups created:"
echo "   • Local (before):  ${LOCAL_BACKUP}"
echo "   • Production:      ${PROD_BACKUP}"
echo ""
echo "🔄 Your local database now contains production data!"
echo ""
echo "💡 Next steps:"
echo "   • Run: cd app && npm run db:check-integrity"
echo "   • Verify data: make db-shell"
echo ""
echo "⚠️  To restore your local backup if needed:"
echo "   make db-restore FILE=${LOCAL_BACKUP}"
echo ""
