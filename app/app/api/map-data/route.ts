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
      prisma.site.findMany({
        where: userCorps === 'all' ? {} : { corporationId: { in: userCorps } },
        include: {
          corporation: {
            select: {
              id: true,
              name: true,
            },
          },
          workers: {
            where: { isActive: true },
            select: {
              id: true,
              fullName: true,
            },
          },
          supervisorAssignments: {
            include: {
              supervisor: {
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
      prisma.corporation.findMany({
        where: userCorps === 'all' ? {} : { id: { in: userCorps } },
        select: {
          id: true,
          name: true,
          description: true,
          isActive: true,
          _count: {
            select: {
              sites: true,
              managers: true,
              supervisors: true,
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
              corporations: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          })
        : [],

      // Managers
      prisma.corporationManager.findMany({
        where: userCorps === 'all' ? {} : { corporationId: { in: userCorps } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          corporation: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      // Supervisors
      prisma.supervisor.findMany({
        where: userCorps === 'all' ? {} : { corporationId: { in: userCorps } },
        include: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phone: true,
            },
          },
          corporation: {
            select: {
              id: true,
              name: true,
            },
          },
          siteAssignments: {
            include: {
              site: {
                select: {
                  id: true,
                  name: true,
                  address: true,
                  city: true,
                },
              },
            },
          },
        },
      }),

      // Workers summary (count only, not individual records for performance)
      prisma.worker.groupBy({
        by: ['siteId', 'isActive'],
        where: {
          site: userCorps === 'all' ? {} : { corporationId: { in: userCorps } },
        },
        _count: true,
      }),
    ]);

    // Calculate worker counts per site
    const workerCountsBySite = workers.reduce((acc, group) => {
      if (!acc[group.siteId]) {
        acc[group.siteId] = { active: 0, inactive: 0 };
      }
      if (group.isActive) {
        acc[group.siteId].active = group._count;
      } else {
        acc[group.siteId].inactive = group._count;
      }
      return acc;
    }, {} as Record<string, { active: number; inactive: number }>);

    // Format sites for map display
    const formattedSites = sites.map((site) => ({
      id: site.id,
      name: site.name,
      address: site.address,
      city: site.city,
      country: site.country,
      latitude: site.latitude,
      longitude: site.longitude,
      phone: site.phone,
      email: site.email,
      isActive: site.isActive,
      corporation: site.corporation,
      workers: {
        active: workerCountsBySite[site.id]?.active || 0,
        inactive: workerCountsBySite[site.id]?.inactive || 0,
        total:
          (workerCountsBySite[site.id]?.active || 0) +
          (workerCountsBySite[site.id]?.inactive || 0),
      },
      supervisors: site.supervisorAssignments.map((sa) => ({
        id: sa.supervisor.id,
        name: sa.supervisor.user.fullName,
        email: sa.supervisor.user.email,
      })),
    }));

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
      sites: formattedSites,
      corporations,
      areaManagers,
      managers,
      supervisors,
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
