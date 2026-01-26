# Production Bugs Index

**Last Updated:** 2026-01-26T18:06:44.560Z
**Total Documented:** 4

## Bug Status Legend

- 🔴 CRITICAL - System-breaking, needs immediate fix
- 🟠 HIGH - User-facing, fix ASAP
- 🟡 MEDIUM - Important but not blocking
- 🟢 LOW - Minor, fix when convenient
- ✅ FIXED - Resolved

## Documented Bugs

| File | Error Type | Hash | Status | Last Seen |
|------|------------|------|--------|-----------|
| PROD-Error-ac8defa9.md | Error | ac8defa9 | 🔄 PENDING | 2026-01-26 |
| PROD-Error-3dfdbd41.md | Error | 3dfdbd41 | 🔄 PENDING | 2026-01-26 |
| PROD-Error-8a2f9add.md | Error | 8a2f9add | 🔄 PENDING | 2026-01-26 |
| PROD-Error-4e7ef615.md | Error | 4e7ef615 | 🔄 PENDING | 2026-01-26 |

## Quick Reference

### How to Use

1. **Check for errors:** `npx ts-node scripts/check-prod-errors.ts`
2. **Save new bugs:** `npx ts-node scripts/check-prod-errors.ts --save`
3. **Test connection:** `npx ts-node scripts/check-prod-errors.ts --test`

### Hash Deduplication

Error hashes are generated from normalized messages. The same logical error
will always have the same hash, preventing duplicate documentation.

Format: `PROD-{ErrorType}-{8-char-hash}.md`
