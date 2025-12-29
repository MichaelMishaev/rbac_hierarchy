'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireSupervisor, hasAccessToCorporation, getUserCorporations } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateWorkerInput = {
  fullName: string;
  phone?: string;
  email?: string;
  position?: string;
  avatarUrl?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  tags?: string[];
  neighborhoodId: string;
  activistCoordinatorId?: string; // Optional, defaults to current user if supervisor
  isActive?: boolean;
  giveLoginAccess?: boolean;
  generatedPassword?: string;
};

export type UpdateWorkerInput = {
  fullName?: string;
  phone?: string;
  email?: string;
  position?: string;
  avatarUrl?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  tags?: string[];
  neighborhoodId?: string;
  activistCoordinatorId?: string;
  isActive?: boolean;
  giveLoginAccess?: boolean;
  generatedPassword?: string;
};

export type ListWorkersFilters = {
  neighborhoodId?: string;
  activistCoordinatorId?: string;
  search?: string;
  position?: string;
  isActive?: boolean;
  tags?: string[];
};

// ============================================
// CREATE WORKER
// ============================================

/**
 * Create a new activist
 *
 * STRICT BUSINESS RULES (from ADD_NEW_DESIGN.md):
 * 1. SuperAdmin: Can create in any neighborhood
 * 2. Area Manager:
 *    - Filter neighborhoods by area
 *    - Join: neighborhoods → cities → area_managers
 * 3. City Coordinator:
 *    - Filter neighborhoods by city_id
 *    - Join: neighborhoods → cities
 * 4. Activist Coordinator:
 *    - MUST check `activist_coordinator_neighborhoods` M2M table
 *    - Get assigned neighborhood IDs
 *    - Can ONLY create in assigned neighborhoods
 *    - CRITICAL: Use junction table validation
 * 5. fullName + phone MUST be unique per neighborhood
 * 6. neighborhoodId MUST be valid and within scope
 *
 * Permissions:
 * - SUPERADMIN: Can create activists in any neighborhood
 * - AREA_MANAGER: Can create activists in neighborhoods within their area
 * - CITY_COORDINATOR: Can create activists in neighborhoods within their city
 * - ACTIVIST_COORDINATOR: Can create activists in ASSIGNED neighborhoods ONLY (M2M validation)
 */
