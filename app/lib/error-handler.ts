/**
 * Global Error Handler for API Routes
 *
 * Usage in API routes:
 *
 * import { withErrorHandler } from '@/lib/error-handler';
 *
 * export const POST = withErrorHandler(async (req: Request) => {
 *   // Your route logic here
 *   return Response.json({ success: true });
 * });
 */

import { NextResponse } from 'next/server';
import { logger, extractRequestContext } from './logger';
import { Prisma } from '@prisma/client';

// Known error types
class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// Export error classes for use in API routes
export { ValidationError, UnauthorizedError, ForbiddenError, NotFoundError };

/**
 * Map error to HTTP status code
 */
function getHttpStatus(error: Error): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof UnauthorizedError) return 401;
  if (error instanceof ForbiddenError) return 403;
  if (error instanceof NotFoundError) return 404;

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 409; // Unique constraint violation
    if (error.code === 'P2025') return 404; // Record not found
    return 400;
  }

  return 500; // Internal server error
}

/**
 * Get user-friendly error message
 */
function getUserMessage(error: Error): string {
  // Don't expose internal errors to users
  if (error instanceof ValidationError) return error.message;
  if (error instanceof UnauthorizedError) return 'נדרשת הזדהות';
  if (error instanceof ForbiddenError) return 'אין לך הרשאה לבצע פעולה זו';
  if (error instanceof NotFoundError) return 'המשאב לא נמצא';

  // Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') return 'הערך כבר קיים במערכת';
    if (error.code === 'P2025') return 'הרשומה לא נמצאה';
  }

  // Generic error message (don't expose stack traces)
  return 'אירעה שגיאה בשרת. אנא נסה שוב מאוחר יותר';
}

/**
 * Wrap API route handler with error handling
 * Next.js 15 compatible - supports both static and dynamic routes
 */
// Overload 1: Static routes (no context)
export function withErrorHandler(
  handler: (req: Request) => Promise<Response>
): (req: Request) => Promise<Response>;

// Overload 2: Dynamic routes (with context)
export function withErrorHandler<T>(
  handler: (req: Request, context: T) => Promise<Response>
): (req: Request, context: T) => Promise<Response>;

// Implementation
export function withErrorHandler<T = any>(
  handler: (req: Request, context?: T) => Promise<Response>
) {
  return async (req: Request, context?: T): Promise<Response> => {
    try {
      return await handler(req, context as T);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      const httpStatus = getHttpStatus(err);
      const userMessage = getUserMessage(err);

      // Extract request context
      const requestContext = await extractRequestContext(req);

      // Log to database
      if (httpStatus >= 500) {
        // Critical errors (500+)
        logger.critical('API route error', err, {
          ...requestContext,
          httpStatus,
        });
      } else if (httpStatus === 403) {
        // RBAC violations
        logger.rbacViolation(err.message, {
          ...requestContext,
          httpStatus,
        });
      } else if (httpStatus === 401) {
        // Auth failures
        logger.authFailure(err.message, {
          ...requestContext,
          httpStatus,
        });
      } else {
        // Other errors
        logger.error('API route error', err, {
          ...requestContext,
          httpStatus,
        });
      }

      // Return error response
      return NextResponse.json(
        {
          error: userMessage,
          code: err.name,
          timestamp: new Date().toISOString(),
        },
        { status: httpStatus }
      );
    }
  };
}

/**
 * Async error wrapper for Server Actions
 *
 * Usage:
 *
 * import { handleServerAction } from '@/lib/error-handler';
 *
 * export async function myAction() {
 *   return handleServerAction(async () => {
 *     // Your action logic
 *     return { success: true };
 *   });
 * }
 */
export async function handleServerAction<T>(
  action: () => Promise<T>
): Promise<T> {
  try {
    return await action();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));

    // Log to database
    logger.error('Server action error', err);

    // Re-throw with user-friendly message
    throw new Error(getUserMessage(err));
  }
}
