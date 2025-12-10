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
                siteAssignments: {
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
                supervisorAssignments: {
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

    // Build complete 7-level hierarchical tree structure
    const tree = {
      id: 'root',
      name: 'Super Admin',
      type: 'superadmin' as const,
      count: {
        areaManagers: areaManagers.length,
      },
      children: areaManagers.map((areaManager: any) => ({
        id: areaManager.id,
        name: `${areaManager.user.fullName} - ${areaManager.regionName}`,
        type: 'areamanager' as const,
        count: {
          cities: areaManager.corporations?.length || 0,
        },
        children: (areaManager.corporations || []).map((corp: any) => ({
          id: corp.id,
          name: corp.name,
          type: 'city' as const,
          count: {
            coordinators: corp.managers.length,
            activistCoordinators: corp.supervisors.length,
            neighborhoods: corp.sites.length,
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
                    children: corp.managers.map((manager: any) => ({
                      id: manager.id,
                      name: `${manager.user.fullName} - ${manager.title}`,
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
                    children: corp.supervisors.map((activistCoordinator: any) => ({
                      id: activistCoordinator.id,
                      name: `${activistCoordinator.user.fullName} - ${activistCoordinator.title}`,
                      type: 'activistCoordinator' as const,
                      count: {
                        neighborhoods: activistCoordinator.siteAssignments?.length || 0,
                      },
                    })),
                  },
                ]
              : []),
            // Sites branch
            ...corp.sites.map((neighborhood: any) => {
              const workers = neighborhood.workers || [];
              const supervisorAssignments = neighborhood.supervisorAssignments || [];
              const hasSupervisors = supervisorAssignments.length > 0;

              // Build activistCoordinator nodes with their assigned workers as children
              const supervisorNodes = supervisorAssignments.map((assignment: any) => {
                const supervisorId = assignment.activistCoordinator.id;

                // Find all workers assigned to this activistCoordinator
                const assignedWorkers = workers.filter(
                  (w: any) => w.activistCoordinatorId === supervisorId
                );

                return {
                  id: `activistCoordinator-${activistCoordinatorId}-neighborhood-${neighborhood.id}`,
                  name: `${assignment.activistCoordinator.user.fullName} - ${assignment.activistCoordinator.title}`,
                  type: 'activistCoordinator' as const,
                  count: {
                    activists: assignedWorkers.length,
                  },
                  children: assignedWorkers.map((activist: any) => ({
                    id: activist.id,
                    name: `${activist.fullName} - ${activist.position}`,
                    type: 'activist' as const,
                    count: {},
                  })),
                };
              });

              // Find orphan workers (not assigned to any activistCoordinator)
              const orphanWorkers = workers
                .filter((w: any) => !w.activistCoordinatorId)
                .map((activist: any) => ({
                  id: activist.id,
                  name: `${activist.fullName} - ${activist.position}`,
                  type: 'activist' as const,
                  count: {},
                  // CRITICAL: Flag as error if neighborhood has supervisors but activist has none
                  hasError: hasSupervisors,
                  errorMessage: hasSupervisors ? 'Worker not assigned to activistCoordinator (neighborhood has supervisors)' : undefined,
                }));

              return {
                id: neighborhood.id,
                name: neighborhood.name,
                type: 'neighborhood' as const,
                count: {
                  activists: workers.length,
                  activistCoordinators: supervisorAssignments.length,
                  orphanWorkers: orphanWorkers.length,
                },
                // CRITICAL: Flag neighborhood as having data integrity issue if orphan workers exist with supervisors
                hasError: hasSupervisors && orphanWorkers.length > 0,
                errorMessage: hasSupervisors && orphanWorkers.length > 0
                  ? `${orphanWorkers.length} activist(s) not assigned to activistCoordinator`
                  : undefined,
                children: [
                  ...supervisorNodes,  // Supervisors with their workers as children
                  ...orphanWorkers,    // Unassigned workers appear at neighborhood level
                ],
              };
            }),
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
