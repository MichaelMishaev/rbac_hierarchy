import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: Authentication required' },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    // Build where clause based on user role
    let areaManagerWhere: any = { isActive: true };
    let cityWhere: any = { isActive: true };
    let neighborhoodWhere: any = { isActive: true };

    // Role-based filtering
    if (userRole === 'AREA_MANAGER') {
      // Area Manager: Only show their own area
      areaManagerWhere = { userId, isActive: true };
    } else if (userRole === 'CITY_COORDINATOR') {
      // City Coordinator: Only show their city
      const cityCoordinator = await prisma.cityCoordinator.findFirst({
        where: { userId },
        select: { cityId: true },
      });
      if (!cityCoordinator) {
        return NextResponse.json({ error: 'City Coordinator not assigned to any city' }, { status: 403 });
      }
      cityWhere = { id: cityCoordinator.cityId, isActive: true };
    } else if (userRole === 'ACTIVIST_COORDINATOR') {
      // Activist Coordinator: Only show their assigned neighborhoods
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId },
        include: {
          neighborhoodAssignments: {
            select: { neighborhoodId: true },
          },
        },
      });
      if (!activistCoordinator || activistCoordinator.neighborhoodAssignments.length === 0) {
        return NextResponse.json({ error: 'Activist Coordinator not assigned to any neighborhoods' }, { status: 403 });
      }
      const neighborhoodIds = activistCoordinator.neighborhoodAssignments.map((a) => a.neighborhoodId);
      neighborhoodWhere = { id: { in: neighborhoodIds }, isActive: true };
      cityWhere = { id: activistCoordinator.cityId, isActive: true };
    }

    // Fetch Area Managers with all their data (filtered by role)
    const areaManagers = await prisma.areaManager.findMany({
      where: areaManagerWhere,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        cities: {
          where: cityWhere,
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
              where: neighborhoodWhere,
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

    // Build hierarchical tree structure - ROOT depends on user role
    let tree: any;

    // Helper function to build city tree structure
    const buildCityTree = (corp: any) => ({
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
                  name: `${coordinator.user?.fullName || 'N/A'} - ${coordinator.title || ''}`,
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
                name: `רכزי פעילים (${corp.activistCoordinators.length})`,
                type: 'activist-coordinators-group' as const,
                count: {},
                children: corp.activistCoordinators.map((activistCoordinator: any) => ({
                  id: activistCoordinator.id,
                  name: `${activistCoordinator.user?.fullName || 'N/A'} - ${activistCoordinator.title || ''}`,
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
              name: `${assignment.activistCoordinator.user?.fullName || 'N/A'} - ${assignment.activistCoordinator.title || ''}`,
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
    });

    // Build tree based on user role
    if (userRole === 'SUPERADMIN') {
      // SuperAdmin: Full hierarchy starting from SuperAdmin
      tree = {
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
            children: (areaManager.cities || []).map((corp: any) => buildCityTree(corp)),
          },
        ],
      })),
      };
    } else if (userRole === 'AREA_MANAGER') {
      // Area Manager: Root is their Area (skip SuperAdmin level)
      if (areaManagers.length > 0) {
        const areaManager = areaManagers[0]; // Should only be one due to filtering
        tree = {
          // Root is the Area (Geographic entity)
          id: `area-${areaManager.id}`,
          name: areaManager.regionName,
          type: 'area' as const,
          count: {
            cities: areaManager.cities?.length || 0,
          },
          children: [
            {
              // Area Manager (Person who manages the area)
              id: areaManager.id,
              name: areaManager.user?.fullName || `${areaManager.regionName} (ללא מנהל)`,
              type: 'areamanager' as const,
              count: {
                cities: areaManager.cities?.length || 0,
              },
              children: (areaManager.cities || []).map((corp: any) => buildCityTree(corp)),
            },
          ],
        };
      } else {
        return NextResponse.json({ error: 'Area Manager not found' }, { status: 404 });
      }
    } else if (userRole === 'CITY_COORDINATOR') {
      // City Coordinator: Root is their City (skip SuperAdmin, Area, Area Manager levels)
      // Find the area manager that has cities (after filtering)
      const areaManagerWithCity = areaManagers.find(am => am.cities.length > 0);
      if (areaManagerWithCity && areaManagerWithCity.cities.length > 0) {
        const city = areaManagerWithCity.cities[0]; // Should only be one due to filtering
        tree = buildCityTree(city);
      } else {
        return NextResponse.json({ error: 'City not found for coordinator' }, { status: 404 });
      }
    } else if (userRole === 'ACTIVIST_COORDINATOR') {
      // Activist Coordinator: Root is their City with only assigned neighborhoods
      // Find the area manager that has cities (after filtering)
      const areaManagerWithCity = areaManagers.find(am => am.cities.length > 0);
      if (areaManagerWithCity && areaManagerWithCity.cities.length > 0) {
        const city = areaManagerWithCity.cities[0]; // Should only be one due to filtering
        tree = buildCityTree(city);
      } else {
        return NextResponse.json({ error: 'City/Neighborhoods not found for activist coordinator' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'Unknown role' }, { status: 403 });
    }

    return NextResponse.json(tree);
  } catch (error) {
    console.error('Error fetching organizational tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizational tree' },
      { status: 500 }
    );
  }
}
