#!/bin/bash

# Quick API Test Script
# Run this to quickly test all backend APIs

echo "🚀 Quick API Test Runner"
echo "========================"
echo ""

# Check if server is running
echo "📡 Checking if development server is running..."
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Server not running. Please start with: npm run dev"
    exit 1
fi

echo "✅ Server is running"
echo ""

# Run Prisma Studio in background for database inspection
echo "🗄️  Opening Prisma Studio..."
npx prisma studio &
PRISMA_PID=$!

echo "✅ Prisma Studio opened at http://localhost:5555"
echo ""

# Wait for user to be ready
echo "📋 Test Checklist:"
echo "  1. Login as SuperAdmin: http://localhost:3000/login"
echo "  2. Open browser console (F12)"
echo "  3. Run test commands from tests/MANUAL_API_TESTING.md"
echo "  4. Verify results in Prisma Studio"
echo ""

read -p "Press Enter when ready to close Prisma Studio..."

# Cleanup
kill $PRISMA_PID 2>/dev/null

echo ""
echo "✅ Test session complete!"
