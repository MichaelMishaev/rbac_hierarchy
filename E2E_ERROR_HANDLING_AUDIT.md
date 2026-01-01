# 🚨 End-to-End Error Handling Audit - 2025-12-31

## ✅ Current State: What's Working

### 1. **Process-Level Error Handlers** ✅
- **File:** `lib/global-error-handlers.ts`
- **Initialized:** `instrumentation.ts` (line 22-24)
- **Catches:**
  - ✅ Unhandled Promise Rejections
  - ✅ Uncaught Exceptions
  - ✅ Process Warnings
  - ✅ SIGTERM/SIGINT for graceful shutdown

### 2. **React Error Boundaries** ✅
- **Component Errors:** `app/error.tsx` (catches render errors, useEffect errors)
- **Root Layout Errors:** `app/global-error.tsx` (catches critical layout errors)
- **Client-Side Logging:** Both send errors to `/api/log-error`

### 3. **Database Error Logging** ✅
- **Table:** `error_logs` (schema.prisma:489-546)
- **Logger:** `lib/logger.ts` with specialized methods:
  - `logger.error()` - General errors
  - `logger.critical()` - Critical system errors
  - `logger.rbacViolation()` - Security violations
  - `logger.authFailure()` - Auth failures
  - `logger.dbError()` - Database errors
  - `logger.apiError()` - External API errors

### 4. **API Route Error Handling** ⚠️ PARTIAL
- **Wrapper:** `lib/error-handler.ts` → `withErrorHandler()`
- **Coverage:** 11/21 API routes wrapped (52% coverage)
- **Wrapped routes:**
  - `/api/tasks/route.ts` ✅
  - `/api/org-tree-export/route.ts` ✅
  - `/api/activists/voters/route.ts` ✅
  - `/api/admin/fix-passwords/route.ts` ✅
  - `/api/org-tree/route.ts` ✅
  - `/api/tasks/unread-count/route.ts` ✅
  - `/api/auth/change-password/route.ts` ✅
  - `/api/tasks/available-recipients/route.ts` ✅
  - `/api/tasks/bulk-archive/route.ts` ✅
  - `/api/tasks/preview-recipients/route.ts` ✅
  - `/api/tasks/inbox/route.ts` ✅

### 5. **Audit Logging Infrastructure** ✅
- **Table:** `audit_logs` (schema.prisma:454-484)
- **Tracks:** CREATE, UPDATE, DELETE with before/after snapshots
- **Status:** ⚠️ Table exists but NOT automatically populated

### 6. **External Monitoring** ✅
- **Sentry Integration:** `instrumentation.ts` (line 11-18)
- **Server Component Errors:** `onRequestError()` hook (line 31-52)

---

## ❌ Critical Gaps: What's Missing

### 🔴 **GAP #1: Unwrapped API Routes (48% not covered)**

**Unwrapped routes (10 files):**
1. `/api/metrics/aggregate/route.ts`
2. `/api/metrics/store/route.ts`
3. `/api/voter-template/route.ts`
4. `/api/org-tree-export-html/route.ts`
5. `/api/org-tree-deep/route.ts`
6. `/api/analytics/web-vitals/route.ts`
7. `/api/seed/route.ts`
8. `/api/notifications/unread-count/route.ts`
9. `/api/tasks/[taskId]/status/route.ts`
10. `/api/tasks/[taskId]/route.ts`
11. `/api/log-error/route.ts` (intentionally unwrapped - error loop prevention)
12. `/api/activists/voters/[id]/route.ts`
13. `/api/map-data/route.ts`
14. `/api/admin/migrate-schema/route.ts`
15. `/api/push/subscribe/route.ts`
16. `/api/events/live-feed/route.ts`
17. `/api/test-auth/route.ts`
18. `/api/ai/suggest-assignments/route.ts`
19. `/api/ai/parse-task/route.ts`
20. `/api/tasks/suggest-assignments/route.ts`

**Risk:** Errors in these routes will NOT be logged to database.

---

