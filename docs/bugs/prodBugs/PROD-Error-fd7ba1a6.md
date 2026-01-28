# PROD BUG: Error - Unexpected Server Response on Areas Page

**Error Hash:** fd7ba1a6
**First Seen:** 2026-01-26T17:06:20.736Z
**Last Seen:** 2026-01-26T17:06:20.736Z
**Occurrence Count:** 1
**Level:** ERROR
**Affected Users:** Unknown

## Error Details

**Error Type:** `Error`

**Full Message:**
```
[Client-Side Error] An unexpected response was received from the server.
```

**URLs Affected:**
- https://app.rbac.shop/areas

**HTTP Statuses:** N/A

**Sample Error IDs:**
- 858a4736-10f6-44e9-8222-d70dd0732ba7

## Root Cause Analysis

This error comes from **Next.js Server Action Reducer** and occurs when:

1. A server action returns HTTP status >= 400 (error)
2. The response content-type is NOT 'text/plain'
3. Next.js can't parse the error response properly

### Server Actions on /areas Page

| Action | File | RBAC Guard | Failure Mode |
|--------|------|------------|--------------|
| `getAvailableAreaManagerUsers` | `areas.ts:513-563` | `requireSuperAdmin()` | Throws if not SuperAdmin |
| `createArea` | `areas.ts:49-184` | `requireSuperAdmin()` | Returns error object |
| `updateArea` | `areas.ts:197-375` | `requireSuperAdmin()` | Returns error object |
| `deleteArea` | `areas.ts:390-501` | `requireSuperAdmin()` | Returns error object |

### Critical Issue: Error Handler Re-throws

**File:** `lib/server-action-error-handler.ts` (line 49)
```typescript
// After logging the error...
throw err;  // ← Re-throws, causing "unexpected response"
```

When `requireSuperAdmin()` fails:
1. `ForbiddenError` is thrown
2. Error handler logs it
3. Error is **re-thrown** (not returned as structured response)
4. Next.js receives HTTP 500 with unstructured error body
5. Client shows: "An unexpected response was received from the server"

### Likely Scenario

A user who is NOT a SuperAdmin (e.g., Area Manager, City Coordinator) visited `/areas` and:
1. The page tried to call `getAvailableAreaManagerUsers()`
2. `requireSuperAdmin()` check failed
3. Error was thrown → re-thrown → "unexpected response"

## Fix Required

### Option 1: Return Error Object Instead of Throwing
```typescript
// In server-action-error-handler.ts
catch (err) {
  await logger.error(...);
  // DON'T throw - return structured error instead
  return { success: false, error: err.message };
}
```

### Option 2: Wrap Server Action Calls with Try-Catch
```typescript
// In AreasClient.tsx
try {
  const users = await getAvailableAreaManagerUsers();
} catch (error) {
  // Handle gracefully - don't let it propagate
  console.error('Failed to get users:', error);
  setError('אין הרשאה לצפות במנהלי אזור');
}
```

### Option 3: Check Permissions Before Calling
```typescript
// Only call if user is SuperAdmin
if (session?.user?.role === 'SUPER_ADMIN') {
  const users = await getAvailableAreaManagerUsers();
}
```

## Files to Modify

| File | Priority | Change |
|------|----------|--------|
| `lib/server-action-error-handler.ts` | HIGH | Return error object instead of re-throwing |
| `app/components/areas/AreasClient.tsx` | MEDIUM | Add permission check before API call |
| `app/components/modals/AreaModal.tsx` | LOW | Better error message handling |

## Prevention Rule

**SERVER-ACTION-001:** Server actions should NEVER throw errors to the client. Always return structured responses:
```typescript
return { success: false, error: 'User-friendly message' };
```

Throwing causes "unexpected response" errors that confuse users.

## Status: 🔄 PENDING

**Created:** 2026-01-27
**Fixed Date:** -
**Commit:** -
