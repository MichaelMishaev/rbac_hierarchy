'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasAccessToCorporation } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import {
  getSiteSupervisorCount,
  autoAssignWorkersToFirstSupervisor,
  reassignWorkersFromRemovedSupervisor,
  canRemoveSupervisorFromSite,
} from '@/lib/supervisor-worker-assignment';

/**
 * Assign supervisor to a site
 *
 * Triggers: Auto-assign all workers to first supervisor if site had 0 supervisors
 *
 * Permissions:
 * - SUPERADMIN: Can assign to any site
 * - MANAGER: Can assign within their corporation
 */
export async function assignSupervisorToSite(supervisorId: string, siteId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Get site to validate access
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

    // Validate access based on role
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, site.corporationId)) {
        return {
          success: false,
          error: 'Cannot assign supervisor to site in different corporation',
        };
      }
    }

    // Get supervisor to validate
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: supervisorId },
      include: {
        user: true,
      },
    });

    if (!supervisor || !supervisor.isActive) {
      return {
        success: false,
        error: 'Supervisor not found or inactive',
      };
    }

    // Validate supervisor belongs to same corporation
    if (supervisor.corporationId !== site.corporationId) {
      return {
        success: false,
        error: 'Supervisor must belong to same corporation as site',
      };
    }

    // Check if already assigned
    const existingAssignment = await prisma.supervisorSite.findUnique({
      where: {
        supervisorId_siteId: {
          supervisorId,
          siteId,
        },
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: 'Supervisor is already assigned to this site',
      };
    }

    // Check if this is the first supervisor for this site
    const supervisorCountBefore = await getSiteSupervisorCount(siteId);
    const isFirstSupervisor = supervisorCountBefore === 0;

    // Assign supervisor to site
    await prisma.supervisorSite.create({
      data: {
        supervisorId,
        siteId,
        corporationId: site.corporationId,
        legacySupervisorUserId: supervisor.userId,
      },
    });

    // Auto-assign workers if this is the first supervisor
    let workersAssigned = 0;
    if (isFirstSupervisor) {
      const result = await autoAssignWorkersToFirstSupervisor(
        siteId,
        supervisorId,
        currentUser.id,
        currentUser.email,
        currentUser.role
      );

      if (result.success) {
        workersAssigned = result.workersUpdated;
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ASSIGN_SUPERVISOR_TO_SITE',
        entity: 'SupervisorSite',
        entityId: `${supervisorId}-${siteId}`,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: null,
        after: {
          supervisorId,
          siteId,
          siteName: site.name,
          supervisorName: supervisor.user.fullName,
          isFirstSupervisor,
          workersAutoAssigned: workersAssigned,
        },
      },
    });

    revalidatePath('/supervisors');
    revalidatePath(`/sites/${siteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: isFirstSupervisor
        ? `Supervisor assigned. ${workersAssigned} worker(s) automatically assigned.`
        : 'Supervisor assigned to site.',
      workersAutoAssigned: workersAssigned,
    };
  } catch (error) {
    console.error('Error assigning supervisor to site:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to assign supervisor',
    };
  }
}

/**
 * Remove supervisor from a site
 *
 * Triggers:
 * - If last supervisor: Clear all workers' supervisorId (back to site)
 * - If non-last: Reassign workers to least-loaded remaining supervisor
 *
 * Validation: Block if supervisor has active workers (should reassign first)
 *
 * Permissions:
 * - SUPERADMIN: Can remove from any site
 * - MANAGER: Can remove within their corporation
 */
export async function removeSupervisorFromSite(supervisorId: string, siteId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Get site to validate access
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

    // Validate access based on role
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, site.corporationId)) {
        return {
          success: false,
          error: 'Cannot remove supervisor from site in different corporation',
        };
      }
    }

    // Verify assignment exists
    const assignment = await prisma.supervisorSite.findUnique({
      where: {
        supervisorId_siteId: {
          supervisorId,
          siteId,
        },
      },
      include: {
        supervisor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: 'Supervisor is not assigned to this site',
      };
    }

    // Check if supervisor has workers in this site (block removal)
    const workerValidation = await canRemoveSupervisorFromSite(supervisorId, siteId);

    if (!workerValidation.canRemove) {
      return {
        success: false,
        error: workerValidation.error,
        workerCount: workerValidation.workerCount,
      };
    }

    // Remove supervisor site assignment
    await prisma.supervisorSite.delete({
      where: {
        supervisorId_siteId: {
          supervisorId,
          siteId,
        },
      },
    });

    // Note: Reassignment logic is NOT triggered here because we blocked removal if workers exist
    // Workers should be manually reassigned BEFORE removing supervisor

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'REMOVE_SUPERVISOR_FROM_SITE',
        entity: 'SupervisorSite',
        entityId: `${supervisorId}-${siteId}`,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          supervisorId,
          siteId,
          siteName: site.name,
          supervisorName: assignment.supervisor.user.fullName,
        },
        after: null,
      },
    });

    revalidatePath('/supervisors');
    revalidatePath(`/sites/${siteId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Supervisor removed from site.',
    };
  } catch (error) {
    console.error('Error removing supervisor from site:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove supervisor',
    };
  }
}