### 🔴 **GAP #2: Server Actions (0% coverage)**

**Files (13 server actions):**
1. `app/actions/cities.ts`
2. `app/actions/neighborhoods.ts`
3. `app/actions/users.ts` ⚠️ **HIGH RISK** (user management)
4. `app/actions/dashboard.ts`
5. `app/actions/activists.ts`
6. `app/actions/activist-coordinator-neighborhoods.ts`
7. `app/actions/wiki.ts`
8. `app/actions/voters.ts` ⚠️ **HIGH RISK** (voter data)
9. `app/actions/auth.ts` ⚠️ **CRITICAL** (authentication)
10. `app/actions/get-voter-duplicates.ts`
11. `app/actions/voters-duplicate-check.ts`
12. `app/actions/areas.ts`
13. `app/actions/invitations.ts`

**Risk:** Server action errors throw to client WITHOUT database logging.

---

### 🔴 **GAP #3: No Automatic Audit Logging**

**Problem:** `audit_logs` table exists but is NOT auto-populated.

**Missing:**
- ❌ No Prisma middleware for auto-logging mutations
- ❌ No audit trail for CREATE/UPDATE/DELETE operations
- ❌ No before/after snapshots

**Impact:** Cannot trace who changed what data when.

---

### 🔴 **GAP #4: No Monitoring Dashboard**

**Missing:**
- ❌ No UI to view `error_logs` table
- ❌ No filtering by level/user/city/date
- ❌ No real-time error alerts
- ❌ No error rate charts

**Impact:** Errors logged but not actionable.

---

## 🎯 Implementation Plan (Prioritized)

### **Phase 1: Complete Error Coverage** (HIGH PRIORITY)

#### Task 1.1: Wrap All API Routes
```bash
# Files to modify (10 unwrapped routes)
app/app/api/metrics/aggregate/route.ts
app/app/api/metrics/store/route.ts
app/app/api/voter-template/route.ts
app/app/api/org-tree-export-html/route.ts
app/app/api/org-tree-deep/route.ts
app/app/api/analytics/web-vitals/route.ts
app/app/api/seed/route.ts
app/app/api/notifications/unread-count/route.ts
app/app/api/tasks/[taskId]/status/route.ts
app/app/api/tasks/[taskId]/route.ts
app/app/api/activists/voters/[id]/route.ts
app/app/api/map-data/route.ts
app/app/api/admin/migrate-schema/route.ts
app/app/api/push/subscribe/route.ts
app/app/api/events/live-feed/route.ts
app/app/api/test-auth/route.ts
app/app/api/ai/suggest-assignments/route.ts
app/app/api/ai/parse-task/route.ts
app/app/api/tasks/suggest-assignments/route.ts
```

**Pattern:**
```typescript
import { withErrorHandler } from '@/lib/error-handler';

export const POST = withErrorHandler(async (req: Request) => {
  // Your logic here
});
```

#### Task 1.2: Wrap All Server Actions
```bash
# Files to modify (13 server actions)
app/app/actions/*.ts
```

**Create:** `lib/server-action-error-handler.ts`
```typescript
import { logger, extractSessionContext } from './logger';
import { auth } from './auth';

export async function withServerActionErrorHandler<T>(
  action: () => Promise<T>,
  actionName: string
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const session = await auth();
    const err = error instanceof Error ? error : new Error(String(error));

    logger.error(`Server action failed: ${actionName}`, err, {
      ...extractSessionContext(session),
      metadata: { actionName },
    });

    throw err; // Re-throw for client handling
  }
}
```

**Usage:**
```typescript
export async function createUser(data: CreateUserInput) {
  return withServerActionErrorHandler(async () => {
    // Your logic here
  }, 'createUser');
}
```

---

### **Phase 2: Audit Logging** (MEDIUM PRIORITY)

