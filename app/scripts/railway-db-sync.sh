#!/bin/bash
# Railway Database Sync Script
# This script pushes Prisma schema and seeds the database on Railway production

set -e

echo "🚀 Railway Database Sync Starting..."
echo ""

# Step 1: Generate Prisma Client
echo "📦 Step 1/3: Generating Prisma Client..."
npx prisma generate
echo "✅ Prisma Client generated"
echo ""

# Step 2: Push database schema
echo "🔄 Step 2/3: Pushing database schema to Railway..."
npx prisma db push --accept-data-loss
echo "✅ Schema pushed successfully"
echo ""

# Step 3: Seed database with test data
echo "🌱 Step 3/3: Seeding database with test data..."
npm run db:seed
echo "✅ Database seeded successfully"
echo ""

echo "🎉 Railway Database Sync Complete!"
echo ""
echo "Database now contains:"
echo "  - 2 cities (Tel Aviv-Yafo, Ramat Gan)"
echo "  - 4 neighborhoods"
echo "  - Full user hierarchy (SuperAdmin, Area Manager, Coordinators)"
echo ""
echo "Optional: Run 'npm run db:seed:cities' to add all 82 Israeli cities"
