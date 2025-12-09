'use server';

/**
 * Attendance Server Actions
 * Handles worker check-in, check-out, and attendance history
 */

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import {
  validateTimeWindow,
  getTodayDateInIsrael,
  isToday,
  getTimeWindowErrorMessage,
  ISRAEL_TZ,
} from '@/lib/attendance';
import { AttendanceStatus, Prisma } from '@prisma/client';

/**
 * Validation Schemas
 */
const CheckInWorkerSchema = z.object({
  workerId: z.string().uuid('מזהה עובד לא תקין'),
  siteId: z.string().min(1, 'מזהה אתר לא תקין'),
  notes: z.string().max(500, 'הערות ארוכות מדי (מקסימום 500 תווים)').optional(),
});

const UndoCheckInSchema = z.object({
  workerId: z.string().uuid('מזהה עובד לא תקין'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'פורמט תאריך לא תקין'),
  reason: z.string().min(1, 'נא לציין סיבה לביטול').max(500, 'סיבה ארוכה מדי'),
});

const GetAttendanceHistorySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  siteId: z.string().min(1).optional(),
  workerId: z.string().uuid().optional(),
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(1000).default(50),
});

/**
 * Check in a worker
 */
export async function checkInWorker(input: z.infer<typeof CheckInWorkerSchema>) {
  try {
    // 1. Validate input
    const validated = CheckInWorkerSchema.parse(input);

    // 2. Get current user and validate authentication
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'לא מחובר למערכת',
      };
    }

    // 3. Validate time window (06:00-22:00 Israel time)
    if (!validateTimeWindow()) {
      return {
        success: false,
        error: getTimeWindowErrorMessage(),
      };
    }

    // 4. Get worker to validate existence and get corporation
    const worker = await prisma.worker.findUnique({
      where: { id: validated.workerId },
      select: {
        id: true,
        fullName: true,
        corporationId: true,
        siteId: true,
      },
    });

    if (!worker) {
      return {
        success: false,
        error: 'עובד לא נמצא',
      };
    }

    // 5. Validate corporation access
    if (!user.isSuperAdmin) {
      // For non-superadmin users, verify they have access to this corporation
      const hasAccess = await validateCorporationAccess(user.id, worker.corporationId);
      if (!hasAccess) {
        return {
          success: false,
          error: 'אין לך הרשאה לתאגיד זה',
        };
      }
    }

    // 6. For supervisors, validate site access
    if (user.role === 'SUPERVISOR' && !user.isSuperAdmin) {
      const hasSiteAccess = await prisma.supervisorSite.findFirst({
        where: {
          legacySupervisorUserId: user.id,
          siteId: validated.siteId,
        },
      });

      if (!hasSiteAccess) {
        return {
          success: false,
          error: 'אין לך הרשאה לאתר זה',
        };
      }
    }

    // 7. Check if record already exists (for audit logging)
    const today = getTodayDateInIsrael();
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        workerId_date: {
          workerId: validated.workerId,
          date: new Date(today),
        },
      },
    });

    const isUpdate = !!existingRecord;
    const now = new Date();

    // 8. Upsert attendance record (handle duplicates)
    const record = await prisma.attendanceRecord.upsert({
      where: {
        workerId_date: {
          workerId: validated.workerId,
          date: new Date(today),
        },
      },
      update: {
        checkedInAt: now,
        status: AttendanceStatus.PRESENT,
        lastEditedById: user.id,
        lastEditedAt: now,
        editReason: validated.notes,
        notes: validated.notes,
      },
      create: {
        workerId: validated.workerId,
        siteId: validated.siteId,
        corporationId: worker.corporationId,
        date: new Date(today),
        checkedInAt: now,
        status: AttendanceStatus.PRESENT,
        checkedInById: user.id,
        notes: validated.notes,
      },
      include: {
        worker: {
          select: {
            fullName: true,
            phone: true,
          },
        },
        checkedInBy: {
          select: {
            fullName: true,
          },
        },
      },
    });

    // 9. Audit log for ALL actions (CREATE and UPDATE)
    await prisma.auditLog.create({
      data: {
        action: isUpdate ? 'UPDATE' : 'CREATE',
        entity: 'attendance_record',
        entityId: record.id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        corporationId: worker.corporationId,
        before: isUpdate ? {
          status: existingRecord?.status,
          checkedInAt: existingRecord?.checkedInAt,
        } : Prisma.JsonNull,
        after: {
          status: AttendanceStatus.PRESENT,
          checkedInAt: record.checkedInAt,
          notes: validated.notes,
        },
      },
    });

    return {
      success: true,
      record: {
        id: record.id,
        workerName: record.worker.fullName,
        checkedInAt: record.checkedInAt,
        status: record.status,
      },
    };
  } catch (error) {
    console.error('Error checking in worker:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'שגיאה בסימון נוכחות',
    };
  }
}

