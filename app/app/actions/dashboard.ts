'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type DashboardStats = {
  superadmin?: SuperAdminStats;
  manager?: ManagerStats;
  supervisor?: SupervisorStats;
  recentActivity: RecentActivity[];
};

export type SuperAdminStats = {
  totalCorporations: number;
  activeCorporations: number;
  totalManagers: number;
  totalSupervisors: number;
  totalSites: number;
  activeSites: number;
  totalWorkers: number;
  activeWorkers: number;
  pendingInvitations: number;
  recentCorporations: any[];
};

export type ManagerStats = {
  corporation: any;
  totalManagers: number;
  totalSupervisors: number;
  totalSites: number;
  activeSites: number;
  totalWorkers: number;
  activeWorkers: number;
  pendingInvitations: number;
  recentSites: any[];
  topSitesByWorkers: any[];
};

export type SupervisorStats = {
  site: any;
  sites: any[]; // All sites assigned to supervisor
  totalWorkers: number;
  activeWorkers: number;
  inactiveWorkers: number;
  recentWorkers: any[];
  workersByPosition: any[];
};

export type RecentActivity = {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  userEmail: string | null;
  userRole: string | null;
  createdAt: Date;
  oldValue?: any;
  newValue?: any;
};

// ============================================
// GET DASHBOARD STATS
// ============================================

/**
 * Get comprehensive dashboard statistics based on user role
 *
 * Returns different data based on role:
 * - SUPERADMIN: Global system stats
 * - MANAGER: Corporation-specific stats
 * - SUPERVISOR: Site-specific stats
 */
export async function getDashboardStats(): Promise<{
  success: boolean;
  stats?: DashboardStats;
  error?: string;
}> {
  try {
    const currentUser = await getCurrentUser();

    let stats: DashboardStats = {
      recentActivity: [],
    };

    // Get role-specific stats
    if (currentUser.role === 'SUPERADMIN') {
      stats.superadmin = await getSuperAdminStats();
    } else if (currentUser.role === 'MANAGER') {
      stats.manager = await getManagerStats(currentUser.corporationId!);
    } else if (currentUser.role === 'SUPERVISOR') {
      stats.supervisor = await getSupervisorStats(currentUser.id);
    }

    // Get recent activity
    stats.recentActivity = await getRecentActivity(currentUser);

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get dashboard stats',
    };
  }
}

// ============================================
// SUPERADMIN STATS
// ============================================

async function getSuperAdminStats(): Promise<SuperAdminStats> {
  const [
    totalCorporations,
    activeCorporations,
    totalManagers,
    totalSupervisors,
    totalSites,
    activeSites,
    totalWorkers,
    activeWorkers,
    pendingInvitations,
    recentCorporations,
  ] = await Promise.all([
    prisma.corporation.count(),
    prisma.corporation.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: 'MANAGER' } }),
    prisma.user.count({ where: { role: 'SUPERVISOR' } }),
    prisma.site.count(),
    prisma.site.count({ where: { isActive: true } }),
    prisma.worker.count(),
    prisma.worker.count({ where: { isActive: true } }),
    prisma.invitation.count({ where: { status: 'PENDING' } }),
    prisma.corporation.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            managers: true,
            sites: true,
          },
        },
      },
    }),
  ]);

  return {
    totalCorporations,
    activeCorporations,
    totalManagers,
    totalSupervisors,
    totalSites,
    activeSites,
    totalWorkers,
    activeWorkers,
    pendingInvitations,
    recentCorporations,
  };
}

// ============================================
// MANAGER STATS
// ============================================

async function getManagerStats(corporationId: string): Promise<ManagerStats> {
  const [
    corporation,
    totalManagers,
    totalSupervisors,
    totalSites,
    activeSites,
    totalWorkers,
    activeWorkers,
    pendingInvitations,
    recentSites,
    topSitesByWorkers,
  ] = await Promise.all([
    prisma.corporation.findUnique({
      where: { id: corporationId },
      include: {
        _count: {
          select: {
            managers: true,
            sites: true,
            invitations: true,
          },
        },
      },
    }),
    prisma.user.count({
      where: {
        corporationId,
        role: 'MANAGER',
      },
    }),
    prisma.user.count({
      where: {
        corporationId,
        role: 'SUPERVISOR',
      },
    }),
    prisma.site.count({
      where: { corporationId },
    }),
    prisma.site.count({
      where: {
        corporationId,
        isActive: true,
      },
    }),
    prisma.worker.count({
      where: {
        site: {
          corporationId,
        },
      },
    }),
    prisma.worker.count({
      where: {
        isActive: true,
        site: {
          corporationId,
        },
      },
    }),
    prisma.invitation.count({
      where: {
        corporationId,
        status: 'PENDING',
      },
    }),
    prisma.site.findMany({
      where: { corporationId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
          },
        },
      },
    }),
    prisma.site.findMany({
      where: { corporationId },
      orderBy: {
        workers: {
          _count: 'desc',
        },
      },
      take: 5,
      select: {
        id: true,
        name: true,
        city: true,
        isActive: true,
        _count: {
          select: {
            workers: true,
            supervisorAssignments: true,
          },
        },
      },
    }),
  ]);

  return {
    corporation,
    totalManagers,
    totalSupervisors,
    totalSites,
    activeSites,
    totalWorkers,
    activeWorkers,
    pendingInvitations,
    recentSites,
    topSitesByWorkers,
  };
}

