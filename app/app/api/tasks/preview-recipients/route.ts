/**
 * POST /api/tasks/preview-recipients - Preview recipients for confirmation modal
 * v2.2: Task Broadcast System - SPAM PREVENTION
 *
 * Returns count and breakdown by role/corporation for confirmation modal
 * CRITICAL: MUST show modal when recipients count > 1
 */

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { previewRecipients } from '@/lib/tasks';
import { Role } from '@prisma/client';
import { withErrorHandler, ForbiddenError, UnauthorizedError } from '@/lib/error-handler';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

export const POST = withErrorHandler(async (request: Request) => {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      const context = await extractRequestContext(request);
      logger.authFailure('Unauthenticated preview recipients attempt', context);
      throw new UnauthorizedError('נדרש אימות');
    }

    const userId = session.user.id as string;
    const userRole = session.user.role as Role;

    // 2. Validate that user can send tasks
    if (userRole === 'ACTIVIST_COORDINATOR') {
      const context = await extractRequestContext(request);
      logger.rbacViolation('Activist coordinator attempted to preview recipients', {
        ...context,
        ...extractSessionContext(session),
        metadata: {
          attemptedAction: 'preview_recipients',
        },
      });
      throw new ForbiddenError('רכזי שכונות לא יכולים לשלוח משימות');
    }

    // 3. Parse request body
    const body = await request.json();
    const { send_to, recipient_user_ids } = body;

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

    // 4. Get preview
    const preview = await previewRecipients(
      userId,
      userRole,
      send_to,
      recipient_user_ids
    );

    // 5. Return response
    return NextResponse.json(preview);
  } catch (error: any) {
    console.error('Error previewing recipients:', error);

    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'שגיאה בטעינת תצוגת נמענים' },
      { status: 500 }
    );
  }
});
