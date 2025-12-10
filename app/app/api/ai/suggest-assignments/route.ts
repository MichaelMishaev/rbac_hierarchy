import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { predictOptimalAssignments } from '@/lib/ai/smartAssignment';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * AI-Powered Task Assignment Suggestions
 *
 * POST /api/ai/suggest-assignments
 *
 * Body:
 * {
 *   "neighborhoodId": "...",
 *   "cityId": "...",
 *   "taskType": "door_knocking",
 *   "priority": "high",
 *   "location": { "lat": 32.0853, "lng": 34.7818 }
 * }
 *
 * Response:
 * {
 *   "predictions": [
 *     {
 *       "activistId": "...",
 *       "activistName": "דני כהן",
 *       "score": 0.92,
 *       "distance": 500,
 *       "currentLoad": 1,
 *       "reasoning": ["📍 קרוב מאוד למיקום", "✅ נוכח בשטח"],
 *       "estimatedDuration": 90
 *     }
 *   ]
 * }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await req.json();
    const { neighborhoodId, cityId, taskType, priority, location } = body;

    // 3. Validate required fields
    if (!neighborhoodId || !cityId) {
      return NextResponse.json(
        { error: 'Missing required fields: neighborhoodId, cityId' },
        { status: 400 }
      );
    }

    // 4. Get AI predictions
    const predictions = await predictOptimalAssignments({
      neighborhoodId,
      cityId,
      taskType: taskType || 'general',
      priority: priority || 'medium',
      location
    }, 5);

    // 5. Return predictions
    return NextResponse.json({
      predictions,
      timestamp: new Date().toISOString(),
      algorithm: 'smart_assignment_v1'
    });

  } catch (error) {
    console.error('AI prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate predictions', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
