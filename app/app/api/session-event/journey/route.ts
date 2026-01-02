/**
 * Session Journey API - Fetch recent session events
 *
 * GET /api/session-event/journey?sessionId=xxx&limit=20
 *
 * Returns the last N session events for a given session ID.
 * Used by error tracker to provide context about user journey.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/session-event/journey
 * Fetch recent session events for debugging context
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const sessionId = searchParams.get('sessionId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    // Validate parameters
    if (!sessionId) {
      return NextResponse.json(
        { error: 'sessionId is required' },
        { status: 400 }
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'limit must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Fetch events from database
    const events = await prisma.sessionEvent.findMany({
      where: { sessionId },
      orderBy: { timestamp: 'desc' },
      take: limit,
      select: {
        id: true,
        eventType: true,
        page: true,
        element: true,
        formName: true,
        loadTime: true,
        timestamp: true,
        // Don't return formData for privacy
      },
    });

    // Reverse to show chronological order (oldest first)
    events.reverse();

    return NextResponse.json(
      { events, count: events.length },
      { status: 200 }
    );
  } catch (error) {
    console.error('[SessionJourney API] Error:', error);

    return NextResponse.json(
      { error: 'Failed to fetch session journey' },
      { status: 500 }
    );
  }
}
