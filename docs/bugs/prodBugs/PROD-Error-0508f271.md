# PROD BUG: Error - React Hydration Error #418 on Dashboard

**Error Hash:** 0508f271
**First Seen:** 2026-01-26T17:01:14.562Z
**Last Seen:** 2026-01-26T17:01:14.562Z
**Occurrence Count:** 1
**Level:** ERROR
**Affected Users:** Unknown

## Error Details

**Error Type:** `Error`

**Full Message:**
```
[Client-Side Error] Uncaught Error: Minified React error #418; visit https://react.dev/errors/418?args[]=HTML&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
```

**URLs Affected:**
- https://app.rbac.shop/dashboard

**HTTP Statuses:** N/A

**Sample Error IDs:**
- 81783794-d896-43a2-9117-1cf5a50ec367

## What is React Error #418?

**Hydration failed because the server rendered HTML didn't match the client.**

This occurs when the HTML generated on the server differs from what React expects to render on the client during hydration.

## Root Cause Analysis

Multiple components on the dashboard have hydration mismatch issues:

### 1. AnimatedCounter.tsx (CRITICAL)
**Line 45:** Uses `Date.now()` which returns different values on server vs client
```typescript
const startTime = Date.now();  // Server timestamp ≠ client timestamp
```

### 2. OrganizationalTreeD3.tsx (HIGH)
**Lines 191-202:** Uses `window.innerWidth` in render calculations
```typescript
if (isMounted && typeof window !== 'undefined') {
  const viewportCenterX = window.innerWidth / 2;  // undefined on server
}
```

**Lines 251-273:** State updates in useEffect based on window dimensions
```typescript
const containerWidth = Math.min(window.innerWidth - 100, 1400);
setTranslate({ x: containerWidth / 2, y: 80 });  // Causes hydration mismatch
```

### 3. CollapsibleCard.tsx (MEDIUM)
**Lines 40-41, 71:** Conditional rendering based on `isExpanded` state
```typescript
sx={{ mb: isExpanded ? 3 : 0 }}  // May differ between renders
{isExpanded && (<Box>...</Box>)}
```

## Fix Required

### Option 1: Suppress Hydration Warning (Quick Fix)
```typescript
<div suppressHydrationWarning>
  {/* Date-dependent content */}
</div>
```

### Option 2: Client-Only Rendering (Proper Fix)
```typescript
const [isClient, setIsClient] = useState(false);
useEffect(() => setIsClient(true), []);

if (!isClient) return <Skeleton />;  // Render placeholder on server
return <AnimatedCounter />;  // Render actual content on client
```

### Option 3: Remove Date/Window Dependencies
Move `Date.now()` and `window` usage to useEffect callbacks only, not in render path.

## Files to Modify

| File | Priority | Issue |
|------|----------|-------|
| `app/components/dashboard/AnimatedCounter.tsx` | CRITICAL | `Date.now()` in render |
| `app/components/dashboard/OrganizationalTreeD3.tsx` | HIGH | `window.innerWidth` usage |
| `app/components/ui/CollapsibleCard.tsx` | MEDIUM | Conditional state rendering |

## Prevention Rule

**HYDRATION-001:** Never use time-dependent (`Date.now()`, `new Date()`) or browser-dependent (`window`, `document`, `navigator`) values in the render path. Use them only in:
- `useEffect` callbacks
- Event handlers
- With `suppressHydrationWarning` attribute
- After `isMounted` state check with proper placeholder

## Status: 🔄 PENDING

**Created:** 2026-01-27
**Fixed Date:** -
**Commit:** -
