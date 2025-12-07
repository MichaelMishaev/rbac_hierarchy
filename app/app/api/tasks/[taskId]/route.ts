/**
 * DELETE /api/tasks/:taskId - Sender delete task within 1 hour
 * v2.2: Task Broadcast System
 *
 * 🚨 CRITICAL: Soft delete - tasks remain visible to recipients as greyed-out
 * Sets deleted_by_sender_at on tasks table
 * Sets deleted_for_recipient_at on ALL task_assignments
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logTaskAudit } from '@/lib/tasks';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { taskId: string } }
) {
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
    const taskId = BigInt(params.taskId);

    // 2. Check if task exists and user is the sender
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignments: {
          select: {
            acknowledgedAt: true,
          },
        },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: 'משימה לא נמצאה' },
        { status: 404 }
      );
    }

    if (task.senderUserId !== userId) {
      return NextResponse.json(
        { error: 'רק השולח יכול למחוק משימה' },
        { status: 403 }
      );
    }

    // 3. Check if already deleted
    if (task.deletedBySenderAt) {
      return NextResponse.json(
        { error: 'המשימה כבר נמחקה' },
        { status: 400 }
      );
    }

    // 4. Check 1-hour window
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    if (task.createdAt < oneHourAgo) {
      return NextResponse.json(
        { error: 'ניתן למחוק משימה רק תוך שעה מיצירתה' },
        { status: 400 }
      );
    }

    // 5. Check if any recipient has acknowledged
    const hasAcknowledged = task.assignments.some((a) => a.acknowledgedAt !== null);
    if (hasAcknowledged) {
      return NextResponse.json(
        { error: 'לא ניתן למחוק משימה שאושרה על ידי נמענים' },
        { status: 400 }
      );
    }

    // 6. 🚨 CRITICAL STEP 1: Soft delete task
    const now = new Date();
    await prisma.task.update({
      where: { id: taskId },
      data: {
        deletedBySenderAt: now,
      },
    });

    // 7. 🚨 CRITICAL STEP 2: Mark for all recipients (they will see greyed-out)
    const updateResult = await prisma.taskAssignment.updateMany({
      where: { taskId },
      data: {
        deletedForRecipientAt: now,
      },
    });

    // 8. Audit log
    await logTaskAudit({
      action: 'delete',
      entity: 'task',
      entityId: taskId,
      userId,
      after: {
        task_id: taskId.toString(),
        deleted_at: now.toISOString(),
        recipients_affected: updateResult.count,
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 9. Return success response
    return NextResponse.json({
      deleted: true,
      task_id: taskId.toString(),
      recipients_affected: updateResult.count,
      deleted_at: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Error deleting task:', error);

    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'שגיאה במחיקת המשימה' },
      { status: 500 }
    );
  }
}
