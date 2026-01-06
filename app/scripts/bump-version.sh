#!/bin/bash
# ============================================
# Version Bumping Script
# ============================================
# Usage:
#   ./scripts/bump-version.sh dev        # App PATCH (1.1.1 → 1.1.2)
#   ./scripts/bump-version.sh prod       # App MINOR (1.1.1 → 1.2.0)
#   ./scripts/bump-version.sh sw         # SW PATCH (2.1.6 → 2.1.7)
#   ./scripts/bump-version.sh sw-major   # SW MAJOR (2.1.6 → 3.0.0)
# ============================================

set -e

VERSION_FILE="version.json"
BUMP_TYPE=${1:-dev}
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed"
    echo "   Install with: brew install jq"
    exit 1
fi

# Read current versions
CURRENT_APP_VERSION=$(jq -r '.version' "$VERSION_FILE")
CURRENT_SW_VERSION=$(jq -r '.serviceWorkerVersion' "$VERSION_FILE")

# Bump version based on type
case "$BUMP_TYPE" in
  prod)
    # Production: Increment app MINOR, reset patch
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_APP_VERSION"
    MINOR=$((MINOR + 1))
    PATCH=0
    NEW_APP_VERSION="$MAJOR.$MINOR.$PATCH"
    NEW_SW_VERSION="$CURRENT_SW_VERSION"
    CHANGELOG_TYPE="production"
    echo "🚀 PRODUCTION: $CURRENT_APP_VERSION → $NEW_APP_VERSION"
    ;;

  dev)
    # Development: Increment app PATCH
    IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_APP_VERSION"
    PATCH=$((PATCH + 1))
    NEW_APP_VERSION="$MAJOR.$MINOR.$PATCH"
    NEW_SW_VERSION="$CURRENT_SW_VERSION"
    CHANGELOG_TYPE="development"
    echo "🔧 DEVELOPMENT: $CURRENT_APP_VERSION → $NEW_APP_VERSION"
    ;;

  sw)
    # Service Worker: Increment PATCH
    IFS='.' read -r SW_MAJOR SW_MINOR SW_PATCH <<< "$CURRENT_SW_VERSION"
    SW_PATCH=$((SW_PATCH + 1))
    NEW_SW_VERSION="$SW_MAJOR.$SW_MINOR.$SW_PATCH"
    NEW_APP_VERSION="$CURRENT_APP_VERSION"
    CHANGELOG_TYPE="service-worker"
    echo "⚙️  SERVICE WORKER: $CURRENT_SW_VERSION → $NEW_SW_VERSION"
    ;;

  sw-major)
    # Service Worker: Increment MAJOR (breaking changes)
    IFS='.' read -r SW_MAJOR SW_MINOR SW_PATCH <<< "$CURRENT_SW_VERSION"
    SW_MAJOR=$((SW_MAJOR + 1))
    NEW_SW_VERSION="$SW_MAJOR.0.0"
    NEW_APP_VERSION="$CURRENT_APP_VERSION"
    CHANGELOG_TYPE="service-worker-major"
    echo "🚨 SERVICE WORKER MAJOR: $CURRENT_SW_VERSION → $NEW_SW_VERSION"
    ;;

  *)
    echo "❌ Invalid bump type: $BUMP_TYPE"
    echo "   Use: dev | prod | sw | sw-major"
    exit 1
    ;;
esac

# Update version.json
CURRENT_DATE=$(date +%Y-%m-%d)
jq --arg appVersion "$NEW_APP_VERSION" \
   --arg swVersion "$NEW_SW_VERSION" \
   --arg date "$CURRENT_DATE" \
   --arg branch "$CURRENT_BRANCH" \
   '.version = $appVersion |
    .serviceWorkerVersion = $swVersion |
    .releaseDate = $date |
    .branch = $branch' \
   "$VERSION_FILE" > "${VERSION_FILE}.tmp" && mv "${VERSION_FILE}.tmp" "$VERSION_FILE"

echo "✅ Updated version.json"
echo "   App Version: $NEW_APP_VERSION"
echo "   SW Version: $NEW_SW_VERSION"
echo "   Branch: $CURRENT_BRANCH"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff $VERSION_FILE"
if [ "$BUMP_TYPE" = "sw" ] || [ "$BUMP_TYPE" = "sw-major" ]; then
    echo "  2. Commit: git add $VERSION_FILE && git commit -m \"chore: bump SW version to $NEW_SW_VERSION\""
else
    echo "  2. Commit: git add $VERSION_FILE && git commit -m \"chore: bump version to $NEW_APP_VERSION\""
fi
if [ "$BUMP_TYPE" = "prod" ]; then
    echo "  3. Push to main: git push origin main"
else
    echo "  3. Push to develop: git push origin develop"
fi
