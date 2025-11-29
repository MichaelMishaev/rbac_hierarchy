'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireManager } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateSiteInput = {
  name: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  corporationId: string;
  isActive?: boolean;
};

export type UpdateSiteInput = {
  name?: string;
  address?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
};

export type ListSitesFilters = {
  corporationId?: string;
  search?: string;
  city?: string;
  isActive?: boolean;
};

// ============================================
// CREATE SITE
// ============================================

/**
 * Create a new site
 *
 * Permissions:
 * - SUPERADMIN: Can create sites in any corporation
 * - MANAGER: Can create sites in their corporation only
 * - SUPERVISOR: Cannot create sites
 */
export async function createSite(data: CreateSiteInput) {
  try {
    // Only SUPERADMIN and MANAGER can create sites
    const currentUser = await requireManager();

    // Validate MANAGER constraints
    if (currentUser.role === 'MANAGER') {
      // Can only create sites in their own corporation
      if (data.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Cannot create site for different corporation',
        };
      }
    }

    // Verify corporation exists
    const corporation = await prisma.corporation.findUnique({
      where: { id: data.corporationId },
    });

    if (!corporation) {
      return {
        success: false,
        error: 'Corporation not found',
      };
    }

    // Create site
    const newSite = await prisma.site.create({
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country ?? 'Israel',
        phone: data.phone,
        email: data.email,
        corporationId: data.corporationId,
        isActive: data.isActive ?? true,
      },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_SITE',
        entity: 'Site',
        entityId: newSite.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: undefined,
        newValue: {
          id: newSite.id,
          name: newSite.name,
          city: newSite.city,
          corporationId: newSite.corporationId,
          isActive: newSite.isActive,
        },
      },
    });

    revalidatePath('/sites');
    revalidatePath('/dashboard');

    return {
      success: true,
      site: newSite,
    };
  } catch (error) {
    console.error('Error creating site:', error);
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
export async function listSites(filters: ListSitesFilters = {}) {
  try {
    const currentUser = await getCurrentUser();

    // Build where clause based on role and filters
    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'MANAGER') {
      // Managers can only see sites in their corporation
      where.corporationId = currentUser.corporationId;
    } else if (currentUser.role === 'SUPERVISOR') {
      // Supervisors can only see sites they are assigned to
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { supervisorId: currentUser.id },
        select: { siteId: true },
      });
      const siteIds = supervisorSites.map(ss => ss.siteId);
      where.id = { in: siteIds };
    }

    // Apply additional filters
    if (filters.corporationId && currentUser.role === 'SUPERADMIN') {
      where.corporationId = filters.corporationId;
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

    // Query sites
    const sites = await prisma.site.findMany({
      where,
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
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
      sites,
      count: sites.length,
    };
  } catch (error) {
    console.error('Error listing sites:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list sites',
      sites: [],
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
export async function getSiteById(siteId: string) {
  try {
    const currentUser = await getCurrentUser();

    const site = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supervisorAssignments: {
          include: {
            supervisor: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                createdAt: true,
              },
            },
          },
          orderBy: { assignedAt: 'desc' },
        },
        workers: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            position: true,
            phone: true,
            isActive: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
          },
        },
      },
    });

    if (!site) {
      return {
        success: false,
        error: 'Site not found',
      };
    }

    // Validate access permissions
    if (currentUser.role === 'MANAGER') {
      if (site.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Check if supervisor has access to this site
      const supervisorSite = await prisma.supervisorSite.findUnique({
        where: {
          supervisorId_siteId: {
            supervisorId: currentUser.id,
            siteId: site.id,
          },
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
      site,
    };
  } catch (error) {
    console.error('Error getting site:', error);
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
export async function updateSite(siteId: string, data: UpdateSiteInput) {
  try {
    // Only SUPERADMIN and MANAGER can update sites
    const currentUser = await requireManager();

    // Get existing site
    const existingSite = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!existingSite) {
      return {
        success: false,
        error: 'Site not found',
      };
    }

    // Validate MANAGER constraints
    if (currentUser.role === 'MANAGER') {
      // Can only update sites in their own corporation
      if (existingSite.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Cannot update site from different corporation',
        };
      }
    }

    // Update site
    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        name: data.name,
        address: data.address,
        city: data.city,
        country: data.country,
        phone: data.phone,
        email: data.email,
        isActive: data.isActive,
      },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_SITE',
        entity: 'Site',
        entityId: updatedSite.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          name: existingSite.name,
          address: existingSite.address,
          city: existingSite.city,
          isActive: existingSite.isActive,
        },
        newValue: {
          name: updatedSite.name,
          address: updatedSite.address,
          city: updatedSite.city,
          isActive: updatedSite.isActive,
        },
      },
    });

    revalidatePath('/sites');
    revalidatePath(`/sites/${siteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      site: updatedSite,
    };
  } catch (error) {
    console.error('Error updating site:', error);
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
 * WARNING: This will cascade delete all related workers!
 */
export async function deleteSite(siteId: string) {
  try {
    // Only SUPERADMIN and MANAGER can delete sites
    const currentUser = await requireManager();

    // Get site to delete
    const siteToDelete = await prisma.site.findUnique({
      where: { id: siteId },
      include: {
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
          },
        },
      },
    });

    if (!siteToDelete) {
      return {
        success: false,
        error: 'Site not found',
      };
    }

    // Validate MANAGER constraints
    if (currentUser.role === 'MANAGER') {
      if (siteToDelete.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Cannot delete site from different corporation',
        };
      }
    }

    // Warning if site has data
    if (siteToDelete._count.supervisorAssignments > 0 || siteToDelete._count.workers > 0) {
      console.warn(
        `Deleting site ${siteToDelete.name} with ${siteToDelete._count.supervisorAssignments} supervisors and ${siteToDelete._count.workers} workers`
      );
    }

    // Delete site (cascades to workers)
    await prisma.site.delete({
      where: { id: siteId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_SITE',
        entity: 'Site',
        entityId: siteId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          id: siteToDelete.id,
          name: siteToDelete.name,
          city: siteToDelete.city,
          supervisorCount: siteToDelete._count.supervisorAssignments,
          workerCount: siteToDelete._count.workers,
        },
        newValue: undefined,
      },
    });

    revalidatePath('/sites');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Site deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting site:', error);
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
export async function getSiteStats(siteId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Get site first to validate access
    const site = await prisma.site.findUnique({
      where: { id: siteId },
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

    // Validate access
    if (currentUser.role === 'MANAGER') {
      if (site.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Check if supervisor has access to this site
      const supervisorSite = await prisma.supervisorSite.findUnique({
        where: {
          supervisorId_siteId: {
            supervisorId: currentUser.id,
            siteId: site.id,
          },
        },
      });

      if (!supervisorSite) {
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
      prisma.supervisorSite.count({
        where: {
          siteId,
        },
      }),
      prisma.worker.count({
        where: { siteId },
      }),
      prisma.worker.count({
        where: {
          siteId,
          isActive: true,
        },
      }),
      prisma.worker.findMany({
        where: { siteId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          name: true,
          position: true,
          phone: true,
          isActive: true,
          createdAt: true,
          supervisor: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        site,
        supervisorCount,
        workerCount,
        activeWorkerCount,
        recentWorkers,
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
export async function toggleSiteStatus(siteId: string) {
  try {
    // Only SUPERADMIN and MANAGER can toggle status
    const currentUser = await requireManager();

    const site = await prisma.site.findUnique({
      where: { id: siteId },
    });

    if (!site) {
      return {
        success: false,
        error: 'Site not found',
      };
    }

    // Validate MANAGER constraints
    if (currentUser.role === 'MANAGER') {
      if (site.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Cannot toggle site from different corporation',
        };
      }
    }

    const updatedSite = await prisma.site.update({
      where: { id: siteId },
      data: {
        isActive: !site.isActive,
      },
      include: {
        corporation: true,
        _count: {
          select: {
            supervisorAssignments: true,
            workers: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: site.isActive ? 'DEACTIVATE_SITE' : 'ACTIVATE_SITE',
        entity: 'Site',
        entityId: siteId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: { isActive: site.isActive },
        newValue: { isActive: updatedSite.isActive },
      },
    });

    revalidatePath('/sites');
    revalidatePath(`/sites/${siteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      site: updatedSite,
    };
  } catch (error) {
    console.error('Error toggling site status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle site status',
    };
  }
}
