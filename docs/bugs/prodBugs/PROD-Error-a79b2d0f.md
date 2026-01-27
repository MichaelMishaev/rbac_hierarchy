# PROD BUG: Error - [Client-Side Error] Invalid string length

**Error Hash:** a79b2d0f
**First Seen:** 2026-01-24T12:13:15.728Z
**Last Seen:** 2026-01-24T12:13:15.728Z
**Occurrence Count:** 1
**Level:** ERROR
**Affected Users:** Unknown

## Error Details

**Error Type:** `Error`

**Full Message:**
```
[Client-Side Error] Invalid string length
```

**URLs Affected:**
- https://app.rbac.shop/login

**HTTP Statuses:** N/A

**Sample Error IDs:**
- 382674c3-b962-497e-91e7-cb903128f2a3

## Stack Trace
```
No stack trace available
```

## Root Cause Analysis

The error was caused by the `urlBase64ToUint8Array()` function in push-notifications.ts:

1. The `VAPID_PUBLIC_KEY` environment variable was undefined or empty
2. This undefined/empty string was passed to `urlBase64ToUint8Array()`
3. `window.atob()` called on invalid input throws "Invalid string length"

The error occurred on `/login` because push notifications were attempting to initialize
during page load via the `usePushNotifications` hook.

## Fix Applied

Added validation to check if VAPID key exists before attempting base64 conversion.

**File:** `app/lib/push-notifications.ts` (lines 149-158)
```typescript
if (!vapidPublicKey) {
  console.error('[Push] VAPID public key not found in env config');
  throw new Error('VAPID public key not configured...');
}
// Only call urlBase64ToUint8Array after validation
applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
```

Also changed environment variable reading to use validated env module instead of
direct `process.env` access.

## Files Modified

- `app/lib/push-notifications.ts` (VAPID key validation)

## Prevention Rule

**ENV-VAL-001:** Always validate environment variables before using them in operations
that can throw errors (base64 decode, URL parsing, etc.).

## Status: ✅ FIXED

**Created:** 2026-01-24
**Fixed Date:** 2026-01-24 (commit 6bad332)
**Commit:** 6bad332, fe4bddb, d006579, 8cfcfef
