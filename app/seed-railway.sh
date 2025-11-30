#!/bin/bash
# One-time script to seed Railway production database

echo "🌱 Seeding Railway production database..."
railway run --service rbac_hierarchy npm run db:seed:prod
