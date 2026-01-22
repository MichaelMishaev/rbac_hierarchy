'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, hasAccessToCorporation } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { hash } from 'bcryptjs';
import {
  getNeighborhoodActivistCoordinatorCount,
  autoAssignActivistsToFirstActivistCoordinator,
  reassignActivistsFromRemovedActivistCoordinator,
  canRemoveActivistCoordinatorFromNeighborhood,
} from '@/lib/activist-coordinator-assignment';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateActivistCoordinatorQuickInput = {
  fullName: string;
  email: string;
  phone?: string;
  cityId: string;
  title?: string;
  tempPassword?: string; // Optional custom temp password
};

// ============================================
// CREATE SUPERVISOR (QUICK)
// ============================================

/**
 * Quick supervisor creation for inline use cases (e.g., creating from site modal)
 *
 * - Creates User + Supervisor records in a transaction
 * - Generates a temporary password (should be changed on first login)
 * - Returns the temporary password to show to the user
 *
 * Permissions:
 * - SUPERADMIN: Can create supervisors in any corporation
 * - MANAGER: Can create supervisors within their corporation only
 */
export async function createActivistCoordinatorQuick(data: CreateActivistCoordinatorQuickInput) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // Only SUPERADMIN and MANAGER can create supervisors
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      return {
        success: false,
        error: 'Supervisors cannot create other supervisors',
      };
    }

    // Validate city access
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, data.cityId)) {
        return {
          success: false,
          error: 'Cannot create supervisor for different city',
        };
      }
    }

    // Validate email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Email already exists',
      };
    }

    // Use custom temp password or default to "admin0"
    const tempPassword = data.tempPassword || 'admin0';
    const hashedPassword = await hash(tempPassword, 12);

    // Create User + Supervisor in transaction
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        fullName: data.fullName,
        phone: data.phone ?? null,
        passwordHash: hashedPassword,
        role: 'ACTIVIST_COORDINATOR',
        requirePasswordChange: true, // Force password change on first login
      },
    });

    const newActivistCoordinator = await prisma.activistCoordinator.create({
      data: {
        userId: newUser.id,
        cityId: data.cityId,
        title: data.title || 'Activist Coordinator',
        isActive: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_ACTIVIST_COORDINATOR_QUICK',
        entity: 'ActivistCoordinator',
        entityId: newActivistCoordinator.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        after: {
          activistCoordinatorId: newActivistCoordinator.id,
          userId: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          cityId: data.cityId,
          title: newActivistCoordinator.title,
        },
      },
    });

    revalidatePath('/activist-coordinators');
    revalidatePath('/neighborhoods');
    revalidatePath('/dashboard');

    return {
      success: true,
      activistCoordinator: {
        id: newActivistCoordinator.id,
        userId: newUser.id,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        title: newActivistCoordinator.title,
      },
      tempPassword, // Return temp password to show to user
    };
  }, 'createActivistCoordinatorQuick');
}

/**
 * Assign activist coordinator to a neighborhood
 *
 * Triggers: Auto-assign all activists to first coordinator if neighborhood had 0 coordinators
 *
 * Permissions:
 * - SUPERADMIN: Can assign to any neighborhood
 * - CITY_COORDINATOR: Can assign within their city
 */
