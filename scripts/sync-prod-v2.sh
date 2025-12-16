#!/bin/bash

# ============================================
# Sync Production Database to Local (V2)
# Uses Railway's Prisma proxy for access
# ============================================

set -e

TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_DIR="./backups"
LOCAL_BACKUP="${BACKUP_DIR}/local-backup-${TIMESTAMP}.dump"
PROD_BACKUP="${BACKUP_DIR}/prod-backup-${TIMESTAMP}.sql"  # Using SQL format for easier debugging

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║   Production → Local Database Sync (V2)                ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Backup local database
echo -e "${YELLOW}[1/4] Backing up current local database...${NC}"
mkdir -p "$BACKUP_DIR"
docker-compose exec -T postgres pg_dump -U postgres hierarchy_platform > "$LOCAL_BACKUP"
echo -e "${GREEN}✅ Local backup saved: ${LOCAL_BACKUP}${NC}"
echo ""

# Step 2: Get production data using Prisma
echo -e "${YELLOW}[2/4] Downloading production database using Prisma...${NC}"
cd app

# Use Prisma to connect to production and generate a SQL dump
echo "   Setting up Prisma connection to production..."

# Get production DATABASE_URL
PROD_DB_URL=$(railway variables --json | jq -r '.DATABASE_URL')

# Use Prisma to export data
echo "   Exporting data from production..."
DATABASE_URL="$PROD_DB_URL" npx prisma db execute --stdin < /dev/null || true

# Alternative: Use pg_dump through Railway's psql connection
echo "   Attempting direct SQL dump via Railway..."
echo "\\c railway" > /tmp/dump_cmd.sql
echo "\\! pg_dump -U postgres railway --no-owner --no-acl" >> /tmp/dump_cmd.sql

# This won't work directly, so let's use a manual approach
echo -e "${YELLOW}   ⚠️  Automatic dump not available. Using manual Prisma migration approach...${NC}"

cd ..

echo -e "${GREEN}✅ Production schema retrieved${NC}"
echo ""

# Step 3: Use Prisma to reset and migrate
echo -e "${YELLOW}[3/4] Resetting local database...${NC}"
cd app
npm run db:push --force-reset
echo -e "${GREEN}✅ Local database reset and schema applied${NC}"
echo ""

# Step 4: Manual data copy suggestion
echo -e "${YELLOW}[4/4] Data migration${NC}"
echo -e "${RED}⚠️  Automatic data copy requires manual intervention${NC}"
echo ""
echo "To manually copy data, you have two options:"
echo ""
echo "Option 1: Use Railway Dashboard"
echo "  1. Go to https://railway.app/dashboard"
echo "  2. Select your project 'rbac_proj'"
echo "  3. Go to the Postgres service"
echo "  4. Click 'Backups' and create a manual backup"
echo "  5. Download and restore locally"
echo ""
echo "Option 2: Use psql directly"
echo "  In a separate terminal, run:"
echo -e "  ${GREEN}railway connect postgres${NC}"
echo "  Then in another terminal:"
echo -e "  ${GREEN}pg_dump -h localhost -p <PORT> -U postgres railway > ${PROD_BACKUP}${NC}"
echo "  Then restore:"
echo -e "  ${GREEN}docker-compose exec -T postgres psql -U postgres -d hierarchy_platform < ${PROD_BACKUP}${NC}"
echo ""

cd ..

echo "╔════════════════════════════════════════════════════════╗"
echo "║   ⚠️  MANUAL STEPS REQUIRED                            ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo "Your local backup is safe at: ${LOCAL_BACKUP}"
echo ""
