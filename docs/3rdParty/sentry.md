Configure Next.js SDK

Automatic Configuration (Recommended)
Configure your app automatically by running the Sentry wizard in the root of your project.

npx @sentry/wizard@latest -i nextjs --saas --org none-p36 --project javascript-nextjs
Manual Configuration


Copy DSN
Alternatively, you can also set up the SDK manually, by following the manual setup docs.
If you already have the configuration for Sentry in your application, and just need this project's (javascript-nextjs) DSN, you can find it below:

https://bcc465e1f6a1209026169f58beea81a4@o4510578657460224.ingest.de.sentry.io/4510578748751952

AI Rules for Code Editors (Optional)


Copy Rules
Sentry provides a set of rules you can use to help your LLM use Sentry correctly. Copy this file and add it to your projects rules configuration. When created as a rules file this should be placed alongside other editor specific rule files. For example, if you are using Cursor, place this file in the .cursorrules directory.
Markdown
rules.md

These examples should be used as guidance when configuring Sentry functionality within a project.

# Exception Catching

Use `Sentry.captureException(error)` to capture an exception and log the error in Sentry.
Use this in try catch blocks or areas where exceptions are expected

# Tracing Examples

Spans should be created for meaningful actions within an applications like button clicks, API calls, and function calls
Use the `Sentry.startSpan` function to create a span
Child spans can exist within a parent span

## Custom Span instrumentation in component actions

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
function TestComponent() {
  const handleTestButtonClick = () => {
    // Create a transaction/span to measure performance
    Sentry.startSpan(
      {
        op: "ui.click",
        name: "Test Button Click",
      },
      (span) => {
        const value = "some config";
        const metric = "some metric";

        // Metrics can be added to the span
        span.setAttribute("config", value);
        span.setAttribute("metric", metric);

        doSomething();
      },
    );
  };

  return (
    <button type="button" onClick={handleTestButtonClick}>
      Test Sentry
    </button>
  );
}
```

## Custom span instrumentation in API calls

The `name` and `op` properties should be meaninful for the activities in the call.
Attach attributes based on relevant information and metrics from the request

```javascript
async function fetchUserData(userId) {
  return Sentry.startSpan(
    {
      op: "http.client",
      name: `GET /api/users/${userId}`,
    },
    async () => {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();
      return data;
    },
  );
}
```

# Logs

Where logs are used, ensure Sentry is imported using `import * as Sentry from "@sentry/nextjs"`
Enable logging in Sentry using `Sentry.init({  enableLogs: true })`
Reference the logger using `const { logger } = Sentry`
Sentry offers a consoleLoggingIntegration that can be used to log specific console error types automatically without instrumenting the individual logger calls

## Configuration

In NextJS the client side Sentry initialization is in `instrumentation-client.(js|ts)`, the server initialization is in `sentry.server.config.ts` and the edge initialization is in `sentry.edge.config.ts`
Initialization does not need to be repeated in other files, it only needs to happen the files mentioned above. You should use `import * as Sentry from "@sentry/nextjs"` to reference Sentry functionality

### Baseline

```javascript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://bcc465e1f6a1209026169f58beea81a4@o4510578657460224.ingest.de.sentry.io/4510578748751952",

  enableLogs: true,
});
```

### Logger Integration

```javascript
Sentry.init({
  dsn: "https://bcc465e1f6a1209026169f58beea81a4@o4510578657460224.ingest.de.sentry.io/4510578748751952",
  integrations: [
    // send console.log, console.warn, and console.error calls as logs to Sentry
    Sentry.consoleLoggingIntegration({ levels: ["log", "warn", "error"] }),
  ],
});
```

## Logger Examples

`logger.fmt` is a template literal function that should be used to bring variables into the structured logs.

```javascript
logger.trace("Starting database connection", { database: "users" });
logger.debug(logger.fmt`Cache miss for user: ${userId}`);
logger.info("Updated profile", { profileId: 345 });
logger.warn("Rate limit reached for endpoint", {
  endpoint: "/api/results/",
  isEnterprise: false,
});
logger.error("Failed to process payment", {
  orderId: "order_123",
  amount: 99.99,
});
logger.fatal("Database connection pool exhausted", {
  database: "users",
  activeConnections: 100,
});
```
---

# Production Setup (Railway)

## Step 1: Add Environment Variables to Railway

Go to your Railway project dashboard and add these environment variables:

### Required Variables:
```bash
# Client-side DSN (public, exposed to browser)
NEXT_PUBLIC_SENTRY_DSN=https://bcc465e1f6a1209026169f58beea81a4@o4510578657460224.ingest.de.sentry.io/4510578748751952