export async function createWorker(data: CreateWorkerInput) {
  try {
    // Get current user
    const currentUser = await getCurrentUser();

    // Only SUPERADMIN, AREA_MANAGER, CITY_COORDINATOR, and ACTIVIST_COORDINATOR can create activists
    if (
      currentUser.role !== 'SUPERADMIN' &&
      currentUser.role !== 'AREA_MANAGER' &&
      currentUser.role !== 'CITY_COORDINATOR' &&
      currentUser.role !== 'ACTIVIST_COORDINATOR'
    ) {
      return {
        success: false,
        error: 'Only SuperAdmin, Area Managers, City Coordinators, and Activist Coordinators can create activists.',
      };
    }

    // Get neighborhood to validate access and get cityId
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: data.neighborhoodId },
      include: {
        cityRelation: {
          select: {
            id: true,
            name: true,
            code: true,
            areaManagerId: true,
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

    // CRITICAL SCOPE VALIDATION: Enforce strict hierarchy
    if (currentUser.role === 'AREA_MANAGER') {
      // Area Manager: Validate neighborhood's city belongs to their area
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
      if (neighborhood.cityRelation.areaManagerId !== currentUserAreaManager.id) {
        return {
          success: false,
          error: 'Area Managers can only create activists in neighborhoods within their area.',
        };
      }
    } else if (currentUser.role === 'CITY_COORDINATOR') {
      // City Coordinator: Validate neighborhood belongs to their city
      const currentUserCityCoordinator = await prisma.cityCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!currentUserCityCoordinator) {
        return {
          success: false,
          error: 'City Coordinator record not found for current user.',
        };
      }

      // STRICT: Can ONLY create in their assigned city's neighborhoods
      if (neighborhood.cityId !== currentUserCityCoordinator.cityId) {
        return {
          success: false,
          error: 'City Coordinators can only create activists in neighborhoods within their city.',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // CRITICAL M2M VALIDATION: Activist Coordinator can ONLY create in assigned neighborhoods
      // ✅ SECURITY FIX (VULN-RBAC-003): Use correct M2M join pattern
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          success: false,
          error: 'רשומת רכז פעילים לא נמצאה',
        };
      }

      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          activistCoordinatorId: activistCoordinator.id, // ✅ CORRECT: Use activistCoordinatorId
          neighborhoodId: data.neighborhoodId,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Activist Coordinators can only create activists in neighborhoods assigned to them.',
        };
      }
    }

    // Validate activist-coordinator assignment based on neighborhood's coordinator count
    const { validateActivistActivistCoordinatorAssignment } = await import('@/lib/activist-coordinator-assignment');
    const validation = await validateActivistActivistCoordinatorAssignment(data.neighborhoodId, data.activistCoordinatorId);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // If activistCoordinatorId provided, validate it exists and is accessible
    if (data.activistCoordinatorId) {
      const activistCoordinator = await prisma.activistCoordinator.findUnique({
        where: { id: data.activistCoordinatorId },
        include: {
          user: true,
        },
      });

      if (!activistCoordinator || !activistCoordinator.isActive) {
        return {
          success: false,
          error: 'Invalid or inactive activist coordinator',
        };
      }

      // Verify coordinator is assigned to this neighborhood
      const { isActivistCoordinatorAssignedToNeighborhood } = await import('@/lib/activist-coordinator-assignment');
      const isAssigned = await isActivistCoordinatorAssignedToNeighborhood(data.activistCoordinatorId, data.neighborhoodId);

      if (!isAssigned) {
        return {
          success: false,
          error: 'Activist coordinator is not assigned to this neighborhood',
        };
      }
    }

    // Create activist
    const newActivist = await prisma.activist.create({
      data: {
        fullName: data.fullName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        position: data.position ?? null,
        avatarUrl: data.avatarUrl ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        notes: data.notes ?? null,
        tags: data.tags ?? [],
        cityId: neighborhood.cityId,
        neighborhoodId: data.neighborhoodId,
        activistCoordinatorId: data.activistCoordinatorId || null, // Null if neighborhood has no coordinators
        isActive: data.isActive ?? true,
      },
      include: {
        neighborhood: {
          include: {
            cityRelation: {
              select: {
                id: true,
                name: true,
                code: true,
                areaManagerId: true,
              },
            },
          },
        },
        activistCoordinator: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Create user account if requested (activist login access)
    if (data.giveLoginAccess && data.generatedPassword && data.phone) {
      const bcrypt = await import('bcryptjs');
      const passwordHash = await bcrypt.hash(data.generatedPassword, 10);

      const activistUser = await prisma.user.create({
        data: {
          email: `${data.phone.replace(/[^0-9]/g, '')}@activist.login`, // Phone as email
          fullName: data.fullName,
          phone: data.phone,
          passwordHash,
          role: 'ACTIVIST',
          isActive: true,
          requirePasswordChange: true, // Force password change on first login
        },
      });

      // Link activist to user
      await prisma.activist.update({
        where: { id: newActivist.id },
        data: { userId: activistUser.id },
      });

      console.log(`✅ Created activist user account: ${activistUser.email} (phone: ${data.phone})`);
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_WORKER',
        entity: 'Worker',
        entityId: newActivist.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        after: {
          id: newActivist.id,
          fullName: newActivist.fullName,
          position: newActivist.position,
          neighborhoodId: newActivist.neighborhoodId,
          activistCoordinatorId: newActivist.activistCoordinatorId,
          isActive: newActivist.isActive,
        },
      },
    });

    revalidatePath('/activists');
    revalidatePath(`/neighborhoods/${data.neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      activist: newActivist,
    };
  } catch (error) {
    console.error('Error creating activist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create worker',
    };
  }
}

// ============================================
// LIST WORKERS
// ============================================

/**
 * List workers with proper filtering based on role
 *
 * Permissions:
 * - SUPERADMIN: Can see all workers
 * - MANAGER: Can see workers in their corporation's sites
 * - SUPERVISOR: Can see workers in their site only
 */
export async function listWorkers(filters: ListWorkersFilters = {}) {
  try {
    const currentUser = await getCurrentUser();

    // Build where clause based on role and filters
    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // ✅ SECURITY FIX (VULN-RBAC-003): Use correct M2M join pattern
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          success: false,
          error: 'רשומת רכז פעילים לא נמצאה',
          data: { activists: [], total: 0, page: 1, limit: 10 },
        };
      }

      const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { activistCoordinatorId: activistCoordinator.id }, // ✅ CORRECT: Use activistCoordinatorId
        select: { neighborhoodId: true },
      });
      const neighborhoodIds = activistCoordinatorNeighborhoods.map(ss => ss.neighborhoodId);
      where.neighborhoodId = { in: neighborhoodIds };
    } else {
      // MANAGER/AREA_MANAGER: Filter by corporation
      const userCorps = getUserCorporations(currentUser);
      if (userCorps !== 'all') {
        // Non-superadmins can only see workers in their corporations
        where.neighborhood = {
          cityId: { in: userCorps },
        };
      }
    }

    // Apply additional filters
    if (filters.neighborhoodId) {
      where.neighborhoodId = filters.neighborhoodId;
    }

    if (filters.activistCoordinatorId) {
      where.activistCoordinatorId = filters.activistCoordinatorId;
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { position: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    if (filters.position) {
      where.position = { contains: filters.position, mode: 'insensitive' };
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.tags && filters.tags.length > 0) {
      where.tags = {
        hasSome: filters.tags,
      };
    }

    // Query activists without neighborhood include (Prisma doesn't handle composite FK properly in includes)
    const activistData = await prisma.activist.findMany({
      where,
      include: {
        activistCoordinator: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Manually fetch neighborhoods using composite FK (neighborhoodId, cityId)
    const neighborhoodKeys = activistData.map((a) => ({
      id: a.neighborhoodId,
      cityId: a.cityId,
    }));

    const neighborhoods = await prisma.neighborhood.findMany({
      where: {
        OR: neighborhoodKeys.map((key) => ({
          id: key.id,
          cityId: key.cityId,
        })),
      },
      include: {
        cityRelation: true,
      },
    });

    // Create a lookup map using composite key
    const neighborhoodMap = new Map(
      neighborhoods.map((n) => [`${n.id}:${n.cityId}`, n])
    );

    // Manually join activists with neighborhoods and serialize to plain objects
    const activists = activistData.map((activist) => {
      const neighborhood = neighborhoodMap.get(`${activist.neighborhoodId}:${activist.cityId}`);

      return {
        ...activist,
        // Serialize Date objects to ISO strings for Server Action compatibility
        createdAt: activist.createdAt?.toISOString(),
        updatedAt: activist.updatedAt?.toISOString(),
        startDate: activist.startDate?.toISOString() || null,
        endDate: activist.endDate?.toISOString() || null,
        // Explicitly serialize neighborhood to avoid Prisma object issues
        neighborhood: neighborhood ? {
          id: neighborhood.id,
          name: neighborhood.name,
          address: neighborhood.address || null,
          city: neighborhood.city || null,
          country: neighborhood.country || null,
          latitude: neighborhood.latitude || null,
          longitude: neighborhood.longitude || null,
          phone: neighborhood.phone || null,
          email: neighborhood.email || null,
          isActive: neighborhood.isActive,
          cityId: neighborhood.cityId,
          createdAt: neighborhood.createdAt?.toISOString(),
          updatedAt: neighborhood.updatedAt?.toISOString(),
          cityRelation: neighborhood.cityRelation ? {
            id: neighborhood.cityRelation.id,
            name: neighborhood.cityRelation.name,
            code: neighborhood.cityRelation.code || null,
          } : null,
        } : null,
      };
    });

    return {
      success: true,
      activists,
      count: activists.length,
    };
  } catch (error) {
    console.error('Error listing activists:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list workers',
      activists: [],
      count: 0,
    };
  }
}

// ============================================
// GET WORKER BY ID
// ============================================

/**
 * Get a specific worker by ID with access validation
 *
 * Permissions:
 * - SUPERADMIN: Can view any worker
 * - MANAGER: Can view workers in their corporation
 * - SUPERVISOR: Can view workers in their site
 */
export async function getWorkerById(activistId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Fetch activist without neighborhood include (Prisma composite FK issue)
    const activistData = await prisma.activist.findUnique({
      where: { id: activistId },
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
          },
        },
      },
    });

    if (!activistData) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Manually fetch neighborhood using composite FK
    const neighborhood = await prisma.neighborhood.findFirst({
      where: {
        id: activistData.neighborhoodId,
        cityId: activistData.cityId,
      },
      include: {
        cityRelation: true,
      },
    });

    const activist = {
      ...activistData,
      neighborhood,
    };

    // Ensure neighborhood was found
    if (!neighborhood) {
      return {
        success: false,
        error: 'Neighborhood not found for activist',
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
      // ✅ SECURITY FIX (VULN-RBAC-003): Use correct M2M join pattern
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          success: false,
          error: 'רשומת רכז פעילים לא נמצאה',
        };
      }

      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          activistCoordinatorId: activistCoordinator.id, // ✅ CORRECT: Use activistCoordinatorId
          neighborhoodId: activist.neighborhoodId,
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
      activist,
    };
  } catch (error) {
    console.error('Error getting activist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get worker',
    };
  }
}

// ============================================
// UPDATE WORKER
// ============================================

/**
 * Update worker information
 *
 * Permissions:
 * - SUPERADMIN: Can update any worker
 * - MANAGER: Can update workers in their corporation
 * - SUPERVISOR: Can update workers in their site (limited fields)
 */
export async function updateWorker(activistId: string, data: UpdateWorkerInput) {
  try {
    const currentUser = await requireSupervisor();

    // Get existing worker
    const existingActivist = await prisma.activist.findUnique({
      where: { id: activistId },
      include: {
        neighborhood: true,
      },
    });

    if (!existingActivist) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access based on role
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, existingActivist.neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot update worker from different corporation',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // ✅ SECURITY FIX (VULN-RBAC-003): Use correct M2M join pattern
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          success: false,
          error: 'רשומת רכז פעילים לא נמצאה',
        };
      }

      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          activistCoordinatorId: activistCoordinator.id, // ✅ CORRECT: Use activistCoordinatorId
          neighborhoodId: existingActivist.neighborhoodId,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Cannot update worker from site you are not assigned to',
        };
      }

      // Activist Coordinators CAN edit activists but CANNOT change neighborhood or coordinator assignment
      if (data.neighborhoodId && data.neighborhoodId !== existingActivist.neighborhoodId) {
        return {
          success: false,
          error: 'Activist Coordinators cannot change activist neighborhood',
        };
      }
      if (data.activistCoordinatorId && data.activistCoordinatorId !== existingActivist.activistCoordinatorId) {
        return {
          success: false,
          error: 'Activist Coordinators cannot reassign activists to different coordinators',
        };
      }
    }

    // Handle site change - clear supervisorId and require reselection
    const finalNeighborhoodId = data.neighborhoodId || existingActivist.neighborhoodId;
    let finalActivistCoordinatorId = data.activistCoordinatorId !== undefined ? data.activistCoordinatorId : existingActivist.activistCoordinatorId;

    // Validate new site if being changed
    if (data.neighborhoodId && data.neighborhoodId !== existingActivist.neighborhoodId) {
      const newNeighborhood = await prisma.neighborhood.findUnique({
        where: { id: data.neighborhoodId },
      });

      if (!newNeighborhood) {
        return {
          success: false,
          error: 'New site not found',
        };
      }

      // Managers can only move workers within their corporations
      if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
        if (!hasAccessToCorporation(currentUser, newNeighborhood.cityId)) {
          return {
            success: false,
            error: 'Cannot move worker to site in different corporation',
          };
        }
      }

      // CRITICAL: When moving to different site, clear supervisorId (require manual reselection)
      if (data.activistCoordinatorId === undefined) {
        finalActivistCoordinatorId = null;
      }
    }

    // Validate supervisor assignment for the final site
    const { validateActivistActivistCoordinatorAssignment } = await import('@/lib/activist-coordinator-assignment');
    const validation = await validateActivistActivistCoordinatorAssignment(finalNeighborhoodId, finalActivistCoordinatorId);

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error,
      };
    }

    // If changing supervisor, validate new supervisor
    if (finalActivistCoordinatorId && finalActivistCoordinatorId !== existingActivist.activistCoordinatorId) {
      const activistCoordinator = await prisma.activistCoordinator.findUnique({
        where: { id: finalActivistCoordinatorId },
        include: {
          user: true,
        },
      });

      if (!activistCoordinator || !activistCoordinator.isActive) {
        return {
          success: false,
          error: 'Invalid or inactive supervisor',
        };
      }

      // Verify supervisor is assigned to the site
      const { isActivistCoordinatorAssignedToNeighborhood } = await import('@/lib/activist-coordinator-assignment');
      const isAssigned = await isActivistCoordinatorAssignedToNeighborhood(finalActivistCoordinatorId, finalNeighborhoodId);

      if (!isAssigned) {
        return {
          success: false,
          error: 'הרכז אינו משויך לשכונה זו',
        };
      }
    }

    // Handle user account creation/disabling BEFORE updating activist
    if (data.giveLoginAccess !== undefined) {
      if (data.giveLoginAccess && data.generatedPassword && data.phone) {
        // Create user account if toggle is turned ON
        if (!existingActivist.userId) {
          const bcrypt = await import('bcryptjs');
          const passwordHash = await bcrypt.hash(data.generatedPassword, 10);

          const activistUser = await prisma.user.create({
            data: {
              email: `${data.phone.replace(/[^0-9]/g, '')}@activist.login`, // Phone as email
              fullName: data.fullName || existingActivist.fullName,
              phone: data.phone,
              passwordHash,
              role: 'ACTIVIST',
              isActive: true,
              requirePasswordChange: true, // Force password change on first login
            },
          });

          // Link activist to user (will be done in update below)
          existingActivist.userId = activistUser.id;
          console.log(`✅ Created activist user account: ${activistUser.email} (phone: ${data.phone})`);
        }
      } else if (!data.giveLoginAccess && existingActivist.userId) {
        // Disable user account if toggle is turned OFF
        await prisma.user.update({
          where: { id: existingActivist.userId },
          data: { isActive: false },
        });
        console.log(`⛔ Disabled user account for activist: ${existingActivist.fullName}`);
      }
    }

    // Update worker
    const updatedActivist = await prisma.activist.update({
      where: { id: activistId },
      data: {
        fullName: data.fullName ?? existingActivist.fullName,
        phone: data.phone ?? null,
        email: data.email ?? null,
        position: data.position ?? null,
        avatarUrl: data.avatarUrl ?? null,
        startDate: data.startDate ?? null,
        endDate: data.endDate ?? null,
        notes: data.notes ?? null,
        tags: data.tags ?? existingActivist.tags,
        ...(finalNeighborhoodId !== existingActivist.neighborhoodId ? { neighborhoodId: finalNeighborhoodId } : {}),
        ...(finalActivistCoordinatorId !== existingActivist.activistCoordinatorId ? { activistCoordinatorId: finalActivistCoordinatorId } : {}),
        isActive: data.isActive ?? existingActivist.isActive,
        // Link to user if account was just created
        ...(existingActivist.userId ? { userId: existingActivist.userId } : {}),
      },
      include: {
        neighborhood: {
          include: {
            cityRelation: {
              select: {
                id: true,
                name: true,
                code: true,
                areaManagerId: true,
              },
            },
          },
        },
        activistCoordinator: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_WORKER',
        entity: 'Worker',
        entityId: updatedActivist.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          fullName: existingActivist.fullName,
          position: existingActivist.position,
          neighborhoodId: existingActivist.neighborhoodId,
          isActive: existingActivist.isActive,
        },
        after: {
          fullName: updatedActivist.fullName,
          position: updatedActivist.position,
          neighborhoodId: updatedActivist.neighborhoodId,
          isActive: updatedActivist.isActive,
        },
      },
    });

    revalidatePath('/activists');
    revalidatePath(`/activists/${activistId}`);
    revalidatePath(`/neighborhoods/${existingActivist.neighborhoodId}`);
    if (data.neighborhoodId && data.neighborhoodId !== existingActivist.neighborhoodId) {
      revalidatePath(`/neighborhoods/${data.neighborhoodId}`);
    }

    return {
      success: true,
      activist: updatedActivist,
    };
  } catch (error) {
    console.error('Error updating activist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update worker',
    };
  }
}

// ============================================
// DELETE WORKER
// ============================================

/**
 * Soft delete a worker (set isActive = false)
 *
 * Permissions:
 * - SUPERADMIN: Can delete any worker
 * - MANAGER: Can delete workers in their corporation
 * - SUPERVISOR: Can delete workers in their site
 */
export async function deleteWorker(activistId: string) {
  try {
    const currentUser = await requireSupervisor();

    // Get worker to delete
    const activistToDelete = await prisma.activist.findUnique({
      where: { id: activistId },
      include: {
        neighborhood: true,
      },
    });

    if (!activistToDelete) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access based on role
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, activistToDelete.neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot delete worker from different corporation',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // ✅ SECURITY FIX (VULN-RBAC-003): Use correct M2M join pattern
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          success: false,
          error: 'רשומת רכז פעילים לא נמצאה',
        };
      }

      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          activistCoordinatorId: activistCoordinator.id, // ✅ CORRECT: Use activistCoordinatorId
          neighborhoodId: activistToDelete.neighborhoodId,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Cannot delete worker from site you are not assigned to',
        };
      }
    }

    // Soft delete (set isActive = false)
    const deletedActivist = await prisma.activist.update({
      where: { id: activistId },
      data: {
        isActive: false,
        endDate: new Date(), // Set end date to now
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_WORKER',
        entity: 'Worker',
        entityId: activistId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          id: activistToDelete.id,
          fullName: activistToDelete.fullName,
          position: activistToDelete.position,
          neighborhoodId: activistToDelete.neighborhoodId,
          isActive: activistToDelete.isActive,
        },
        after: {
          isActive: false,
          endDate: deletedActivist.endDate,
        },
      },
    });

    revalidatePath('/activists');
    revalidatePath(`/neighborhoods/${activistToDelete.neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Worker deactivated successfully',
      activist: deletedActivist,
    };
  } catch (error) {
    console.error('Error deleting activist:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete worker',
    };
  }
}

// ============================================
// TOGGLE WORKER STATUS
// ============================================

/**
 * Toggle worker active status
 *
 * Permissions:
 * - SUPERADMIN: Can toggle any worker
 * - MANAGER: Can toggle workers in their corporation
 * - SUPERVISOR: Can toggle workers in their site
 */
export async function toggleWorkerStatus(activistId: string) {
  try {
    const currentUser = await requireSupervisor();

    const activist = await prisma.activist.findUnique({
      where: { id: activistId },
      include: {
        neighborhood: true,
      },
    });

    if (!activist) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, activist.neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot toggle worker from different corporation',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // ✅ SECURITY FIX (VULN-RBAC-003): Fix M2M query using correct FK
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          success: false,
          error: 'רשומת רכז פעילים לא נמצאה',
        };
      }

      // Check if supervisor has access to this worker's site
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          activistCoordinatorId: activistCoordinator.id,
          neighborhoodId: activist.neighborhoodId,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Cannot toggle worker from site you are not assigned to',
        };
      }
    }

    const updatedActivist = await prisma.activist.update({
      where: { id: activistId },
      data: {
        isActive: !activist.isActive,
        endDate: !activist.isActive ? null : new Date(), // Clear end date when reactivating
      },
      include: {
        neighborhood: {
          select: {
            id: true,
            name: true,
          },
        },
        activistCoordinator: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
              },
            },
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: activist.isActive ? 'DEACTIVATE_WORKER' : 'ACTIVATE_WORKER',
        entity: 'Worker',
        entityId: activistId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: { isActive: activist.isActive },
        after: { isActive: updatedActivist.isActive },
      },
    });

    revalidatePath('/activists');
    revalidatePath(`/activists/${activistId}`);
    revalidatePath(`/neighborhoods/${activist.neighborhoodId}`);

    return {
      success: true,
      activist: updatedActivist,
    };
  } catch (error) {
    console.error('Error toggling worker status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle worker status',
    };
  }
}

