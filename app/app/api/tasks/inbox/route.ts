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
    const statusFilter = searchParams.get('status') || 'active'; // active/unread/read/acknowledged/archived/deleted
    const includeDeleted = searchParams.get('include_deleted') !== 'false'; // default: true
    const sortBy = searchParams.get('sort_by') || 'execution_date'; // execution_date/created_at
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');

    // 3. Build where clause
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

    // 4. Get tasks
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
        sortBy === 'execution_date'
          ? { task: { executionDate: 'desc' } }
          : { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    // 5. Get counts
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

    // 6. Get sender role for each assignment
    const enrichedAssignments = await Promise.all(
      assignments.map(async (assignment) => {
        const senderUserId = assignment.task.senderUserId;

        // Determine sender role
        let senderRole = 'unknown';
        const [isSuperAdmin, isAreaManager, isManager, isSupervisor] = await Promise.all([
          prisma.user.findUnique({
            where: { id: senderUserId },
            select: { isSuperAdmin: true },
          }),
          prisma.areaManager.findFirst({
            where: { userId: senderUserId },
          }),
          prisma.corporationManager.findFirst({
            where: { userId: senderUserId },
          }),
          prisma.supervisor.findFirst({
            where: { userId: senderUserId },
          }),
        ]);

        if (isSuperAdmin?.isSuperAdmin) {
          senderRole = 'super_admin';
        } else if (isAreaManager) {
          senderRole = 'area_manager';
        } else if (isManager) {
          senderRole = 'corporation_manager';
        } else if (isSupervisor) {
          senderRole = 'supervisor';
        }

        // Show placeholder if deleted, otherwise actual body
        const isDeleted = assignment.deletedForRecipientAt !== null;
        const body = isDeleted ? 'המשימה נמחקה על ידי השולח' : assignment.task.body;

        return {
          task_id: assignment.taskId.toString(),
          type: assignment.task.type,
          body,
          execution_date: assignment.task.executionDate.toISOString().split('T')[0],
          sender_name: assignment.task.senderUser.fullName,
          sender_role: senderRole,
          created_at: assignment.task.createdAt.toISOString(),
          status: assignment.status,
          read_at: assignment.readAt?.toISOString() || null,
          acknowledged_at: assignment.acknowledgedAt?.toISOString() || null,
          archived_at: assignment.archivedAt?.toISOString() || null,
          deleted_for_recipient_at: assignment.deletedForRecipientAt?.toISOString() || null,
          is_deleted: isDeleted,
        };
      })
    );

    // 7. Return response
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