# Server-side DSN (private)
SENTRY_DSN=https://bcc465e1f6a1209026169f58beea81a4@o4510578657460224.ingest.de.sentry.io/4510578748751952

# Organization slug
SENTRY_ORG=none-p36

# Project slug
SENTRY_PROJECT=javascript-nextjs

# Auth token for uploading source maps (get from Sentry.io → Settings → Auth Tokens)
SENTRY_AUTH_TOKEN=your-auth-token-here
```

### How to Get SENTRY_AUTH_TOKEN:
1. Go to https://sentry.io/settings/account/api/auth-tokens/
2. Click "Create New Token"
3. Scopes needed: `project:releases`, `project:write`, `org:read`
4. Copy token and paste into Railway

## Step 2: Verify Railway Environment

After adding variables, Railway will automatically redeploy. Verify:
- All 5 variables are set
- No typos in variable names
- `NEXT_PUBLIC_SENTRY_DSN` starts with `NEXT_PUBLIC_`

## Step 3: Our Production Configuration

### Client Config (`sentry.client.config.ts`)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Only 10% of transactions in production (cost optimization)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  environment: process.env.NODE_ENV || 'development',

  // Filter out expected errors
  beforeSend(event, hint) {
    const error = hint.originalException;

    // Don't send validation errors (expected user errors)
    if (error instanceof Error && error.message.includes('Validation error')) {
      return null;
    }

    // Don't send auth errors (expected)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return null;
    }

    return event;
  },

  // Browser tracing + Session Replay
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      maskAllText: true,      // Privacy: mask all text
      blockAllMedia: true,    // Privacy: block images/videos
    }),
  ],

  // Only record 10% of sessions
  replaysSessionSampleRate: 0.1,

  // Record 100% of sessions with errors
  replaysOnErrorSampleRate: 1.0,
});
```

### Server Config (`sentry.server.config.ts`)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',

  beforeSend(event, hint) {
    const error = hint.originalException;

    if (error instanceof Error && error.message.includes('Validation error')) {
      return null;
    }

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return null;
    }

    // Don't send RBAC permission denials (expected)
    if (error instanceof Error && error.message.includes('Access denied')) {
      return null;
    }

    return event;
  },

  integrations: [
    Sentry.prismaIntegration(),  // Track database queries
  ],
});
```

### Edge Config (`sentry.edge.config.ts`)
```typescript
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  enabled: process.env.NODE_ENV === 'production',
  environment: process.env.NODE_ENV || 'development',
});
```

## Step 4: Verify Sentry is Working

### Option A: Check Railway Logs
After deployment, check Railway logs for:
```
✓ Sentry initialized successfully
```

### Option B: Trigger Test Error in Production
1. Open browser console on production site
2. Run: `throw new Error("Sentry test error")`
3. Go to https://sentry.io/organizations/none-p36/issues/
4. You should see the error appear within 1-2 minutes

### Option C: Use Sentry CLI (Local)
```bash
npx @sentry/wizard@latest verify
```

## Cost Optimization Explained

Our configuration is optimized for cost:

| Setting | Value | Why |
|---------|-------|-----|
| `tracesSampleRate` | 0.1 (10%) | Only track 10% of transactions in prod |
| `replaysSessionSampleRate` | 0.1 (10%) | Only record 10% of normal sessions |
| `replaysOnErrorSampleRate` | 1.0 (100%) | Record ALL sessions with errors |
| `enabled` | production only | No Sentry overhead in dev |
| `beforeSend` filters | Validation/Auth/RBAC | Don't send expected errors |

**Estimated monthly cost:** Free tier covers ~5,000 errors/month

## Troubleshooting

### Sentry not capturing errors?
1. Check Railway environment variables are set
2. Verify `NODE_ENV=production` in Railway
3. Check Sentry.io project quota hasn't been exceeded
4. Look for `enabled: false` in logs

### Source maps not uploading?
1. Verify `SENTRY_AUTH_TOKEN` has correct scopes
2. Check Railway build logs for "Uploading source maps..."
3. Ensure `SENTRY_ORG` and `SENTRY_PROJECT` match exactly

### Too many errors being sent?
1. Add more filters to `beforeSend`
2. Reduce `tracesSampleRate` to 0.05 (5%)
3. Check if error is real bug vs expected behavior

---

# Original Verification (Development)

Start your development server and visit /sentry-example-page if you have set it up. Click the button to trigger a test error.
Or, trigger a sample error by calling a function that does not exist somewhere in your application.
JavaScript

myUndefinedFunction();