// ============================================
// SUPERVISOR STATS
// ============================================

async function getSupervisorStats(supervisorId: string): Promise<SupervisorStats> {
  // Get supervisor's assigned sites
  const supervisorSites = await prisma.supervisorSite.findMany({
    where: { supervisorId },
    select: { siteId: true },
  });

  const siteIds = supervisorSites.map((ss) => ss.siteId);

  // If no sites assigned, return empty stats
  if (siteIds.length === 0) {
    return {
      site: null,
      sites: [],
      totalWorkers: 0,
      activeWorkers: 0,
      inactiveWorkers: 0,
      recentWorkers: [],
      workersByPosition: [],
    };
  }

  // Get stats across all assigned sites
  const [
    sites,
    totalWorkers,
    activeWorkers,
    inactiveWorkers,
    recentWorkers,
    workersByPosition,
  ] = await Promise.all([
    prisma.site.findMany({
      where: { id: { in: siteIds } },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
          },
        },
      },
    }),
    prisma.worker.count({
      where: { siteId: { in: siteIds } },
    }),
    prisma.worker.count({
      where: {
        siteId: { in: siteIds },
        isActive: true,
      },
    }),
    prisma.worker.count({
      where: {
        siteId: { in: siteIds },
        isActive: false,
      },
    }),
    prisma.worker.findMany({
      where: { siteId: { in: siteIds } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        position: true,
        phone: true,
        isActive: true,
        startDate: true,
        createdAt: true,
      },
    }),
    prisma.worker.groupBy({
      by: ['position'],
      where: {
        siteId: { in: siteIds },
        isActive: true,
      },
      _count: {
        position: true,
      },
      orderBy: {
        _count: {
          position: 'desc',
        },
      },
      take: 5,
    }),
  ]);

  return {
    site: sites.length > 0 ? sites[0] : null, // Return first site for backwards compatibility
    sites, // Also include all sites
    totalWorkers,
    activeWorkers,
    inactiveWorkers,
    recentWorkers,
    workersByPosition: workersByPosition.map((item) => ({
      position: item.position || 'Unspecified',
      count: item._count.position,
    })),
  };
}

// ============================================
// RECENT ACTIVITY
// ============================================

async function getRecentActivity(currentUser: any): Promise<RecentActivity[]> {
  const where: any = {};

  // Filter activity based on role
  if (currentUser.role === 'MANAGER') {
    // Managers see activity from their corporation (via userId)
    where.userId = {
      in: await prisma.user
        .findMany({
          where: { corporationId: currentUser.corporationId },
          select: { id: true },
        })
        .then((users) => users.map((u) => u.id)),
    };
  } else if (currentUser.role === 'SUPERVISOR') {
    // Supervisors see only their own activity
    where.userId = currentUser.id;
  }

  const activities = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 20,
    select: {
      id: true,
      action: true,
      entity: true,
      entityId: true,
      userEmail: true,
      userRole: true,
      createdAt: true,
      oldValue: true,
      newValue: true,
    },
  });

  return activities;
}

// ============================================
// GET SYSTEM OVERVIEW
// ============================================

/**
 * Get high-level system overview (for homepage/admin)
 *
 * Permissions: SUPERADMIN only
 */
export async function getSystemOverview() {
  try {
    const currentUser = await getCurrentUser();

    if (currentUser.role !== 'SUPERADMIN') {
      return {
        success: false,
        error: 'Unauthorized: SuperAdmin access required',
      };
    }

    const [
      totalCorporations,
      totalUsers,
      totalSites,
      totalWorkers,
      totalInvitations,
      recentActivity,
      corporationGrowth,
    ] = await Promise.all([
      prisma.corporation.count(),
      prisma.user.count(),
      prisma.site.count(),
      prisma.worker.count(),
      prisma.invitation.count({ where: { status: 'PENDING' } }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          action: true,
          entity: true,
          userEmail: true,
          createdAt: true,
        },
      }),
      // Corporation growth over last 6 months
      prisma.corporation.groupBy({
        by: ['createdAt'],
        _count: {
          id: true,
        },
        where: {
          createdAt: {
            gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
          },
        },
      }),
    ]);

    return {
      success: true,
      overview: {
        totalCorporations,
        totalUsers,
        totalSites,
        totalWorkers,
        totalInvitations,
        recentActivity,
        corporationGrowth,
      },
    };
  } catch (error) {
    console.error('Error getting system overview:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get system overview',
    };
  }
}

