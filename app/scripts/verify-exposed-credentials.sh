#!/bin/bash
#
# Verify Exposed Credentials Are Not In Use
#
# This script checks all Railway environments to verify that the exposed
# production database password is not currently active.
#
# Usage: bash scripts/verify-exposed-credentials.sh

set -e

EXPOSED_PASSWORD="WObjqIJKncYvsxMmNUPbdGcgfSvMjZPH"
EXPOSED_HOST="switchyard.proxy.rlwy.net"

echo "🔍 Checking for exposed credentials in Railway environments..."
echo ""
echo "Exposed password: ${EXPOSED_PASSWORD:0:10}...${EXPOSED_PASSWORD: -10}"
echo "Exposed host: $EXPOSED_HOST"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}❌ Railway CLI not installed${NC}"
    echo "Install with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Railway${NC}"
    echo "Login with: railway login"
    exit 1
fi

echo -e "${GREEN}✅ Railway CLI ready${NC}"
echo ""

# Function to check environment
check_environment() {
    local env_name=$1
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Checking environment: $env_name"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Note: railway link requires interactive mode, so we can't actually switch
    # We'll just check the current environment and provide instructions
    echo "Note: Cannot programmatically switch environments in non-interactive mode"
    echo "You must manually check each environment:"
    echo ""
    echo "  1. Run: railway link -e $env_name"
    echo "  2. Run: railway variables | grep -i \"$EXPOSED_PASSWORD\""
    echo "  3. Run: railway variables | grep -i \"$EXPOSED_HOST\""
    echo ""
}

# Get current environment
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Current Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

railway status || echo "Not linked to a project"
echo ""

# Check current environment variables
echo "Checking current environment variables..."
echo ""

if railway variables --json 2>&1 | grep -q "$EXPOSED_PASSWORD"; then
    echo -e "${RED}🚨 CRITICAL: Exposed password FOUND in current environment!${NC}"
    echo ""
    echo "IMMEDIATE ACTION REQUIRED:"
    echo "1. Follow the password rotation guide in RAILWAY_PASSWORD_ROTATION_GUIDE.md"
    echo "2. Create a new database service"
    echo "3. Migrate data to new database"
    echo "4. Update environment variables"
    echo "5. Delete old database service"
    echo ""
    FOUND=true
elif railway variables --json 2>&1 | grep -q "$EXPOSED_HOST"; then
    echo -e "${YELLOW}⚠️  WARNING: Exposed host FOUND in current environment${NC}"
    echo ""
    echo "The exposed host is present but password may be different."
    echo "Check the full DATABASE_URL variable:"
    echo ""
    railway variables | grep -i "DATABASE"
    echo ""
    FOUND=true
else
    echo -e "${GREEN}✅ Exposed credentials NOT found in current environment${NC}"
    echo ""
    FOUND=false
fi

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$FOUND" = true ]; then
    echo -e "${RED}❌ EXPOSED CREDENTIALS FOUND${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Read: app/RAILWAY_PASSWORD_ROTATION_GUIDE.md"
    echo "2. Rotate database credentials immediately"
    echo "3. Review audit logs for suspicious activity"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Current environment looks safe${NC}"
    echo ""
    echo "IMPORTANT: This only checked the CURRENT environment."
    echo ""
    echo "To check ALL environments manually:"
    echo ""
    echo "  # Development"
    echo "  railway link -e development"
    echo "  railway variables | grep -i \"switchyard\""
    echo ""
    echo "  # Production (if exists)"
    echo "  railway link -e production"
    echo "  railway variables | grep -i \"switchyard\""
    echo ""
    echo "  # Staging (if exists)"
    echo "  railway link -e staging"
    echo "  railway variables | grep -i \"switchyard\""
    echo ""
    echo "If you find the exposed credentials in ANY environment:"
    echo "  → Follow RAILWAY_PASSWORD_ROTATION_GUIDE.md"
    echo ""
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Verification Complete"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
