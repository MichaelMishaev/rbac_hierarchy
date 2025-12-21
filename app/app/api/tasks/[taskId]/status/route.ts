/**
 * PATCH /api/tasks/:taskId/status - Update task assignment status
 * v2.2: Task Broadcast System
 *
 * 🚨 CRITICAL: Status changes MUST be blocked on deleted tasks
 * Enforced in SQL with WHERE deleted_for_recipient_at IS NULL
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskAudit } from '@/lib/tasks';
import { UnauthorizedError } from '@/lib/error-handler';
import { logger, extractRequestContext } from '@/lib/logger';

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ taskId: string }> }
) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      const context = await extractRequestContext(request);
      logger.authFailure('Unauthenticated task status update attempt', context);
      throw new UnauthorizedError('נדרש אימות');
    }

    const userId = session.user.id as string;
    const { taskId: taskIdStr } = await context.params;
    const taskId = BigInt(taskIdStr);

    // 2. Parse request body
    const body = await request.json();
    const { status } = body;

    // 3. Validate status
    const validStatuses = ['read', 'acknowledged', 'archived'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'סטטוס לא תקף' },
        { status: 400 }
      );
    }

    // 4. 🚨 CRITICAL: Update only if NOT deleted
    // Using raw query to ensure WHERE clause is enforced
    const updateResult = await prisma.$executeRaw`
      UPDATE task_assignments
      SET
        status = ${status}::text,
        read_at = CASE WHEN ${status} = 'read' THEN NOW() ELSE read_at END,
        acknowledged_at = CASE WHEN ${status} = 'acknowledged' THEN NOW() ELSE acknowledged_at END,
        archived_at = CASE WHEN ${status} = 'archived' THEN NOW() ELSE archived_at END
      WHERE task_id = ${taskId}
        AND target_user_id = ${userId}
        AND deleted_for_recipient_at IS NULL
    `;

    // 5. Check if update succeeded
    if (updateResult === 0) {
      // Either task doesn't exist OR it's deleted
      const assignment = await prisma.taskAssignment.findFirst({
        where: {
          taskId,
          targetUserId: userId,
        },
        select: {
          deletedForRecipientAt: true,
        },
      });

      if (assignment?.deletedForRecipientAt) {
        return NextResponse.json(
          { error: 'לא ניתן לשנות סטטוס של משימה שנמחקה' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: 'משימה לא נמצאה' },
          { status: 404 }
        );
      }
    }

    // 6. Fetch updated assignment
    const updated = await prisma.taskAssignment.findFirst({
      where: {
        taskId,
        targetUserId: userId,
      },
    });

    if (!updated) {
      return NextResponse.json(
        { error: 'שגיאה בטעינת המשימה המעודכנת' },
        { status: 500 }
      );
    }

    // 7. Audit log
    await logTaskAudit({
      action: 'update',
      entity: 'task_assignment',
      entityId: taskId,
      userId,
      after: {
        task_id: taskId.toString(),
        user_id: userId,
        status,
        read_at: updated.readAt?.toISOString() || null,
        acknowledged_at: updated.acknowledgedAt?.toISOString() || null,
        archived_at: updated.archivedAt?.toISOString() || null,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 8. Return success response
    return NextResponse.json({
      task_id: taskId.toString(),
      status: updated.status,
      read_at: updated.readAt?.toISOString() || null,
      acknowledged_at: updated.acknowledgedAt?.toISOString() || null,
      archived_at: updated.archivedAt?.toISOString() || null,
    });
  } catch (error: any) {
    console.error('Error updating task status:', error);

    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'שגיאה בעדכון סטטוס המשימה' },
      { status: 500 }
    );
  }
}
