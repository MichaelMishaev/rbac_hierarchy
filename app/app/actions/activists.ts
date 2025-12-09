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
 * Create a new worker
 *
 * Permissions:
 * - SUPERADMIN: Can create workers in any site
 * - MANAGER: Can create workers in sites within their corporation
 * - SUPERVISOR: Can create workers in their assigned site only
 */
export async function createWorker(data: CreateWorkerInput) {
  try {
    // All roles can create workers (with restrictions)
    const currentUser = await requireSupervisor();

    // Get neighborhood to validate access and get cityId
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: data.neighborhoodId },
      include: {
        cityRelation: true,
      },
    });

    if (!neighborhood) {
      return {
        success: false,
        error: 'Neighborhood not found',
      };
    }

    // Validate access based on role
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      // City coordinators can only create activists in their city's neighborhoods
      if (!hasAccessToCorporation(currentUser, neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot create activist for neighborhood in different city',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Coordinators can only create activists in their assigned neighborhoods (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          legacyActivistCoordinatorUserId: currentUser.id,
          neighborhoodId: data.neighborhoodId,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Cannot create worker for site you are not assigned to',
        };
      }
    }

    // Validate activist-coordinator assignment based on neighborhood's coordinator count
    const { validateWorkerSupervisorAssignment } = await import('@/lib/activist-coordinator-assignment');
    const validation = await validateWorkerSupervisorAssignment(data.neighborhoodId, data.activistCoordinatorId);

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
      const { isSupervisorAssignedToSite } = await import('@/lib/activist-coordinator-assignment');
      const isAssigned = await isSupervisorAssignedToSite(data.activistCoordinatorId, data.neighborhoodId);

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
        phone: data.phone,
        email: data.email,
        position: data.position,
        avatarUrl: data.avatarUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
        tags: data.tags ?? [],
        cityId: neighborhood.cityId,
        neighborhoodId: data.neighborhoodId,
        activistCoordinatorId: data.activistCoordinatorId || null, // Null if neighborhood has no coordinators
        isActive: data.isActive ?? true,
      },
      include: {
        neighborhood: {
          include: {
            cityRelation: true,
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
        action: 'CREATE_WORKER',
        entity: 'Worker',
        entityId: newActivist.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: undefined,
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

    revalidatePath('/workers');
    revalidatePath(`/sites/${data.neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      worker: newActivist,
    };
  } catch (error) {
    console.error('Error creating worker:', error);
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
      // SUPERVISOR: Filter by specific assigned sites (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { legacyActivistCoordinatorUserId: currentUser.id },
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

    // Query workers
    const activists = await prisma.activist.findMany({
      where,
      include: {
        neighborhood: {
          include: {
            cityRelation: true,
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
      orderBy: [
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      activists,
      count: activists.length,
    };
  } catch (error) {
    console.error('Error listing workers:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list workers',
      workers: [],
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

    const activist = await prisma.activist.findUnique({
      where: { id: activistId },
      include: {
        neighborhood: {
          include: {
            cityRelation: true,
          },
        },
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

    if (!activist) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access permissions
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, activist.neighborhood.cityId)) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    } else if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      // Check if supervisor has access to this worker's site (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          legacyActivistCoordinatorUserId: currentUser.id,
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
    console.error('Error getting worker:', error);
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
      // Check if supervisor has access to this worker's site (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          legacyActivistCoordinatorUserId: currentUser.id,
          neighborhoodId: existingActivist.neighborhoodId,
        },
      });

      if (!activistCoordinatorNeighborhood) {
        return {
          success: false,
          error: 'Cannot update worker from site you are not assigned to',
        };
      }

      // Supervisors cannot change site or supervisor
      if (data.neighborhoodId || data.activistCoordinatorId) {
        return {
          success: false,
          error: 'Supervisors cannot change worker site or supervisor',
        };
      }
    }

    // Handle site change - clear supervisorId and require reselection
    let finalNeighborhoodId = data.neighborhoodId || existingActivist.neighborhoodId;
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
    const { validateWorkerSupervisorAssignment } = await import('@/lib/activist-coordinator-assignment');
    const validation = await validateWorkerSupervisorAssignment(finalNeighborhoodId, finalActivistCoordinatorId);

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
      const { isSupervisorAssignedToSite } = await import('@/lib/activist-coordinator-assignment');
      const isAssigned = await isSupervisorAssignedToSite(finalActivistCoordinatorId, finalNeighborhoodId);

      if (!isAssigned) {
        return {
          success: false,
          error: 'Supervisor is not assigned to this site',
        };
      }
    }

    // Update worker
    const updatedActivist = await prisma.activist.update({
      where: { id: activistId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        position: data.position,
        avatarUrl: data.avatarUrl,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
        tags: data.tags,
        neighborhoodId: finalNeighborhoodId !== existingActivist.neighborhoodId ? finalNeighborhoodId : undefined,
        activistCoordinatorId: finalActivistCoordinatorId !== existingActivist.activistCoordinatorId ? finalActivistCoordinatorId : undefined,
        isActive: data.isActive,
      },
      include: {
        neighborhood: {
          include: {
            cityRelation: true,
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

    revalidatePath('/workers');
    revalidatePath(`/workers/${activistId}`);
    revalidatePath(`/sites/${existingActivist.neighborhoodId}`);
    if (data.neighborhoodId && data.neighborhoodId !== existingActivist.neighborhoodId) {
      revalidatePath(`/sites/${data.neighborhoodId}`);
    }

    return {
      success: true,
      worker: updatedActivist,
    };
  } catch (error) {
    console.error('Error updating worker:', error);
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
      // Check if supervisor has access to this worker's site (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          legacyActivistCoordinatorUserId: currentUser.id,
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

    revalidatePath('/workers');
    revalidatePath(`/sites/${activistToDelete.neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Worker deactivated successfully',
      worker: deletedActivist,
    };
  } catch (error) {
    console.error('Error deleting worker:', error);
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
      // Check if supervisor has access to this worker's site (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorNeighborhood = await prisma.activistCoordinatorNeighborhood.findFirst({
        where: {
          legacyActivistCoordinatorUserId: currentUser.id,
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

    revalidatePath('/workers');
    revalidatePath(`/workers/${activistId}`);
    revalidatePath(`/sites/${activist.neighborhoodId}`);

    return {
      success: true,
      worker: updatedActivist,
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
export async function bulkCreateWorkers(workers: CreateWorkerInput[]) {
  try {
    const currentUser = await requireSupervisor();

    const results = {
      success: [] as any[],
      failed: [] as { worker: CreateWorkerInput; error: string }[],
    };

    for (const workerData of workers) {
      const result = await createWorker(workerData);

      if (result.success && result.worker) {
        results.success.push(result.worker);
      } else {
        results.failed.push({
          worker: workerData,
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
    console.error('Error bulk creating workers:', error);
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
      // SUPERVISOR: Filter by specific assigned sites (using legacyActivistCoordinatorUserId for User.id)
      const activistCoordinatorNeighborhoods = await prisma.activistCoordinatorNeighborhood.findMany({
        where: { legacyActivistCoordinatorUserId: currentUser.id },
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
