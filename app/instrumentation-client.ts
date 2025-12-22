import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

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

    return event;
  },

  // Configure breadcrumbs
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({
      // Mask all text content for privacy
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],

  // Session Replay sample rate - only record 10% of sessions in production
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0,

  // If the entire session is not sampled, use the below sample rate to sample
  // sessions when an error occurs.
  replaysOnErrorSampleRate: 1.0,
});

/**
 * Export navigation tracking hook for Sentry
 * Required for App Router navigation instrumentation
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
