# Safe API Route Wrapping - Zero Regression Strategy

## 🎯 Goal: Wrap ALL routes with 0% regression risk

## ⚠️ CRITICAL RULES - NO EXCEPTIONS

### Rule 1: ONE ROUTE AT A TIME
- ✅ Wrap 1 route
- ✅ Test 1 route
- ✅ Commit 1 route
- ❌ NEVER wrap multiple routes without testing

### Rule 2: PRESERVE ALL EXISTING BEHAVIOR
- ✅ Keep all try/catch blocks (withErrorHandler wraps them)
- ✅ Keep all return statements exactly the same
- ✅ Keep all status codes unchanged
- ✅ Keep all validation logic unchanged

### Rule 3: ONLY ADD, NEVER REMOVE
```typescript
// ❌ BAD: Removes existing error handling
export const POST = withErrorHandler(async (req) => {
  await doSomething();  // If this throws, no error message!
  return Response.json({ success: true });
});

// ✅ GOOD: Keeps existing behavior
export const POST = withErrorHandler(async (req) => {
  try {
    await doSomething();
    return Response.json({ success: true });
  } catch (error) {
    // Existing error handling preserved
    if (error instanceof ValidationError) {
      return Response.json({ error: 'Invalid' }, { status: 400 });
    }
    throw error; // Let withErrorHandler log it
  }
});
```

### Rule 4: EXPLICIT RBAC LOGGING ONLY
- ✅ Add `logger.rbacViolation()` for 403 Forbidden responses
- ✅ Add `logger.authFailure()` for 401 Unauthorized responses
- ❌ Don't change auth logic
- ❌ Don't change permission checks

---

## 📋 Wrapping Checklist (Per Route)

### Before Wrapping
- [ ] Read entire route file
- [ ] Identify all return paths
- [ ] Identify all status codes
- [ ] Identify all error types
- [ ] Note any custom validation

### During Wrapping
- [ ] Import: `import { withErrorHandler, ForbiddenError, UnauthorizedError } from '@/lib/error-handler'`
- [ ] Import: `import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger'`
- [ ] Change: `export async function GET/POST/PUT/DELETE` → `export const GET/POST/PUT/DELETE = withErrorHandler(async`
- [ ] Add RBAC logging BEFORE throwing errors
- [ ] Keep all existing try/catch blocks
- [ ] Keep all existing return statements

### After Wrapping
- [ ] Visual diff check: Only additions, no removals
- [ ] Test in local dev
- [ ] Check error response format unchanged
- [ ] Check success response format unchanged
- [ ] Check status codes unchanged
- [ ] Commit with descriptive message

---

## 🔍 Safe Wrapping Pattern

### Pattern 1: Simple Route (No existing try/catch)
```typescript
// BEFORE
export async function GET(req: Request) {
  const session = await auth();
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const data = await prisma.data.findMany();
  return Response.json(data);
}

// AFTER (SAFE)
export const GET = withErrorHandler(async (req: Request) => {
  const session = await auth();

  if (!session) {
    const context = await extractRequestContext(req);
    logger.authFailure('Unauthenticated access attempt', context);
    throw new UnauthorizedError('נדרשת הזדהות');
  }

  const data = await prisma.data.findMany();
  return Response.json(data);
});
```

### Pattern 2: Route with existing try/catch
```typescript
// BEFORE
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const result = await doSomething(body);
    return Response.json(result);
  } catch (error) {
    console.error('Error:', error);
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

// AFTER (SAFE - preserves existing behavior)
export const POST = withErrorHandler(async (req: Request) => {
  try {
    const body = await req.json();
    const result = await doSomething(body);
    return Response.json(result);
  } catch (error) {
    // Existing error handling preserved
    console.error('Error:', error);
    return Response.json({ error: 'Failed' }, { status: 500 });
    // Note: Error still logged by withErrorHandler
  }
});
```

### Pattern 3: Route with Zod validation
```typescript
// BEFORE
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = schema.parse(body);
    // ...
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json({ error: 'Invalid', details: error.errors }, { status: 400 });
    }
    return Response.json({ error: 'Failed' }, { status: 500 });
  }
}

// AFTER (SAFE - Zod errors handled by withErrorHandler automatically)
export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();
  const validated = schema.parse(body);
  // Zod errors automatically return 400 with details
  // ...
});
```

### Pattern 4: Route with RBAC checks
```typescript
// BEFORE
export async function DELETE(req: Request) {
  const session = await auth();
  if (session.user.role !== 'SUPERADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }
  // ...
}

// AFTER (SAFE + RBAC logging)
export const DELETE = withErrorHandler(async (req: Request) => {
  const session = await auth();

  if (session.user.role !== 'SUPERADMIN') {
    const context = await extractRequestContext(req);
    logger.rbacViolation(`Non-superadmin attempted admin action`, {
      ...context,
      ...extractSessionContext(session),
    });
    throw new ForbiddenError('רק מנהל מערכת יכול לבצע פעולה זו');
  }
  // ...
});
```

---

## 🧪 Testing Strategy (Per Route)

