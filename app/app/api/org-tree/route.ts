import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { withErrorHandler, UnauthorizedError, ForbiddenError } from '@/lib/error-handler';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

export const GET = withErrorHandler(async (req: Request) => {
  try {
    const session = await auth();

    // Require authentication
    if (!session?.user) {
      const context = await extractRequestContext(req);
      logger.authFailure('Unauthenticated access to org-tree', context);
      throw new UnauthorizedError('נדרשת הזדהות');
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    // DEBUG: Log user role and ID for troubleshooting org-tree visibility
    console.log('🔍 [ORG-TREE API] User Role:', userRole, '| User ID:', userId, '| Email:', session.user.email);

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
        const context = await extractRequestContext(req);
        logger.rbacViolation('City Coordinator not assigned to any city', {
          ...context,
          ...extractSessionContext(session),
        });
        throw new ForbiddenError('רכז עיר לא משוייך לאף עיר');
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
      if (!activistCoordinator) {
        const context = await extractRequestContext(req);
        logger.rbacViolation('Activist Coordinator not found for user', {
          ...context,
          ...extractSessionContext(session),
        });
        throw new ForbiddenError('לא נמצאה הגדרת רכז פעילים עבור משתמש זה');
      }

      // IMPORTANT: Allow empty neighborhood assignments - show empty tree instead of error
      // This allows users to log in and see their dashboard even before being assigned
      if (activistCoordinator.neighborhoodAssignments.length === 0) {
        console.log('⚠️  [ORG-TREE API] Activist Coordinator has no neighborhoods assigned - returning empty city tree');
        // Return empty city structure instead of error
        const city = await prisma.city.findUnique({
          where: { id: activistCoordinator.cityId },
          select: { id: true, name: true },
        });

        return NextResponse.json({
          id: city?.id || 'unknown',
          name: city?.name || 'עיר לא ידועה',
          type: 'city',
          count: {
            neighborhoods: 0,
            activists: 0,
          },
          children: [],
          isEmpty: true,
          emptyMessage: 'טרם הוקצו לך שכונות. פנה למנהל העיר שלך.',
        });
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
                        phone: true,
                        email: true,
                        activistCoordinatorId: true,
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
            // Include neighborhoods for Activist Coordinator role only (they don't see City Coordinators)
            ...(userRole === 'ACTIVIST_COORDINATOR' ? {
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
                      phone: true,
                      email: true,
                      activistCoordinatorId: true,
                    },
                  },
                },
              },
            } : {}),
          },
        },
      },
      orderBy: {
        regionName: 'asc',
      },
    });

    // Build hierarchical tree structure - ROOT depends on user role
    let tree: any;

    // Helper function to build city tree structure for SuperAdmin, Area Manager, City Coordinator
    const buildCityTree = (corp: any) => {
      // Helper to build neighborhood nodes (shared logic)
      const buildNeighborhoodNodes = (neighborhoods: any[]) => {
        return neighborhoods.map((neighborhood: any) => {
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
                name: activist.fullName,
                type: 'activist' as const,
                count: {},
                attributes: {
                  type: 'activist',
                  phone: activist.phone,
                  email: activist.email,
                  position: activist.position,
                },
              })),
            };
          });

          // Find orphan activists (not assigned to any activistCoordinator)
          const orphanActivists = activists
            .filter((a: any) => !a.activistCoordinatorId)
            .map((activist: any) => ({
              id: activist.id,
              name: activist.fullName,
              type: 'activist' as const,
              count: {},
              attributes: {
                type: 'activist',
                phone: activist.phone,
                email: activist.email,
                position: activist.position,
              },
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
        });
      };

      // Count total neighborhoods across all coordinators
      const totalNeighborhoods = corp.coordinators.reduce(
        (sum: number, coord: any) => sum + (coord.neighborhoods?.length || 0),
        0
      );

      return {
        id: corp.id,
        name: corp.name,
        type: 'city' as const,
        count: {
          coordinators: corp.coordinators.length,
          activistCoordinators: corp.activistCoordinators.length,
          neighborhoods: totalNeighborhoods,
        },
        children: [
          // City Coordinators with their neighborhoods as children
          ...(corp.coordinators.length > 0
            ? corp.coordinators.map((coordinator: any) => ({
                id: coordinator.id,
                name: `${coordinator.user?.fullName || 'N/A'}${coordinator.title ? ` - ${coordinator.title}` : ''}`,
                type: 'coordinator' as const,
                count: {
                  neighborhoods: coordinator.neighborhoods?.length || 0,
                },
                children: buildNeighborhoodNodes(coordinator.neighborhoods || []),
              }))
            : []),
        ],
      };
    };

    // Helper function to build simplified city tree for Activist Coordinator
    // Shows ONLY assigned neighborhoods with activists (no coordinator/activist coordinator groups)
    const buildActivistCoordinatorTree = (corp: any) => ({
      id: corp.id,
      name: corp.name,
      type: 'city' as const,
      count: {
        neighborhoods: corp.neighborhoods.length,
        activists: corp.neighborhoods.reduce((sum: number, n: any) => sum + (n.activists?.length || 0), 0),
      },
      children: corp.neighborhoods.map((neighborhood: any) => {
        const activists = neighborhood.activists || [];

        return {
          id: neighborhood.id,
          name: neighborhood.name,
          type: 'neighborhood' as const,
          count: {
            activists: activists.length,
          },
          // Show activists directly (no activist coordinator intermediary node) with full details
          children: activists.map((activist: any) => ({
            id: activist.id,
            name: activist.fullName,
            type: 'activist' as const,
            count: {},
            attributes: {
              type: 'activist',
              phone: activist.phone,
              email: activist.email,
              position: activist.position,
            },
          })),
        };
      }),
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
      const areaManager = areaManagers[0]; // Should only be one due to filtering
      if (!areaManager) {
        const context = await extractRequestContext(req);
        logger.rbacViolation('Area Manager data not found for user', {
          ...context,
          ...extractSessionContext(session),
        });
        throw new ForbiddenError('לא נמצאו נתונים עבור מנהל האזור');
      }

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
    } else if (userRole === 'CITY_COORDINATOR') {
      // City Coordinator: Root is their City (skip SuperAdmin, Area, Area Manager levels)
      // Find the area manager that has cities (after filtering)
      const areaManagerWithCity = areaManagers.find(am => am.cities.length > 0);
      const city = areaManagerWithCity?.cities[0];

      if (!city) {
        const context = await extractRequestContext(req);
        logger.rbacViolation('City not found for City Coordinator', {
          ...context,
          ...extractSessionContext(session),
        });
        throw new ForbiddenError('לא נמצאה עיר עבור רכז העיר');
      }

      tree = buildCityTree(city);
    } else if (userRole === 'ACTIVIST_COORDINATOR') {
      // Activist Coordinator: Root is their City with ONLY assigned neighborhoods (no coordinator groups)
      // Find the area manager that has cities (after filtering)
      const areaManagerWithCity = areaManagers.find(am => am.cities.length > 0);
      const city = areaManagerWithCity?.cities[0];

      if (!city) {
        const context = await extractRequestContext(req);
        logger.rbacViolation('City not found for Activist Coordinator', {
          ...context,
          ...extractSessionContext(session),
        });
        throw new ForbiddenError('לא נמצאה עיר/שכונות עבור רכז הפעילים');
      }

      tree = buildActivistCoordinatorTree(city); // Use simplified tree builder (no coordinator/activist coordinator groups)
    } else {
      const context = await extractRequestContext(req);
      logger.rbacViolation('Unknown role attempted to access org-tree', {
        ...context,
        ...extractSessionContext(session),
      });
      throw new ForbiddenError('תפקיד לא מוכר');
    }

    return NextResponse.json(tree);
  } catch (error) {
    // Re-throw known errors (withErrorHandler will handle them)
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }

    // Log and re-throw unknown errors
    console.error('Error fetching organizational tree:', error);
    throw error;
  }
});