#### Task 2.1: Create Audit Logger Utility
**File:** `lib/audit-logger.ts`
```typescript
import { prisma } from './prisma';

export async function logAudit({
  action,
  entity,
  entityId,
  before,
  after,
  userId,
  userEmail,
  userRole,
  cityId,
  ipAddress,
  userAgent,
}: {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  cityId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity,
        entityId,
        before,
        after,
        userId,
        userEmail,
        userRole,
        cityId,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    console.error('[Audit Logger] Failed to log audit:', error);
  }
}
```

#### Task 2.2: Add Audit Calls to Critical Operations
**Example:**
```typescript
// Before
await prisma.user.create({ data: userData });

// After
const newUser = await prisma.user.create({ data: userData });
await logAudit({
  action: 'CREATE',
  entity: 'User',
  entityId: newUser.id,
  after: newUser,
  userId: session.user.id,
  userEmail: session.user.email,
  userRole: session.user.role,
});
```

---

### **Phase 3: Monitoring Dashboard** (LOW PRIORITY)

#### Task 3.1: Create Error Logs Page
**File:** `app/[locale]/(dashboard)/system-logs/error-logs/page.tsx`

**Features:**
- Table view of `error_logs`
- Filters: level, errorType, cityId, date range
- Search: message, userId, userEmail
- Export to CSV

#### Task 3.2: Create Audit Logs Page
**File:** `app/[locale]/(dashboard)/system-logs/audit-logs/page.tsx`

**Features:**
- Table view of `audit_logs`
- Filters: action, entity, userId, cityId, date range
- Diff viewer (before → after)

---

## 📋 Checklist

### Immediate (Do Now)
- [ ] Wrap all 19 unwrapped API routes with `withErrorHandler`
- [ ] Create `lib/server-action-error-handler.ts`
- [ ] Wrap all 13 server actions with error handler

### Short-Term (This Week)
- [ ] Create `lib/audit-logger.ts`
- [ ] Add audit logging to user CRUD operations
- [ ] Add audit logging to activist CRUD operations
- [ ] Add audit logging to voter CRUD operations

### Long-Term (This Month)
- [ ] Build error logs monitoring dashboard
- [ ] Build audit logs monitoring dashboard
- [ ] Add real-time error alerts (Slack/Email)
- [ ] Set up error rate monitoring

---

## 🎨 Error Handling Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   ERROR HANDLING LAYERS                      │
└─────────────────────────────────────────────────────────────┘

Layer 1: Process-Level (Global)
├─ instrumentation.ts → initializeGlobalErrorHandlers()
├─ Catches: uncaughtException, unhandledRejection
└─ Logs: logger.critical() → error_logs table

Layer 2: React Error Boundaries (Client)
├─ app/error.tsx (component errors)
├─ app/global-error.tsx (root layout errors)
└─ Logs: fetch('/api/log-error') → error_logs table

Layer 3: API Routes (Server)
├─ withErrorHandler() wrapper
├─ Catches: all route handler errors
└─ Logs: logger.error/critical/rbacViolation() → error_logs table

Layer 4: Server Actions (Server)
├─ withServerActionErrorHandler() wrapper (TO ADD)
├─ Catches: all server action errors
└─ Logs: logger.error() → error_logs table

Layer 5: Audit Trail (Mutations)
├─ logAudit() utility (TO ADD)
├─ Manual calls on CREATE/UPDATE/DELETE
└─ Logs: audit_logs table
```

---

## 📊 Expected Outcomes

After full implementation:
- ✅ **100% error coverage** (all API routes + server actions wrapped)
- ✅ **100% audit trail** (all mutations logged)
- ✅ **Real-time monitoring** (dashboard for viewing logs)
- ✅ **Zero blind spots** (every error caught and logged)

---

## 🚀 Next Steps

**Ready to implement? Say:**
- "Wrap all API routes" → I'll wrap all 19 unwrapped routes
- "Add server action error handling" → I'll create the wrapper + wrap all 13 actions
- "Add audit logging" → I'll implement audit logger + add to critical operations
- "Create monitoring dashboard" → I'll build the error logs UI

**Or say "do all" to implement everything in sequence.**
