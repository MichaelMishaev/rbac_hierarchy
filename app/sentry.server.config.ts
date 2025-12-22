import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,

  environment: process.env.NODE_ENV || 'development',

  // Only enable in production
  enabled: process.env.NODE_ENV === 'production',

  // Configure error filtering
  beforeSend(event, hint) {
    // Filter out expected errors
    const error = hint.originalException;

    // Don't send validation errors to Sentry (expected user errors)
    if (error instanceof Error && error.message.includes('Validation error')) {
      return null;
    }

    // Don't send 401/403 auth errors (expected)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return null;
    }

    // Don't send RBAC permission denials (expected)
    if (error instanceof Error && error.message.includes('Access denied')) {
      return null;
    }

    return event;
  },

  // Configure integrations
  integrations: [
    // Add Prisma instrumentation
    Sentry.prismaIntegration(),
  ],
});