/**
 * Get today's attendance for a site or all sites
 */
export async function getTodaysAttendance(siteId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('לא מחובר למערכת');
    }

    const today = getTodayDateInIsrael();

    // Build where clause based on role
    const where: any = {
      date: new Date(today),
    };

    // Corporation filter (except for superadmin)
    if (!user.isSuperAdmin) {
      // Get user's corporations
      const userCorps = await getUserCorporations(user.id);
      where.corporationId = { in: userCorps };
    }

    // Site filter (if provided)
    if (siteId) {
      where.siteId = siteId;
    }

    // Supervisor-specific filtering
    if (user.role === 'SUPERVISOR' && !user.isSuperAdmin) {
      // Get supervisor's assigned sites
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { legacySupervisorUserId: user.id },
        select: { siteId: true },
      });

      const siteIds = supervisorSites.map((ss) => ss.siteId);

      if (siteId && !siteIds.includes(siteId)) {
        throw new Error('אין לך הרשאה לאתר זה');
      }

      where.siteId = { in: siteIds };
    }

    // Fetch attendance records
    const records = await prisma.attendanceRecord.findMany({
      where,
      include: {
        worker: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            position: true,
            avatarUrl: true,
          },
        },
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        checkedInBy: {
          select: {
            fullName: true,
          },
        },
        lastEditedBy: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PRESENT first, then NOT_PRESENT
        { checkedInAt: 'desc' },
      ],
    });

    // Also get workers who haven't been checked in
    const checkedInWorkerIds = records.map((r) => r.workerId);

    const uncheckedWorkersWhere: any = {
      isActive: true,
      id: { notIn: checkedInWorkerIds },
    };

    if (siteId) {
      uncheckedWorkersWhere.siteId = siteId;
    } else if (user.role === 'SUPERVISOR' && !user.isSuperAdmin) {
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { legacySupervisorUserId: user.id },
        select: { siteId: true },
      });
      uncheckedWorkersWhere.siteId = { in: supervisorSites.map((ss) => ss.siteId) };
    }

    if (!user.isSuperAdmin) {
      const userCorps = await getUserCorporations(user.id);
      uncheckedWorkersWhere.corporationId = { in: userCorps };
    }

    const uncheckedWorkers = await prisma.worker.findMany({
      where: uncheckedWorkersWhere,
      select: {
        id: true,
        fullName: true,
        phone: true,
        position: true,
        avatarUrl: true,
        siteId: true,
        site: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    return {
      checkedIn: records,
      notCheckedIn: uncheckedWorkers,
      summary: {
        total: records.length + uncheckedWorkers.length,
        present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
        notPresent: uncheckedWorkers.length,
        date: today,
      },
    };
  } catch (error) {
    console.error('Error fetching today\'s attendance:', error);
    throw error;
  }
}

/**
 * Undo/delete a check-in
 */
export async function undoCheckIn(input: z.infer<typeof UndoCheckInSchema>) {
  try {
    // 1. Validate input
    const validated = UndoCheckInSchema.parse(input);

    // 2. Get current user
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: 'לא מחובר למערכת',
      };
    }

    // 3. Validate time window for same-day edits
    const isTodayDate = isToday(validated.date);
    if (isTodayDate && !validateTimeWindow()) {
      return {
        success: false,
        error: getTimeWindowErrorMessage(),
      };
    }

    // 4. Find existing attendance record
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        workerId_date: {
          workerId: validated.workerId,
          date: new Date(validated.date),
        },
      },
      include: {
        worker: {
          select: {
            corporationId: true,
            fullName: true,
            phone: true,
          },
        },
        site: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!existingRecord) {
      return {
        success: false,
        error: 'רשומת נוכחות לא נמצאה',
      };
    }

    // 5. Validate access
    if (!user.isSuperAdmin) {
      const hasAccess = await validateCorporationAccess(
        user.id,
        existingRecord.worker.corporationId
      );
      if (!hasAccess) {
        return {
          success: false,
          error: 'אין לך הרשאה לתאגיד זה',
        };
      }
    }

    // 6. Delete the record (or mark as NOT_PRESENT)
    const record = await prisma.attendanceRecord.delete({
      where: {
        workerId_date: {
          workerId: validated.workerId,
          date: new Date(validated.date),
        },
      },
    });

    // 7. Audit log with cancellation reason
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'attendance_record',
        entityId: record.id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        corporationId: existingRecord.worker.corporationId,
        before: {
          workerId: record.workerId,
          workerName: existingRecord.worker.fullName,
          workerPhone: existingRecord.worker.phone,
          siteId: record.siteId,
          siteName: existingRecord.site?.name,
          status: record.status,
          checkedInAt: record.checkedInAt,
          date: record.date,
        },
        after: {
          reason: validated.reason, // Why the check-in was canceled
          canceledAt: new Date(),
        },
      },
    });

    return {
      success: true,
      message: `נוכחות עבור ${existingRecord.worker.fullName} בוטלה בהצלחה`,
    };
  } catch (error) {
    console.error('Error undoing check-in:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }

    return {
      success: false,
      error: 'שגיאה בביטול נוכחות',
    };
  }
}

