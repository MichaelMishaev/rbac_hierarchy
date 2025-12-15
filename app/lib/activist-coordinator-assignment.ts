/**
 * Supervisor-Worker Assignment Helper Functions
 *
 * Business Rules:
 * 1. If site has 0 activistCoordinators → activists.activistCoordinatorId = null (belong to site)
 * 2. If site has ≥1 activistCoordinators → activists.activistCoordinatorId REQUIRED
 * 3. First activistCoordinator added → auto-assign ALL activists
 * 4. Last activistCoordinator removed → ALL activists back to site (activistCoordinatorId = null)
 * 5. Non-last activistCoordinator removed → reassign to least-loaded remaining activistCoordinator
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Get activistCoordinator count for a site
 */
export async function getNeighborhoodActivistCoordinatorCount(neighborhoodId: string): Promise<number> {
  const count = await prisma.activistCoordinatorNeighborhood.count({
    where: {
      neighborhoodId,
      activistCoordinator: {
        isActive: true,
      },
    },
  });
  return count;
}

/**
 * Get active activistCoordinators for a site (with worker counts)
 */
export async function getNeighborhoodActivistCoordinatorsWithActivistCount(neighborhoodId: string) {
  const activistCoordinators = await prisma.activistCoordinatorNeighborhood.findMany({
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
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              activists: {
                where: {
                  neighborhoodId, // Only count activists in THIS site
                  isActive: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return activistCoordinators.map(ss => ({
    activistCoordinatorId: ss.activistCoordinator.id,
    user: ss.activistCoordinator.user,
    activistCount: ss.activistCoordinator._count.activists,
  }));
}

/**
 * Find activistCoordinator with fewest activists (load balancing)
 */
export async function findLeastLoadedActivistCoordinator(neighborhoodId: string): Promise<string | null> {
  const activistCoordinators = await getNeighborhoodActivistCoordinatorsWithActivistCount(neighborhoodId);

  if (activistCoordinators.length === 0) return null;

  // Sort by worker count ascending
  activistCoordinators.sort((a, b) => a.activistCount - b.activistCount);

  return activistCoordinators[0].activistCoordinatorId;
}

/**
 * Check if activistCoordinator is assigned to site
 */
export async function isActivistCoordinatorAssignedToNeighborhood(
  activistCoordinatorId: string,
  neighborhoodId: string
): Promise<boolean> {
  const assignment = await prisma.activistCoordinatorNeighborhood.findUnique({
    where: {
      activistCoordinatorId_neighborhoodId: {
        activistCoordinatorId,
        neighborhoodId,
      },
    },
  });
  return !!assignment;
}

/**
 * Validate worker activistCoordinator assignment for a site
 *
 * Rules:
 * - If site has 0 activistCoordinators → activistCoordinatorId MUST be null
 * - If site has ≥1 activistCoordinators → activistCoordinatorId REQUIRED and must be assigned to site
 */
export async function validateActivistActivistCoordinatorAssignment(
  neighborhoodId: string,
  activistCoordinatorId: string | null | undefined
): Promise<{ valid: boolean; error?: string }> {
  const supervisorCount = await getNeighborhoodActivistCoordinatorCount(neighborhoodId);

  // Rule 1: Site with no activistCoordinators
  if (supervisorCount === 0) {
    if (activistCoordinatorId) {
      return {
        valid: false,
        error: 'השכונה אינה כוללת רכזי שכונות. לא ניתן לשייך פעיל לרכז שכונתי.',
      };
    }
    return { valid: true };
  }

  // Rule 2: Site with activistCoordinators - activistCoordinatorId required
  if (!activistCoordinatorId) {
    return {
      valid: false,
      error: 'השכונה כוללת רכזי שכונות. יש לשייך את הפעיל לרכז שכונתי.',
    };
  }

  // Rule 3: Supervisor must be assigned to this site
  const isAssigned = await isActivistCoordinatorAssignedToNeighborhood(activistCoordinatorId, neighborhoodId);
  if (!isAssigned) {
    return {
      valid: false,
      error: 'הרכז אינו משויך לשכונה זו.',
    };
  }

  return { valid: true };
}

/**
 * Auto-assign all activists to first activistCoordinator added to site
 *
 * Called when: First activistCoordinator is assigned to a site
 */
export async function autoAssignActivistsToFirstActivistCoordinator(
  neighborhoodId: string,
  activistCoordinatorId: string,
  userId: string,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; workersUpdated: number; error?: string }> {
  try {
    // Get all orphan activists in this site
    const orphanWorkers = await prisma.activist.findMany({
      where: {
        neighborhoodId,
        activistCoordinatorId: null,
        isActive: true,
      },
      select: { id: true, fullName: true },
    });

    if (orphanWorkers.length === 0) {
      return { success: true, workersUpdated: 0 };
    }

    // Update all activists in a transaction
    await prisma.$transaction(async (tx) => {
      // Bulk update activists
      await tx.activist.updateMany({
        where: {
          neighborhoodId,
          activistCoordinatorId: null,
          isActive: true,
        },
        data: {
          activistCoordinatorId,
        },
      });

      // Create audit log for auto-assignment
      await tx.auditLog.create({
        data: {
          action: 'AUTO_ASSIGN_WORKERS',
          entity: 'Worker',
          entityId: neighborhoodId,
          userId,
          userEmail,
          userRole,
          before: {
            workerIds: orphanWorkers.map(w => w.id),
            activistCoordinatorId: null,
          },
          after: {
            workerIds: orphanWorkers.map(w => w.id),
            activistCoordinatorId,
            reason: 'First activistCoordinator added to site',
          },
        },
      });
    });

    return {
      success: true,
      workersUpdated: orphanWorkers.length,
    };
  } catch (error) {
    console.error('Error auto-assigning activists to first activistCoordinator:', error);
    return {
      success: false,
      workersUpdated: 0,
      error: error instanceof Error ? error.message : 'Auto-assignment failed',
    };
  }
}

/**
 * Reassign activists when activistCoordinator is removed (not the last one)
 *
 * Called when: Non-last activistCoordinator is removed/unassigned from site
 * Strategy: Load balancing - assign to activistCoordinator with fewest activists
 */
export async function reassignActivistsFromRemovedActivistCoordinator(
  neighborhoodId: string,
  removedActivistCoordinatorId: string,
  userId: string,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; workersReassigned: number; error?: string }> {
  try {
    // Get current activistCoordinators (including the one being removed)
    const currentActivistCoordinatorCount = await getNeighborhoodActivistCoordinatorCount(neighborhoodId);

    // Calculate remaining count AFTER removal
    const remainingActivistCoordinatorCount = currentActivistCoordinatorCount - 1;

    // Get activists of removed activistCoordinator
    const affectedWorkers = await prisma.activist.findMany({
      where: {
        neighborhoodId,
        activistCoordinatorId: removedActivistCoordinatorId,
        isActive: true,
      },
      select: { id: true, fullName: true },
    });

    if (affectedWorkers.length === 0) {
      return { success: true, workersReassigned: 0 };
    }

    await prisma.$transaction(async (tx) => {
      if (remainingActivistCoordinatorCount === 0) {
        // Last activistCoordinator removed - activists back to site
        await tx.activist.updateMany({
          where: {
            neighborhoodId,
            activistCoordinatorId: removedActivistCoordinatorId,
            isActive: true,
          },
          data: {
            activistCoordinatorId: null,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'AUTO_UNASSIGN_WORKERS',
            entity: 'Worker',
            entityId: neighborhoodId,
            userId,
            userEmail,
            userRole,
            before: {
              workerIds: affectedWorkers.map(w => w.id),
              activistCoordinatorId: removedActivistCoordinatorId,
            },
            after: {
              workerIds: affectedWorkers.map(w => w.id),
              activistCoordinatorId: null,
              reason: 'Last activistCoordinator removed from site',
            },
          },
        });
      } else {
        // Reassign to least loaded activistCoordinator (load balancing)
        const targetActivistCoordinatorId = await findLeastLoadedActivistCoordinator(neighborhoodId);

        if (!targetActivistCoordinatorId) {
          throw new Error('No available activistCoordinator found for reassignment');
        }

        await tx.activist.updateMany({
          where: {
            neighborhoodId,
            activistCoordinatorId: removedActivistCoordinatorId,
            isActive: true,
          },
          data: {
            activistCoordinatorId: targetActivistCoordinatorId,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'AUTO_REASSIGN_WORKERS',
            entity: 'Worker',
            entityId: neighborhoodId,
            userId,
            userEmail,
            userRole,
            before: {
              workerIds: affectedWorkers.map(w => w.id),
              activistCoordinatorId: removedActivistCoordinatorId,
            },
            after: {
              workerIds: affectedWorkers.map(w => w.id),
              activistCoordinatorId: targetActivistCoordinatorId,
              reason: 'Supervisor removed, reassigned to least loaded activistCoordinator',
            },
          },
        });
      }
    });

    return {
      success: true,
      workersReassigned: affectedWorkers.length,
    };
  } catch (error) {
    console.error('Error reassigning activists from removed activistCoordinator:', error);
    return {
      success: false,
      workersReassigned: 0,
      error: error instanceof Error ? error.message : 'Reassignment failed',
    };
  }
}

/**
 * Check if activistCoordinator can be removed from site
 *
 * Validation: Block removal if activistCoordinator has active activists in that site
 */
export async function canRemoveActivistCoordinatorFromNeighborhood(
  activistCoordinatorId: string,
  neighborhoodId: string
): Promise<{ canRemove: boolean; error?: string; activistCount?: number }> {
  const activistCount = await prisma.activist.count({
    where: {
      neighborhoodId,
      activistCoordinatorId,
      isActive: true,
    },
  });

  if (activistCount > 0) {
    return {
      canRemove: false,
      error: `Cannot remove activistCoordinator. They have ${activistCount} active worker(s) in this site.`,
      activistCount,
    };
  }

  return { canRemove: true, activistCount: 0 };
}

/**
 * Find orphan activists (site has activistCoordinators, but worker has no activistCoordinator)
 * Used for data integrity checks and tree visualization
 */
export async function findOrphanActivists(neighborhoodId?: string) {
  const where: Prisma.ActivistWhereInput = {
    activistCoordinatorId: null,
    isActive: true,
    neighborhood: {
      activistCoordinatorAssignments: {
        some: {
          activistCoordinator: {
            isActive: true,
          },
        },
      },
    },
  };

  if (neighborhoodId) {
    where.neighborhoodId = neighborhoodId;
  }

  return await prisma.activist.findMany({
    where,
    include: {
      neighborhood: {
        select: {
          id: true,
          name: true,
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
  });
}
