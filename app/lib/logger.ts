/**
 * Production Logger with Database Persistence
 *
 * Features:
 * - Automatic error logging to database (ErrorLog table)
 * - Console logging for development
 * - User context extraction (from session/request)
 * - RBAC violation tracking
 * - Performance: async DB writes (non-blocking)
 * - Sanitization: removes sensitive data from stack traces
 */

import { prisma } from './prisma';
import { ErrorLevel } from '@prisma/client';

// Environment detection
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = process.env.NODE_ENV === 'production';

// Types
export interface LogContext {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  cityId?: string;
  httpMethod?: string;
  httpStatus?: number;
  url?: string;
  referer?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
  metadata?: Record<string, unknown>;
}

export interface ErrorLogData extends LogContext {
  errorType: string;
  message: string;
  stack?: string;
  code?: string;
  level?: ErrorLevel;
}

// Sanitize sensitive data from stack traces
function sanitizeStack(stack?: string): string | undefined {
  if (!stack) return undefined;

  return stack
    .replace(/password['":][\s]*['"][^'"]*['"]/gi, 'password:"[REDACTED]"')
    .replace(/token['":][\s]*['"][^'"]*['"]/gi, 'token:"[REDACTED]"')
    .replace(/apiKey['":][\s]*['"][^'"]*['"]/gi, 'apiKey:"[REDACTED]"')
    .replace(/secret['":][\s]*['"][^'"]*['"]/gi, 'secret:"[REDACTED]"')
    .replace(/authorization:\s*['"][^'"]*['"]/gi, 'authorization:"[REDACTED]"')
    .replace(/cookie:\s*['"][^'"]*['"]/gi, 'cookie:"[REDACTED]"');
}

// Sanitize metadata
function sanitizeMetadata(metadata?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!metadata) return undefined;

  const sanitized = { ...metadata };
  const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'authorization', 'cookie'];

  for (const key of sensitiveKeys) {
    if (key in sanitized) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

// Write error to database (async, non-blocking)
async function persistErrorToDb(data: ErrorLogData): Promise<void> {
  try {
    await prisma.errorLog.create({
      data: {
        level: data.level || ErrorLevel.ERROR,
        errorType: data.errorType,
        message: data.message.substring(0, 5000), // Limit message length
        stack: sanitizeStack(data.stack)?.substring(0, 10000), // Limit stack trace
        code: data.code,
        httpMethod: data.httpMethod,
        httpStatus: data.httpStatus,
        url: data.url?.substring(0, 2000),
        referer: data.referer?.substring(0, 2000),
        userId: data.userId,
        userEmail: data.userEmail,
        userRole: data.userRole,
        cityId: data.cityId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent?.substring(0, 500),
        requestId: data.requestId,
        metadata: sanitizeMetadata(data.metadata) as Record<string, unknown> | undefined,
        environment: process.env.NODE_ENV || 'production',
      },
    });
  } catch (dbError) {
    // Fallback: log to console if DB write fails
    console.error('[LOGGER] Failed to persist error to database:', dbError);
    console.error('[LOGGER] Original error:', data);
  }
}

// Main logger object
export const logger = {
  /**
   * Log informational message
   */
  info: (message: string, context?: LogContext) => {
    console.log(`[INFO] ${message}`, context || '');

    // Don't persist INFO logs to DB in production (too verbose)
    // Only persist if explicitly requested
    if (context?.metadata?.persistToDb) {
      persistErrorToDb({
        errorType: 'Info',
        message,
        level: ErrorLevel.INFO,
        ...context,
      }).catch(console.error);
    }
  },

  /**
   * Log warning message
   */
  warn: (message: string, context?: LogContext) => {
    console.warn(`[WARN] ${message}`, context || '');

    // Persist warnings in production
    if (isProduction) {
      persistErrorToDb({
        errorType: 'Warning',
        message,
        level: ErrorLevel.WARN,
        ...context,
      }).catch(console.error);
    }
  },

  /**
   * Log error message
   */
  error: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorObj = error instanceof Error ? error : undefined;

    console.error(`[ERROR] ${message}`, {
      error: errorObj?.message,
      stack: errorObj?.stack,
      ...context,
    });

    // Always persist errors to DB
    persistErrorToDb({
      errorType: errorObj?.constructor?.name || 'Error',
      message,
      stack: errorObj?.stack,
      level: ErrorLevel.ERROR,
      ...context,
    }).catch(console.error);
  },

  /**
   * Log critical error (system-level, requires immediate attention)
   */
  critical: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorObj = error instanceof Error ? error : undefined;

    console.error(`[CRITICAL] ${message}`, {
      error: errorObj?.message,
      stack: errorObj?.stack,
      ...context,
    });

    // Always persist critical errors
    persistErrorToDb({
      errorType: errorObj?.constructor?.name || 'CriticalError',
      message,
      stack: errorObj?.stack,
      level: ErrorLevel.CRITICAL,
      ...context,
    }).catch(console.error);

    // TODO: Send alert to Slack/email for critical errors
  },

  /**
   * Log RBAC violation (security-critical)
   */
  rbacViolation: (message: string, context: LogContext) => {
    console.error(`[RBAC VIOLATION] ${message}`, context);

    persistErrorToDb({
      errorType: 'RBACViolation',
      message,
      code: 'ERR_RBAC_VIOLATION',
      level: ErrorLevel.CRITICAL,
      httpStatus: 403,
      ...context,
    }).catch(console.error);
  },

  /**
   * Log authentication failure
   */
  authFailure: (message: string, context: LogContext) => {
    console.error(`[AUTH FAILURE] ${message}`, context);

    persistErrorToDb({
      errorType: 'AuthFailure',
      message,
      code: 'ERR_AUTH_FAILURE',
      level: ErrorLevel.ERROR,
      httpStatus: 401,
      ...context,
    }).catch(console.error);
  },

  /**
   * Log database error
   */
  dbError: (message: string, error: Error, context?: LogContext) => {
    console.error(`[DB ERROR] ${message}`, {
      error: error.message,
      stack: error.stack,
      ...context,
    });

    persistErrorToDb({
      errorType: 'DatabaseError',
      message,
      stack: error.stack,
      code: 'ERR_DATABASE',
      level: ErrorLevel.CRITICAL,
      ...context,
    }).catch(console.error);
  },

  /**
   * Log API error (for external API calls)
   */
  apiError: (message: string, error?: Error | unknown, context?: LogContext) => {
    const errorObj = error instanceof Error ? error : undefined;

    console.error(`[API ERROR] ${message}`, {
      error: errorObj?.message,
      stack: errorObj?.stack,
      ...context,
    });

    persistErrorToDb({
      errorType: 'APIError',
      message,
      stack: errorObj?.stack,
      code: 'ERR_EXTERNAL_API',
      level: ErrorLevel.ERROR,
      ...context,
    }).catch(console.error);
  },

  /**
   * Debug logging (only in development)
   */
  debug: (message: string, context?: LogContext) => {
    if (isDevelopment) {
      console.log(`[DEBUG] ${message}`, context || '');
    }
  },
};

/**
 * Extract user context from Next.js request
 * Usage in API routes:
 *
 * import { logger, extractRequestContext } from '@/lib/logger';
 *
 * export async function POST(req: Request) {
 *   const context = await extractRequestContext(req);
 *   logger.error('Something failed', error, context);
 * }
 */
export async function extractRequestContext(req: Request): Promise<LogContext> {
  const url = new URL(req.url);

  return {
    httpMethod: req.method,
    url: url.pathname + url.search,
    referer: req.headers.get('referer') || undefined,
    ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
    userAgent: req.headers.get('user-agent') || undefined,
    requestId: req.headers.get('x-request-id') || crypto.randomUUID(),
  };
}

/**
 * Extract user context from session (NextAuth)
 * Usage in Server Actions:
 *
 * import { auth } from '@/lib/auth';
 * import { logger, extractSessionContext } from '@/lib/logger';
 *
 * export async function myAction() {
 *   const session = await auth();
 *   const context = extractSessionContext(session);
 *   logger.error('Action failed', error, context);
 * }
 */
export function extractSessionContext(session: { user?: { id?: string; email?: string; role?: string; cityId?: string } } | null): LogContext {
  if (!session?.user) return {};

  return {
    userId: session.user.id,
    userEmail: session.user.email,
    userRole: session.user.role,
    cityId: session.user.cityId,
  };
}