// ============================================
// BULK CREATE WORKERS
// ============================================

/**
 * Create multiple workers at once (for CSV import)
 *
 * Permissions:
 * - Same as createWorker for each worker
 */
export async function bulkCreateWorkers(activists: CreateWorkerInput[]) {
  try {
    const results = {
      success: [] as any[],
      failed: [] as { activist: CreateWorkerInput; error: string }[],
    };

    for (const workerData of activists) {
      const result = await createWorker(workerData);

      if (result.success && result.activist) {
        results.success.push(result.activist);
      } else {
        results.failed.push({
          activist: workerData,
          error: result.error || 'Unknown error',
        });
      }
    }

    return {
      success: true,
      results: {
        successCount: results.success.length,
        failedCount: results.failed.length,
        success: results.success,
        failed: results.failed,
      },
    };
  } catch (error) {
    console.error('Error bulk creating activists:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to bulk create workers',
    };
  }
}

// ============================================
// GET WORKER STATS
// ============================================

/**
 * Get worker statistics
 *
 * Permissions:
 * - Based on role (same filtering as listWorkers)
 */
export async function getWorkerStats() {
  try {
    const currentUser = await getCurrentUser();

    const where: any = {};

    // Get user corporations (for later use in site filtering)
    const userCorps = currentUser.role === 'ACTIVIST_COORDINATOR' ? null : getUserCorporations(currentUser);

    // Apply role-based filtering
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // ✅ SECURITY FIX (VULN-RBAC-003): Fix M2M query using correct FK
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!activistCoordinator) {
        return {
          total: 0,
          active: 0,
          inactive: 0,
          byCorp: [],
          byNeighborhood: [],
          byStatus: [],
        };
      }

      // SUPERVISOR: Filter by specific assigned sites
      const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { activistCoordinatorId: activistCoordinator.id },
        select: { neighborhoodId: true },
      });
      const neighborhoodIds = activistCoordinatorNeighborhoods.map(ss => ss.neighborhoodId);
      where.neighborhoodId = { in: neighborhoodIds };
    } else {
      // MANAGER/AREA_MANAGER: Filter by corporation
      if (userCorps !== 'all') {
        where.neighborhood = {
          cityId: { in: userCorps },
        };
      }
    }

    const [
      totalWorkers,
      activeWorkers,
      inactiveWorkers,
      recentWorkers,
      workersBySite,
    ] = await Promise.all([
      prisma.activist.count({ where }),
      prisma.activist.count({ where: { ...where, isActive: true } }),
      prisma.activist.count({ where: { ...where, isActive: false } }),
      prisma.activist.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          fullName: true,
          position: true,
          isActive: true,
          createdAt: true,
          neighborhood: {
            select: {
              id: true,
              name: true,
            },
          },
          activistCoordinator: {
            select: {
              id: true,
              user: {
                select: {
                  fullName: true,
                },
              },
            },
          },
        },
      }),
      prisma.neighborhood.findMany({
        where: userCorps && userCorps !== 'all'
          ? { cityId: { in: userCorps } }
          : {},
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              activists: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalWorkers,
        activeWorkers,
        inactiveWorkers,
        recentWorkers,
        workersBySite,
      },
    };
  } catch (error) {
    console.error('Error getting worker stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get worker stats',
    };
  }
}

