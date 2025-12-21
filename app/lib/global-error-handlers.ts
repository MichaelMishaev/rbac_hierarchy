/**
 * Global Error Handlers - Catches ALL unhandled errors
 *
 * This file sets up process-level error handlers that catch:
 * - Unhandled Promise rejections
 * - Uncaught exceptions
 * - Process warnings
 *
 * Import this ONCE in your app entry point (instrumentation.ts or next.config.js)
 */

import { logger } from './logger';

let isInitialized = false;

export function initializeGlobalErrorHandlers() {
  // Prevent double initialization
  if (isInitialized) {
    console.log('[Global Error Handlers] Already initialized, skipping...');
    return;
  }

  console.log('[Global Error Handlers] Initializing...');

  // 1. Catch unhandled promise rejections
  process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
    const error = reason instanceof Error ? reason : new Error(String(reason));

    logger.critical('Unhandled Promise Rejection', error, {
      metadata: {
        promiseDetails: String(promise),
        reason: String(reason),
        source: 'unhandledRejection',
      },
    });

    console.error('UNHANDLED PROMISE REJECTION:', error);
  });

  // 2. Catch uncaught exceptions
  process.on('uncaughtException', (error: Error, origin: string) => {
    logger.critical('Uncaught Exception', error, {
      metadata: {
        origin,
        source: 'uncaughtException',
      },
    });

    console.error('UNCAUGHT EXCEPTION:', error);

    // In production, you might want to gracefully shutdown
    // For now, just log and continue
  });

  // 3. Catch process warnings (memory leaks, deprecated APIs, etc.)
  process.on('warning', (warning: Error) => {
    logger.warn('Process Warning', {
      metadata: {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        source: 'processWarning',
      },
    });

    console.warn('PROCESS WARNING:', warning);
  });

  // 4. Catch SIGTERM/SIGINT for graceful shutdown logging
  const shutdownHandler = (signal: string) => {
    logger.info(`Process received ${signal}, shutting down gracefully`, {
      metadata: { signal, persistToDb: true },
    });

    console.log(`[Global Error Handlers] Received ${signal}, shutting down...`);

    // Give time for final logs to persist
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  };

  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));

  isInitialized = true;
  console.log('[Global Error Handlers] ✅ Initialized successfully');
}

/**
 * Cleanup function (optional, for testing)
 */
export function cleanupGlobalErrorHandlers() {
  process.removeAllListeners('unhandledRejection');
  process.removeAllListeners('uncaughtException');
  process.removeAllListeners('warning');
  process.removeAllListeners('SIGTERM');
  process.removeAllListeners('SIGINT');

  isInitialized = false;
  console.log('[Global Error Handlers] Cleaned up');
}
