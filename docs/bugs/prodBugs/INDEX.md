# Production Bugs Index

**Last Updated:** 2026-01-28T15:50:00.000Z
**Total Documented:** 8
**Fixed:** 6
**Pending:** 2

## Bug Status Legend

- 🔴 CRITICAL - System-breaking, needs immediate fix
- 🟠 HIGH - User-facing, fix ASAP
- 🟡 MEDIUM - Important but not blocking
- 🟢 LOW - Minor, fix when convenient
- ✅ FIXED - Resolved

## Documented Bugs

| File | Error Type | Hash | Status | Last Seen | Fixed Date |
|------|------------|------|--------|-----------|------------|
| PROD-Error-0508f271.md | React Hydration #418 | 0508f271 | 🟠 HIGH | 2026-01-26 | - |
| PROD-Error-fd7ba1a6.md | Unexpected Response | fd7ba1a6 | 🟠 HIGH | 2026-01-26 | - |
| PROD-Error-4e7ef615.md | Circular JSON | 4e7ef615 | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-8a2f9add.md | Circular JSON | 8a2f9add | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-3dfdbd41.md | Circular JSON | 3dfdbd41 | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-ac8defa9.md | Circular JSON | ac8defa9 | ✅ FIXED | 2026-01-26 | 2026-01-27 |
| PROD-Error-3c8da2a3.md | ServiceWorker | 3c8da2a3 | ✅ FIXED | 2026-01-28 | 2026-01-05 |
| PROD-Error-a79b2d0f.md | Invalid string | a79b2d0f | ✅ FIXED | 2026-01-24 | 2026-01-24 |

## New Bugs (2026-01-28)

### 1. React Hydration Error #418 (Dashboard)
- **Hash:** 0508f271
- **Page:** `/dashboard`
- **Root Cause:** `Date.now()` and `window.innerWidth` used in render path
- **Files:** AnimatedCounter.tsx, OrganizationalTreeD3.tsx
- **Prevention Rule:** HYDRATION-001

### 2. Unexpected Server Response (Areas)
- **Hash:** fd7ba1a6
- **Page:** `/areas`
- **Root Cause:** Server action error handler re-throws errors instead of returning structured response
- **Files:** server-action-error-handler.ts, AreasClient.tsx
- **Prevention Rule:** SERVER-ACTION-001

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
| HYDRATION-001 | Never use Date/window in render path | 0508f271 |
| SERVER-ACTION-001 | Return error objects, don't throw | fd7ba1a6 |
| FORM-DOM-001 | Never serialize DOM elements | 4e7ef615, 8a2f9add, 3dfdbd41, ac8defa9 |
| PWA-SW-001 | Never cache /sw.js or /manifest.json | 3c8da2a3 |
| ENV-VAL-001 | Validate env vars before operations | a79b2d0f |
