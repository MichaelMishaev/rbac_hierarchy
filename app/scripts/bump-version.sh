#!/bin/bash
# ============================================
# Version Bumping Script
# ============================================
# Usage:
#   ./scripts/bump-version.sh dev    # Increment patch (1.1.1 → 1.1.2)
#   ./scripts/bump-version.sh prod   # Increment minor (1.1.1 → 1.2.0)
# ============================================

set -e

VERSION_FILE="version.json"
BUMP_TYPE=${1:-dev}

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "❌ Error: jq is not installed"
    echo "   Install with: brew install jq"
    exit 1
fi

# Read current version
CURRENT_VERSION=$(jq -r '.version' "$VERSION_FILE")

# Parse version components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Bump version based on type
if [ "$BUMP_TYPE" = "prod" ]; then
    # Production: Increment minor, reset patch
    MINOR=$((MINOR + 1))
    PATCH=0
    NEW_VERSION="$MAJOR.$MINOR.$PATCH"
    echo "🚀 PRODUCTION RELEASE: $CURRENT_VERSION → $NEW_VERSION"
elif [ "$BUMP_TYPE" = "dev" ]; then
    # Development: Increment patch
    PATCH=$((PATCH + 1))
    NEW_VERSION="$MAJOR.$MINOR.$PATCH"
    echo "🔧 DEVELOPMENT BUILD: $CURRENT_VERSION → $NEW_VERSION"
else
    echo "❌ Invalid bump type: $BUMP_TYPE"
    echo "   Use: dev or prod"
    exit 1
fi

# Update version.json
CURRENT_DATE=$(date +%Y-%m-%d)
jq --arg version "$NEW_VERSION" \
   --arg date "$CURRENT_DATE" \
   --arg type "$BUMP_TYPE" \
   '.version = $version | .releaseDate = $date' \
   "$VERSION_FILE" > "${VERSION_FILE}.tmp" && mv "${VERSION_FILE}.tmp" "$VERSION_FILE"

echo "✅ Version bumped to $NEW_VERSION"
echo "📝 Updated: $VERSION_FILE"
echo ""
echo "Next steps:"
echo "  1. Review changes: git diff $VERSION_FILE"
echo "  2. Commit: git add $VERSION_FILE && git commit -m \"chore: bump version to $NEW_VERSION\""
if [ "$BUMP_TYPE" = "prod" ]; then
    echo "  3. Push to main: git push origin main"
else
    echo "  3. Push to develop: git push origin develop"
fi