/**
 * Get attendance history with filters
 */
export async function getAttendanceHistory(
  input: z.infer<typeof GetAttendanceHistorySchema>
) {
  try {
    // 1. Validate input
    const validated = GetAttendanceHistorySchema.parse(input);

    // 2. Get current user
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('לא מחובר למערכת');
    }

    // 3. Build where clause
    const where: any = {
      date: {
        gte: new Date(validated.startDate),
        lte: new Date(validated.endDate),
      },
    };

    // Corporation filter
    if (!user.isSuperAdmin) {
      const userCorps = await getUserCorporations(user.id);
      where.corporationId = { in: userCorps };
    }

    // Site filter
    if (validated.siteId) {
      where.siteId = validated.siteId;
    }

    // Worker filter
    if (validated.workerId) {
      where.workerId = validated.workerId;
    }

    // Supervisor-specific filtering
    if (user.role === 'SUPERVISOR' && !user.isSuperAdmin) {
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { legacySupervisorUserId: user.id },
        select: { siteId: true },
      });
      where.siteId = { in: supervisorSites.map((ss) => ss.siteId) };
    }

    // 4. Fetch records with pagination
    const [records, total, auditLogs] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          worker: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              position: true,
            },
          },
          site: {
            select: {
              id: true,
              name: true,
            },
          },
          checkedInBy: {
            select: {
              fullName: true,
            },
          },
          lastEditedBy: {
            select: {
              fullName: true,
            },
          },
        },
        orderBy: [{ date: 'desc' }, { checkedInAt: 'desc' }],
        skip: validated.page * validated.limit,
        take: validated.limit,
      }),
      prisma.attendanceRecord.count({ where }),
      // Fetch audit logs for deleted check-ins and edits
      prisma.auditLog.findMany({
        where: {
          entity: 'attendance_record',
          createdAt: {
            gte: new Date(validated.startDate),
            lte: new Date(validated.endDate + 'T23:59:59'),
          },
          ...(validated.siteId ? {} : {}), // We can't filter by siteId in audit logs directly
          ...(!user.isSuperAdmin ? { corporationId: { in: await getUserCorporations(user.id) } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: validated.limit,
      }),
    ]);

    // 5. Calculate attendance statistics
    const stats = await prisma.attendanceRecord.groupBy({
      by: ['workerId'],
      where,
      _count: {
        status: true,
      },
    });

    return {
      records,
      auditLogs, // Include audit logs for complete history
      pagination: {
        total,
        page: validated.page,
        limit: validated.limit,
        totalPages: Math.ceil(total / validated.limit),
      },
      stats,
    };
  } catch (error) {
    console.error('Error fetching attendance history:', error);
    throw error;
  }
}

/**
 * Helper: Validate corporation access for a user
 */
async function validateCorporationAccess(
  userId: string,
  corporationId: string
): Promise<boolean> {
  const [isManager, isSupervisor] = await Promise.all([
    prisma.corporationManager.findFirst({
      where: {
        userId,
        corporationId,
        isActive: true,
      },
    }),
    prisma.supervisor.findFirst({
      where: {
        userId,
        corporationId,
        isActive: true,
      },
    }),
  ]);

  return !!(isManager || isSupervisor);
}

/**
 * Helper: Get user's corporations
 */
async function getUserCorporations(userId: string): Promise<string[]> {
  const [managerCorps, supervisorCorps] = await Promise.all([
    prisma.corporationManager.findMany({
      where: { userId, isActive: true },
      select: { corporationId: true },
    }),
    prisma.supervisor.findMany({
      where: { userId, isActive: true },
      select: { corporationId: true },
    }),
  ]);

  const corpIds = [
    ...managerCorps.map((m) => m.corporationId),
    ...supervisorCorps.map((s) => s.corporationId),
  ];

  return Array.from(new Set(corpIds));
}
