'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireManager, hasAccessToCorporation } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateNeighborhoodInput = {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  cityId: string;
  activistCoordinatorId?: string; // OPTIONAL: ActivistCoordinator can be assigned at creation or later
  isActive?: boolean;
};

export type UpdateNeighborhoodInput = {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
};

export type ListNeighborhoodsFilters = {
  cityId?: string;
  search?: string;
  city?: string;
  isActive?: boolean;
};

// ============================================
// CREATE SITE
// ============================================

/**
 * Create a new neighborhood
 *
 * STRICT BUSINESS RULES (from ADD_NEW_DESIGN.md):
 * 1. SuperAdmin: Can create in any city
 * 2. Area Manager:
 *    - Get their area from `area_managers` table
 *    - Filter cities by `area_manager_id`
 *    - Can create in ANY city in their area
 * 3. City Coordinator:
 *    - Get their city from `city_coordinators` table
 *    - Can ONLY create in their assigned city
 *    - Cannot access other cities
 * 4. neighborhoodName MUST NOT be empty
 * 5. cityId MUST be valid and within scope
 *
 * Permissions:
 * - SUPERADMIN: Can create neighborhoods in any city
 * - AREA_MANAGER: Can create neighborhoods in cities within their area
 * - CITY_COORDINATOR: Can create neighborhoods in their city ONLY
 * - ACTIVIST_COORDINATOR: Cannot create neighborhoods
 */
export async function createNeighborhood(data: CreateNeighborhoodInput) {
  try {
    // Get current user
    const currentUser = await getCurrentUser();

    // Only SUPERADMIN, AREA_MANAGER, and CITY_COORDINATOR can create neighborhoods
    if (
      currentUser.role !== 'SUPERADMIN' &&
      currentUser.role !== 'AREA_MANAGER' &&
      currentUser.role !== 'CITY_COORDINATOR'
    ) {
      return {
        success: false,
        error: 'Only SuperAdmin, Area Managers, and City Coordinators can create neighborhoods.',
      };
    }

    // Verify city exists first
    const city = await prisma.city.findUnique({
      where: { id: data.cityId },
      select: {
        id: true,
        name: true,
        code: true,
        areaManagerId: true,
      },
    });

    if (!city) {
      return {
        success: false,
        error: 'City not found',
      };
    }

    // CRITICAL SCOPE VALIDATION: Enforce strict hierarchy
    if (currentUser.role === 'AREA_MANAGER') {
      // Area Manager: Get their area and validate city belongs to it
      const currentUserAreaManager = await prisma.areaManager.findFirst({
        where: { userId: currentUser.id },
      });

      if (!currentUserAreaManager) {
        return {
          success: false,
          error: 'Area Manager record not found for current user.',
        };
      }

      // STRICT: City must belong to Area Manager's area
      if (city.areaManagerId !== currentUserAreaManager.id) {
        return {
          success: false,
          error: 'Area Managers can only create neighborhoods in cities within their area.',
        };
      }
    } else if (currentUser.role === 'CITY_COORDINATOR') {
      // City Coordinator: Get their city and validate
      const currentUserCityCoordinator = await prisma.cityCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!currentUserCityCoordinator) {
        return {
          success: false,
          error: 'City Coordinator record not found for current user.',
        };
      }

      // STRICT: Can ONLY create in their assigned city
      if (data.cityId !== currentUserCityCoordinator.cityId) {
        return {
          success: false,
          error: 'City Coordinators can only create neighborhoods in their own city.',
        };
      }
    }

    // OPTIONAL: Verify activist coordinator if provided
    let supervisor = null;
    if (data.activistCoordinatorId) {
      supervisor = await prisma.activistCoordinator.findFirst({
        where: {
          id: data.activistCoordinatorId,
          cityId: data.cityId,
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
      });

      if (!supervisor) {
        return {
          success: false,
          error: 'ActivistCoordinator not found or belongs to different corporation',
        };
      }
    }

    // Create site (+ optional supervisor assignment) in transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create site
      const newNeighborhood = await tx.neighborhood.create({
        data: {
          name: data.name,
          address: data.address,
          city: data.city,
          country: data.country ?? 'Israel',
          phone: data.phone,
          email: data.email,
          cityId: data.cityId,
          isActive: data.isActive ?? true,
        },
        include: { cityRelation: {
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
      });

      // 2. OPTIONAL: Create supervisor assignment if supervisor provided
      if (data.activistCoordinatorId && supervisor) {
        await tx.activistCoordinatorNeighborhood.create({
          data: {
            neighborhoodId: newNeighborhood.id,
            activistCoordinatorId: data.activistCoordinatorId,
            cityId: data.cityId,
            legacyActivistCoordinatorUserId: supervisor.userId,
            assignedBy: currentUser.id,
          },
        });
      }

      return newNeighborhood;
    });

    const newNeighborhood = result;

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_NEIGHBORHOOD',
        entity: 'Site',
        entityId: newNeighborhood.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: undefined,
        after: {
          id: newNeighborhood.id,
          name: newNeighborhood.name,
          city: newNeighborhood.city,
          cityId: newNeighborhood.cityId,
          isActive: newNeighborhood.isActive,
          activistCoordinatorId: data.activistCoordinatorId,
          supervisorName: supervisor?.user.fullName,
        },
      },
    });

    revalidatePath('/neighborhoods');
    revalidatePath('/dashboard');

    return {
      success: true,
      neighborhood: newNeighborhood,
    };
  } catch (error) {
    console.error('Error creating neighborhood:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create site',
    };
  }
}

