/**
 * Client-Side Error Logging API
 *
 * Receives errors from:
 * - error.tsx (React Error Boundary)
 * - global-error.tsx (Root Layout Error Boundary)
 * - Manual client-side logging
 *
 * Logs them to the database with proper context
 */

import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { ErrorLevel } from '@prisma/client';

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      message,
      stack,
      digest,
      level = 'ERROR',
      errorType = 'ClientError',
      url,
      userAgent,
      timestamp,
      metadata,
    } = body;

    // Determine error level
    let errorLevel: ErrorLevel = ErrorLevel.ERROR;
    if (level === 'CRITICAL') errorLevel = ErrorLevel.CRITICAL;
    if (level === 'WARN') errorLevel = ErrorLevel.WARN;

    // Log to database
    await logger.error(
      `[Client-Side Error] ${message}`,
      { message, stack } as Error,
      {
        errorType,
        level: errorLevel,
        url,
        userAgent,
        ipAddress: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || undefined,
        metadata: {
          digest,
          timestamp,
          source: 'client',
          ...metadata,
        },
      }
    );

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[log-error API] Failed to log client error:', error);

    // Don't throw - we don't want to create an error loop
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    );
  }
}