export async function assignSupervisorToSite(activistCoordinatorId: string, neighborhoodId: string) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // Get neighborhood to validate access
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
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
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot assign coordinator to neighborhood in different city',
        };
      }
    }

    // Get activist coordinator to validate
    const activistCoordinator = await prisma.activistCoordinator.findUnique({
      where: { id: activistCoordinatorId },
      include: {
        user: true,
      },
    });

    if (!activistCoordinator || !activistCoordinator.isActive) {
      return {
        success: false,
        error: 'Activist coordinator not found or inactive',
      };
    }

    // Validate coordinator belongs to same city
    if (activistCoordinator.cityId !== neighborhood.cityId) {
      return {
        success: false,
        error: 'Activist coordinator must belong to same city as neighborhood',
      };
    }

    // Check if already assigned
    const existingAssignment = await prisma.activistCoordinatorNeighborhood.findUnique({
      where: {
        activistCoordinatorId_neighborhoodId: {
          activistCoordinatorId,
          neighborhoodId,
        },
      },
    });

    if (existingAssignment) {
      return {
        success: false,
        error: 'Activist coordinator is already assigned to this neighborhood',
      };
    }

    // Check if this is the first coordinator for this neighborhood
    const coordinatorCountBefore = await getNeighborhoodActivistCoordinatorCount(neighborhoodId);
    const isFirstCoordinator = coordinatorCountBefore === 0;

    // Assign coordinator to neighborhood
    await prisma.activistCoordinatorNeighborhood.create({
      data: {
        activistCoordinatorId,
        neighborhoodId,
        cityId: neighborhood.cityId,
        legacyActivistCoordinatorUserId: activistCoordinator.userId,
      },
    });

    // Auto-assign activists if this is the first coordinator
    let activistsAssigned = 0;
    if (isFirstCoordinator) {
      const result = await autoAssignActivistsToFirstActivistCoordinator(
        neighborhoodId,
        activistCoordinatorId,
        currentUser.id,
        currentUser.email,
        currentUser.role
      );

      if (result.success) {
        activistsAssigned = result.workersUpdated;
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'ASSIGN_COORDINATOR_TO_NEIGHBORHOOD',
        entity: 'ActivistCoordinatorNeighborhood',
        entityId: `${activistCoordinatorId}-${neighborhoodId}`,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        after: {
          activistCoordinatorId,
          neighborhoodId,
          neighborhoodName: neighborhood.name,
          coordinatorName: activistCoordinator.user.fullName,
          isFirstCoordinator,
          activistsAutoAssigned: activistsAssigned,
        },
      },
    });

    revalidatePath('/activist-coordinators');
    revalidatePath(`/neighborhoods/${neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: isFirstCoordinator
        ? `Coordinator assigned. ${activistsAssigned} activist(s) automatically assigned.`
        : 'Coordinator assigned to neighborhood.',
      activistsAutoAssigned: activistsAssigned,
    };
  }, 'assignSupervisorToSite');
}

/**
 * Remove activist coordinator from a neighborhood
 *
 * Triggers:
 * - If last coordinator: Clear all activists' coordinatorId (back to neighborhood)
 * - If non-last: Reassign activists to least-loaded remaining coordinator
 *
 * Validation: Block if coordinator has active activists (should reassign first)
 *
 * Permissions:
 * - SUPERADMIN: Can remove from any neighborhood
 * - CITY_COORDINATOR: Can remove within their city
 */
export async function removeSupervisorFromSite(activistCoordinatorId: string, neighborhoodId: string) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // Get neighborhood to validate access
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodId },
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
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, neighborhood.cityId)) {
        return {
          success: false,
          error: 'Cannot remove coordinator from neighborhood in different city',
        };
      }
    }

    // Verify assignment exists
    const assignment = await prisma.activistCoordinatorNeighborhood.findUnique({
      where: {
        activistCoordinatorId_neighborhoodId: {
          activistCoordinatorId,
          neighborhoodId,
        },
      },
      include: {
        activistCoordinator: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!assignment) {
      return {
        success: false,
        error: 'Activist coordinator is not assigned to this neighborhood',
      };
    }

    // Check if coordinator has activists in this neighborhood (block removal)
    const activistValidation = await canRemoveActivistCoordinatorFromNeighborhood(activistCoordinatorId, neighborhoodId);

    if (!activistValidation.canRemove) {
      return {
        success: false,
        error: activistValidation.error,
        activistCount: activistValidation.activistCount,
      };
    }

    // Remove coordinator neighborhood assignment
    await prisma.activistCoordinatorNeighborhood.delete({
      where: {
        activistCoordinatorId_neighborhoodId: {
          activistCoordinatorId,
          neighborhoodId,
        },
      },
    });

    // Note: Reassignment logic is NOT triggered here because we blocked removal if activists exist
    // Activists should be manually reassigned BEFORE removing coordinator

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'REMOVE_COORDINATOR_FROM_NEIGHBORHOOD',
        entity: 'ActivistCoordinatorNeighborhood',
        entityId: `${activistCoordinatorId}-${neighborhoodId}`,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          activistCoordinatorId,
          neighborhoodId,
          neighborhoodName: neighborhood.name,
          // CRITICAL FIX: Use optional chaining - user may be soft-deleted
          coordinatorName: assignment.activistCoordinator.user?.fullName ?? 'N/A',
        },
      },
    });

    revalidatePath('/activist-coordinators');
    revalidatePath(`/neighborhoods/${neighborhoodId}`);
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'Activist coordinator removed from neighborhood.',
    };
  }, 'removeSupervisorFromSite');
}

/**
 * Delete activist coordinator (deactivate)
 *
 * Triggers: Auto-reassign ALL activists from ALL neighborhoods
 * - For each neighborhood: If last coordinator → activists to neighborhood (null)
 * - For each neighborhood: If non-last → reassign to least-loaded
 *
 * Permissions:
 * - SUPERADMIN: Can delete any coordinator
 * - CITY_COORDINATOR: Can delete within their city
 */
export async function deleteSupervisor(activistCoordinatorId: string) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // Get activist coordinator to validate
    const activistCoordinator = await prisma.activistCoordinator.findUnique({
      where: { id: activistCoordinatorId },
      include: {
        user: true,
        neighborhoodAssignments: {
          include: {
            neighborhood: true,
          },
        },
      },
    });

    if (!activistCoordinator) {
      return {
        success: false,
        error: 'Activist coordinator not found',
      };
    }

    // Validate access based on role
    if (currentUser.role !== 'SUPERADMIN') {
      if (!hasAccessToCorporation(currentUser, activistCoordinator.cityId)) {
        return {
          success: false,
          error: 'Cannot delete coordinator from different city',
        };
      }
    }

    // Get all neighborhoods this coordinator is assigned to
    const assignedNeighborhoods = activistCoordinator.neighborhoodAssignments.map((na: any) => na.neighborhood);

    // Reassign activists from all neighborhoods
    const reassignmentResults = await Promise.all(
      assignedNeighborhoods.map(async (neighborhood: any) => {
        const result = await reassignActivistsFromRemovedActivistCoordinator(
          neighborhood.id,
          activistCoordinatorId,
          currentUser.id,
          currentUser.email,
          currentUser.role
        );
        return {
          neighborhoodId: neighborhood.id,
          neighborhoodName: neighborhood.name,
          ...result,
        };
      })
    );

    // Deactivate coordinator (soft delete)
    await prisma.activistCoordinator.update({
      where: { id: activistCoordinatorId },
      data: {
        isActive: false,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_ACTIVIST_COORDINATOR',
        entity: 'ActivistCoordinator',
        entityId: activistCoordinatorId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          id: activistCoordinator.id,
          title: activistCoordinator.title,
          isActive: activistCoordinator.isActive,
          assignedNeighborhoods: assignedNeighborhoods.map((n: any) => ({ id: n.id, name: n.name })),
        },
        after: {
          isActive: false,
          reassignmentResults,
        },
      },
    });

    revalidatePath('/activist-coordinators');
    revalidatePath('/dashboard');
    assignedNeighborhoods.forEach((neighborhood: any) => revalidatePath(`/neighborhoods/${neighborhood.id}`));

    const totalActivistsReassigned = reassignmentResults.reduce(
      (sum: any, r: any) => sum + r.workersReassigned,
      0
    );

    return {
      success: true,
      message: `Activist coordinator deactivated. ${totalActivistsReassigned} activist(s) reassigned across ${assignedNeighborhoods.length} neighborhood(s).`,
      reassignmentResults,
    };
  }, 'deleteSupervisor');
}
