'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireSuperAdmin, getUserCorporations, hasAccessToCorporation } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateCityInput = {
  name: string;
  code: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
  areaManagerId: string; // v1.4: Required - Area Manager assignment
};

export type UpdateCityInput = {
  name?: string;
  code?: string;
  description?: string;
  logo?: string;
  isActive?: boolean;
  areaManagerId?: string; // v1.4: Allow changing Area Manager assignment
};

export type ListCitiesFilters = {
  search?: string;
  isActive?: boolean;
};

// ============================================
// CREATE CORPORATION
// ============================================

/**
 * Create a new city
 *
 * STRICT BUSINESS RULES (from ADD_NEW_DESIGN.md):
 * 1. SuperAdmin: Can create in any area
 * 2. Area Manager:
 *    - MUST exist in `area_managers` table
 *    - MUST assign city to their area (`areaManagerId`)
 *    - CANNOT assign to other areas
 * 3. cityName MUST NOT be empty
 * 4. code should be auto-generated or unique
 *
 * Permissions:
 * - SUPERADMIN: Can create cities in any area
 * - AREA_MANAGER: Can create cities (ONLY in their area)
 * - CITY_COORDINATOR: Cannot create cities
 * - ACTIVIST_COORDINATOR: Cannot create cities
 */
export async function createCity(data: CreateCityInput) {
  return withServerActionErrorHandler(async () => {
    // Get current user (SuperAdmin OR Area Manager)
    const currentUser = await getCurrentUser();

    // Only SUPERADMIN and AREA_MANAGER can create cities
    if (currentUser.role !== 'SUPERADMIN' && currentUser.role !== 'AREA_MANAGER') {
      return {
        success: false,
        error: 'Only SuperAdmin and Area Managers can create cities.',
      };
    }

    // Validate name uniqueness
    const existingByName = await prisma.city.findFirst({
      where: { name: data.name },
    });

    if (existingByName) {
      return {
        success: false,
        error: 'עיר בשם זה כבר קיימת במערכת', // City with this name already exists in the system
      };
    }

    // Validate code uniqueness
    const existingCorp = await prisma.city.findUnique({
      where: { code: data.code },
    });

    if (existingCorp) {
      return {
        success: false,
        error: 'קוד העיר כבר קיים במערכת', // City code already exists in the system
      };
    }

    // Validate that Area Manager exists and is active
    const areaManager = await prisma.areaManager.findUnique({
      where: { id: data.areaManagerId },
    });

    if (!areaManager) {
      return {
        success: false,
        error: 'Selected Area Manager not found.',
      };
    }

    if (!areaManager.isActive) {
      return {
        success: false,
        error: 'Selected Area Manager is not active.',
      };
    }

    // CRITICAL SCOPE VALIDATION: Area Managers can ONLY create in their area
    if (currentUser.role === 'AREA_MANAGER') {
      // Get the Area Manager record for current user
      const currentUserAreaManager = await prisma.areaManager.findFirst({
        where: { userId: currentUser.id },
      });

      if (!currentUserAreaManager) {
        return {
          success: false,
          error: 'Area Manager record not found for current user.',
        };
      }

      // STRICT VALIDATION: Area Manager can ONLY create cities in THEIR area
      if (data.areaManagerId !== currentUserAreaManager.id) {
        return {
          success: false,
          error: 'Area Managers can only create cities in their own area.',
        };
      }
    }

    // Create corporation
    const newCorporation = await prisma.city.create({
      data: {
        name: data.name,
        code: data.code,
        description: data.description ?? null,
        logoUrl: data.logo ?? null,
        isActive: data.isActive ?? true,
        areaManagerId: data.areaManagerId, // v1.4: Required field from user input
      },
      include: {
        areaManager: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            coordinators: true,     // Counts CityCoordinator records
            activistCoordinators: true,  // Counts ActivistCoordinator records
            neighborhoods: true,
            invitations: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_CORPORATION',
        entity: 'Corporation',
        entityId: newCorporation.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        after: {
          id: newCorporation.id,
          name: newCorporation.name,
          code: newCorporation.code,
          isActive: newCorporation.isActive,
        },
      },
    });

    revalidatePath('/cities');
    revalidatePath('/dashboard');

    return {
      success: true,
      city: newCorporation,
    };
  }, 'createCity');
}

// ============================================
// LIST CORPORATIONS
// ============================================

/**
 * List corporations with proper filtering based on role
 *
 * Permissions:
 * - SUPERADMIN: Can see all corporations
 * - MANAGER: Can see only their corporation
 * - SUPERVISOR: Can see only their corporation
 */