// ============================================
// LIST SITES
// ============================================

/**
 * List sites with proper filtering based on role
 *
 * Permissions:
 * - SUPERADMIN: Can see all sites across all corporations
 * - MANAGER: Can see sites in their corporation only
 * - SUPERVISOR: Can see sites they are assigned to only
 */
export async function listNeighborhoods(filters: ListNeighborhoodsFilters = {}) {
  try {
    const currentUser = await getCurrentUser();

    // Build where clause based on role and filters
    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'CITY_COORDINATOR') {
      // City coordinators can only see neighborhoods in their city
      const coordinator = await prisma.cityCoordinator.findFirst({
        where: { userId: currentUser.id },
        select: { cityId: true },
      });
      if (coordinator) {
        where.cityId = coordinator.cityId;
      }
    } else if (currentUser.role === 'AREA_MANAGER') {
      // Area managers can see neighborhoods in their cities
      const areaManager = await prisma.areaManager.findFirst({
        where: { userId: currentUser.id },
        include: { cities: { select: { id: true } } },
      });
      if (areaManager) {
        where.cityId = { in: areaManager.cities.map(c => c.id) };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Supervisors can only see sites they are assigned to (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorAssignments = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { legacyActivistCoordinatorUserId: currentUser.id },
        select: { neighborhoodId: true },
      });
      const siteIds = activistCoordinatorAssignments.map(ss => ss.neighborhoodId);
      where.id = { in: siteIds };
    }

    // Apply additional filters
    if (filters.cityId && currentUser.role === 'SUPERADMIN') {
      where.cityId = filters.cityId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { city: { contains: filters.search, mode: 'insensitive' } },
        { address: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: 'insensitive' };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    // Query neighborhoods
    const neighborhoods = await prisma.neighborhood.findMany({
      where,
      include: { cityRelation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: { select: { activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      neighborhoods,
      count: neighborhoods.length,
    };
  } catch (error) {
    console.error('Error listing neighborhoods:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list neighborhoods',
      neighborhoods: [],
      count: 0,
    };
  }
}

// ============================================
// GET SITE BY ID
// ============================================

/**
 * Get a specific site by ID with access validation
 *
 * Permissions:
 * - SUPERADMIN: Can view any site
 * - MANAGER: Can view sites in their corporation
 * - SUPERVISOR: Can view sites they are assigned to
 */
export async function getNeighborhoodById(neighborhoodId: string) {
  try {
    const currentUser = await getCurrentUser();

    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
      include: { cityRelation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        activistCoordinatorAssignments: {
          include: {
            activistCoordinator: {
              select: {
                id: true,
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
                createdAt: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        activists: {
          where: { isActive: true },
          select: {
            id: true,
            fullName: true,
            position: true,
            phone: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: { select: { activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
    });

    if (!neighborhood) {
      return {
        success: false,
        error: 'Neighborhood not found',
      };
    }

    // Validate access permissions
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, neighborhood.cityId)) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Check if supervisor has access to this site (v1.3: use findFirst since unique constraint changed)
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          activistCoordinatorId: currentUser.id,
          neighborhoodId: neighborhood.id,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    }

    return {
      success: true,
      neighborhood,
    };
  } catch (error) {
    console.error('Error getting neighborhood:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get site',
    };
  }
}

// ============================================
// UPDATE SITE
// ============================================

/**
 * Update site information
 *
 * Permissions:
 * - SUPERADMIN: Can update any site
 * - MANAGER: Can update sites in their corporation
 * - SUPERVISOR: Cannot update sites
 */
export async function updateNeighborhood(neighborhoodId: string, data: UpdateNeighborhoodInput) {
  try {
    // Only SUPERADMIN and MANAGER can update sites
    const currentUser = await requireManager();

    // Get existing site
    const existingNeighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
    });

    if (!existingNeighborhood) {
      return {
        success: false,
        error: 'Neighborhood not found',
      };
    }

    // Validate MANAGER and AREA_MANAGER constraints
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      // Can only update sites in corporations they have access to
      if (!hasAccessToCorporation(currentUser, existingNeighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot update neighborhood from different corporation',
        };
      }
    }

    // Update site
    const updatedNeighborhood = await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
      },
      include: { cityRelation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: { select: { activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_NEIGHBORHOOD',
        entity: 'Site',
        entityId: updatedNeighborhood.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          name: existingNeighborhood.name,
          address: existingNeighborhood.address,
          city: existingNeighborhood.city,
          isActive: existingNeighborhood.isActive,
        },
        after: {
          name: updatedNeighborhood.name,
          address: updatedNeighborhood.address,
          city: updatedNeighborhood.city,
          isActive: updatedNeighborhood.isActive,
        },
      },
    });

    revalidatePath('/neighborhoods');
    revalidatePath(`/neighborhoods/${neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      neighborhood: updatedNeighborhood,
    };
  } catch (error) {
    console.error('Error updating neighborhood:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update site',
    };
  }
}

// ============================================
// DELETE SITE
// ============================================

/**
 * Delete a site (hard delete)
 *
 * Permissions:
 * - SUPERADMIN: Can delete any site
 * - MANAGER: Can delete sites in their corporation
 * - SUPERVISOR: Cannot delete sites
 *
 * WARNING: This will cascade delete all related activists!
 */
export async function deleteNeighborhood(neighborhoodId: string) {
  try {
    // Only SUPERADMIN and MANAGER can delete sites
    const currentUser = await requireManager();

    // Get site to delete
    const neighborhoodToDelete = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
      include: {
        _count: { select: { activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
    });

    if (!neighborhoodToDelete) {
      return {
        success: false,
        error: 'Neighborhood not found',
      };
    }

    // Validate MANAGER and AREA_MANAGER constraints
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, neighborhoodToDelete.cityId)) {
        return {
          success: false,
          error: 'Cannot delete neighborhood from different corporation',
        };
      }
    }

    // Warning if site has data
    if (neighborhoodToDelete._count.activistCoordinatorAssignments > 0 || neighborhoodToDelete._count.activists > 0) {
      console.warn(
        `Deleting site ${neighborhoodToDelete.name} with ${neighborhoodToDelete._count.activistCoordinatorAssignments} supervisors and ${neighborhoodToDelete._count.activists} activists`
      );
    }

    // Delete site (cascades to activists)
    await prisma.neighborhood.delete({
      where: { id: neighborhoodId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_NEIGHBORHOOD',
        entity: 'Site',
        entityId: neighborhoodId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          id: neighborhoodToDelete.id,
          name: neighborhoodToDelete.name,
          city: neighborhoodToDelete.city,
          supervisorCount: neighborhoodToDelete._count.activistCoordinatorAssignments,
          workerCount: neighborhoodToDelete._count.activists,
        },
        after: undefined,
      },
    });

    revalidatePath('/neighborhoods');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Site deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting neighborhood:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete site',
    };
  }
}

// ============================================
// GET SITE STATS
// ============================================

/**
 * Get detailed statistics for a site
 *
 * Permissions:
 * - SUPERADMIN: Can get stats for any site
 * - MANAGER: Can get stats for sites in their corporation
 * - SUPERVISOR: Can get stats for their site only
 */
export async function getNeighborhoodStats(neighborhoodId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Get site first to validate access
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
      include: { cityRelation: true,
      },
    });

    if (!neighborhood) {
      return {
        success: false,
        error: 'Neighborhood not found',
      };
    }

    // Validate access
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, neighborhood.cityId)) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Check if supervisor has access to this site (v1.3: use findFirst since unique constraint changed)
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          activistCoordinatorId: currentUser.id,
          neighborhoodId: neighborhood.id,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    }

    const [
      supervisorCount,
      workerCount,
      activeWorkerCount,
      recentWorkers,
    ] = await Promise.all([
      prisma.activistCoordinatorNeighborhood.count({
        where: {
          neighborhoodId,
        },
      }),
      prisma.activist.count({
        where: { neighborhoodId },
      }),
      prisma.activist.count({
        where: {
          neighborhoodId,
          isActive: true,
        },
      }),
      prisma.activist.findMany({
        where: { neighborhoodId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          position: true,
          phone: true,
          isActive: true,
          createdAt: true,
          activistCoordinator: {
            select: {
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        neighborhood,
        supervisorCount,
        activistCount: workerCount,
        activeActivistCount: activeWorkerCount,
        recentActivists: recentWorkers,
      },
    };
  } catch (error) {
    console.error('Error getting site stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get site stats',
    };
  }
}

// ============================================
// TOGGLE SITE STATUS
// ============================================

/**
 * Toggle site active status (soft enable/disable)
 *
 * Permissions:
 * - SUPERADMIN: Can toggle any site
 * - MANAGER: Can toggle sites in their corporation
 * - SUPERVISOR: Cannot toggle site status
 */
export async function toggleNeighborhoodStatus(neighborhoodId: string) {
  try {
    // Only SUPERADMIN and MANAGER can toggle status
    const currentUser = await requireManager();

    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
    });

    if (!neighborhood) {
      return {
        success: false,
        error: 'Neighborhood not found',
      };
    }

    // Validate MANAGER and AREA_MANAGER constraints
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot toggle neighborhood from different corporation',
        };
      }
    }

    const updatedNeighborhood = await prisma.neighborhood.update({
      where: { id: neighborhoodId },
      data: {
        isActive: !neighborhood.isActive,
      },
      include: { cityRelation: true,
        _count: { select: { activistCoordinatorAssignments: true,
            activists: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: neighborhood.isActive ? 'DEACTIVATE_NEIGHBORHOOD' : 'ACTIVATE_NEIGHBORHOOD',
        entity: 'Site',
        entityId: neighborhoodId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: { isActive: neighborhood.isActive },
        after: { isActive: updatedNeighborhood.isActive },
      },
    });

    revalidatePath('/neighborhoods');
    revalidatePath(`/neighborhoods/${neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      neighborhood: updatedNeighborhood,
    };
  } catch (error) {
    console.error('Error toggling site status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle site status',
    };
  }
}

// ============================================
// LIST SUPERVISORS BY CORPORATION
// ============================================

/**
 * Get all active supervisors for a corporation
 * Used to populate supervisor dropdown when creating/editing sites
 *
 * Permissions:
 * - SUPERADMIN: Can list supervisors from any corporation
 * - MANAGER: Can list supervisors from their corporation only
 * - SUPERVISOR: Can list supervisors from their corporation only
 */
export async function listActivistCoordinatorsByCity(cityId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Validate access to corporation
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, cityId)) {
        return {
          success: false,
          error: 'Cannot list supervisors from different corporation',
          activistCoordinators: [],
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Supervisors can only see other supervisors in their corporation
      const supervisorRecord = await prisma.activistCoordinator.findFirst({
        where: {
          userId: currentUser.id,
          cityId,
        },
      });

      if (!supervisorRecord) {
        return {
          success: false,
          error: 'Access denied',
          activistCoordinators: [],
        };
      }
    }

    // Fetch supervisors
    const supervisors = await prisma.activistCoordinator.findMany({
      where: {
        cityId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            neighborhoodAssignments: true,
            activists: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      success: true,
      activistCoordinators: supervisors.map(s => ({
        id: s.id,
        userId: s.user.id,
        fullName: s.user.fullName,
        email: s.user.email,
        phone: s.user.phone,
        avatarUrl: s.user.avatarUrl,
        title: s.title,
        siteCount: s._count.neighborhoodAssignments,
        workerCount: s._count.activists,
      })),
    };
  } catch (error) {
    console.error('Error listing activistCoordinators:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list supervisors',
      activistCoordinators: [],
    };
  }
}

// ============================================
// LIST COORDINATORS BY NEIGHBORHOOD
// ============================================

/**
 * Get all active coordinators assigned to a specific neighborhood
 * Used to populate coordinator dropdown when creating/editing activists
 *
 * Permissions:
 * - Any authenticated user can list coordinators for a neighborhood they have access to
 */
export async function listActivistCoordinatorsByNeighborhood(neighborhoodId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Get neighborhood to validate access
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
      select: { cityId: true },
    });

    if (!neighborhood) {
      return {
        success: false,
        error: 'Neighborhood not found',
        activistCoordinators: [],
      };
    }

    // Validate access to neighborhood's city
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot list coordinators from different city',
          activistCoordinators: [],
        };
      }
    }

    // Fetch coordinators assigned to this neighborhood
    const assignments = await prisma.activistCoordinatorNeighborhood.findMany({
      where: {
        neighborhoodId,
        activistCoordinator: {
          isActive: true,
        },
      },
      include: {
        activistCoordinator: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                avatarUrl: true,
              },
            },
            _count: {
              select: {
                activists: {
                  where: {
                    neighborhoodId, // Only count activists in THIS neighborhood
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });

    return {
      success: true,
      activistCoordinators: assignments.map(a => ({
        id: a.activistCoordinator.id,
        userId: a.activistCoordinator.user.id,
        fullName: a.activistCoordinator.user.fullName,
        email: a.activistCoordinator.user.email,
        phone: a.activistCoordinator.user.phone,
        avatarUrl: a.activistCoordinator.user.avatarUrl,
        activistCount: a.activistCoordinator._count.activists,
      })),
    };
  } catch (error) {
    console.error('Error listing activistCoordinators for neighborhood:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list coordinators',
      activistCoordinators: [],
    };
  }
}
