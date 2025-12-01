import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    // Only SuperAdmin can access organizational tree
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Fetch Area Managers with all their data
    const areaManagers = await prisma.areaManager.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        corporations: {
          where: {
            isActive: true,
          },
          include: {
            managers: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
            supervisors: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
                siteAssignments: {
                  include: {
                    site: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            sites: {
              where: {
                isActive: true,
              },
              include: {
                workers: {
                  where: {
                    isActive: true,
                  },
                  select: {
                    id: true,
                    name: true,
                    position: true,
                  },
                },
                supervisorAssignments: {
                  include: {
                    siteManager: {
                      include: {
                        user: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        regionName: 'asc',
      },
    });

    // Build complete 7-level hierarchical tree structure
    const tree = {
      id: 'root',
      name: 'Super Admin',
      type: 'superadmin' as const,
      count: {
        areaManagers: areaManagers.length,
      },
      children: areaManagers.map(areaManager => ({
        id: areaManager.id,
        name: `${areaManager.user.name} - ${areaManager.regionName}`,
        type: 'areamanager' as const,
        count: {
          corporations: areaManager.corporations.length,
        },
        children: areaManager.corporations.map(corp => ({
          id: corp.id,
          name: corp.name,
          type: 'corporation' as const,
          count: {
            managers: corp.managers.length,
            supervisors: corp.supervisors.length,
            sites: corp.sites.length,
          },
          children: [
            // Managers branch
            ...(corp.managers.length > 0
              ? [
                  {
                    id: `${corp.id}-managers`,
                    name: `מנהלים (${corp.managers.length})`,
                    type: 'managers-group' as const,
                    count: {},
                    children: corp.managers.map(manager => ({
                      id: manager.id,
                      name: `${manager.user.name} - ${manager.title}`,
                      type: 'manager' as const,
                      count: {},
                    })),
                  },
                ]
              : []),
            // Supervisors branch
            ...(corp.supervisors.length > 0
              ? [
                  {
                    id: `${corp.id}-supervisors`,
                    name: `מפקחים (${corp.supervisors.length})`,
                    type: 'supervisors-group' as const,
                    count: {},
                    children: corp.supervisors.map(supervisor => ({
                      id: supervisor.id,
                      name: `${supervisor.user.name} - ${supervisor.title}`,
                      type: 'supervisor' as const,
                      count: {
                        sites: supervisor.siteAssignments.length,
                      },
                    })),
                  },
                ]
              : []),
            // Sites branch
            ...corp.sites.map(site => ({
              id: site.id,
              name: site.name,
              type: 'site' as const,
              count: {
                workers: site.workers.length,
                supervisors: site.supervisorAssignments.length,
              },
              children: site.workers.map(worker => ({
                id: worker.id,
                name: `${worker.name} - ${worker.position}`,
                type: 'worker' as const,
                count: {},
              })),
            })),
          ],
        })),
      })),
    };

    return NextResponse.json(tree);
  } catch (error) {
    console.error('Error fetching organizational tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizational tree' },
      { status: 500 }
    );
  }
}