### 1. Success Case
```bash
# Test successful request
curl -X GET http://localhost:3200/api/route \
  -H "Cookie: session=..." \
  -H "Content-Type: application/json"

# ✅ Should return same data as before
# ✅ Should return same status code (200)
```

### 2. Auth Failure
```bash
# Test without auth
curl -X GET http://localhost:3200/api/route

# ✅ Should return 401
# ✅ Should log to error_logs with error_type='AuthFailure'
```

### 3. RBAC Violation
```bash
# Test with wrong role
curl -X DELETE http://localhost:3200/api/admin/route \
  -H "Cookie: session_activist=..."

# ✅ Should return 403
# ✅ Should log to error_logs with error_type='RBACViolation'
```

### 4. Validation Error
```bash
# Test with invalid data
curl -X POST http://localhost:3200/api/route \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'

# ✅ Should return 400
# ✅ Should return validation details
```

### 5. Database Error
```bash
# Simulate DB error (temporarily break DB connection)
# ✅ Should return 500
# ✅ Should log to error_logs with error_type='DatabaseError'
```

---

## 📊 Progress Tracking

### Priority 1: Authentication (CRITICAL - 3 routes)
- [x] `app/api/auth/change-password/route.ts` ✅ DONE (2025-12-21)
- [ ] `app/api/auth/[...nextauth]/route.ts` (skip - handled by NextAuth)
- [x] `app/api/admin/fix-passwords/route.ts` ✅ DONE (2025-12-21)

### Priority 2: Voters (HIGH - 4 routes)
- [x] `app/api/activists/voters/route.ts` ✅ DONE
- [ ] `app/api/activists/voters/[id]/route.ts`
- [ ] `app/api/admin/migrate-voters/route.ts`
- [ ] `app/api/voter-template/route.ts`

### Priority 3: Tasks (HIGH - 8 routes)
- [ ] `app/api/tasks/route.ts`
- [ ] `app/api/tasks/[taskId]/route.ts`
- [ ] `app/api/tasks/[taskId]/status/route.ts`
- [ ] `app/api/tasks/bulk-archive/route.ts`
- [ ] `app/api/tasks/inbox/route.ts`
- [ ] `app/api/tasks/unread-count/route.ts`
- [ ] `app/api/tasks/available-recipients/route.ts`
- [ ] `app/api/tasks/preview-recipients/route.ts`

### Priority 4: Org Tree (CRITICAL - 3 routes)
- [ ] `app/api/org-tree/route.ts`
- [ ] `app/api/org-tree-deep/route.ts`
- [ ] `app/api/org-tree-export/route.ts`

### Priority 5: Admin (MEDIUM - 5 routes)
- [ ] `app/api/admin/migrate-schema/route.ts`
- [ ] `app/api/admin/restore-database/route.ts`
- [ ] `app/api/admin/restore-database-now/route.ts`
- [ ] `app/api/seed/route.ts`
- [ ] `app/api/test-auth/route.ts`

### Priority 6: Analytics (LOW - 5 routes)
- [ ] `app/api/analytics/web-vitals/route.ts`
- [ ] `app/api/metrics/store/route.ts`
- [ ] `app/api/metrics/aggregate/route.ts`
- [ ] `app/api/map-data/route.ts`
- [ ] `app/api/events/live-feed/route.ts`

### Priority 7: Misc (LOW - 3 routes)
- [ ] `app/api/push/subscribe/route.ts`
- [ ] `app/api/ai/parse-task/route.ts`
- [ ] `app/api/ai/suggest-assignments/route.ts`

---

## 🚨 Red Flags - STOP if you see these

### ❌ Regression Risk Indicators
1. Removing existing error messages → Users see different errors
2. Changing status codes → Frontend breaks
3. Removing try/catch → Error handling breaks
4. Changing response format → API contract breaks
5. Removing validation → Security hole

### ✅ Safe Change Indicators
1. Only adding imports
2. Only adding logging statements
3. Only changing function declaration (async function → const = withErrorHandler)
4. Only adding RBAC/auth logging
5. All existing logic unchanged

---

## 🎯 Success Criteria

**Route is successfully wrapped when:**
1. ✅ All existing tests pass
2. ✅ No change in response format
3. ✅ No change in status codes
4. ✅ Errors logged to `error_logs` table
5. ✅ RBAC violations logged separately
6. ✅ Visual diff shows only additions

---

## 📝 Commit Message Template

```
feat(logging): wrap [route-name] with error handler

- Add withErrorHandler wrapper for automatic error logging
- Add RBAC violation logging for 403 responses
- Add auth failure logging for 401 responses
- Preserve all existing behavior (no regressions)

Tested:
- ✅ Success case
- ✅ Auth failure case
- ✅ RBAC violation case
- ✅ Validation error case

Related: Error logging system implementation
```

---

## 🚀 Ready to Start

**Next action**: Wrap first Priority 1 route
**Estimated time**: 5 minutes per route
**Total routes**: 31 routes (~2.5 hours total)
**Approach**: Systematic, one-by-one, test each
