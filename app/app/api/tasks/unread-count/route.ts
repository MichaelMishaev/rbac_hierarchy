/**
 * GET /api/tasks/unread-count - Get user's unread task count
 * Lightweight endpoint for navigation badge
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'נדרש אימות' },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;

    // 2. Get unread count (active tasks only, not archived)
    const unreadCount = await prisma.taskAssignment.count({
      where: {
        targetUserId: userId,
        status: 'unread',
        archivedAt: null,
        deletedForRecipientAt: null, // Exclude deleted tasks
      },
    });

    // 3. Return count
    return NextResponse.json({
      unread_count: unreadCount,
    });
  } catch (error: any) {
    console.error('Error fetching unread count:', error);

    return NextResponse.json(
      { error: 'שגיאה בטעינת ספירת משימות' },
      { status: 500 }
    );
  }
}
