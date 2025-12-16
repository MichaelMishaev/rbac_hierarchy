/**
 * Server-Sent Events (SSE) API Route for Live Activity Feed
 * Streams real-time campaign events to connected clients
 *
 * Events include:
 * - Activist check-ins/check-outs
 * - Task completions
 * - New activist additions
 * - Task assignments
 */

import { NextRequest } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface LiveEvent {
  type: 'check_in' | 'check_out' | 'task_complete' | 'activist_added' | 'task_assigned' | 'connected';
  data: any;
  timestamp: number;
}

export async function GET(req: NextRequest) {
  const session = await auth();

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Send initial connection message
  await writer.write(
    encoder.encode(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`)
  );

  // Polling interval to check for new events
  // TODO: Replace with Redis Pub/Sub or PostgreSQL LISTEN/NOTIFY in production
  const interval = setInterval(async () => {
    try {
      const events = await fetchRecentEvents(session.user.id, session.user.role);

      for (const event of events) {
        await writer.write(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      }
    } catch (error) {
      console.error('[SSE] Error fetching events:', error);
    }
  }, 5000); // Poll every 5 seconds

  // Keep-alive ping to prevent connection timeout
  const keepAlive = setInterval(() => {
    writer.write(encoder.encode(': ping\n\n'));
  }, 30000); // Ping every 30 seconds

  // Handle client disconnect
  req.signal.addEventListener('abort', () => {
    clearInterval(interval);
    clearInterval(keepAlive);
    writer.close();
    console.log('[SSE] Client disconnected');
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}

/**
 * Fetch recent events based on user role and permissions
 */
async function fetchRecentEvents(_userId: string, _role: string): Promise<LiveEvent[]> {
  const events: LiveEvent[] = [];
  const fiveSecondsAgo = new Date(Date.now() - 5000);

  try {
    // Fetch recent attendance records (check-ins/check-outs)
    const recentAttendance = await prisma.attendanceRecord.findMany({
      where: {
        createdAt: { gte: fiveSecondsAgo },
      },
      include: {
        activist: {
          include: {
            neighborhood: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    for (const record of recentAttendance) {
      events.push({
        type: record.status === 'PRESENT' ? 'check_in' : 'check_out',
        data: {
          activist_name: record.activist.fullName,
          neighborhood: record.activist.neighborhood?.name || 'Unknown',
          notes: record.notes || undefined,
        },
        timestamp: record.createdAt.getTime(),
      });
    }

    // Fetch recent task completions
    const recentTaskCompletions = await prisma.taskAssignment.findMany({
      where: {
        acknowledgedAt: { gte: fiveSecondsAgo },
      },
      include: {
        task: true,
        targetUser: true,
      },
      orderBy: { acknowledgedAt: 'desc' },
      take: 10,
    });

    for (const assignment of recentTaskCompletions) {
      events.push({
        type: 'task_complete',
        data: {
          user_name: assignment.targetUser?.fullName || 'Unknown',
          task_body: assignment.task.body,
          completed_at: assignment.acknowledgedAt,
        },
        timestamp: assignment.acknowledgedAt?.getTime() || assignment.createdAt.getTime(),
      });
    }

    // Fetch recently added activists
    const recentActivists = await prisma.activist.findMany({
      where: {
        createdAt: { gte: fiveSecondsAgo },
      },
      include: {
        neighborhood: {
          include: {
            cityRelation: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    for (const activist of recentActivists) {
      events.push({
        type: 'activist_added',
        data: {
          activist_name: activist.fullName,
          neighborhood: activist.neighborhood?.name || 'Unknown',
          city: activist.neighborhood?.cityRelation?.name || 'Unknown',
        },
        timestamp: activist.createdAt.getTime(),
      });
    }

  } catch (error) {
    console.error('[SSE] Error fetching events from database:', error);
  }

  return events.sort((a, b) => b.timestamp - a.timestamp);
}
