# Production Logger - Usage Examples

## Overview

The production logger automatically saves errors to the `error_logs` database table while also logging to the console. All sensitive data (passwords, tokens, etc.) is automatically sanitized.

---

## 1. API Routes

### Basic Error Logging
```typescript
// app/api/example/route.ts
import { NextResponse } from 'next/server';
import { logger, extractRequestContext } from '@/lib/logger';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Your logic here
    const result = await processData(body);

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const context = await extractRequestContext(req);

    // This will log to both console AND database
    logger.error('Failed to process data', error as Error, context);

    return NextResponse.json(
      { error: 'שגיאה בעיבוד הנתונים' },
      { status: 500 }
    );
  }
}
```

### Using Error Handler Wrapper (Recommended)
```typescript
// app/api/example/route.ts
import { withErrorHandler } from '@/lib/error-handler';

export const POST = withErrorHandler(async (req: Request) => {
  const body = await req.json();

  // Your logic here - errors are automatically caught and logged
  const result = await processData(body);

  return Response.json({ success: true, data: result });
});

// Errors are automatically:
// - Logged to database with full context
// - Sanitized for user display
// - Returned with appropriate HTTP status
```

---

## 2. Server Actions

### Basic Usage
```typescript
'use server';

import { auth } from '@/lib/auth';
import { logger, extractSessionContext } from '@/lib/logger';

export async function myAction(data: FormData) {
  try {
    const session = await auth();

    // Your logic here
    const result = await processAction(data);

    return { success: true, result };
  } catch (error) {
    const context = extractSessionContext(session);

    logger.error('Action failed', error as Error, context);

    throw new Error('שגיאה בביצוע הפעולה');
  }
}
```

### Using Error Handler Wrapper
```typescript
'use server';

import { handleServerAction } from '@/lib/error-handler';
import { auth } from '@/lib/auth';

export async function myAction(data: FormData) {
  return handleServerAction(async () => {
    const session = await auth();

    // Your logic - errors automatically caught and logged
    const result = await processAction(data);

    return { success: true, result };
  });
}
```

---

## 3. Specific Error Types

### RBAC Violations
```typescript
import { logger, extractRequestContext } from '@/lib/logger';
import { auth } from '@/lib/auth';

export async function GET(req: Request) {
  const session = await auth();

  if (!session?.user) {
    const context = await extractRequestContext(req);
    logger.authFailure('Unauthenticated access attempt', context);

    return NextResponse.json({ error: 'נדרשת הזדהות' }, { status: 401 });
  }

  // Check city access
  const cityId = req.nextUrl.searchParams.get('cityId');
  if (session.user.role !== 'SUPERADMIN' && session.user.cityId !== cityId) {
    const context = await extractRequestContext(req);
    logger.rbacViolation(
      `User ${session.user.email} attempted to access city ${cityId}`,
      {
        ...context,
        userId: session.user.id,
        userEmail: session.user.email,
        userRole: session.user.role,
        cityId: session.user.cityId,
        metadata: { attemptedCityId: cityId },
      }
    );

    return NextResponse.json({ error: 'אין לך הרשאה' }, { status: 403 });
  }

  // Continue with authorized logic...
}
```

### Database Errors
```typescript
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/prisma';

export async function createUser(data: any) {
  try {
    const user = await prisma.user.create({ data });
    return user;
  } catch (error) {
    if (error instanceof Error) {
      logger.dbError('Failed to create user', error, {
        metadata: {
          email: data.email,
          role: data.role
        },
      });
    }
    throw error;
  }
}
```

### API/External Service Errors
```typescript
import { logger } from '@/lib/logger';

export async function fetchExternalData(url: string) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    logger.apiError('External API call failed', error as Error, {
      metadata: {
        url,
        service: 'ExternalService'
      },
    });
    throw error;
  }
}
```

---

## 4. Different Log Levels

