# PROD BUG: Error - [Client-Side Error] Failed to update a ServiceWorker for sco...

**Error Hash:** 3c8da2a3
**First Seen:** 2026-01-22T16:54:00.911Z
**Last Seen:** 2026-01-22T18:57:12.911Z
**Occurrence Count:** 2
**Level:** ERROR
**Affected Users:** Unknown

## Error Details

**Error Type:** `Error`

**Full Message:**
```
[Client-Side Error] Failed to update a ServiceWorker for scope ('https://app.rbac.shop/') with script ('https://app.rbac.shop/sw.js'): An unknown error occurred when fetching the script.
```

**URLs Affected:**
- https://app.rbac.shop/login

**HTTP Statuses:** N/A

**Sample Error IDs:**
- 39ab0fb8-2405-4513-8808-31bfb4af3793
- 1af9319d-b9e0-4281-ac01-059a952c84f6

## Stack Trace
```
No stack trace available
```

## Root Cause Analysis

The Service Worker was caching itself (`/sw.js`), creating an update deadlock:
1. Old SW is active in production
2. New version deployed to server
3. Browser requests update check for `/sw.js`
4. Old SW intercepts the request and returns its cached version (itself)
5. Browser sees no change - update never happens

## Fix Applied

Added explicit cache bypass for `/sw.js` and `/manifest.json` in the service worker.

**File:** `app/public/sw.js` (lines 153-163)
```javascript
// Service Worker and Manifest: NEVER cache (prevents update deadlock)
if (url.pathname === '/sw.js' || url.pathname === '/manifest.json') {
  event.respondWith(
    fetch(request, {
      cache: 'no-cache', // Force revalidation
    })
  );
  return;
}
```

Version bumped to 2.1.6 to force cache invalidation.

## Files Modified

- `app/public/sw.js` (lines 153-163, version 2.1.6)

## Prevention Rule

**PWA-SW-001:** Service Workers must NEVER cache `/sw.js` or `/manifest.json`.
These files must always be fetched fresh to allow updates.

## Status: ✅ FIXED

**Created:** 2026-01-24
**Fixed Date:** 2026-01-05 (Bug #43)
**Commit:** SW version 2.1.6
