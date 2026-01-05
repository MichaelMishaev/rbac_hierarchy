'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireSuperAdmin } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateAreaInput = {
  regionName: string;
  regionCode: string;
  userId?: string; // OPTIONAL - User with AREA_MANAGER role
  description?: string;
  isActive?: boolean;
};

export type UpdateAreaInput = {
  regionName?: string;
  regionCode?: string;
  userId?: string;
  description?: string;
  isActive?: boolean;
};

// ============================================
// CREATE AREA MANAGER
// ============================================

/**
 * Create a new Area Manager
 *
 * STRICT BUSINESS RULES (from ADD_NEW_DESIGN.md):
 * 1. Current user MUST be SuperAdmin
 * 2. regionName MUST be unique
 * 3. regionCode MUST be unique
 * 4. User is OPTIONAL - areas can exist without a manager
 * 5. If user is provided (userId), they must have AREA_MANAGER role
 * 6. User cannot already be an Area Manager (if provided)
 *
 * Permissions:
 * - SUPERADMIN: Can create Area Managers
 * - AREA_MANAGER: Cannot create Area Managers
 * - CITY_COORDINATOR: Cannot create Area Managers
 * - ACTIVIST_COORDINATOR: Cannot create Area Managers
 */
export async function createArea(data: CreateAreaInput) {
  return withServerActionErrorHandler(async () => {
    // RULE 1: Only SUPERADMIN can create Area Managers
    const currentUser = await requireSuperAdmin();

    // RULE 2: Validate regionName uniqueness
    const existingByName = await prisma.areaManager.findFirst({
      where: { regionName: data.regionName.trim() },
    });

    if (existingByName) {
      return {
        success: false,
        error: 'Region name already exists. Please choose a different name.',
      };
    }

    // RULE 3: Validate regionCode uniqueness
    const existingByCode = await prisma.areaManager.findUnique({
      where: { regionCode: data.regionCode.trim().toUpperCase() },
    });

    if (existingByCode) {
      return {
        success: false,
        error: 'Region code already exists. Please choose a different code.',
      };
    }

    // RULE 4 & 5: Validate user IF provided (userId is optional)
    let user = null;
    if (data.userId && data.userId.trim() !== '') {
      user = await prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          isActive: true,
        },
      });

      if (!user) {
        return {
          success: false,
          error: 'Selected user not found.',
        };
      }

      if (user.role !== 'AREA_MANAGER') {
        return {
          success: false,
          error: 'Selected user must have AREA_MANAGER role.',
        };
      }

      if (!user.isActive) {
        return {
          success: false,
          error: 'Selected user is not active.',
        };
      }

      // Check if user is already an Area Manager
      const existingAreaManager = await prisma.areaManager.findFirst({
        where: { userId: data.userId },
      });

      if (existingAreaManager) {
        return {
          success: false,
          error: 'User is already assigned as an Area Manager.',
        };
      }
    }

    // Create Area Manager in database
    const newAreaManager = await prisma.areaManager.create({
      data: {
        regionName: data.regionName.trim(),
        regionCode: data.regionCode.trim().toUpperCase(),
        userId: data.userId && data.userId.trim() !== '' ? data.userId : null,
        metadata: data.description ? { description: data.description } : {},
        isActive: data.isActive ?? true,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_AREA_MANAGER',
        entity: 'AreaManager',
        entityId: newAreaManager.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        after: {
          id: newAreaManager.id,
          regionName: newAreaManager.regionName,
          regionCode: newAreaManager.regionCode,
          userId: newAreaManager.userId,
          userEmail: user?.email || 'N/A (No manager assigned)',
          isActive: newAreaManager.isActive,
        },
      },
    });

    revalidatePath('/areas');
    revalidatePath('/dashboard');

    return {
      success: true,
      area: {
        ...newAreaManager,
        citiesCount: newAreaManager._count.cities,
      },
    };
  }, 'createArea');
}

// ============================================
// UPDATE AREA MANAGER
// ============================================

/**
 * Update Area Manager information
 *
 * Permissions:
 * - SUPERADMIN: Can update any area manager
 * - Others: Cannot update area managers
 */
