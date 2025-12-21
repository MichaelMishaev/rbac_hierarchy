/**
 * GET /api/tasks/unread-count - Get user's unread task count
 * Lightweight endpoint for navigation badge
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, UnauthorizedError } from '@/lib/error-handler';
import { logger } from '@/lib/logger';

export const GET = withErrorHandler(async (_request: Request) => {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      logger.authFailure('Unauthenticated unread count access attempt', {});
      throw new UnauthorizedError('נדרש אימות');
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
});
