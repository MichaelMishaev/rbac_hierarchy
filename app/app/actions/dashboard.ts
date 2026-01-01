'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserCorporations } from '@/lib/auth';
import { unstable_cache } from 'next/cache';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

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
  totalCities: number;
  activeCities: number;
  totalManagers: number;
  totalSupervisors: number;
  totalAreaManagers: number;
  totalNeighborhoods: number;
  activeNeighborhoods: number;
  totalActivists: number;
  activeActivists: number;
  pendingInvitations: number;
  recentCities: any[];
};

export type ManagerStats = {
  cityRelation: any;
  totalManagers: number;
  totalSupervisors: number;
  totalNeighborhoods: number;
  activeNeighborhoods: number;
  totalActivists: number;
  activeActivists: number;
  pendingInvitations: number;
  recentNeighborhoods: any[];
  topNeighborhoodsByActivists: any[];
};

export type SupervisorStats = {
  neighborhood: any;
  neighborhoods: any[]; // All sites assigned to supervisor
  totalActivists: number;
  activeActivists: number;
  inactiveActivists: number;
  recentActivists: any[];
  activistsByPosition: any[];
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
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    const stats: DashboardStats = {
      recentActivity: [],
    };

    // Get role-specific stats (using CACHED versions for speed)
    if (currentUser.role === 'SUPERADMIN') {
      stats.superadmin = await getCachedSuperAdminStats();
    } else if (currentUser.role === 'CITY_COORDINATOR') {
      // Get first city ID for coordinator
      const coordinator = await prisma.cityCoordinator.findFirst({
        where: { userId: currentUser.id },
        select: { cityId: true },
      });
      if (coordinator) {
        stats.manager = await getCachedManagerStats(coordinator.cityId);
      }
    } else if (currentUser.role === 'AREA_MANAGER') {
      // Get ALL cities for area manager and aggregate stats
      const areaManager = await prisma.areaManager.findFirst({
        where: { userId: currentUser.id },
        include: { cities: { select: { id: true } } },
      });
      if (areaManager && areaManager.cities.length > 0) {
        const cityIds = areaManager.cities.map(c => c.id);
        stats.manager = await getCachedAreaManagerStats(cityIds);
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      stats.supervisor = await getCachedSupervisorStats(currentUser.id);
    }

    // Get recent activity
    stats.recentActivity = await getRecentActivity(currentUser);

    return {
      success: true,
      stats,
    };
  }, 'getDashboardStats');
}

// ============================================
// CACHED STATS FUNCTIONS (Performance Optimization)
// ============================================

/**
 * Cached version of SuperAdmin stats - revalidates every 30 seconds
 * This dramatically improves dashboard navigation speed by avoiding 11 database queries
 */
const getCachedSuperAdminStats = unstable_cache(
  async () => getSuperAdminStatsUncached(),
  ['dashboard-superadmin-stats'],
  {
    revalidate: 30, // Cache for 30 seconds
    tags: ['dashboard', 'superadmin-stats']
  }
);

/**
 * Cached version of Manager stats - revalidates every 30 seconds
 * Accepts cityId as parameter for cache key
 */
const getCachedManagerStats = unstable_cache(
  async (cityId: string) => getManagerStatsUncached(cityId),
  ['dashboard-manager-stats'],
  {
    revalidate: 30,
    tags: ['dashboard', 'manager-stats']
  }
);

/**
 * Cached version of Supervisor stats - revalidates every 30 seconds
 * Accepts userId as parameter for cache key
 */
const getCachedSupervisorStats = unstable_cache(
  async (userId: string) => getSupervisorStatsUncached(userId),
  ['dashboard-supervisor-stats'],
  {
    revalidate: 30,
    tags: ['dashboard', 'supervisor-stats']
  }
);

/**
 * Cached version of Area Manager stats - revalidates every 30 seconds
 * Aggregates stats across multiple cities
 */
