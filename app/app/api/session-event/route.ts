/**
 * Session Event API - Receive and store user journey events
 *
 * Features:
 * - Batch event processing
 * - Zod validation
 * - User ID extraction from session
 * - Form data sanitization
 * - Rate limiting (via event batching)
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema
const SessionEventSchema = z.object({
  sessionId: z.string(),
  eventType: z.enum(['navigation', 'click', 'form_submit', 'form_error']),
  page: z.string().optional(),
  element: z.string().optional(),
  formName: z.string().optional(),
  formData: z.record(z.any()).optional(),
  loadTime: z.number().int().positive().optional(),
  timestamp: z.number(),
});

const BatchSchema = z.object({
  events: z.array(SessionEventSchema).max(20), // Max 20 events per batch
});

// Sensitive fields to redact
const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn', 'authorization'];

/**
 * Sanitize form data - remove sensitive information
 */
function sanitizeFormData(formData: Record<string, any> | undefined): Record<string, any> | undefined {
  if (!formData) return undefined;

  const sanitized = { ...formData };

  for (const key of Object.keys(sanitized)) {
    const lowerKey = key.toLowerCase();
    if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * POST /api/session-event
 * Store batch of session events
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = BatchSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request body', details: validation.error.issues },
        { status: 400 }
      );
    }

    const { events } = validation.data;

    // Get session if authenticated
    const session = await auth();
    const userId = session?.user?.id || null;
    const cityId = session?.user?.activistProfile?.cityId || null;

    // Get user agent from headers
    const userAgent = request.headers.get('user-agent') || undefined;

    // Prepare events for database insertion
    const eventsToInsert = events.map(event => ({
      sessionId: event.sessionId,
      userId,
      eventType: event.eventType,
      page: event.page,
      element: event.element,
      formName: event.formName,
      formData: sanitizeFormData(event.formData),
      loadTime: event.loadTime,
      timestamp: new Date(event.timestamp),
      userAgent,
      cityId,
    }));

    // Batch insert into database
    await prisma.sessionEvent.createMany({
      data: eventsToInsert,
      skipDuplicates: true, // Skip if duplicate session events (edge case)
    });

    return NextResponse.json(
      { success: true, count: eventsToInsert.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SessionEvent API] Error:', error);

    // Don't return detailed error to client for security
    return NextResponse.json(
      { error: 'Failed to store events' },
      { status: 500 }
    );
  }
}
