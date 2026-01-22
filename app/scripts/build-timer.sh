#!/bin/bash
# Build Performance Monitor
# Usage: bash scripts/build-timer.sh

set -e

echo "🚀 Build Performance Monitor"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Start total timer
TOTAL_START=$(date +%s)

# 1. Prisma Generation
echo -e "${BLUE}[1/2]${NC} Generating Prisma Client..."
PRISMA_START=$(date +%s)
npx prisma generate > /dev/null 2>&1
PRISMA_END=$(date +%s)
PRISMA_TIME=$((PRISMA_END - PRISMA_START))
echo -e "${GREEN}✓${NC} Prisma generated in ${YELLOW}${PRISMA_TIME}s${NC}"
echo ""

# 2. Next.js Build
echo -e "${BLUE}[2/2]${NC} Building Next.js application..."
NEXT_START=$(date +%s)
npm run build
NEXT_END=$(date +%s)
NEXT_TIME=$((NEXT_END - NEXT_START))
echo -e "${GREEN}✓${NC} Next.js built in ${YELLOW}${NEXT_TIME}s${NC}"
echo ""

# Total time
TOTAL_END=$(date +%s)
TOTAL_TIME=$((TOTAL_END - TOTAL_START))

# Summary
echo "=============================="
echo "📊 Build Performance Summary"
echo "=============================="
echo -e "Prisma Generation: ${YELLOW}${PRISMA_TIME}s${NC} ($(awk "BEGIN {printf \"%.1f\", ($PRISMA_TIME/$TOTAL_TIME)*100}")%)"
echo -e "Next.js Build:     ${YELLOW}${NEXT_TIME}s${NC} ($(awk "BEGIN {printf \"%.1f\", ($NEXT_TIME/$TOTAL_TIME)*100}")%)"
echo "------------------------------"
echo -e "Total Build Time:  ${GREEN}${TOTAL_TIME}s${NC}"
echo "=============================="
echo ""

# Performance rating
if [ $TOTAL_TIME -lt 60 ]; then
  echo -e "${GREEN}🎉 Excellent! Build completed in under 1 minute!${NC}"
elif [ $TOTAL_TIME -lt 90 ]; then
  echo -e "${YELLOW}⚡ Good! Build completed in under 1.5 minutes.${NC}"
elif [ $TOTAL_TIME -lt 120 ]; then
  echo -e "${YELLOW}⏱️  Acceptable. Build completed in under 2 minutes.${NC}"
else
  echo -e "${YELLOW}⚠️  Slow build detected. Consider optimizations.${NC}"
fi