export async function listCities(filters: ListCitiesFilters = {}) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // Build where clause based on role and filters
    const where: any = {};

    // Role-based filtering
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      // Non-superadmins can only see their corporations
      where.id = { in: userCorps };
    }

    // Apply additional filters
    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { code: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Default to showing only active cities (hide soft-deleted)
    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    } else {
      where.isActive = true; // Hide soft-deleted cities by default
    }

    // Query corporations
    const corporations = await prisma.city.findMany({
      where,
      include: {
        _count: {
          select: {
            coordinators: true,     // Counts CityCoordinator records
            activistCoordinators: true,  // Counts ActivistCoordinator records
            neighborhoods: true,
            invitations: true,
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
      cities: corporations,
      count: corporations.length,
    };
  }, 'listCities');
}

// ============================================
// GET CORPORATION BY ID
// ============================================

/**
 * Get a specific corporation by ID with access validation
 *
 * Permissions:
 * - SUPERADMIN: Can view any corporation
 * - MANAGER: Can view only their corporation
 * - SUPERVISOR: Can view only their corporation
 */
export async function getCityById(cityId: string) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // Non-superadmins can only view their corporations
    if (!hasAccessToCorporation(currentUser, cityId)) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    const corporation = await prisma.city.findUnique({
      where: { id: cityId },
      include: {
        coordinators: {
          select: {
            id: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
        neighborhoods: {
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
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            coordinators: true,     // Counts CityCoordinator records
            activistCoordinators: true,  // Counts ActivistCoordinator records
            neighborhoods: true,
            invitations: true,
          },
        },
      },
    });

    if (!corporation) {
      return {
        success: false,
        error: 'Corporation not found',
      };
    }

    return {
      success: true,
      corporation,
    };
  }, 'getCityById');
}

// ============================================
// UPDATE CORPORATION
// ============================================

/**
 * Update corporation information
 *
 * Permissions:
 * - SUPERADMIN: Can update any corporation (all fields)
 * - MANAGER: Can update only their corporation (limited fields)
 * - SUPERVISOR: Cannot update corporations
 */
