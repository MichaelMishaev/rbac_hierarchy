#!/bin/bash

# ============================================
# Sync Production Database to Local - WORKING VERSION
# Uses Railway connect to create local proxy
# ============================================

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
LOCAL_BACKUP="${BACKUP_DIR}/local-backup-${TIMESTAMP}.dump"
PROD_BACKUP="${BACKUP_DIR}/prod-backup-${TIMESTAMP}.dump"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Production → Local Database Sync                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Backup local database
echo -e "${YELLOW}[1/5] Backing up current local database...${NC}"
mkdir -p "$BACKUP_DIR"
docker-compose exec -T postgres pg_dump -U postgres -Fc hierarchy_platform > "$LOCAL_BACKUP"
LOCAL_SIZE=$(du -h "$LOCAL_BACKUP" | cut -f1)
echo -e "${GREEN}✅ Local backup saved (${LOCAL_SIZE}): ${LOCAL_BACKUP}${NC}"
echo ""

# Step 2: Start Railway proxy in background
echo -e "${YELLOW}[2/5] Starting Railway database proxy...${NC}"
echo -e "${BLUE}   This will open a connection to Railway's PostgreSQL...${NC}"

# Start railway connect in background and capture the port
cd app
railway connect postgres &
PROXY_PID=$!
cd ..

echo "   Waiting for proxy to establish connection..."
sleep 5  # Give it time to establish connection

# Railway connect typically uses port 5432 or dynamically assigns one
# We'll try the default PostgreSQL port first
PROXY_PORT=5432

echo -e "${GREEN}✅ Railway proxy started (PID: $PROXY_PID)${NC}"
echo ""

# Step 3: Dump production database through proxy
echo -e "${YELLOW}[3/5] Downloading production database through proxy...${NC}"
echo "   This may take a few minutes..."

# Dump using the local proxy
PGPASSWORD=$(cd app && railway variables --json | jq -r '.DATABASE_URL' | sed -n 's/.*:\(.*\)@.*/\1/p') \
  pg_dump -h localhost -p $PROXY_PORT -U postgres railway -Fc > "$PROD_BACKUP" 2>&1

# Kill the proxy
kill $PROXY_PID 2>/dev/null || true

if [ -s "$PROD_BACKUP" ]; then
    PROD_SIZE=$(du -h "$PROD_BACKUP" | cut -f1)
    echo -e "${GREEN}✅ Production backup downloaded (${PROD_SIZE}): ${PROD_BACKUP}${NC}"
else
    echo -e "${RED}❌ Production backup failed${NC}"
    echo "   You may need to run this manually. Instructions:"
    echo ""
    echo "   Terminal 1: ${BLUE}railway connect postgres${NC}"
    echo "   Terminal 2: ${BLUE}pg_dump -h localhost -p <PORT> -U postgres railway -Fc > ${PROD_BACKUP}${NC}"
    echo ""
    kill $PROXY_PID 2>/dev/null || true
    exit 1
fi
echo ""

# Step 4: Clear local database
echo -e "${YELLOW}[4/5] Clearing local database...${NC}"
docker-compose exec -T postgres psql -U postgres -d hierarchy_platform -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
echo -e "${GREEN}✅ Local database cleared${NC}"
echo ""

# Step 5: Restore production data
echo -e "${YELLOW}[5/5] Restoring production data to local database...${NC}"
docker-compose exec -T postgres pg_restore -U postgres -d hierarchy_platform -v < "$PROD_BACKUP"
echo -e "${GREEN}✅ Production data restored${NC}"
echo ""

echo "╔════════════════════════════════════════════════════════╗"
echo "║   ✅ SYNC COMPLETE                                     ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "📊 Backups:"
echo "   • Local (before):  ${LOCAL_BACKUP} (${LOCAL_SIZE})"
echo "   • Production:      ${PROD_BACKUP} (${PROD_SIZE})"
echo ""
echo "🔄 Your local database now contains production data!"
echo ""
echo "💡 Next steps:"
echo "   • Verify: make db-shell"
echo "   • Check integrity: cd app && npm run db:check-integrity"
echo ""
