#!/bin/bash

# Setup Railway Development Environment Variables
# Run this script after the Railway services are provisioned

echo "🚀 Setting up Railway Development Environment Variables..."

# Switch to development environment
railway environment development

# Get the Railway-assigned URL (you'll need to update this after first deployment)
echo "⚠️  Note: Update RAILWAY_DEV_URL after Railway assigns a URL to your service"
RAILWAY_DEV_URL="YOUR-RAILWAY-DEV-URL-HERE"  # Update this after deployment

# Set environment variables
echo "📝 Setting environment variables..."

railway variables set \
  AUTH_TRUST_HOST=1 \
  NODE_ENV=development \
  EMAIL_FROM=noreply@localhost \
  NEXTAUTH_SECRET="oo+OYmuVXlgnTmJ5D3NXEFaZ+pjfe7bRWbwnvYZYkks=" \
  AUTH_URL="https://${RAILWAY_DEV_URL}" \
  NEXTAUTH_URL="https://${RAILWAY_DEV_URL}" \
  NEXT_PUBLIC_APP_URL="https://${RAILWAY_DEV_URL}"

echo "✅ Basic environment variables set!"
echo ""
echo "⚠️  IMPORTANT NEXT STEPS:"
echo "1. Wait for Railway to assign a URL to your service"
echo "2. Update RAILWAY_DEV_URL in this script with the actual URL"
echo "3. Re-run this script to update the URL-dependent variables"
echo "4. Go to Railway dashboard to:"
echo "   - Set the service to use 'develop' branch"
echo "   - Set Root Directory to '/app'"
echo "   - Verify DATABASE_URL variables are present (auto-added by PostgreSQL service)"
echo ""
echo "🔍 Check current variables:"
echo "railway variables"