export async function updateCity(cityId: string, data: UpdateCityInput) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // SUPERVISOR cannot update corporations
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      return {
        success: false,
        error: 'Supervisors cannot update corporations',
      };
    }

    // Get existing corporation
    const existingCorp = await prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!existingCorp) {
      return {
        success: false,
        error: 'Corporation not found',
      };
    }

    // Normalize optional fields that might arrive as empty strings from forms
    const normalizedAreaManagerId =
      typeof data.areaManagerId === 'string' && data.areaManagerId.trim().length === 0
        ? undefined
        : data.areaManagerId;

    // Validate MANAGER and AREA_MANAGER constraints
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      // Can only update corporations they have access to
      if (!hasAccessToCorporation(currentUser, cityId)) {
        return {
          success: false,
          error: 'Cannot update other corporations',
        };
      }

      // Managers cannot change isActive status or code (but Area Managers can)
      if (currentUser.role === 'CITY_COORDINATOR' && (data.isActive !== undefined || data.code !== undefined)) {
        return {
          success: false,
          error: 'Managers cannot change corporation status or code',
        };
      }
    }

    // Check code uniqueness if code is being updated
    if (data.code && data.code !== existingCorp.code) {
      const codeExists = await prisma.city.findUnique({
        where: { code: data.code },
      });

      if (codeExists) {
        return {
          success: false,
          error: 'Corporation code already exists',
        };
      }
    }

    // v1.4: Validate Area Manager if areaManagerId is being updated
    if (normalizedAreaManagerId !== undefined) {
      const areaManager = await prisma.areaManager.findUnique({
        where: { id: normalizedAreaManagerId },
      });

      if (!areaManager) {
        return {
          success: false,
          error: 'Selected Area Manager not found.',
        };
      }

      if (!areaManager.isActive) {
        return {
          success: false,
          error: 'Selected Area Manager is not active.',
        };
      }
    }

    // Update corporation - build data object conditionally
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.code !== undefined) updateData.code = data.code;
    if (data.description !== undefined) updateData.description = data.description ?? null;
    if (data.logo !== undefined) updateData.logoUrl = data.logo ?? null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (normalizedAreaManagerId !== undefined) updateData.areaManagerId = normalizedAreaManagerId; // v1.4: Update Area Manager if provided

    const updatedCorporation = await prisma.city.update({
      where: { id: cityId },
      data: updateData,
      include: {
        areaManager: {
          include: {
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            coordinators: true,     // Counts CityCoordinator records
            activistCoordinators: true,  // Counts ActivistCoordinator records
            neighborhoods: true,
            invitations: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_CORPORATION',
        entity: 'Corporation',
        entityId: updatedCorporation.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          name: existingCorp.name,
          code: existingCorp.code,
          description: existingCorp.description,
          isActive: existingCorp.isActive,
          areaManagerId: existingCorp.areaManagerId, // v1.4: Track Area Manager changes
        },
        after: {
          name: updatedCorporation.name,
          code: updatedCorporation.code,
          description: updatedCorporation.description,
          isActive: updatedCorporation.isActive,
          areaManagerId: updatedCorporation.areaManagerId, // v1.4: Track Area Manager changes
        },
      },
    });

    revalidatePath('/cities');
    revalidatePath(`/cities/${cityId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      city: updatedCorporation,
    };
  }, 'updateCity');
}

// ============================================
// DELETE CORPORATION
// ============================================

/**
 * Delete a corporation (hard delete)
 *
 * Permissions:
 * - SUPERADMIN: Can delete any corporation
 * - MANAGER: Cannot delete corporations
 * - SUPERVISOR: Cannot delete corporations
 *
 * WARNING: This will cascade delete all related data!
 */
export async function deleteCity(cityId: string) {
  return withServerActionErrorHandler(async () => {
    // Only SUPERADMIN can delete corporations
    const currentUser = await requireSuperAdmin();

    // Get corporation to delete with active neighborhoods list
    const corpToDelete = await prisma.city.findUnique({
      where: { id: cityId },
      include: {
        neighborhoods: {
          where: {
            isActive: true,
          },
          select: {
            id: true,
            name: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            coordinators: {
              where: {
                isActive: true,
              },
            },
            neighborhoods: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!corpToDelete) {
      return {
        success: false,
        error: 'Corporation not found',
      };
    }

    // CRITICAL: Block deletion if city has neighborhoods - return full neighborhood list
    if (corpToDelete._count.neighborhoods > 0) {
      return {
        success: false,
        code: 'NEIGHBORHOODS_EXIST',
        neighborhoodCount: corpToDelete._count.neighborhoods,
        cityName: corpToDelete.name,
        neighborhoods: corpToDelete.neighborhoods.map(neighborhood => ({
          id: neighborhood.id,
          name: neighborhood.name,
        })),
        error: `לא ניתן למחוק עיר עם ${corpToDelete._count.neighborhoods} ${corpToDelete._count.neighborhoods === 1 ? 'שכונה פעילה' : 'שכונות פעילות'}`,
      };
    }

    // CRITICAL: Block deletion if city has coordinators
    if (corpToDelete._count.coordinators > 0) {
      return {
        success: false,
        code: 'COORDINATORS_EXIST',
        coordinatorCount: corpToDelete._count.coordinators,
        cityName: corpToDelete.name,
        error: `לא ניתן למחוק עיר עם ${corpToDelete._count.coordinators} ${corpToDelete._count.coordinators === 1 ? 'רכז פעיל' : 'רכזים פעילים'}`,
      };
    }

    // Soft delete city (set isActive = false)
    // INV-DATA-001: Preserves historical data for campaign analytics
    await prisma.city.update({
      where: { id: cityId },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'SOFT_DELETE_CITY',
        entity: 'City',
        entityId: cityId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          id: corpToDelete.id,
          name: corpToDelete.name,
          code: corpToDelete.code,
          coordinatorCount: corpToDelete._count.coordinators,
          neighborhoodCount: corpToDelete._count.neighborhoods,
          isActive: true,
        },
        after: {
          isActive: false,
        },
      },
    });

    revalidatePath('/cities');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Corporation deleted successfully',
    };
  }, 'deleteCity');
}

// ============================================
// GET CORPORATION STATS
// ============================================

/**
 * Get detailed statistics for a corporation
 *
 * Permissions:
 * - SUPERADMIN: Can get stats for any corporation
 * - MANAGER: Can get stats for their corporation only
 * - SUPERVISOR: Can get stats for their corporation only
 */
export async function getCityStats(cityId: string) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // Validate access
    if (!hasAccessToCorporation(currentUser, cityId)) {
      return {
        success: false,
        error: 'Access denied',
      };
    }

    const [
      corporation,
      managerCount,
      supervisorCount,
      siteCount,
      activeSiteCount,
      workerCount,
      pendingInvitations,
      recentManagers,
      recentSites,
    ] = await Promise.all([
      prisma.city.findUnique({
        where: { id: cityId },
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
      prisma.invitation.count({
        where: {
          cityId,
          status: 'PENDING',
        },
      }),
      prisma.cityCoordinator.findMany({
        where: {
          cityId,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
            },
          },
          createdAt: true,
        },
      }),
      prisma.neighborhood.findMany({
        where: { cityId },
        orderBy: { createdAt: 'desc' },
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

    if (!corporation) {
      return {
        success: false,
        error: 'Corporation not found',
      };
    }

    return {
      success: true,
      stats: {
        corporation,
        managerCount,
        supervisorCount,
        siteCount,
        activeSiteCount,
        workerCount,
        pendingInvitations,
        recentManagers,
        recentSites,
      },
    };
  }, 'getCityStats');
}

// ============================================
// TOGGLE CORPORATION STATUS
// ============================================

/**
 * Toggle corporation active status (soft enable/disable)
 *
 * Permissions:
 * - SUPERADMIN: Can toggle any corporation
 * - MANAGER: Cannot toggle corporation status
 * - SUPERVISOR: Cannot toggle corporation status
 */
export async function toggleCityStatus(cityId: string) {
  return withServerActionErrorHandler(async () => {
    // Only SUPERADMIN can toggle status
    const currentUser = await requireSuperAdmin();

    const corporation = await prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!corporation) {
      return {
        success: false,
        error: 'Corporation not found',
      };
    }

    const updatedCorporation = await prisma.city.update({
      where: { id: cityId },
      data: {
        isActive: !corporation.isActive,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: corporation.isActive ? 'DEACTIVATE_CORPORATION' : 'ACTIVATE_CORPORATION',
        entity: 'Corporation',
        entityId: cityId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: { isActive: corporation.isActive },
        after: { isActive: updatedCorporation.isActive },
      },
    });

    revalidatePath('/cities');
    revalidatePath(`/cities/${cityId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      city: updatedCorporation,
    };
  }, 'toggleCityStatus');
}