const getCachedAreaManagerStats = unstable_cache(
  async (cityIds: string[]) => getAreaManagerStatsUncached(cityIds),
  ['dashboard-area-manager-stats'],
  {
    revalidate: 30,
    tags: ['dashboard', 'area-manager-stats']
  }
);

// ============================================
// SUPERADMIN STATS
// ============================================

async function getSuperAdminStatsUncached(): Promise<SuperAdminStats> {
  const [
    totalCities,
    activeCities,
    totalManagers,
    totalSupervisors,
    totalAreaManagers,
    totalNeighborhoods,
    activeNeighborhoods,
    totalActivists,
    activeActivists,
    pendingInvitations,
    recentCities,
  ] = await Promise.all([
    prisma.city.count(),
    prisma.city.count({ where: { isActive: true } }),
    prisma.cityCoordinator.count(),
    prisma.activistCoordinator.count(),
    prisma.areaManager.count(),
    prisma.neighborhood.count(),
    prisma.neighborhood.count({ where: { isActive: true } }),
    prisma.activist.count(),
    prisma.activist.count({ where: { isActive: true } }),
    prisma.invitation.count({ where: { status: 'PENDING' } }),
    prisma.city.findMany({
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            coordinators: true,
            neighborhoods: true,
          },
        },
      },
    }),
  ]);

  return {
    totalCities,
    activeCities,
    totalManagers,
    totalSupervisors,
    totalAreaManagers,
    totalNeighborhoods,
    activeNeighborhoods,
    totalActivists,
    activeActivists,
    pendingInvitations,
    recentCities,
  };
}

// ============================================
// MANAGER STATS
// ============================================