/**
 * Delete supervisor (deactivate)
 *
 * Triggers: Auto-reassign ALL workers from ALL sites
 * - For each site: If last supervisor → workers to site (null)
 * - For each site: If non-last → reassign to least-loaded
 *
 * Permissions:
 * - SUPERADMIN: Can delete any supervisor
 * - MANAGER: Can delete within their corporation
 */
export async function deleteSupervisor(supervisorId: string) {
  try {
    const currentUser = await getCurrentUser();

    // Get supervisor to validate
    const supervisor = await prisma.supervisor.findUnique({
      where: { id: supervisorId },
      include: {
        user: true,
        siteAssignments: {
          include: {
            site: true,
          },
        },
      },
    });

    if (!supervisor) {
      return {
        success: false,
        error: 'Supervisor not found',
      };
    }

    // Validate access based on role
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, supervisor.corporationId)) {
        return {
          success: false,
          error: 'Cannot delete supervisor from different corporation',
        };
      }
    }

    // Get all sites this supervisor is assigned to
    const assignedSites = supervisor.siteAssignments.map(sa => sa.site);

    // Reassign workers from all sites
    const reassignmentResults = await Promise.all(
      assignedSites.map(async (site) => {
        const result = await reassignWorkersFromRemovedSupervisor(
          site.id,
          supervisorId,
          currentUser.id,
          currentUser.email,
          currentUser.role
        );
        return {
          siteId: site.id,
          siteName: site.name,
          ...result,
        };
      })
    );

    // Deactivate supervisor (soft delete)
    await prisma.supervisor.update({
      where: { id: supervisorId },
      data: {
        isActive: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_SUPERVISOR',
        entity: 'Supervisor',
        entityId: supervisorId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          id: supervisor.id,
          title: supervisor.title,
          isActive: supervisor.isActive,
          assignedSites: assignedSites.map(s => ({ id: s.id, name: s.name })),
        },
        after: {
          isActive: false,
          reassignmentResults,
        },
      },
    });

    revalidatePath('/supervisors');
    revalidatePath('/dashboard');
    assignedSites.forEach(site => revalidatePath(`/sites/${site.id}`));

    const totalWorkersReassigned = reassignmentResults.reduce(
      (sum, r) => sum + r.workersReassigned,
      0
    );

    return {
      success: true,
      message: `Supervisor deactivated. ${totalWorkersReassigned} worker(s) reassigned across ${assignedSites.length} site(s).`,
      reassignmentResults,
    };
  } catch (error) {
    console.error('Error deleting supervisor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete supervisor',
    };
  }
}