// ============================================
// GET AREA MANAGERS (FILTERED BY SCOPE)
// ============================================

/**
 * Get Area Managers for dropdown selection (filtered by user scope)
 *
 * STRICT SCOPE FILTERING (RBAC):
 * - SuperAdmin: See ALL areas (no filtering)
 * - Area Manager: See ONLY their area
 * - City Coordinator: See ONLY the area their city belongs to
 * - Activist Coordinator: See ONLY the area their city belongs to
 *
 * Permissions:
 * - SUPERADMIN: Full access to all areas
 * - AREA_MANAGER: Restricted to their own area
 * - CITY_COORDINATOR: Restricted to their city's area
 * - ACTIVIST_COORDINATOR: Restricted to their city's area
 */
export async function getAreaManagers() {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    const whereClause: any = {
      isActive: true,
      user: {
        isActive: true, // CRITICAL: Only return areas with active (non-soft-deleted) users
      },
    };

    // ROLE-BASED SCOPE FILTERING
    if (currentUser.role === 'AREA_MANAGER') {
      // Area Manager: ONLY see their own area
      const currentUserAreaManager = await prisma.areaManager.findFirst({
        where: { userId: currentUser.id },
      });

      if (!currentUserAreaManager) {
        return {
          success: false,
          error: 'Area Manager record not found',
          areaManagers: [],
        };
      }

      whereClause.id = currentUserAreaManager.id;
    } else if (currentUser.role === 'CITY_COORDINATOR') {
      // City Coordinator: ONLY see the area their city belongs to
      const cityCoordinator = await prisma.cityCoordinator.findFirst({
        where: { userId: currentUser.id },
        include: {
          city: {
            select: {
              areaManagerId: true,
            },
          },
        },
      });

      if (!cityCoordinator || !cityCoordinator.city.areaManagerId) {
        return {
          success: false,
          error: 'City Coordinator record or city area not found',
          areaManagers: [],
        };
      }

      whereClause.id = cityCoordinator.city.areaManagerId;
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Activist Coordinator: ONLY see the area their city belongs to
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
        include: {
          city: {
            select: {
              areaManagerId: true,
            },
          },
        },
      });

      if (!activistCoordinator || !activistCoordinator.city.areaManagerId) {
        return {
          success: false,
          error: 'Activist Coordinator record or city area not found',
          areaManagers: [],
        };
      }

      whereClause.id = activistCoordinator.city.areaManagerId;
    }
    // else: SUPERADMIN sees all areas (no additional filtering)

    // CRITICAL FIX: Soft-deleted users filtered at relation level in whereClause
    const areaManagers = await prisma.areaManager.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
      orderBy: {
        regionName: 'asc',
      },
    });

    // CRITICAL FIX (Bug #50): Filter out area managers with null/deleted users
    // Prisma's relation filter doesn't exclude orphaned foreign keys (deleted users)
    const validAreaManagers = areaManagers.filter((am) => am.user !== null);

    return {
      success: true,
      areaManagers: validAreaManagers.map((am) => ({
        id: am.id,
        regionName: am.regionName,
        regionCode: am.regionCode,
        fullName: am.user!.fullName,
        email: am.user!.email,
        corporationCount: am._count.cities,
      })),
    };
  }, 'getAreaManagers');
}
