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
            fullName: true,
            email: true,
          },
        },
        cities: {
          where: {
            isActive: true,
          },
          include: {
            coordinators: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
              },
            },
            activistCoordinators: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                  },
                },
                neighborhoodAssignments: {
                  include: {
                    neighborhood: {
                      select: {
                        name: true,
                      },
                    },
                  },
                },
              },
            },
            neighborhoods: {
              where: {
                isActive: true,
              },
              include: {
                activists: {
                  where: {
                    isActive: true,
                  },
                  select: {
                    id: true,
                    fullName: true,
                    position: true,
                    activistCoordinatorId: true, // CRITICAL: Include supervisorId for hierarchy
                  },
                },
                activistCoordinatorAssignments: {
                  include: {
                    activistCoordinator: {
                      include: {
                        user: {
                          select: {
                            fullName: true,
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

    // Build complete 8-level hierarchical tree structure
    // SuperAdmin → Area (District) → Area Manager (Person) → Cities → ...
    const tree = {
      id: 'root',
      name: 'Super Admin',
      type: 'superadmin' as const,
      count: {
        areaManagers: areaManagers.length,
      },
      children: areaManagers.map((areaManager: any) => ({
        // Level 2: Area/District (Geographic entity)
        id: `area-${areaManager.id}`,
        name: areaManager.regionName,
        type: 'area' as const,
        count: {
          cities: areaManager.cities?.length || 0,
        },
        children: [
          {
            // Level 3: Area Manager (Person who manages the area)
            id: areaManager.id,
            name: areaManager.user?.fullName || `${areaManager.regionName} (ללא מנהל)`,
            type: 'areamanager' as const,
            count: {
              cities: areaManager.cities?.length || 0,
            },
            children: (areaManager.cities || []).map((corp: any) => ({
          id: corp.id,
          name: corp.name,
          type: 'city' as const,
          count: {
            coordinators: corp.coordinators.length,
            activistCoordinators: corp.activistCoordinators.length,
            neighborhoods: corp.neighborhoods.length,
          },
          children: [
            // Coordinators branch
            ...(corp.coordinators.length > 0
              ? [
                  {
                    id: `${corp.id}-coordinators`,
                    name: `רכזים (${corp.coordinators.length})`,
                    type: 'coordinators-group' as const,
                    count: {},
                    children: corp.coordinators.map((coordinator: any) => ({
                      id: coordinator.id,
                      name: `${coordinator.user.fullName} - ${coordinator.title || ''}`,
                      type: 'coordinator' as const,
                      count: {},
                    })),
                  },
                ]
              : []),
            // Activist Coordinators branch
            ...(corp.activistCoordinators.length > 0
              ? [
                  {
                    id: `${corp.id}-activist-coordinators`,
                    name: `רכזי פעילים (${corp.activistCoordinators.length})`,
                    type: 'activist-coordinators-group' as const,
                    count: {},
                    children: corp.activistCoordinators.map((activistCoordinator: any) => ({
                      id: activistCoordinator.id,
                      name: `${activistCoordinator.user.fullName} - ${activistCoordinator.title || ''}`,
                      type: 'activistCoordinator' as const,
                      count: {
                        neighborhoods: activistCoordinator.neighborhoodAssignments?.length || 0,
                      },
                    })),
                  },
                ]
              : []),
            // Neighborhoods branch
            ...corp.neighborhoods.map((neighborhood: any) => {
              const activists = neighborhood.activists || [];
              const activistCoordinatorAssignments = neighborhood.activistCoordinatorAssignments || [];
              const hasActivistCoordinators = activistCoordinatorAssignments.length > 0;

              // Build activistCoordinator nodes with their assigned activists as children
              const activistCoordinatorNodes = activistCoordinatorAssignments.map((assignment: any) => {
                const activistCoordinatorId = assignment.activistCoordinator.id;

                // Find all activists assigned to this activistCoordinator
                const assignedActivists = activists.filter(
                  (a: any) => a.activistCoordinatorId === activistCoordinatorId
                );

                return {
                  id: `activistCoordinator-${activistCoordinatorId}-neighborhood-${neighborhood.id}`,
                  name: `${assignment.activistCoordinator.user.fullName} - ${assignment.activistCoordinator.title || ''}`,
                  type: 'activistCoordinator' as const,
                  count: {
                    activists: assignedActivists.length,
                  },
                  children: assignedActivists.map((activist: any) => ({
                    id: activist.id,
                    name: `${activist.fullName} - ${activist.position || ''}`,
                    type: 'activist' as const,
                    count: {},
                  })),
                };
              });

              // Find orphan activists (not assigned to any activistCoordinator)
              const orphanActivists = activists
                .filter((a: any) => !a.activistCoordinatorId)
                .map((activist: any) => ({
                  id: activist.id,
                  name: `${activist.fullName} - ${activist.position || ''}`,
                  type: 'activist' as const,
                  count: {},
                  // CRITICAL: Flag as error if neighborhood has activist coordinators but activist has none
                  hasError: hasActivistCoordinators,
                  errorMessage: hasActivistCoordinators ? 'Activist not assigned to activist coordinator (neighborhood has coordinators)' : undefined,
                }));

              return {
                id: neighborhood.id,
                name: neighborhood.name,
                type: 'neighborhood' as const,
                count: {
                  activists: activists.length,
                  activistCoordinators: activistCoordinatorAssignments.length,
                  orphanActivists: orphanActivists.length,
                },
                // CRITICAL: Flag neighborhood as having data integrity issue if orphan activists exist with coordinators
                hasError: hasActivistCoordinators && orphanActivists.length > 0,
                errorMessage: hasActivistCoordinators && orphanActivists.length > 0
                  ? `${orphanActivists.length} activist(s) not assigned to activist coordinator`
                  : undefined,
                children: [
                  ...activistCoordinatorNodes,  // Activist coordinators with their activists as children
                  ...orphanActivists,           // Unassigned activists appear at neighborhood level
                ],
              };
            }),
          ],
        })),
          },
        ],
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
