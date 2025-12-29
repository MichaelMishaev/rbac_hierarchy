'use server';

/**
 * Attendance Server Actions
 * Handles activist check-in, check-out, and attendance history
 */

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
import {
  validateTimeWindow,
  getTodayDateInIsrael,
  isToday,
  getTimeWindowErrorMessage,
} from '@/lib/attendance';
import { AttendanceStatus, Prisma } from '@prisma/client';

/**
 * Validation Schemas
 */
const CheckInActivistSchema = z.object({
  activistId: z.string().uuid('מזהה פעיל לא תקין'),
  neighborhoodId: z.string().min(1, 'מזהה שכונה לא תקין'),
  notes: z.string().max(500, 'הערות ארוכות מדי (מקסימום 500 תווים)').optional(),
});

const UndoCheckInSchema = z.object({
  activistId: z.string().uuid('מזהה פעיל לא תקין'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'פורמט תאריך לא תקין'),
  reason: z.string().min(1, 'נא לציין סיבה לביטול').max(500, 'סיבה ארוכה מדי'),
});

const GetAttendanceHistorySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  neighborhoodId: z.string().min(1).optional(),
  activistId: z.string().uuid().optional(),
  page: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(1000).default(50),
});

/**
 * Check in an activist
 */
export async function checkInActivist(input: z.infer<typeof CheckInActivistSchema>) {
  try {
    // 1. Validate input
    const validated = CheckInActivistSchema.parse(input);

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

    // 4. Get activist to validate existence and get city
    const activist = await prisma.activist.findUnique({
      where: { id: validated.activistId },
      select: {
        id: true,
        fullName: true,
        cityId: true,
        neighborhoodId: true,
      },
    });

    if (!activist) {
      return {
        success: false,
        error: 'פעיל לא נמצא',
      };
    }

    // 5. Validate city access
    if (!user.isSuperAdmin) {
      // For non-superadmin users, verify they have access to this city
      const hasAccess = await validateCityAccess(user.id, activist.cityId);
      if (!hasAccess) {
        return {
          success: false,
          error: 'אין לך הרשאה לעיר זו',
        };
      }
    }

    // 6. For activist coordinators, validate neighborhood access
    if (user.role === 'ACTIVIST_COORDINATOR' && !user.isSuperAdmin) {
      const hasNeighborhoodAccess = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          legacyActivistCoordinatorUserId: user.id,
          neighborhoodId: validated.neighborhoodId,
        },
      });

      if (!hasNeighborhoodAccess) {
        return {
          success: false,
          error: 'אין לך הרשאה לשכונה זו',
        };
      }
    }

    // 7. Check if record already exists (for audit logging)
    const today = getTodayDateInIsrael();
    const existingRecord = await prisma.attendanceRecord.findUnique({
      where: {
        activistId_date: {
          activistId: validated.activistId,
          date: new Date(today),
        },
      },
    });

    const isUpdate = !!existingRecord;
    const now = new Date();

    // 8. Upsert attendance record (handle duplicates)
    const record = await prisma.attendanceRecord.upsert({
      where: {
        activistId_date: {
          activistId: validated.activistId,
          date: new Date(today),
        },
      },
      update: {
        checkedInAt: now,
        status: AttendanceStatus.PRESENT,
        lastEditedById: user.id,
        lastEditedAt: now,
        editReason: validated.notes ?? null,
        notes: validated.notes ?? null,
      },
      create: {
        activistId: validated.activistId,
        neighborhoodId: validated.neighborhoodId,
        cityId: activist.cityId,
        date: new Date(today),
        checkedInAt: now,
        status: AttendanceStatus.PRESENT,
        checkedInById: user.id,
        notes: validated.notes ?? null,
      },
      include: {
        activist: {
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
        cityId: activist.cityId,
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
        activistName: record.activist.fullName,
        checkedInAt: record.checkedInAt,
        status: record.status,
      },
    };
  } catch (error) {
    console.error('Error checking in activist:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? 'שגיאת אימות',
      };
    }

    return {
      success: false,
      error: 'שגיאה בסימון נוכחות',
    };
  }
}

/**
 * Get today's attendance for a neighborhood or all neighborhoods (UNCACHED)
 * Optimized to eliminate duplicate queries
 */
