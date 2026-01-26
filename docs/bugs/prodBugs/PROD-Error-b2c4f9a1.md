# PROD BUG: Error - Server Components render error

**Error Hash:** b2c4f9a1
**First Seen:** 2026-01-22 09:20:48 UTC
**Last Seen:** 2026-01-22 11:13:45 UTC
**Occurrence Count:** 35
**Level:** ERROR
**Severity:** 🟠 HIGH
**Affected Users:** Unknown (client-side error, no user context)

## Error Details

**Error Type:** `Error`

**Full Message:**
```
[Client-Side Error] An error occurred in the Server Components render. The specific message is omitted in production builds to avoid leaking sensitive details.
```

**URLs Affected:**
- /activists (most recent)
- Multiple pages (generic SSR error)

**Sample Error ID:** 18f4188a-9b81-49c1-9831-a7c595635edf

## Stack Trace
```
(No stack trace available - error message is minified in production)
```

## Root Cause Analysis

**Issue:** Generic React Server Component hydration/render error

This is a **catch-all error** from Next.js production builds that hides the actual error message for security reasons.

**Possible Causes:**
1. **Data mismatch** between server render and client hydration
2. **Null/undefined data** from server actions
3. **Async data race** during component render
4. **Type mismatch** in props passed to client components

**Why this is problematic:**
- Production build masks the real error
- Cannot debug without reproducing locally
- Affects multiple pages (/activists, /dashboard, /cities)

## Investigation Steps Required

### Step 1: Enable detailed errors locally
```bash
# In .env.local
NODE_ENV=development
NEXT_PUBLIC_ENABLE_DETAILED_ERRORS=true
```

### Step 2: Reproduce on affected pages
Visit in order:
1. https://app.rbac.shop/activists (35 errors here)
2. https://app.rbac.shop/dashboard
3. https://app.rbac.shop/cities

### Step 3: Check for common patterns
Look for:
- Server components using `use client` incorrectly
- Async data loaded without proper Suspense boundaries
- Props with `undefined` values
- Date objects not serialized properly

### Step 4: Add error boundaries
```typescript
// Add to each affected page
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error }) {
  // Log to server
  logErrorToServer({ error: error.toString(), stack: error.stack });
  return <div>שגיאה בטעינת הדף</div>;
}

<ErrorBoundary FallbackComponent={ErrorFallback}>
  <YourComponent />
</ErrorBoundary>
```

## Temporary Mitigation

Since we can't identify the exact cause without detailed stack traces, add comprehensive error logging:

```typescript
// app/error-logger.ts
export async function logDetailedError(context: string, error: any) {
  if (process.env.NODE_ENV === 'production') {
    await fetch('/api/error-log', {
      method: 'POST',
      body: JSON.stringify({
        context,
        message: error?.message || 'Unknown error',
        stack: error?.stack || 'No stack',
        componentStack: error?.componentStack,
        url: window.location.href,
      })
    });
  }
}
```

## Files to Investigate

**Primary suspects:**
- `app/app/[locale]/(activist)/activists/page.tsx` (highest occurrence URL)
- `app/app/[locale]/(dashboard)/dashboard/page.tsx`
- `app/components/` (check all Client Components for SSR issues)

**Look for:**
- Missing `use client` directives
- Server Components using browser APIs
- Improper data serialization

## Status: 🔄 NEEDS REPRODUCTION

**Created:** 2026-01-22
**Investigation Status:** Awaiting local reproduction with development build
**Fixed Date:** -
**Commit:** -

## Next Actions
1. ✅ Document issue (this file)
2. ⏳ Reproduce error locally in development mode
3. ⏳ Identify exact component causing the error
4. ⏳ Add proper error boundaries
5. ⏳ Fix root cause
6. ⏳ Deploy fix and monitor
