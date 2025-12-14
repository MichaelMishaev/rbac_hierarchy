import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserCorporations } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    let user;
    try {
      user = await getCurrentUser();
    } catch (authError) {
      console.error('[Map Data API] Authentication error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized - Please log in again' },
        { status: 401 }
      );
    }

    const userCorps = getUserCorporations(user);

    // Fetch all entities based on user permissions
    const [sites, corporations, areaManagers, managers, supervisors, workers] = await Promise.all([
      // Sites with GPS coordinates
      prisma.neighborhood.findMany({
        where: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        include: {
          cityRelation: {
            select: {
              id: true,
              name: true,
            },
          },
          activists: {
            select: {
              id: true,
              fullName: true,
              isActive: true,
            },
          },
          activistCoordinatorAssignments: {
            include: {
              activistCoordinator: {
                include: {
                  user: {
                    select: {
                      id: true,
                      fullName: true,
                      email: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),

      // Corporations
      prisma.city.findMany({
        where: userCorps === 'all' ? {} : { id: { in: userCorps } },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          _count: {
            select: {
              neighborhoods: true,
              coordinators: true,
              activistCoordinators: true,
            },
          },
        },
      }),

      // Area Managers
      user.isSuperAdmin
        ? prisma.areaManager.findMany({
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  email: true,
                  phone: true,
                },
              },
              cities: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : [],

      // City Coordinators
      prisma.cityCoordinator.findMany({
        where: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Activist Coordinators
      prisma.activistCoordinator.findMany({
        where: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          neighborhoodAssignments: {
            include: {
              neighborhood: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  cityRelation: true,
                },
              },
            },
          },
        },
      }),

      // Workers summary (count only, not individual records for performance)
      prisma.activist.groupBy({
        by: ['neighborhoodId', 'isActive'],
        where: {
          neighborhood: userCorps === 'all' ? {} : { cityId: { in: userCorps } },
        },
        _count: true,
      }),
    ]);

    // Calculate worker counts per site
    const workerCountsBySite = workers.reduce((acc, group) => {
      if (!acc[group.neighborhoodId]) {
        acc[group.neighborhoodId] = { active: 0, inactive: 0 };
      }
      if (group.isActive) {
        acc[group.neighborhoodId].active = group._count;
      } else {
        acc[group.neighborhoodId].inactive = group._count;
      }
      return acc;
    }, {} as Record<string, { active: number; inactive: number }>);

    // Format sites for map display
    const formattedSites = sites.map((site) => {
      const activeCount = site.activists.filter(a => a.isActive).length;
      const inactiveCount = site.activists.filter(a => !a.isActive).length;

      return {
        id: site.id,
        name: site.name,
        address: site.address,
        country: site.country,
        latitude: site.latitude,
        longitude: site.longitude,
        phone: site.phone,
        email: site.email,
        isActive: site.isActive,
        city: site.cityRelation,
        activists: {
          active: activeCount,
          inactive: inactiveCount,
          total: site.activists.length,
        },
        activistCoordinators: site.activistCoordinatorAssignments.map((sa: any) => ({
          id: sa.activistCoordinator.id,
          name: sa.activistCoordinator.user?.fullName || 'N/A',
          email: sa.activistCoordinator.user?.email || 'N/A',
        })),
      };
    });

    // Calculate stats
    const stats = {
      totalSites: sites.length,
      activeSites: sites.filter((s) => s.isActive).length,
      totalCorporations: corporations.length,
      activeCorporations: corporations.filter((c) => c.isActive).length,
      totalManagers: managers.length,
      totalSupervisors: supervisors.length,
      totalAreaManagers: areaManagers.length,
      totalWorkers: Object.values(workerCountsBySite).reduce(
        (sum, counts) => sum + counts.active + counts.inactive,
        0
      ),
      activeWorkers: Object.values(workerCountsBySite).reduce(
        (sum, counts) => sum + counts.active,
        0
      ),
    };

    return NextResponse.json({
      neighborhoods: formattedSites,
      cities: corporations,
      areaManagers,
      managers,
      activistCoordinators: supervisors,
      stats,
      user: {
        id: user.id,
        name: user.fullName,
        role: user.role,
        isSuperAdmin: user.isSuperAdmin,
      },
    });
  } catch (error) {
    console.error('Error fetching map data:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch map data' },
      { status: 500 }
    );
  }
}
