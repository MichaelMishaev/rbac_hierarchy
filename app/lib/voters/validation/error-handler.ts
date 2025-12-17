/**
 * Error Handling for Voter System
 *
 * SOLID Principles:
 * - Single Responsibility: Only handles error transformation and logging
 * - Open/Closed: Can add new error types without modifying existing code
 */

import { z } from 'zod';
import { InvariantViolationError } from '../core/invariants';
import { formatZodErrors, getFirstErrorMessage } from './schemas';

/**
 * Standard error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  errorCode?: string;
  details?: Record<string, unknown>;
  fieldErrors?: Record<string, string>;
}

/**
 * Standard success response structure
 */
export interface SuccessResponse<T> {
  success: true;
  data: T;
}

/**
 * Union type for all responses
 */
export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

/**
 * Error types for voter operations
 */
export enum VoterErrorCode {
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_PHONE = 'INVALID_PHONE',
  INVALID_ID_NUMBER = 'INVALID_ID_NUMBER',

  // Business logic errors
  INVARIANT_VIOLATION = 'INVARIANT_VIOLATION',
  VOTER_NOT_FOUND = 'VOTER_NOT_FOUND',
  DUPLICATE_PHONE = 'DUPLICATE_PHONE',

  // Permission errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  VISIBILITY_DENIED = 'VISIBILITY_DENIED',

  // System errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Hebrew error messages for each error code
 */
const ERROR_MESSAGES: Record<VoterErrorCode, string> = {
  [VoterErrorCode.VALIDATION_ERROR]: 'שגיאת אימות נתונים',
  [VoterErrorCode.INVALID_PHONE]: 'מספר טלפון לא תקין',
  [VoterErrorCode.INVALID_ID_NUMBER]: 'תעודת זהות לא תקינה',
  [VoterErrorCode.INVARIANT_VIOLATION]: 'הפרת כללי מערכת',
  [VoterErrorCode.VOTER_NOT_FOUND]: 'בוחר לא נמצא',
  [VoterErrorCode.DUPLICATE_PHONE]: 'מספר טלפון קיים במערכת',
  [VoterErrorCode.UNAUTHORIZED]: 'אינך מחובר למערכת',
  [VoterErrorCode.FORBIDDEN]: 'אין לך הרשאה לפעולה זו',
  [VoterErrorCode.VISIBILITY_DENIED]: 'אין לך הרשאה לצפות בבוחר זה',
  [VoterErrorCode.DATABASE_ERROR]: 'שגיאת מסד נתונים',
  [VoterErrorCode.UNKNOWN_ERROR]: 'שגיאה לא ידועה',
};

/**
 * Create error response with proper structure
 */
export function createErrorResponse(
  errorCode: VoterErrorCode,
  customMessage?: string,
  details?: Record<string, unknown>
): ErrorResponse {
  return {
    success: false,
    error: customMessage || ERROR_MESSAGES[errorCode],
    errorCode,
    details,
  };
}

/**
 * Create success response with proper structure
 */
export function createSuccessResponse<T>(data: T): SuccessResponse<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Handle Zod validation errors
 */
export function handleZodError(error: z.ZodError): ErrorResponse {
  return {
    success: false,
    error: getFirstErrorMessage(error),
    errorCode: VoterErrorCode.VALIDATION_ERROR,
    fieldErrors: formatZodErrors(error),
  };
}

/**
 * Handle invariant violation errors
 */
export function handleInvariantError(error: InvariantViolationError): ErrorResponse {
  return {
    success: false,
    error: error.message,
    errorCode: VoterErrorCode.INVARIANT_VIOLATION,
    details: error.details,
  };
}

/**
 * Handle database errors
 */
export function handleDatabaseError(error: Error): ErrorResponse {
  // Log the full error for debugging
  console.error('[Database Error]', error);

  // Don't expose internal database errors to users
  return {
    success: false,
    error: ERROR_MESSAGES[VoterErrorCode.DATABASE_ERROR],
    errorCode: VoterErrorCode.DATABASE_ERROR,
    details: process.env.NODE_ENV === 'development' ? { message: error.message } : undefined,
  };
}

/**
 * Master error handler that routes to specific handlers
 */
export function handleError(error: unknown): ErrorResponse {
  // Zod validation error
  if (error instanceof z.ZodError) {
    return handleZodError(error);
  }

  // Invariant violation error
  if (error instanceof InvariantViolationError) {
    return handleInvariantError(error);
  }

  // Standard Error
  if (error instanceof Error) {
    // Check for common error patterns
    if (error.message.includes('not found')) {
      return createErrorResponse(VoterErrorCode.VOTER_NOT_FOUND, error.message);
    }

    if (error.message.includes('Unauthorized')) {
      return createErrorResponse(VoterErrorCode.UNAUTHORIZED, error.message);
    }

    if (error.message.includes('Forbidden') || error.message.includes('permission')) {
      return createErrorResponse(VoterErrorCode.FORBIDDEN, error.message);
    }

    // Database errors (Prisma)
    if (error.name === 'PrismaClientKnownRequestError') {
      return handleDatabaseError(error);
    }

    // Generic error
    console.error('[Voter System Error]', error);
    return createErrorResponse(
      VoterErrorCode.UNKNOWN_ERROR,
      process.env.NODE_ENV === 'development' ? error.message : undefined
    );
  }

  // Unknown error type
  console.error('[Unknown Error]', error);
  return createErrorResponse(VoterErrorCode.UNKNOWN_ERROR);
}

/**
 * Wrapper for server actions that handles errors automatically
 */
export async function withErrorHandling<T>(
  fn: () => Promise<T>
): Promise<ApiResponse<T>> {
  try {
    const result = await fn();
    return createSuccessResponse(result);
  } catch (error) {
    return handleError(error);
  }
}

/**
 * Assert that user is authenticated (throws if not)
 */
export function assertAuthenticated(userId: string | undefined): asserts userId is string {
  if (!userId) {
    throw new Error('Unauthorized: No active session');
  }
}

/**
 * Assert that user has required role (throws if not)
 */
export function assertRole(
  userRole: string,
  allowedRoles: string[]
): void {
  if (!allowedRoles.includes(userRole)) {
    throw new Error(`Forbidden: Required role is one of: ${allowedRoles.join(', ')}`);
  }
}

/**
 * Log error with context for debugging
 */
export function logError(
  context: string,
  error: unknown,
  metadata?: Record<string, unknown>
): void {
  console.error(`[${context}]`, {
    error: error instanceof Error ? error.message : error,
    stack: error instanceof Error ? error.stack : undefined,
    ...metadata,
  });
}