async function getManagerStatsUncached(cityId: string): Promise<ManagerStats> {
  const [
    corporation,
    totalManagers,
    totalSupervisors,
    totalNeighborhoods,
    activeNeighborhoods,
    totalActivists,
    activeActivists,
    pendingInvitations,
    recentNeighborhoods,
    topNeighborhoodsByActivists,
  ] = await Promise.all([
    prisma.city.findUnique({
      where: { id: cityId },
      include: {
        _count: {
          select: {
            coordinators: true,
            neighborhoods: true,
            invitations: true,
          },
        },
      },
    }),
    prisma.cityCoordinator.count({
      where: {
        cityId,
      },
    }),
    prisma.activistCoordinator.count({
      where: {
        cityId,
      },
    }),
    prisma.neighborhood.count({
      where: { cityId },
    }),
    prisma.neighborhood.count({
      where: {
        cityId,
        isActive: true,
      },
    }),
    prisma.activist.count({
      where: {
        neighborhood: {
          cityId,
        },
      },
    }),
    prisma.activist.count({
      where: {
        isActive: true,
        neighborhood: {
          cityId,
        },
      },
    }),
    prisma.invitation.count({
      where: {
        cityId,
        status: 'PENDING',
      },
    }),
    prisma.neighborhood.findMany({
      where: { cityId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        _count: {
          select: {
            activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
    }),
    prisma.neighborhood.findMany({
      where: { cityId },
      orderBy: {
        activists: {
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
            activists: true,
            activistCoordinatorAssignments: true,
          },
        },
      },
    }),
  ]);

  return {
    cityRelation: corporation,
    totalManagers,
    totalSupervisors,
    totalNeighborhoods,
    activeNeighborhoods,
    totalActivists,
    activeActivists,
    pendingInvitations,
    recentNeighborhoods,
    topNeighborhoodsByActivists,
  };
}

// ============================================
// AREA MANAGER STATS (AGGREGATED ACROSS CITIES)
// ============================================

async function getAreaManagerStatsUncached(cityIds: string[]): Promise<ManagerStats> {
  const [
    totalManagers,
    totalSupervisors,
    totalNeighborhoods,
    activeNeighborhoods,
    totalActivists,
    activeActivists,
    pendingInvitations,
    recentNeighborhoods,
    topNeighborhoodsByActivists,
  ] = await Promise.all([
    prisma.cityCoordinator.count({
      where: {
        cityId: { in: cityIds },
      },
    }),
    prisma.activistCoordinator.count({
      where: {
        cityId: { in: cityIds },
      },
    }),
    prisma.neighborhood.count({
      where: { cityId: { in: cityIds } },
    }),
    prisma.neighborhood.count({
      where: {
        cityId: { in: cityIds },
        isActive: true,
      },
    }),
    prisma.activist.count({
      where: {
        neighborhood: {
          cityId: { in: cityIds },
        },
      },
    }),
    prisma.activist.count({
      where: {
        isActive: true,
        neighborhood: {
          cityId: { in: cityIds },
        },
      },
    }),
    prisma.invitation.count({
      where: {
        cityId: { in: cityIds },
        status: 'PENDING',
      },
    }),
    prisma.neighborhood.findMany({
      where: { cityId: { in: cityIds } },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        cityRelation: {
          select: {
            name: true,
          },
        },
        _count: {
          select: {
            activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
    }),
    prisma.neighborhood.findMany({
      where: { cityId: { in: cityIds } },
      orderBy: {
        activists: {
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
            activists: true,
            activistCoordinatorAssignments: true,
          },
        },
      },
    }),
  ]);

  return {
    cityRelation: null, // Area Manager doesn't have a single city
    totalManagers,
    totalSupervisors,
    totalNeighborhoods,
    activeNeighborhoods,
    totalActivists,
    activeActivists,
    pendingInvitations,
    recentNeighborhoods,
    topNeighborhoodsByActivists,
  };
}

// ============================================
// SUPERVISOR STATS
// ============================================

async function getSupervisorStatsUncached(userId: string): Promise<SupervisorStats> {
  // ✅ SECURITY FIX (VULN-RBAC-003): Fix M2M query using correct FK
  const activistCoordinator = await prisma.activistCoordinator.findFirst({
    where: { userId },
  });

  if (!activistCoordinator) {
    return {
      neighborhood: null,
      neighborhoods: [],
      totalActivists: 0,
      activeActivists: 0,
      inactiveActivists: 0,
      recentActivists: [],
      activistsByPosition: [],
    };
  }

  // Get supervisor's assigned sites
  const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
    where: { activistCoordinatorId: activistCoordinator.id },
    select: { neighborhoodId: true },
  });

  const siteIds = activistCoordinatorNeighborhoods.map((ss) => ss.neighborhoodId);

  // If no sites assigned, return empty stats
  if (siteIds.length === 0) {
    return {
      neighborhood: null,
      neighborhoods: [],
      totalActivists: 0,
      activeActivists: 0,
      inactiveActivists: 0,
      recentActivists: [],
      activistsByPosition: [],
    };
  }

  // Get stats across all assigned sites
  const [
    sites,
    totalActivists,
    activeActivists,
    inactiveActivists,
    recentActivists,
    activistsByPosition,
  ] = await Promise.all([
    prisma.neighborhood.findMany({
      where: { id: { in: siteIds } },
      include: {
        cityRelation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
    }),
    prisma.activist.count({
      where: { neighborhoodId: { in: siteIds } },
    }),
    prisma.activist.count({
      where: {
        neighborhoodId: { in: siteIds },
        isActive: true,
      },
    }),
    prisma.activist.count({
      where: {
        neighborhoodId: { in: siteIds },
        isActive: false,
      },
    }),
    prisma.activist.findMany({
      where: { neighborhoodId: { in: siteIds } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        fullName: true,
        position: true,
        phone: true,
        isActive: true,
        startDate: true,
        createdAt: true,
      },
    }),
    prisma.activist.groupBy({
      by: ['position'],
      where: {
        neighborhoodId: { in: siteIds },
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
    neighborhood: sites.length > 0 ? sites[0] : null, // Return first site for backwards compatibility
    neighborhoods: sites, // Also include all sites
    totalActivists,
    activeActivists,
    inactiveActivists,
    recentActivists,
    activistsByPosition: activistsByPosition.map((item) => ({
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
  const userCorps = getUserCorporations(currentUser);
  if (userCorps !== 'all') {
    // Get all user IDs in these corporations
    const [managers, supervisors] = await Promise.all([
      prisma.cityCoordinator.findMany({
        where: { cityId: { in: userCorps } },
        select: { userId: true },
      }),
      prisma.activistCoordinator.findMany({
        where: { cityId: { in: userCorps } },
        select: { userId: true },
      }),
    ]);

    const userIds = [...new Set([
      ...managers.map(m => m.userId),
      ...supervisors.map(s => s.userId),
    ])];

    where.userId = { in: userIds };
  }

  if (currentUser.role === 'ACTIVIST_COORDINATOR') {
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
      before: true,
      after: true,
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
  return withServerActionErrorHandler(async () => {
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
      prisma.city.count(),
      prisma.user.count(),
      prisma.neighborhood.count(),
      prisma.activist.count(),
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
      prisma.city.groupBy({
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
  }, 'getSystemOverview');
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
  return withServerActionErrorHandler(async () => {
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

    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      // Filter by corporation
      const [managers, supervisors] = await Promise.all([
        prisma.cityCoordinator.findMany({
          where: { cityId: { in: userCorps } },
          select: { userId: true },
        }),
        prisma.activistCoordinator.findMany({
          where: { cityId: { in: userCorps } },
          select: { userId: true },
        }),
      ]);

      const userIds = [...new Set([
        ...managers.map(m => m.userId),
        ...supervisors.map(s => s.userId),
      ])];

      where.userId = { in: userIds };
    }

    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
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
  }, 'getAnalyticsData');
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
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    let stats = {};

    if (currentUser.role === 'SUPERADMIN') {
      const [corporations, users, sites, workers] = await Promise.all([
        prisma.city.count({ where: { isActive: true } }),
        prisma.user.count(),
        prisma.neighborhood.count({ where: { isActive: true } }),
        prisma.activist.count({ where: { isActive: true } }),
      ]);

      stats = { corporations, users, sites, workers };
    } else if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      const userCorps = getUserCorporations(currentUser);

      if (!Array.isArray(userCorps) || userCorps.length === 0) {
        return {
          success: false,
          error: 'Manager must be assigned to a corporation',
        };
      }

      const [managers, supervisors, sites, workers] = await Promise.all([
        prisma.cityCoordinator.count({
          where: { cityId: { in: userCorps } },
        }),
        prisma.activistCoordinator.count({
          where: { cityId: { in: userCorps } },
        }),
        prisma.neighborhood.count({
          where: { cityId: { in: userCorps }, isActive: true },
        }),
        prisma.activist.count({
          where: {
            isActive: true,
            neighborhood: { cityId: { in: userCorps } },
          },
        }),
      ]);

      stats = { managers, supervisors, sites, workers };
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // ✅ SECURITY FIX (VULN-RBAC-003): Fix M2M query using correct FK
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          success: false,
          error: 'רשומת רכז פעילים לא נמצאה',
        };
      }

      // Get supervisor's assigned sites
      const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { activistCoordinatorId: activistCoordinator.id },
        select: { neighborhoodId: true },
      });

      const siteIds = activistCoordinatorNeighborhoods.map((ss) => ss.neighborhoodId);

      if (siteIds.length === 0) {
        return {
          success: false,
          error: 'Supervisor must be assigned to at least one site',
        };
      }

      const [totalWorkers, activeWorkers, todayWorkers] = await Promise.all([
        prisma.activist.count({ where: { neighborhoodId: { in: siteIds } } }),
        prisma.activist.count({
          where: { neighborhoodId: { in: siteIds }, isActive: true },
        }),
        prisma.activist.count({
          where: {
            neighborhoodId: { in: siteIds },
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
  }, 'getQuickStats');
}
