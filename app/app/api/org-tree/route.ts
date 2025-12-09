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
                    fullName: true,
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
                    fullName: true,
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
                    fullName: true,
                    position: true,
                    supervisorId: true, // CRITICAL: Include supervisorId for hierarchy
                  },
                },
                supervisorAssignments: {
                  include: {
                    supervisor: {
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
          corporations: areaManager.corporations?.length || 0,
        },
        children: (areaManager.corporations || []).map((corp: any) => ({
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
                    children: corp.supervisors.map((supervisor: any) => ({
                      id: supervisor.id,
                      name: `${supervisor.user.fullName} - ${supervisor.title}`,
                      type: 'supervisor' as const,
                      count: {
                        sites: supervisor.siteAssignments?.length || 0,
                      },
                    })),
                  },
                ]
              : []),
            // Sites branch
            ...corp.sites.map((site: any) => {
              const workers = site.workers || [];
              const supervisorAssignments = site.supervisorAssignments || [];
              const hasSupervisors = supervisorAssignments.length > 0;

              // Build supervisor nodes with their assigned workers as children
              const supervisorNodes = supervisorAssignments.map((assignment: any) => {
                const supervisorId = assignment.supervisor.id;

                // Find all workers assigned to this supervisor
                const assignedWorkers = workers.filter(
                  (w: any) => w.supervisorId === supervisorId
                );

                return {
                  id: `supervisor-${supervisorId}-site-${site.id}`,
                  name: `${assignment.supervisor.user.fullName} - ${assignment.supervisor.title}`,
                  type: 'supervisor' as const,
                  count: {
                    workers: assignedWorkers.length,
                  },
                  children: assignedWorkers.map((worker: any) => ({
                    id: worker.id,
                    name: `${worker.fullName} - ${worker.position}`,
                    type: 'worker' as const,
                    count: {},
                  })),
                };
              });

              // Find orphan workers (not assigned to any supervisor)
              const orphanWorkers = workers
                .filter((w: any) => !w.supervisorId)
                .map((worker: any) => ({
                  id: worker.id,
                  name: `${worker.fullName} - ${worker.position}`,
                  type: 'worker' as const,
                  count: {},
                  // CRITICAL: Flag as error if site has supervisors but worker has none
                  hasError: hasSupervisors,
                  errorMessage: hasSupervisors ? 'Worker not assigned to supervisor (site has supervisors)' : undefined,
                }));

              return {
                id: site.id,
                name: site.name,
                type: 'site' as const,
                count: {
                  workers: workers.length,
                  supervisors: supervisorAssignments.length,
                  orphanWorkers: orphanWorkers.length,
                },
                // CRITICAL: Flag site as having data integrity issue if orphan workers exist with supervisors
                hasError: hasSupervisors && orphanWorkers.length > 0,
                errorMessage: hasSupervisors && orphanWorkers.length > 0
                  ? `${orphanWorkers.length} worker(s) not assigned to supervisor`
                  : undefined,
                children: [
                  ...supervisorNodes,  // Supervisors with their workers as children
                  ...orphanWorkers,    // Unassigned workers appear at site level
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
