'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireSupervisor, hasAccessToCorporation, getUserCorporations } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateWorkerInput = {
  name: string;
  phone?: string;
  email?: string;
  position?: string;
  avatar?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  tags?: string[];
  siteId: string;
  supervisorId?: string; // Optional, defaults to current user if supervisor
  isActive?: boolean;
};

export type UpdateWorkerInput = {
  name?: string;
  phone?: string;
  email?: string;
  position?: string;
  avatar?: string;
  startDate?: Date;
  endDate?: Date;
  notes?: string;
  tags?: string[];
  siteId?: string;
  supervisorId?: string;
  isActive?: boolean;
};

export type ListWorkersFilters = {
  siteId?: string;
  supervisorId?: string;
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

    // Get site to validate access and get corporationId
    const site = await prisma.site.findUnique({
      where: { id: data.siteId },
      include: {
        corporation: true,
      },
    });

    if (!site) {
      return {
        success: false,
        error: 'Site not found',
      };
    }

    // Validate access based on role
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      // Managers can only create workers in their corporation's sites
      if (!hasAccessToCorporation(currentUser, site.corporationId)) {
        return {
          success: false,
          error: 'Cannot create worker for site in different corporation',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Supervisors can only create workers in their assigned sites
      const supervisorSite = await prisma.supervisorSite.findFirst({
        where: {
          supervisorId: currentUser.id,
          siteId: data.siteId,
        },
      });

      if (!supervisorSite) {
        return {
          success: false,
          error: 'Cannot create worker for site you are not assigned to',
        };
      }
    }

    // Determine supervisor ID
    let supervisorId = data.supervisorId;
    if (currentUser.role === 'SUPERVISOR') {
      // Supervisors can only assign themselves
      supervisorId = currentUser.id;
    } else if (!supervisorId) {
      // If not provided, default to current user
      supervisorId = currentUser.id;
    }

    // Validate supervisor exists and has access to the site
    const supervisor = await prisma.user.findUnique({
      where: { id: supervisorId },
    });

    if (!supervisor || supervisor.role !== 'SUPERVISOR') {
      return {
        success: false,
        error: 'Invalid supervisor',
      };
    }

    // Create worker
    const newWorker = await prisma.worker.create({
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        position: data.position,
        avatar: data.avatar,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
        tags: data.tags ?? [],
        corporationId: site.corporationId,
        siteId: data.siteId,
        supervisorId,
        isActive: data.isActive ?? true,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            city: true,
            corporation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_WORKER',
        entity: 'Worker',
        entityId: newWorker.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: undefined,
        newValue: {
          id: newWorker.id,
          name: newWorker.name,
          position: newWorker.position,
          siteId: newWorker.siteId,
          supervisorId: newWorker.supervisorId,
          isActive: newWorker.isActive,
        },
      },
    });

    revalidatePath('/workers');
    revalidatePath(`/sites/${data.siteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      worker: newWorker,
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
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      // Non-superadmins can only see workers in their corporations
      where.site = {
        corporationId: { in: userCorps },
      };
    }

    // Additional SUPERVISOR filtering
    if (currentUser.role === 'SUPERVISOR') {
      // Supervisors can only see workers in their assigned sites
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { supervisorId: currentUser.id },
        select: { siteId: true },
      });
      const siteIds = supervisorSites.map(ss => ss.siteId);
      where.siteId = { in: siteIds };
    }

    // Apply additional filters
    if (filters.siteId) {
      where.siteId = filters.siteId;
    }

    if (filters.supervisorId) {
      where.supervisorId = filters.supervisorId;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
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
    const workers = await prisma.worker.findMany({
      where,
      include: {
        site: {
          select: {
            id: true,
            name: true,
            city: true,
            corporation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
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
      workers,
      count: workers.length,
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
export async function getWorkerById(workerId: string) {
  try {
    const currentUser = await getCurrentUser();

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        site: {
          include: {
            corporation: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!worker) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access permissions
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, worker.site.corporationId)) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Check if supervisor has access to this worker's site
      const supervisorSite = await prisma.supervisorSite.findFirst({
        where: {
          supervisorId: currentUser.id,
          siteId: worker.siteId,
        },
      });

      if (!supervisorSite) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    }

    return {
      success: true,
      worker,
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
export async function updateWorker(workerId: string, data: UpdateWorkerInput) {
  try {
    const currentUser = await requireSupervisor();

    // Get existing worker
    const existingWorker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        site: true,
      },
    });

    if (!existingWorker) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access based on role
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, existingWorker.site.corporationId)) {
        return {
          success: false,
          error: 'Cannot update worker from different corporation',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Check if supervisor has access to this worker's site
      const supervisorSite = await prisma.supervisorSite.findFirst({
        where: {
          supervisorId: currentUser.id,
          siteId: existingWorker.siteId,
        },
      });

      if (!supervisorSite) {
        return {
          success: false,
          error: 'Cannot update worker from site you are not assigned to',
        };
      }

      // Supervisors cannot change site or supervisor
      if (data.siteId || data.supervisorId) {
        return {
          success: false,
          error: 'Supervisors cannot change worker site or supervisor',
        };
      }
    }

    // Validate new site if being changed
    if (data.siteId && data.siteId !== existingWorker.siteId) {
      const newSite = await prisma.site.findUnique({
        where: { id: data.siteId },
      });

      if (!newSite) {
        return {
          success: false,
          error: 'New site not found',
        };
      }

      // Managers can only move workers within their corporations
      if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
        if (!hasAccessToCorporation(currentUser, newSite.corporationId)) {
          return {
            success: false,
            error: 'Cannot move worker to site in different corporation',
          };
        }
      }
    }

    // Update worker
    const updatedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        position: data.position,
        avatar: data.avatar,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
        tags: data.tags,
        siteId: data.siteId,
        supervisorId: data.supervisorId,
        isActive: data.isActive,
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
            city: true,
            corporation: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_WORKER',
        entity: 'Worker',
        entityId: updatedWorker.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          name: existingWorker.name,
          position: existingWorker.position,
          siteId: existingWorker.siteId,
          isActive: existingWorker.isActive,
        },
        newValue: {
          name: updatedWorker.name,
          position: updatedWorker.position,
          siteId: updatedWorker.siteId,
          isActive: updatedWorker.isActive,
        },
      },
    });

    revalidatePath('/workers');
    revalidatePath(`/workers/${workerId}`);
    revalidatePath(`/sites/${existingWorker.siteId}`);
    if (data.siteId && data.siteId !== existingWorker.siteId) {
      revalidatePath(`/sites/${data.siteId}`);
    }

    return {
      success: true,
      worker: updatedWorker,
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
export async function deleteWorker(workerId: string) {
  try {
    const currentUser = await requireSupervisor();

    // Get worker to delete
    const workerToDelete = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        site: true,
      },
    });

    if (!workerToDelete) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access based on role
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, workerToDelete.site.corporationId)) {
        return {
          success: false,
          error: 'Cannot delete worker from different corporation',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Check if supervisor has access to this worker's site
      const supervisorSite = await prisma.supervisorSite.findFirst({
        where: {
          supervisorId: currentUser.id,
          siteId: workerToDelete.siteId,
        },
      });

      if (!supervisorSite) {
        return {
          success: false,
          error: 'Cannot delete worker from site you are not assigned to',
        };
      }
    }

    // Soft delete (set isActive = false)
    const deletedWorker = await prisma.worker.update({
      where: { id: workerId },
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
        entityId: workerId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          id: workerToDelete.id,
          name: workerToDelete.name,
          position: workerToDelete.position,
          siteId: workerToDelete.siteId,
          isActive: workerToDelete.isActive,
        },
        newValue: {
          isActive: false,
          endDate: deletedWorker.endDate,
        },
      },
    });

    revalidatePath('/workers');
    revalidatePath(`/sites/${workerToDelete.siteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Worker deactivated successfully',
      worker: deletedWorker,
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
export async function toggleWorkerStatus(workerId: string) {
  try {
    const currentUser = await requireSupervisor();

    const worker = await prisma.worker.findUnique({
      where: { id: workerId },
      include: {
        site: true,
      },
    });

    if (!worker) {
      return {
        success: false,
        error: 'Worker not found',
      };
    }

    // Validate access
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      if (!hasAccessToCorporation(currentUser, worker.site.corporationId)) {
        return {
          success: false,
          error: 'Cannot toggle worker from different corporation',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Check if supervisor has access to this worker's site
      const supervisorSite = await prisma.supervisorSite.findFirst({
        where: {
          supervisorId: currentUser.id,
          siteId: worker.siteId,
        },
      });

      if (!supervisorSite) {
        return {
          success: false,
          error: 'Cannot toggle worker from site you are not assigned to',
        };
      }
    }

    const updatedWorker = await prisma.worker.update({
      where: { id: workerId },
      data: {
        isActive: !worker.isActive,
        endDate: !worker.isActive ? null : new Date(), // Clear end date when reactivating
      },
      include: {
        site: {
          select: {
            id: true,
            name: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: worker.isActive ? 'DEACTIVATE_WORKER' : 'ACTIVATE_WORKER',
        entity: 'Worker',
        entityId: workerId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: { isActive: worker.isActive },
        newValue: { isActive: updatedWorker.isActive },
      },
    });

    revalidatePath('/workers');
    revalidatePath(`/workers/${workerId}`);
    revalidatePath(`/sites/${worker.siteId}`);

    return {
      success: true,
      worker: updatedWorker,
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

    // Apply role-based filtering
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      where.site = {
        corporationId: { in: userCorps },
      };
    }

    // Additional SUPERVISOR filtering
    if (currentUser.role === 'SUPERVISOR') {
      // Supervisors can only see stats for their assigned sites
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { supervisorId: currentUser.id },
        select: { siteId: true },
      });
      const siteIds = supervisorSites.map(ss => ss.siteId);
      where.siteId = { in: siteIds };
    }

    const [
      totalWorkers,
      activeWorkers,
      inactiveWorkers,
      recentWorkers,
      workersBySite,
    ] = await Promise.all([
      prisma.worker.count({ where }),
      prisma.worker.count({ where: { ...where, isActive: true } }),
      prisma.worker.count({ where: { ...where, isActive: false } }),
      prisma.worker.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          position: true,
          isActive: true,
          createdAt: true,
          site: {
            select: {
              name: true,
            },
          },
          supervisor: {
            select: {
              name: true,
            },
          },
        },
      }),
      prisma.site.findMany({
        where: userCorps !== 'all'
          ? { corporationId: { in: userCorps } }
          : {},
        select: {
          id: true,
          name: true,
          _count: {
            select: {
              workers: true,
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
