#!/bin/bash
# Generate BUILD_ID in format: YYYY-MM-DD-gitSHA
# Used for deployment version tracking and client update notifications

set -e

# Get current date in YYYY-MM-DD format (Israel timezone)
BUILD_DATE=$(TZ="Asia/Jerusalem" date +%Y-%m-%d)

# Try to get git commit SHA (first 7 characters)
if git rev-parse --git-dir > /dev/null 2>&1; then
  GIT_SHA=$(git rev-parse --short=7 HEAD 2>/dev/null || echo "unknown")
else
  GIT_SHA="unknown"
fi

# Construct BUILD_ID
if [ "$GIT_SHA" = "unknown" ]; then
  # Fallback for local dev or non-git environments
  BUILD_ID="dev-local"
else
  BUILD_ID="${BUILD_DATE}-${GIT_SHA}"
fi

# Export for Next.js build process
export NEXT_PUBLIC_BUILD_ID="$BUILD_ID"

# Create build-info.json for debugging (optional)
BUILD_INFO_DIR="app/public"
mkdir -p "$BUILD_INFO_DIR"

cat > "${BUILD_INFO_DIR}/build-info.json" <<EOF
{
  "buildId": "${BUILD_ID}",
  "buildDate": "${BUILD_DATE}",
  "gitSha": "${GIT_SHA}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "environment": "${RAILWAY_ENVIRONMENT:-local}"
}
EOF

# Output for Railway logs
echo "✅ Generated BUILD_ID: $BUILD_ID"
echo "NEXT_PUBLIC_BUILD_ID=$BUILD_ID" >> $GITHUB_ENV 2>/dev/null || true

# For Railway: append to .env for build process
if [ -n "$RAILWAY_ENVIRONMENT" ]; then
  echo "NEXT_PUBLIC_BUILD_ID=$BUILD_ID" >> app/.env.local
  echo "📦 Railway build detected - BUILD_ID saved to .env.local"
fi

echo "$BUILD_ID"
