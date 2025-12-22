/**
 * Next.js Instrumentation
 *
 * This file runs BEFORE your Next.js app starts.
 * Perfect for setting up global error handlers.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Initialize Sentry first
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }

  // Then initialize global error handlers
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeGlobalErrorHandlers } = await import('./lib/global-error-handlers');
    initializeGlobalErrorHandlers();
  }
}
