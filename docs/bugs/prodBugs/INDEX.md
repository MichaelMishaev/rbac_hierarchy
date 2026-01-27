# Production Bugs Index

**Last Updated:** 2026-01-27T10:00:00.000Z
**Total Documented:** 6
**Fixed:** 6
**Pending:** 0

## Bug Status Legend

- 🔴 CRITICAL - System-breaking, needs immediate fix
- 🟠 HIGH - User-facing, fix ASAP
- 🟡 MEDIUM - Important but not blocking
- 🟢 LOW - Minor, fix when convenient
- ✅ FIXED - Resolved

## Documented Bugs

| File | Error Type | Hash | Status | Last Seen | Fixed Date |
|------|------------|------|--------|-----------|------------|
| PROD-Error-4e7ef615.md | Circular JSON | 4e7ef615 | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-8a2f9add.md | Circular JSON | 8a2f9add | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-3dfdbd41.md | Circular JSON | 3dfdbd41 | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-ac8defa9.md | Circular JSON | ac8defa9 | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-3c8da2a3.md | ServiceWorker | 3c8da2a3 | ✅ FIXED | 2026-01-22 | 2026-01-05 |
| PROD-Error-a79b2d0f.md | Invalid string | a79b2d0f | ✅ FIXED | 2026-01-24 | 2026-01-24 |

## Recent Fixes (2026-01-27)

### Circular JSON Serialization Bug (4 instances)
- **Root Cause:** VoterForm.tsx accessing `nativeEvent.submitter` DOM element
- **Fix:** Extract only primitive attribute strings, not DOM references
- **File:** `app/app/[locale]/(dashboard)/manage-voters/components/VoterForm.tsx`
- **Prevention Rule:** FORM-DOM-001

## Quick Reference

### How to Use

1. **Check for errors:** `npx tsx scripts/check-prod-errors.ts`
2. **Save new bugs:** `npx tsx scripts/check-prod-errors.ts --save`
3. **Test connection:** `npx tsx scripts/check-prod-errors.ts --test`

### Hash Deduplication

Error hashes are generated from normalized messages. The same logical error
will always have the same hash, preventing duplicate documentation.

Format: `PROD-{ErrorType}-{8-char-hash}.md`

### Prevention Rules Index

| Rule ID | Description | Related Bugs |
|---------|-------------|--------------|
| FORM-DOM-001 | Never serialize DOM elements | 4e7ef615, 8a2f9add, 3dfdbd41, ac8defa9 |
| PWA-SW-001 | Never cache /sw.js or /manifest.json | 3c8da2a3 |
| ENV-VAL-001 | Validate env vars before operations | a79b2d0f |