### Critical Errors (System-Level)
```typescript
logger.critical('Database connection pool exhausted', error, {
  metadata: {
    poolSize: 10,
    activeConnections: 10
  },
});
// → Logged to DB with level: CRITICAL
// → TODO: Send alert to Slack/email
```

### Regular Errors
```typescript
logger.error('User upload failed', error, {
  userId: session.user.id,
  metadata: {
    fileName: file.name,
    fileSize: file.size
  },
});
// → Logged to DB with level: ERROR
```

### Warnings (Potential Issues)
```typescript
logger.warn('Approaching rate limit', {
  userId: session.user.id,
  metadata: {
    requestCount: 95,
    limit: 100
  },
});
// → Logged to DB with level: WARN (only in production)
```

### Info (Optional Logging)
```typescript
logger.info('User exported data', {
  userId: session.user.id,
  metadata: {
    recordCount: 1000,
    persistToDb: true // Must be explicitly requested
  },
});
// → Logged to DB only if metadata.persistToDb = true
```

### Debug (Development Only)
```typescript
logger.debug('Cache hit', {
  metadata: {
    key: 'user:123',
    ttl: 3600
  },
});
// → Only logs to console in development
// → Never logged to DB
```

---

## 5. Context Enrichment

### Add User Context
```typescript
import { auth } from '@/lib/auth';
import { logger, extractSessionContext } from '@/lib/logger';

const session = await auth();
const context = extractSessionContext(session);

logger.error('Operation failed', error, {
  ...context, // Adds: userId, userEmail, userRole, cityId
  metadata: {
    operation: 'bulkDelete',
    recordCount: 50
  },
});
```

### Add HTTP Context
```typescript
import { logger, extractRequestContext } from '@/lib/logger';

const context = await extractRequestContext(req);

logger.error('Request failed', error, {
  ...context, // Adds: httpMethod, url, referer, ipAddress, userAgent, requestId
  httpStatus: 500,
});
```

### Full Context (API Route)
```typescript
import { auth } from '@/lib/auth';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

const session = await auth();
const requestContext = await extractRequestContext(req);
const sessionContext = extractSessionContext(session);

logger.error('Complete error context', error, {
  ...requestContext,
  ...sessionContext,
  httpStatus: 500,
  metadata: {
    customField: 'value'
  },
});
```

---

## 6. Custom Error Types

### Using Built-in Error Classes
```typescript
import {
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError
} from '@/lib/error-handler';

// ValidationError → 400
if (!email || !password) {
  throw new ValidationError('חובה למלא דוא"ל וסיסמה');
}

// UnauthorizedError → 401
if (!session) {
  throw new UnauthorizedError('נדרשת הזדהות');
}

// ForbiddenError → 403
if (session.user.cityId !== cityId) {
  throw new ForbiddenError('אין לך הרשאה לגשת לעיר זו');
}

// NotFoundError → 404
if (!user) {
  throw new NotFoundError('המשתמש לא נמצא');
}
```

---

## 7. Real-World Examples

### Example 1: Voter Upload with Error Tracking
```typescript
// app/api/voters/upload/route.ts
import { withErrorHandler } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

export const POST = withErrorHandler(async (req: Request) => {
  const session = await auth();
  if (!session) {
    throw new UnauthorizedError('נדרשת הזדהות');
  }

  const formData = await req.formData();
  const file = formData.get('file') as File;

  if (!file) {
    throw new ValidationError('חובה להעלות קובץ');
  }

  try {
    const voters = await parseExcelFile(file);
    const created = await bulkCreateVoters(voters, session.user.id);

    // Optional: Log success
    logger.info('Voters uploaded successfully', {
      ...extractSessionContext(session),
      metadata: {
        count: created.length,
        persistToDb: true
      },
    });

    return Response.json({ success: true, count: created.length });
  } catch (error) {
    // Error automatically logged by withErrorHandler
    throw error;
  }
});
```

