'use client';

/**
 * Global Error Tracking Provider
 *
 * Initializes comprehensive error tracking on mount
 * Captures all unhandled errors and sends detailed context
 */

import { useEffect } from 'react';
import { errorTracker } from '@/app/lib/error-tracker';

export function ErrorTrackingProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Global error handler
    const handleError = (event: ErrorEvent) => {
      event.preventDefault();

      const error = new Error(event.message);
      error.stack = event.error?.stack;

      errorTracker?.sendError(error, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'unhandledError',
      });
    };

    // Global unhandled rejection handler
    const handleRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault();

      const error = event.reason instanceof Error
        ? event.reason
        : new Error(String(event.reason));

      errorTracker?.sendError(error, {
        type: 'unhandledRejection',
        promise: event.promise,
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  return <>{children}</>;
}
