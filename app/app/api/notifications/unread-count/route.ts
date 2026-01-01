/**
 * API Route: GET /api/notifications/unread-count
 * Returns count of unread notifications (task assignments) for current user
 *
 * Used by:
 * - Bottom navigation "More" tab badge
 * - Notifications page header
 */

import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export const GET = withErrorHandler(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  // Count unread task assignments (notifications)
  // Same logic as notifications page.tsx line 85
  const unreadCount = await prisma.taskAssignment.count({
    where: {
      targetUserId: userId,
      status: 'unread',
    },
  });

  return NextResponse.json({
    unread_count: unreadCount,
  });
});