async function getTodaysAttendanceUncached(userId: string, userRole: string, isSuperAdmin: boolean, neighborhoodId?: string) {
  const today = getTodayDateInIsrael();

  // OPTIMIZATION: Fetch user cities and coordinator neighborhoods ONCE at the start
  let userCities: string[] = [];
  let coordinatorNeighborhoodIds: string[] = [];

  if (!isSuperAdmin) {
    userCities = await getUserCities(userId);
  }

  if (userRole === 'ACTIVIST_COORDINATOR' && !isSuperAdmin) {
    const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
      where: { legacyActivistCoordinatorUserId: userId },
      select: { neighborhoodId: true },
    });
    coordinatorNeighborhoodIds = activistCoordinatorNeighborhoods.map((acn) => acn.neighborhoodId);

    // Validate neighborhood access if specific neighborhood requested
    if (neighborhoodId && !coordinatorNeighborhoodIds.includes(neighborhoodId)) {
      throw new Error('אין לך הרשאה לשכונה זו');
    }
  }

  // Build where clause for attendance records
  const attendanceWhere: any = {
    date: new Date(today),
  };

  if (!isSuperAdmin) {
    attendanceWhere.cityId = { in: userCities };
  }

  if (neighborhoodId) {
    attendanceWhere.neighborhoodId = neighborhoodId;
  } else if (userRole === 'ACTIVIST_COORDINATOR' && !isSuperAdmin) {
    attendanceWhere.neighborhoodId = { in: coordinatorNeighborhoodIds };
  }

  // Fetch attendance records
  const records = await prisma.attendanceRecord.findMany({
    where: attendanceWhere,
    include: {
      activist: {
        select: {
          id: true,
          fullName: true,
          phone: true,
          position: true,
          avatarUrl: true,
        },
      },
      neighborhood: {
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

  // Get activists who haven't been checked in
  const checkedInActivistIds = records.map((r) => r.activistId);

  const uncheckedActivistsWhere: any = {
    isActive: true,
    id: { notIn: checkedInActivistIds },
  };

  // OPTIMIZATION: Reuse userCities and coordinatorNeighborhoodIds instead of re-querying
  if (neighborhoodId) {
    uncheckedActivistsWhere.neighborhoodId = neighborhoodId;
  } else if (userRole === 'ACTIVIST_COORDINATOR' && !isSuperAdmin) {
    uncheckedActivistsWhere.neighborhoodId = { in: coordinatorNeighborhoodIds };
  }

  if (!isSuperAdmin) {
    uncheckedActivistsWhere.cityId = { in: userCities };
  }

  const uncheckedActivists = await prisma.activist.findMany({
    where: uncheckedActivistsWhere,
    select: {
      id: true,
      fullName: true,
      phone: true,
      position: true,
      avatarUrl: true,
      neighborhoodId: true,
      neighborhood: {
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
    notCheckedIn: uncheckedActivists,
    summary: {
      total: records.length + uncheckedActivists.length,
      present: records.filter((r) => r.status === AttendanceStatus.PRESENT).length,
      notPresent: uncheckedActivists.length,
      date: today,
    },
  };
}

/**
 * Cached wrapper for getTodaysAttendance
 * Cache for 30 seconds to balance freshness with performance
 */
const getCachedTodaysAttendance = unstable_cache(
  async (userId: string, userRole: string, isSuperAdmin: boolean, neighborhoodId?: string) =>
    getTodaysAttendanceUncached(userId, userRole, isSuperAdmin, neighborhoodId),
  ['attendance-today'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['attendance', 'todays-attendance']
  }
);

/**
 * Get today's attendance for a neighborhood or all neighborhoods
 * PUBLIC API - uses caching for performance
 */
export async function getTodaysAttendance(neighborhoodId?: string) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      throw new Error('לא מחובר למערכת');
    }

    // Use cached version with user params as cache keys
    return await getCachedTodaysAttendance(user.id, user.role, user.isSuperAdmin, neighborhoodId);
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
        activistId_date: {
          activistId: validated.activistId,
          date: new Date(validated.date),
        },
      },
      include: {
        activist: {
          select: {
            cityId: true,
            fullName: true,
            phone: true,
          },
        },
        neighborhood: {
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
      const hasAccess = await validateCityAccess(
        user.id,
        existingRecord.activist.cityId
      );
      if (!hasAccess) {
        return {
          success: false,
          error: 'אין לך הרשאה לעיר זו',
        };
      }
    }

    // 6. Soft-cancel the record (preserves immutability - INV-DATA-003)
    // ✅ SECURITY FIX: Update instead of delete to preserve audit trail
    const record = await prisma.attendanceRecord.update({
      where: {
        activistId_date: {
          activistId: validated.activistId,
          date: new Date(validated.date),
        },
      },
      data: {
        status: 'NOT_PRESENT',
        notes: `ביטול: ${validated.reason}`,
        cancelledAt: new Date(),
        cancelledBy: user.id,
        lastEditedById: user.id,
        lastEditedAt: new Date(),
        editReason: validated.reason,
      },
    });

    // 7. Audit log with cancellation reason
    await prisma.auditLog.create({
      data: {
        action: 'CANCEL_ATTENDANCE',
        entity: 'attendance_record',
        entityId: record.id,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        cityId: existingRecord.activist.cityId,
        before: {
          activistId: record.activistId,
          activistName: existingRecord.activist.fullName,
          activistPhone: existingRecord.activist.phone,
          neighborhoodId: record.neighborhoodId,
          neighborhoodName: existingRecord.neighborhood?.name,
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
      message: `נוכחות עבור ${existingRecord.activist.fullName} בוטלה בהצלחה`,
    };
  } catch (error) {
    console.error('Error undoing check-in:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message ?? 'שגיאת אימות',
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

    // City filter
    if (!user.isSuperAdmin) {
      const userCities = await getUserCities(user.id);
      where.cityId = { in: userCities };
    }

    // Neighborhood filter
    if (validated.neighborhoodId) {
      where.neighborhoodId = validated.neighborhoodId;
    }

    // Activist filter
    if (validated.activistId) {
      where.activistId = validated.activistId;
    }

    // Activist coordinator-specific filtering
    if (user.role === 'ACTIVIST_COORDINATOR' && !user.isSuperAdmin) {
      const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { legacyActivistCoordinatorUserId: user.id },
        select: { neighborhoodId: true },
      });
      where.neighborhoodId = { in: activistCoordinatorNeighborhoods.map((acn) => acn.neighborhoodId) };
    }

    // 4. Fetch records with pagination
    const [records, total, auditLogs] = await Promise.all([
      prisma.attendanceRecord.findMany({
        where,
        include: {
          activist: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              position: true,
            },
          },
          neighborhood: {
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
          ...(validated.neighborhoodId ? {} : {}), // We can't filter by neighborhoodId in audit logs directly
          ...(!user.isSuperAdmin ? { cityId: { in: await getUserCities(user.id) } } : {}),
        },
        orderBy: { createdAt: 'desc' },
        take: validated.limit,
      }),
    ]);

    // 5. Calculate attendance statistics
    const stats = await prisma.attendanceRecord.groupBy({
      by: ['activistId'],
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
 * Helper: Validate city access for a user
 */
async function validateCityAccess(
  userId: string,
  cityId: string
): Promise<boolean> {
  const [isCityCoordinator, isActivistCoordinator] = await Promise.all([
    prisma.cityCoordinator.findFirst({
      where: {
        userId,
        cityId,
        isActive: true,
      },
    }),
    prisma.activistCoordinator.findFirst({
      where: {
        userId,
        cityId,
        isActive: true,
      },
    }),
  ]);

  return !!(isCityCoordinator || isActivistCoordinator);
}

/**
 * Helper: Get user's cities
 */
async function getUserCities(userId: string): Promise<string[]> {
  const [cityCoordinatorCities, activistCoordinatorCities] = await Promise.all([
    prisma.cityCoordinator.findMany({
      where: { userId, isActive: true },
      select: { cityId: true },
    }),
    prisma.activistCoordinator.findMany({
      where: { userId, isActive: true },
      select: { cityId: true },
    }),
  ]);

  const cityIds = [
    ...cityCoordinatorCities.map((m) => m.cityId),
    ...activistCoordinatorCities.map((s) => s.cityId),
  ];

  return Array.from(new Set(cityIds));
}
