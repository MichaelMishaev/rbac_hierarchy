/**
 * Next.js Instrumentation
 *
 * This file runs BEFORE your Next.js app starts.
 * Perfect for setting up global error handlers.
 *
 * See: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  // Only run on server-side
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { initializeGlobalErrorHandlers } = await import('./lib/global-error-handlers');
    initializeGlobalErrorHandlers();
  }
}