export async function updateArea(areaId: string, data: UpdateAreaInput) {
  return withServerActionErrorHandler(async () => {
    // Only SUPERADMIN can update area managers
    const currentUser = await requireSuperAdmin();

    // Get existing area manager
    const existingArea = await prisma.areaManager.findUnique({
      where: { id: areaId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
      },
    });

    if (!existingArea) {
      return {
        success: false,
        error: 'Area Manager not found',
      };
    }

    // Validate regionName uniqueness if updating
    if (data.regionName && data.regionName !== existingArea.regionName) {
      const nameExists = await prisma.areaManager.findFirst({
        where: {
          regionName: data.regionName.trim(),
          id: { not: areaId },
        },
      });

      if (nameExists) {
        return {
          success: false,
          error: 'Region name already exists',
        };
      }
    }

    // Validate regionCode uniqueness if updating
    if (data.regionCode && data.regionCode !== existingArea.regionCode) {
      const codeExists = await prisma.areaManager.findFirst({
        where: {
          regionCode: data.regionCode.trim().toUpperCase(),
          id: { not: areaId },
        },
      });

      if (codeExists) {
        return {
          success: false,
          error: 'Region code already exists',
        };
      }
    }

    // Validate new user if updating
    let newUser = null;
    if (data.userId && data.userId !== existingArea.userId) {
      newUser = await prisma.user.findUnique({
        where: { id: data.userId },
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          isActive: true,
        },
      });

      if (!newUser) {
        return {
          success: false,
          error: 'Selected user not found',
        };
      }

      if (newUser.role !== 'AREA_MANAGER') {
        return {
          success: false,
          error: 'Selected user must have AREA_MANAGER role',
        };
      }

      if (!newUser.isActive) {
        return {
          success: false,
          error: 'Selected user is not active',
        };
      }

      // Check if new user is already an area manager
      const existingAreaForUser = await prisma.areaManager.findFirst({
        where: {
          userId: data.userId,
          id: { not: areaId },
        },
      });

      if (existingAreaForUser) {
        return {
          success: false,
          error: 'User is already assigned as an Area Manager',
        };
      }
    }

    // Update area manager - build data object conditionally
    const updateData: any = {};
    if (data.regionName !== undefined) updateData.regionName = data.regionName.trim();
    if (data.regionCode !== undefined) updateData.regionCode = data.regionCode.trim().toUpperCase();
    if (data.userId !== undefined) updateData.userId = data.userId;
    if (data.description) updateData.metadata = { description: data.description };
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updatedArea = await prisma.areaManager.update({
      where: { id: areaId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_AREA_MANAGER',
        entity: 'AreaManager',
        entityId: updatedArea.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          regionName: existingArea.regionName,
          regionCode: existingArea.regionCode,
          userId: existingArea.userId,
          userEmail: existingArea.user?.email || 'N/A',
          isActive: existingArea.isActive,
        },
        after: {
          regionName: updatedArea.regionName,
          regionCode: updatedArea.regionCode,
          userId: updatedArea.userId,
          userEmail: updatedArea.user?.email || 'N/A',
          isActive: updatedArea.isActive,
        },
      },
    });

    revalidatePath('/areas');
    revalidatePath(`/areas/${areaId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      area: {
        ...updatedArea,
        citiesCount: updatedArea._count.cities,
      },
    };
  }, 'updateArea');
}

// ============================================
// DELETE AREA MANAGER
// ============================================

/**
 * Delete an Area Manager (hard delete)
 *
 * Permissions:
 * - SUPERADMIN: Can delete area managers
 * - Others: Cannot delete area managers
 *
 * WARNING: This will cascade delete all related cities!
 */
export async function deleteArea(areaId: string) {
  return withServerActionErrorHandler(async () => {
    // Only SUPERADMIN can delete area managers
    const currentUser = await requireSuperAdmin();

    // CRITICAL: Restrict deletion to specific authorized emails only
    const AUTHORIZED_DELETE_EMAILS = ['dima@gmail.com', 'test@test.com'];
    if (!AUTHORIZED_DELETE_EMAILS.includes(currentUser.email)) {
      return {
        success: false,
        error: 'Only authorized users can delete areas. Contact system administrator.',
      };
    }

    // Get area manager to delete with cities list
    const areaToDelete = await prisma.areaManager.findUnique({
      where: { id: areaId },
      include: {
        user: {
          select: {
            email: true,
            fullName: true,
          },
        },
        cities: {
          select: {
            id: true,
            name: true,
            code: true,
          },
          orderBy: {
            name: 'asc',
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
    });

    if (!areaToDelete) {
      return {
        success: false,
        error: 'Area Manager not found',
      };
    }

    // Warning if area has cities - return full city list
    if (areaToDelete._count.cities > 0) {
      return {
        success: false,
        code: 'CITIES_EXIST',
        cityCount: areaToDelete._count.cities,
        areaName: areaToDelete.regionName,
        cities: areaToDelete.cities.map(city => ({
          id: city.id,
          name: city.name,
          code: city.code,
        })),
        error: `לא ניתן למחוק מחוז עם ${areaToDelete._count.cities} ${areaToDelete._count.cities === 1 ? 'עיר פעילה' : 'ערים פעילות'}`,
      };
    }

    // Delete area manager
    await prisma.areaManager.delete({
      where: { id: areaId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_AREA_MANAGER',
        entity: 'AreaManager',
        entityId: areaId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          id: areaToDelete.id,
          regionName: areaToDelete.regionName,
          regionCode: areaToDelete.regionCode,
          userId: areaToDelete.userId,
          userEmail: areaToDelete.user?.email || 'N/A',
          cityCount: areaToDelete._count.cities,
        },
      },
    });

    revalidatePath('/areas');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Area Manager deleted successfully',
    };
  }, 'deleteArea');
}

// ============================================
// GET AVAILABLE USERS FOR AREA MANAGER
// ============================================

/**
 * Get users with AREA_MANAGER role who are not yet assigned as Area Managers
 *
 * Permissions:
 * - SUPERADMIN: Can access this list
 */
export async function getAvailableAreaManagerUsers(currentAreaId?: string) {
  return withServerActionErrorHandler(async () => {
    // Only SUPERADMIN can access
    await requireSuperAdmin();

    // Get all users with AREA_MANAGER role
    const areaManagerUsers = await prisma.user.findMany({
      where: {
        role: 'AREA_MANAGER',
        isActive: true,
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        phone: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });

    // Get IDs of users who are already area managers
    const findManyOptions: any = {
      select: {
        userId: true,
      },
    };
    if (currentAreaId) {
      findManyOptions.where = {
        // When editing, exclude users assigned to OTHER areas
        id: { not: currentAreaId },
      };
    }
    const assignedUsers = await prisma.areaManager.findMany(findManyOptions);

    const assignedUserIds = new Set(assignedUsers.map((am) => am.userId));

    // Filter to get only available users
    // When editing (currentAreaId provided), includes the currently assigned user
    // When creating (no currentAreaId), excludes all assigned users
    const availableUsers = areaManagerUsers.filter(
      (user) => !assignedUserIds.has(user.id)
    );

    return {
      success: true,
      users: availableUsers,
    };
  }, 'getAvailableAreaManagerUsers');
}

// ============================================
// TOGGLE AREA MANAGER STATUS
// ============================================

/**
 * Toggle area manager active status (soft enable/disable)
 *
 * Permissions:
 * - SUPERADMIN: Can toggle any area manager
 */
/**
 * List all areas
 *
 * Permissions:
 * - SUPERADMIN: Can list all areas
 * - Others: Can list areas they have access to
 */
export async function listAreas() {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'לא מחובר למערכת' };
    }

    // Fetch all areas (SuperAdmin sees all, others see only their areas)
    const areas = await prisma.areaManager.findMany({
      where: currentUser.isSuperAdmin ? {} : {
        userId: currentUser.id,
      },
      select: {
        id: true,
        regionName: true,
        regionCode: true,
        isActive: true,
      },
      orderBy: {
        regionName: 'asc',
      },
    });

    return {
      success: true,
      areas,
    };
  }, 'listAreas');
}

export async function toggleAreaStatus(areaId: string) {
  return withServerActionErrorHandler(async () => {
    // Only SUPERADMIN can toggle status
    const currentUser = await requireSuperAdmin();

    const area = await prisma.areaManager.findUnique({
      where: { id: areaId },
    });

    if (!area) {
      return {
        success: false,
        error: 'Area Manager not found',
      };
    }

    const updatedArea = await prisma.areaManager.update({
      where: { id: areaId },
      data: {
        isActive: !area.isActive,
      },
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            phone: true,
            isActive: true,
          },
        },
        _count: {
          select: {
            cities: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: area.isActive ? 'DEACTIVATE_AREA_MANAGER' : 'ACTIVATE_AREA_MANAGER',
        entity: 'AreaManager',
        entityId: areaId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: { isActive: area.isActive },
        after: { isActive: updatedArea.isActive },
      },
    });

    revalidatePath('/areas');
    revalidatePath(`/areas/${areaId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      area: {
        ...updatedArea,
        citiesCount: updatedArea._count.cities,
      },
    };
  }, 'toggleAreaStatus');
}
