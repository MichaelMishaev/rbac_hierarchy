/**
 * POST /api/tasks/bulk-archive - Bulk archive tasks
 * v2.2: Task Broadcast System
 *
 * Allows users to archive all read tasks or tasks older than X days
 * Does NOT archive deleted tasks by default (separate retention policy)
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, UnauthorizedError } from '@/lib/error-handler';
import { logger, extractRequestContext } from '@/lib/logger';

export const POST = withErrorHandler(async (request: NextRequest) => {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      const context = await extractRequestContext(request);
      logger.authFailure('Unauthenticated bulk archive attempt', context);
      throw new UnauthorizedError('נדרש אימות');
    }

    const userId = session.user.id as string;

    // 2. Parse request body
    const body = await request.json();
    const { archive_read = false, older_than_days } = body;

    // 3. Build where clause
    const where: any = {
      targetUserId: userId,
      archivedAt: null, // Only archive non-archived tasks
      deletedForRecipientAt: null, // Do NOT archive deleted tasks (separate retention)
    };

    if (archive_read) {
      where.status = 'read';
    }

    if (older_than_days && typeof older_than_days === 'number' && older_than_days > 0) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - older_than_days);
      where.createdAt = {
        lt: cutoffDate,
      };
    }

    // 4. Archive tasks
    const result = await prisma.taskAssignment.updateMany({
      where,
      data: {
        status: 'archived',
        archivedAt: new Date(),
      },
    });

    // 5. Return response
    return NextResponse.json({
      archived_count: result.count,
    });
  } catch (error: any) {
    console.error('Error bulk archiving tasks:', error);

    return NextResponse.json(
      { error: 'שגיאה בארכוב משימות' },
      { status: 500 }
    );
  }
});
