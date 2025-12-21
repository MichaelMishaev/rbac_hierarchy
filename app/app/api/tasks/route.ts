/**
 * POST /api/tasks - Create new task
 * v2.2: Task Broadcast System with critical fixes
 *
 * CRITICAL: Recipients count must be computed FIRST before inserting task
 * to avoid constraint violation (recipients_count > 0)
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  getAllRecipientsUnderMe,
  validateRecipients,
  logTaskAudit,
} from '@/lib/tasks';
import { sendTaskNotification, areVapidKeysConfigured } from '@/lib/send-push-notification';
import { Role } from '@prisma/client';
import { withErrorHandler, ForbiddenError, UnauthorizedError } from '@/lib/error-handler';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

export const POST = withErrorHandler(async (request: Request) => {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      const context = await extractRequestContext(request);
      logger.authFailure('Unauthenticated task creation attempt', context);
      throw new UnauthorizedError('נדרש אימות');
    }

    const userId = session.user.id as string;
    const userRole = session.user.role as Role;

    // 2. Validate that user can send tasks
    if (userRole === 'ACTIVIST_COORDINATOR') {
      const context = await extractRequestContext(request);
      logger.rbacViolation('Activist coordinator attempted to send task', {
        ...context,
        ...extractSessionContext(session),
        metadata: {
          attemptedAction: 'create_task',
        },
      });
      throw new ForbiddenError('רכזי שכונות לא יכולים לשלוח משימות');
    }

    // 3. Parse and validate request body
    const body = await request.json();
    const { type = 'Task', body: taskBody, execution_date, send_to, recipient_user_ids } = body;

    // Validate task body
    if (!taskBody || typeof taskBody !== 'string') {
      return NextResponse.json(
        { error: 'תיאור המשימה חסר' },
        { status: 400 }
      );
    }

    if (taskBody.length < 10 || taskBody.length > 2000) {
      return NextResponse.json(
        { error: 'תיאור המשימה חייב להכיל בין 10 ל-2000 תווים' },
        { status: 400 }
      );
    }

    // Validate execution date
    if (!execution_date) {
      return NextResponse.json(
        { error: 'תאריך ביצוע חסר' },
        { status: 400 }
      );
    }

    const executionDate = new Date(execution_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (executionDate < today) {
      return NextResponse.json(
        { error: 'תאריך ביצוע לא יכול להיות בעבר' },
        { status: 400 }
      );
    }

    // Validate send_to
    if (send_to !== 'all' && send_to !== 'selected') {
      return NextResponse.json(
        { error: 'יש לבחור "כולם תחתיי" או "נבחרים ספציפיים"' },
        { status: 400 }
      );
    }

    if (send_to === 'selected' && (!recipient_user_ids || recipient_user_ids.length === 0)) {
      return NextResponse.json(
        { error: 'יש לבחור לפחות נמען אחד' },
        { status: 400 }
      );
    }

    // 4. 🚨 CRITICAL STEP 1: Resolve recipients FIRST
    let recipients: string[];

    if (send_to === 'all') {
      const allRecipients = await getAllRecipientsUnderMe(userId, userRole);
      recipients = allRecipients.map((r) => r.userId);
    } else {
      recipients = await validateRecipients(recipient_user_ids, userId, userRole);
    }

    const recipientsCount = recipients.length;

    if (recipientsCount === 0) {
      return NextResponse.json(
        { error: 'לא נמצאו נמענים תקפים' },
        { status: 400 }
      );
    }

    // 5. 🚨 CRITICAL STEP 2: Insert task WITH recipients_count
    // This prevents constraint violation (recipients_count > 0)
    const task = await prisma.task.create({
      data: {
        type,
        body: taskBody,
        senderUserId: userId,
        executionDate,
        recipientsCount, // ✅ Set explicitly (constraint requires > 0)
      },
    });

    // 6. STEP 3: Insert task_assignments
    await prisma.taskAssignment.createMany({
      data: recipients.map((recipientId) => ({
        taskId: task.id,
        targetUserId: recipientId,
        status: 'unread',
      })),
    });

    // 7. STEP 4: Audit log
    await logTaskAudit({
      action: 'create',
      entity: 'task',
      entityId: task.id,
      userId,
      after: {
        task_id: task.id.toString(),
        type,
        body_preview: taskBody.substring(0, 100),
        recipients_count: recipientsCount,
        execution_date: executionDate.toISOString(),
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    });

    // 8. STEP 5: Send push notifications
    let pushSent = false;
    let pushCount = 0;

    if (areVapidKeysConfigured()) {
      try {
        pushCount = await sendTaskNotification(recipients, {
          taskId: task.id,
          body: taskBody,
          senderName: session.user.name || session.user.email || 'שולח לא ידוע',
          executionDate,
        });
        pushSent = pushCount > 0;

        console.log(`[Task Created] Sent ${pushCount} push notifications for task ${task.id}`);
      } catch (pushError) {
        console.error('[Task Created] Failed to send push notifications:', pushError);
        // Don't fail task creation if push notifications fail
      }
    } else {
      console.warn('[Task Created] VAPID keys not configured, skipping push notifications');
    }

    // 9. Return success response
    return NextResponse.json(
      {
        task_id: task.id.toString(),
        created_at: task.createdAt.toISOString(),
        recipients_count: recipientsCount,
        push_sent: pushSent,
        push_count: pushCount,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error creating task:', error);

    // Return user-friendly error message
    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'שגיאה ביצירת המשימה' },
      { status: 500 }
    );
  }
});
