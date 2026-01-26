# Version Management System

## Current Version: 1.1.1

## Versioning Scheme (Semantic Versioning)

```
MAJOR.MINOR.PATCH
  │     │     │
  │     │     └─ Development builds (auto-increment on push to develop)
  │     └─────── Production releases (auto-increment on merge to main)
  └───────────── Breaking changes (manual increment)
```

### Examples

- **Development**: `1.1.1` → `1.1.2` (push to `develop`)
- **Production**: `1.1.2` → `1.2.0` (merge to `main`)
- **Breaking**: `1.2.0` → `2.0.0` (manual bump)

## How It Works

### 1. Version Source of Truth

**File**: `version.json`

```json
{
  "version": "1.1.1",
  "releaseDate": "2026-01-03",
  "changelog": [...]
}
```

### 2. Display Location

Version appears in navigation sidebar:
- **Desktop**: Bottom of left sidebar
- **Mobile**: Below user email in drawer header

**Component**: `app/components/layout/NavigationV3.tsx`

```tsx
<Typography sx={{ fontSize: '10px', color: colors.neutral[300] }}>
  v{process.env.NEXT_PUBLIC_APP_VERSION || '1.1.1'}
</Typography>
```

### 3. Build Process

**Railway Build** (`railway-migrate.sh`):
1. Reads version from `version.json`
2. Sets `NEXT_PUBLIC_APP_VERSION` env var
3. Next.js embeds version in client bundle

**Local Development**:
- Falls back to `1.1.1` if env var not set
- Or reads from `.env` file

## Usage

### Manual Version Bump (Recommended)

```bash
# Development build (push to develop)
./scripts/bump-version.sh dev
# Result: 1.1.1 → 1.1.2

# Production release (merge to main)
./scripts/bump-version.sh prod
# Result: 1.1.2 → 1.2.0

# Commit and push
git add version.json
git commit -m "chore: bump version to X.Y.Z"
git push origin develop  # or main
```

### Automated Version Bump (Future)

**GitHub Actions** (not yet implemented):
```yaml
# .github/workflows/auto-version.yml
on:
  push:
    branches: [develop, main]
jobs:
  bump-version:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./scripts/bump-version.sh dev  # or prod
      - run: git push
```

## Deployment Flow

### Development (develop branch)

```bash
# 1. Bump version
./scripts/bump-version.sh dev

# 2. Commit changes
git add version.json
git commit -m "chore: bump version to 1.1.2"

# 3. Push to develop
git push origin develop

# 4. Railway auto-deploys
# - Reads version.json
# - Sets NEXT_PUBLIC_APP_VERSION=1.1.2
# - Builds and deploys
# - Version shows in UI: v1.1.2
```

### Production (main branch)

```bash
# 1. Bump version for production
./scripts/bump-version.sh prod

# 2. Commit changes
git add version.json
git commit -m "chore: release v1.2.0"

# 3. Create PR: develop → main
gh pr create --base main --head develop --title "Release v1.2.0"

# 4. Merge PR
# Railway auto-deploys to production

# 5. Version shows in UI: v1.2.0
```

## Verification

### Check Current Version

**In UI**:
- Open navigation sidebar
- Look at bottom (desktop) or below user email (mobile)
- Should show: `v1.1.1`

**In Code**:
```bash
cat version.json | grep version
# Output: "version": "1.1.1"
```

**In Railway**:
```bash
railway variables
# Look for: NEXT_PUBLIC_APP_VERSION=1.1.1
```

### Testing Locally

```bash
# Set version in .env
echo "NEXT_PUBLIC_APP_VERSION=1.1.1" >> .env

# Start dev server
npm run dev

# Navigate to any page
# Version should appear in navigation
```

## Files Involved

| File | Purpose |
|------|---------|
| `version.json` | Source of truth for version |
| `scripts/bump-version.sh` | Version bumping script |
| `app/components/layout/NavigationV3.tsx` | UI display |
| `.env.example` | Env var documentation |
| `next.config.ts` | Expose version to client |
| `railway-migrate.sh` | Inject version during Railway build |

## Troubleshooting

**Version not showing in UI:**
1. Check `version.json` exists
2. Check `.env` has `NEXT_PUBLIC_APP_VERSION`
3. Restart dev server
4. Hard refresh browser (Cmd+Shift+R)

**Version stuck at 1.1.1:**
1. Check Railway env vars
2. Verify `railway-migrate.sh` ran during deploy
3. Check Railway build logs for version output

**jq not installed error:**
```bash
brew install jq
```

## Best Practices

1. ✅ **Always bump version before merging**
2. ✅ **Use `bump-version.sh` script** (don't edit `version.json` manually)
3. ✅ **Commit version bump separately** from feature changes
4. ✅ **Use conventional commit messages**: `chore: bump version to X.Y.Z`
5. ❌ **Don't skip versions** (1.1.1 → 1.1.3 ❌)
6. ❌ **Don't manually edit version.json** (use script)

## Changelog Management (Future)

Each version bump can optionally add changelog entry:

```bash
./scripts/bump-version.sh dev --changelog "Fixed auth bug, Added session tracking"
```

This appends to `version.json`:
```json
{
  "changelog": [
    {
      "version": "1.1.2",
      "date": "2026-01-03",
      "type": "development",
      "changes": [
        "Fixed auth bug",
        "Added session tracking"
      ]
    }
  ]
}
```

Then displayed in UI (version tooltip or about page).
