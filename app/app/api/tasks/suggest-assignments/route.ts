/**
 * Smart Task Assignment API Route
 * Returns optimal activist suggestions for a task based on location and workload
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { suggestTaskAssignments, type TaskLocation } from '@/lib/smartAssignment';

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { location, neighborhoodId, count = 5 } = body;

    // Validate inputs
    if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
      return NextResponse.json(
        { error: 'Invalid location. Must provide lat and lng coordinates.' },
        { status: 400 }
      );
    }

    if (!neighborhoodId) {
      return NextResponse.json(
        { error: 'Missing neighborhoodId' },
        { status: 400 }
      );
    }

    // Get smart suggestions
    const suggestions = await suggestTaskAssignments(
      location as TaskLocation,
      neighborhoodId,
      count
    );

    return NextResponse.json({
      success: true,
      suggestions,
      count: suggestions.length,
    });

  } catch (error) {
    console.error('[Smart Assignment API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate suggestions' },
      { status: 500 }
    );
  }
}