// ============================================
// GET ANALYTICS DATA
// ============================================

/**
 * Get analytics data for charts and graphs
 *
 * Permissions: Based on role
 */
export async function getAnalyticsData(timeRange: 'week' | 'month' | 'year' = 'month') {
  try {
    const currentUser = await getCurrentUser();

    // Calculate date range
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Build filter based on role
    const where: any = {
      createdAt: {
        gte: startDate,
        lte: now,
      },
    };

    if (currentUser.role === 'MANAGER') {
      // Filter by corporation
      where.userId = {
        in: await prisma.user
          .findMany({
            where: { corporationId: currentUser.corporationId },
            select: { id: true },
          })
          .then((users) => users.map((u) => u.id)),
      };
    } else if (currentUser.role === 'SUPERVISOR') {
      // Only supervisor's own actions
      where.userId = currentUser.id;
    }

    // Get activity by action type
    const activityByAction = await prisma.auditLog.groupBy({
      by: ['action'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get activity by entity type
    const activityByEntity = await prisma.auditLog.groupBy({
      by: ['entity'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
    });

    // Get daily activity trend
    const dailyActivity = await prisma.auditLog.groupBy({
      by: ['createdAt'],
      where,
      _count: {
        id: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      success: true,
      analytics: {
        timeRange,
        startDate,
        endDate: now,
        activityByAction: activityByAction.map((item) => ({
          action: item.action,
          count: item._count.id,
        })),
        activityByEntity: activityByEntity.map((item) => ({
          entity: item.entity,
          count: item._count.id,
        })),
        dailyActivity: dailyActivity.map((item) => ({
          date: item.createdAt,
          count: item._count.id,
        })),
      },
    };
  } catch (error) {
    console.error('Error getting analytics data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get analytics data',
    };
  }
}

// ============================================
// GET QUICK STATS
// ============================================

/**
 * Get quick stats for dashboard cards (optimized for performance)
 *
 * Permissions: Based on role
 */
export async function getQuickStats() {
  try {
    const currentUser = await getCurrentUser();

    let stats = {};

    if (currentUser.role === 'SUPERADMIN') {
      const [corporations, users, sites, workers] = await Promise.all([
        prisma.corporation.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.site.count({ where: { isActive: true } }),
        prisma.worker.count({ where: { isActive: true } }),
      ]);

      stats = { corporations, users, sites, workers };
    } else if (currentUser.role === 'MANAGER') {
      if (!currentUser.corporationId) {
        return {
          success: false,
          error: 'Manager must be assigned to a corporation',
        };
      }

      const [managers, supervisors, sites, workers] = await Promise.all([
        prisma.user.count({
          where: { corporationId: currentUser.corporationId, role: 'MANAGER' },
        }),
        prisma.user.count({
          where: { corporationId: currentUser.corporationId, role: 'SUPERVISOR' },
        }),
        prisma.site.count({
          where: { corporationId: currentUser.corporationId, isActive: true },
        }),
        prisma.worker.count({
          where: {
            isActive: true,
            site: { corporationId: currentUser.corporationId },
          },
        }),
      ]);

      stats = { managers, supervisors, sites, workers };
    } else if (currentUser.role === 'SUPERVISOR') {
      // Get supervisor's assigned sites
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { supervisorId: currentUser.id },
        select: { siteId: true },
      });

      const siteIds = supervisorSites.map((ss) => ss.siteId);

      if (siteIds.length === 0) {
        return {
          success: false,
          error: 'Supervisor must be assigned to at least one site',
        };
      }

      const [totalWorkers, activeWorkers, todayWorkers] = await Promise.all([
        prisma.worker.count({ where: { siteId: { in: siteIds } } }),
        prisma.worker.count({
          where: { siteId: { in: siteIds }, isActive: true },
        }),
        prisma.worker.count({
          where: {
            siteId: { in: siteIds },
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      ]);

      stats = { totalWorkers, activeWorkers, todayWorkers };
    }

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error('Error getting quick stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get quick stats',
    };
  }
}