### Example 2: Authentication Failure Tracking
```typescript
// app/api/auth/login/route.ts
import { withErrorHandler } from '@/lib/error-handler';
import { logger, extractRequestContext } from '@/lib/logger';
import { verifyPassword } from '@/lib/auth';

export const POST = withErrorHandler(async (req: Request) => {
  const { email, password } = await req.json();
  const context = await extractRequestContext(req);

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !await verifyPassword(password, user.passwordHash)) {
    // Track failed login attempts
    logger.authFailure('Invalid credentials', {
      ...context,
      userEmail: email,
      metadata: { reason: 'invalid_credentials' },
    });

    return Response.json(
      { error: 'דוא"ל או סיסמה שגויים' },
      { status: 401 }
    );
  }

  // Continue with successful login...
});
```

### Example 3: RBAC Enforcement with Logging
```typescript
// app/api/cities/[id]/route.ts
import { withErrorHandler } from '@/lib/error-handler';
import { auth } from '@/lib/auth';
import { logger, extractSessionContext } from '@/lib/logger';

export const DELETE = withErrorHandler(async (
  req: Request,
  { params }: { params: { id: string } }
) => {
  const session = await auth();
  const context = extractSessionContext(session);

  // Only SuperAdmin can delete cities
  if (session.user.role !== 'SUPERADMIN') {
    logger.rbacViolation(
      `User attempted to delete city`,
      {
        ...context,
        metadata: {
          attemptedAction: 'DELETE',
          targetCityId: params.id
        },
      }
    );

    throw new ForbiddenError('רק מנהל מערכת יכול למחוק עיר');
  }

  await prisma.city.delete({ where: { id: params.id } });

  return Response.json({ success: true });
});
```

---

## 8. Monitoring & Alerts (Future)

### TODO: Slack Integration
```typescript
// lib/logger.ts (line 185)
// TODO: Send alert to Slack/email for critical errors
if (level === ErrorLevel.CRITICAL) {
  await sendSlackAlert({
    message,
    error: errorObj,
    context,
  });
}
```

### TODO: Automated Cleanup
```bash
# Run monthly via cron
0 0 1 * * cd /path/to/app && npx tsx scripts/cleanup-old-error-logs.ts
```

---

## Best Practices

1. **Always use `withErrorHandler` for API routes** - Automatic error logging
2. **Always use `handleServerAction` for Server Actions** - Consistent error handling
3. **Use specific log levels** - `critical` for system issues, `error` for user-facing errors
4. **Add metadata** - Include relevant context (user, city, operation details)
5. **Don't log sensitive data** - Sanitization is automatic, but avoid logging passwords/tokens
6. **Use custom error classes** - `ValidationError`, `UnauthorizedError`, etc.
7. **Check logs regularly** - See `/docs/prod/logInvestigateProd.md` for investigation queries

---

## Common Mistakes to Avoid

❌ **Don't log errors twice**
```typescript
// BAD: Error logged by withErrorHandler AND manually
export const POST = withErrorHandler(async (req: Request) => {
  try {
    // ...
  } catch (error) {
    logger.error('Failed', error); // ❌ Duplicate log
    throw error;
  }
});
```

✅ **Let withErrorHandler handle it**
```typescript
// GOOD: Error logged once by withErrorHandler
export const POST = withErrorHandler(async (req: Request) => {
  // Logic here - errors auto-logged
  await doSomething();
});
```

❌ **Don't expose stack traces to users**
```typescript
// BAD: Exposes internal details
return Response.json({ error: error.stack }, { status: 500 });
```

✅ **Use user-friendly messages**
```typescript
// GOOD: Generic message (stack trace in logs only)
logger.error('Operation failed', error);
return Response.json({ error: 'אירעה שגיאה' }, { status: 500 });
```

---

## Summary

- **API Routes**: Use `withErrorHandler` wrapper
- **Server Actions**: Use `handleServerAction` wrapper
- **Specific Errors**: Use `logger.rbacViolation`, `logger.authFailure`, etc.
- **Context**: Always add user/request context
- **Investigation**: See `/docs/prod/logInvestigateProd.md`
