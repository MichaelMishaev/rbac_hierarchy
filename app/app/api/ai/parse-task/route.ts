import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { parseTaskFromNaturalLanguage, formatParsedTask } from '@/lib/ai/nlTaskParser';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Natural Language Task Parser API
 *
 * POST /api/ai/parse-task
 *
 * Body:
 * {
 *   "input": "לדפוק דלתות בפלורנטין ביום רביעי בבוקר",
 *   "cityId": "..."
 * }
 *
 * Response:
 * {
 *   "parsed": {
 *     "action": "לדפוק דלתות",
 *     "location": "פלורנטין",
 *     "date": "2025-12-15T00:00:00Z",
 *     "time": "09:00",
 *     "priority": "medium",
 *     "taskType": "door_knocking",
 *     "suggestedActivists": [...],
 *     "confidence": 0.9
 *   },
 *   "formatted": "🤖 הבנתי:\n\n📋 פעולה: לדפוק דלתות\n..."
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
    const { input, cityId } = body;

    // 3. Validate required fields
    if (!input || typeof input !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid "input" field' },
        { status: 400 }
      );
    }

    if (!cityId) {
      return NextResponse.json(
        { error: 'Missing required field: cityId' },
        { status: 400 }
      );
    }

    // 4. Parse natural language input
    const parsed = await parseTaskFromNaturalLanguage(input, cityId);

    // 5. Format for display
    const formatted = formatParsedTask(parsed);

    // 6. Return parsed data
    return NextResponse.json({
      parsed,
      formatted,
      timestamp: new Date().toISOString(),
      parser: 'nl_task_parser_v1'
    });

  } catch (error) {
    console.error('NL parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse input', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
