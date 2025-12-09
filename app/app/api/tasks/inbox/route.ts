/**
 * GET /api/tasks/inbox - Get user's task inbox
 * v2.2: Task Broadcast System with deleted task support
 *
 * CRITICAL: Deleted tasks MUST remain visible as greyed-out placeholders
 * for legal compliance and audit trail
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
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

    // 2. Parse query parameters
    const { searchParams } = new URL(request.url);
    const view = searchParams.get('view') || 'received'; // received/sent
    const statusFilter = searchParams.get('status') || 'active'; // active/unread/read/acknowledged/archived/deleted
    const includeDeleted = searchParams.get('include_deleted') !== 'false'; // default: true
    const sortBy = searchParams.get('sort_by') || 'created_at'; // created_at/execution_date (default: sent date desc)
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Handle SENT vs RECEIVED view
    if (view === 'sent') {
      // Get tasks created by this user
      const sentTasks = await prisma.task.findMany({
        where: {
          senderUserId: userId,
        },
        include: {
          senderUser: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          assignments: {
            include: {
              targetUser: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy:
          sortBy === 'created_at'
            ? { createdAt: 'desc' }
            : { executionDate: 'desc' },
        take: limit,
        skip: offset,
      });

      // Transform to consistent format
      const enrichedTasks = sentTasks.map((task) => {
        const totalRecipients = task.recipientsCount;
        const readCount = task.assignments.filter(a => a.status === 'read' || a.status === 'acknowledged').length;
        const acknowledgedCount = task.assignments.filter(a => a.status === 'acknowledged').length;

        return {
          task_id: task.id.toString(),
          type: task.type,
          body: task.body,
          execution_date: task.executionDate.toISOString().split('T')[0],
          sender_name: task.senderUser.fullName,
          sender_role: 'self',
          created_at: task.createdAt.toISOString(),
          status: `${acknowledgedCount}/${readCount}/${totalRecipients}`, // acknowledged/read/total
          read_at: null,
          acknowledged_at: null,
          archived_at: null,
          deleted_for_recipient_at: task.deletedBySenderAt?.toISOString() || null,
          is_deleted: task.deletedBySenderAt !== null,
          recipients_count: totalRecipients,
          read_count: readCount,
          acknowledged_count: acknowledgedCount,
          recipients: task.assignments.map(a => ({
            user_id: a.targetUserId,
            user_name: a.targetUser.fullName,
            status: a.status,
            read_at: a.readAt?.toISOString() || null,
            acknowledged_at: a.acknowledgedAt?.toISOString() || null,
          })),
        };
      });

      const totalCount = await prisma.task.count({
        where: { senderUserId: userId },
      });

      return NextResponse.json({
        tasks: enrichedTasks,
        total_count: totalCount,
        unread_count: 0,
        archived_count: 0,
        deleted_count: await prisma.task.count({
          where: { senderUserId: userId, deletedBySenderAt: { not: null } },
        }),
      });
    }

    // 4. RECEIVED view (original logic)
    const where: any = {
      targetUserId: userId,
    };

    // Filter by status
    if (statusFilter === 'active') {
      where.archivedAt = null;
    } else if (statusFilter === 'archived') {
      where.archivedAt = { not: null };
    } else if (statusFilter === 'deleted') {
      where.deletedForRecipientAt = { not: null };
    } else if (statusFilter === 'unread' || statusFilter === 'read' || statusFilter === 'acknowledged') {
      where.status = statusFilter;
      where.archivedAt = null;
    }

    // 5. Get tasks
    const assignments = await prisma.taskAssignment.findMany({
      where,
      include: {
        task: {
          include: {
            senderUser: {
              select: {
                id: true,
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy:
        sortBy === 'created_at'
          ? { createdAt: 'desc' }
          : { task: { executionDate: 'desc' } },
      take: limit,
      skip: offset,
    });

    // 6. Get counts
    const [totalCount, unreadCount, archivedCount, deletedCount] = await Promise.all([
      prisma.taskAssignment.count({
        where: { targetUserId: userId },
      }),
      prisma.taskAssignment.count({
        where: {
          targetUserId: userId,
          status: 'unread',
          archivedAt: null,
        },
      }),
      prisma.taskAssignment.count({
        where: {
          targetUserId: userId,
          archivedAt: { not: null },
        },
      }),
      prisma.taskAssignment.count({
        where: {
          targetUserId: userId,
          deletedForRecipientAt: { not: null },
        },
      }),
    ]);

    // 7. Batch fetch sender roles (PERFORMANCE FIX: 1 query instead of N*4)
    const uniqueSenderIds = [...new Set(assignments.map((a) => a.task.senderUserId))];

    const [superAdmins, areaManagers, managers, supervisors] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: uniqueSenderIds }, isSuperAdmin: true },
        select: { id: true },
      }),
      prisma.areaManager.findMany({
        where: { userId: { in: uniqueSenderIds } },
        select: { userId: true },
      }),
      prisma.corporationManager.findMany({
        where: { userId: { in: uniqueSenderIds } },
        select: { userId: true },
      }),
      prisma.supervisor.findMany({
        where: { userId: { in: uniqueSenderIds } },
        select: { userId: true },
      }),
    ]);

    // Create lookup maps for O(1) access
    const superAdminSet = new Set(superAdmins.map((u) => u.id));
    const areaManagerSet = new Set(areaManagers.map((am) => am.userId));
    const managerSet = new Set(managers.map((m) => m.userId));
    const supervisorSet = new Set(supervisors.map((s) => s.userId));

    // Determine sender role (O(1) lookup)
    const getSenderRole = (userId: string): string => {
      if (superAdminSet.has(userId)) return 'super_admin';
      if (areaManagerSet.has(userId)) return 'area_manager';
      if (managerSet.has(userId)) return 'corporation_manager';
      if (supervisorSet.has(userId)) return 'supervisor';
      return 'unknown';
    };

    // 8. Map assignments to response format (no DB queries)
    const enrichedAssignments = assignments.map((assignment) => {
      const isDeleted = assignment.deletedForRecipientAt !== null;
      const body = isDeleted ? 'המשימה נמחקה על ידי השולח' : assignment.task.body;

      return {
        task_id: assignment.taskId.toString(),
        type: assignment.task.type,
        body,
        execution_date: assignment.task.executionDate.toISOString().split('T')[0],
        sender_name: assignment.task.senderUser.fullName,
        sender_role: getSenderRole(assignment.task.senderUserId),
        created_at: assignment.task.createdAt.toISOString(),
        status: assignment.status,
        read_at: assignment.readAt?.toISOString() || null,
        acknowledged_at: assignment.acknowledgedAt?.toISOString() || null,
        archived_at: assignment.archivedAt?.toISOString() || null,
        deleted_for_recipient_at: assignment.deletedForRecipientAt?.toISOString() || null,
        is_deleted: isDeleted,
      };
    });

    // 9. Return response
    return NextResponse.json({
      tasks: enrichedAssignments,
      total_count: totalCount,
      unread_count: unreadCount,
      archived_count: archivedCount,
      deleted_count: deletedCount,
    });
  } catch (error: any) {
    console.error('Error fetching inbox:', error);

    return NextResponse.json(
      { error: 'שגיאה בטעינת תיבת המשימות' },
      { status: 500 }
    );
  }
}