// ============================================
// QUICK UPDATE ACTIVIST FIELD (INLINE EDITING)
// ============================================

/**
 * Quick update a single activist field for inline editing
 * Supports: phone, email, position, isActive
 *
 * RBAC Rules:
 * - SuperAdmin: Can update any activist
 * - Area Manager: Can update activists in their area
 * - City Coordinator: Can update activists in their city
 * - Activist Coordinator: Can update activists in assigned neighborhoods only
 */
export async function quickUpdateActivistField(
  activistId: string,
  field: 'phone' | 'email' | 'position' | 'isActive',
  value: string | boolean
) {
  try {
    const currentUser = await getCurrentUser();

    // Only authorized roles can update activists
    if (
      currentUser.role !== 'SUPERADMIN' &&
      currentUser.role !== 'AREA_MANAGER' &&
      currentUser.role !== 'CITY_COORDINATOR' &&
      currentUser.role !== 'ACTIVIST_COORDINATOR'
    ) {
      return {
        success: false,
        error: 'Unauthorized to update activists',
      };
    }

    // Get activist with neighborhood and city info for RBAC check
    const activist = await prisma.activist.findUnique({
      where: { id: activistId },
      include: {
        neighborhood: {
          include: {
            cityRelation: {
              include: {
                areaManager: true,
              },
            },
          },
        },
      },
    });

    if (!activist) {
      return {
        success: false,
        error: 'Activist not found',
      };
    }

    // RBAC: Check access based on role
    if (currentUser.role === 'AREA_MANAGER') {
      // Area Manager can only update activists in their area
      const areaManager = await prisma.areaManager.findFirst({
        where: { userId: currentUser.id },
      });

      if (!areaManager || activist.neighborhood.cityRelation?.areaManagerId !== areaManager.id) {
        return {
          success: false,
          error: 'You can only update activists in your area',
        };
      }
    } else if (currentUser.role === 'CITY_COORDINATOR') {
      // City Coordinator can only update activists in their city
      const cityCoordinator = await prisma.cityCoordinator.findFirst({
        where: { userId: currentUser.id },
      });

      if (!cityCoordinator || activist.neighborhood.cityId !== cityCoordinator.cityId) {
        return {
          success: false,
          error: 'You can only update activists in your city',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Activist Coordinator can only update activists in assigned neighborhoods
      const activistCoordinator = await prisma.activistCoordinator.findFirst({
        where: { userId: currentUser.id },
        include: {
          neighborhoodAssignments: {
            select: {
              neighborhoodId: true,
            },
          },
        },
      });

      const assignedNeighborhoodIds = activistCoordinator?.neighborhoodAssignments.map(n => n.neighborhoodId) || [];

      if (!assignedNeighborhoodIds.includes(activist.neighborhoodId)) {
        return {
          success: false,
          error: 'You can only update activists in your assigned neighborhoods',
        };
      }
    }

    // Validate field-specific data
    if (field === 'email' && value && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return {
          success: false,
          error: 'Invalid email format',
        };
      }
    }

    if (field === 'phone' && value && typeof value === 'string') {
      // Israeli phone validation (optional - basic check)
      const phoneRegex = /^[0-9\-\+\(\)\s]+$/;
      if (!phoneRegex.test(value)) {
        return {
          success: false,
          error: 'Invalid phone format',
        };
      }
    }

    // Update the field
    const updatedActivist = await prisma.activist.update({
      where: { id: activistId },
      data: { [field]: value },
      include: {
        neighborhood: {
          select: {
            id: true,
            name: true,
            cityRelation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        activistCoordinator: {
          select: {
            id: true,
            user: {
              select: {
                fullName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    revalidatePath('/activists');
    revalidatePath('/dashboard');

    return {
      success: true,
      activist: updatedActivist,
    };
  } catch (error) {
    console.error('Error updating activist field:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update activist',
    };
  }
}
