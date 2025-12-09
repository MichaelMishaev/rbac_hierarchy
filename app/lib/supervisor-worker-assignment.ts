/**
 * Supervisor-Worker Assignment Helper Functions
 *
 * Business Rules:
 * 1. If site has 0 supervisors → workers.supervisorId = null (belong to site)
 * 2. If site has ≥1 supervisors → workers.supervisorId REQUIRED
 * 3. First supervisor added → auto-assign ALL workers
 * 4. Last supervisor removed → ALL workers back to site (supervisorId = null)
 * 5. Non-last supervisor removed → reassign to least-loaded remaining supervisor
 */

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Get supervisor count for a site
 */
export async function getSiteSupervisorCount(siteId: string): Promise<number> {
  const count = await prisma.supervisorSite.count({
    where: {
      siteId,
      supervisor: {
        isActive: true,
      },
    },
  });
  return count;
}

/**
 * Get active supervisors for a site (with worker counts)
 */
export async function getSiteSupervisorsWithWorkerCount(siteId: string) {
  const supervisors = await prisma.supervisorSite.findMany({
    where: {
      siteId,
      supervisor: {
        isActive: true,
      },
    },
    include: {
      supervisor: {
        include: {
          user: {
            select: {
              fullName: true,
              email: true,
            },
          },
          _count: {
            select: {
              workers: {
                where: {
                  siteId, // Only count workers in THIS site
                  isActive: true,
                },
              },
            },
          },
        },
      },
    },
  });

  return supervisors.map(ss => ({
    supervisorId: ss.supervisor.id,
    user: ss.supervisor.user,
    workerCount: ss.supervisor._count.workers,
  }));
}

/**
 * Find supervisor with fewest workers (load balancing)
 */
export async function findLeastLoadedSupervisor(siteId: string): Promise<string | null> {
  const supervisors = await getSiteSupervisorsWithWorkerCount(siteId);

  if (supervisors.length === 0) return null;

  // Sort by worker count ascending
  supervisors.sort((a, b) => a.workerCount - b.workerCount);

  return supervisors[0].supervisorId;
}

/**
 * Check if supervisor is assigned to site
 */
export async function isSupervisorAssignedToSite(
  supervisorId: string,
  siteId: string
): Promise<boolean> {
  const assignment = await prisma.supervisorSite.findUnique({
    where: {
      supervisorId_siteId: {
        supervisorId,
        siteId,
      },
    },
  });
  return !!assignment;
}

/**
 * Validate worker supervisor assignment for a site
 *
 * Rules:
 * - If site has 0 supervisors → supervisorId MUST be null
 * - If site has ≥1 supervisors → supervisorId REQUIRED and must be assigned to site
 */
export async function validateWorkerSupervisorAssignment(
  siteId: string,
  supervisorId: string | null | undefined
): Promise<{ valid: boolean; error?: string }> {
  const supervisorCount = await getSiteSupervisorCount(siteId);

  // Rule 1: Site with no supervisors
  if (supervisorCount === 0) {
    if (supervisorId) {
      return {
        valid: false,
        error: 'Site has no supervisors. Worker cannot be assigned to a supervisor.',
      };
    }
    return { valid: true };
  }

  // Rule 2: Site with supervisors - supervisorId required
  if (!supervisorId) {
    return {
      valid: false,
      error: 'Site has supervisors. Worker must be assigned to a supervisor.',
    };
  }

  // Rule 3: Supervisor must be assigned to this site
  const isAssigned = await isSupervisorAssignedToSite(supervisorId, siteId);
  if (!isAssigned) {
    return {
      valid: false,
      error: 'Supervisor is not assigned to this site.',
    };
  }

  return { valid: true };
}

/**
 * Auto-assign all workers to first supervisor added to site
 *
 * Called when: First supervisor is assigned to a site
 */
export async function autoAssignWorkersToFirstSupervisor(
  siteId: string,
  supervisorId: string,
  userId: string,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; workersUpdated: number; error?: string }> {
  try {
    // Get all orphan workers in this site
    const orphanWorkers = await prisma.worker.findMany({
      where: {
        siteId,
        supervisorId: null,
        isActive: true,
      },
      select: { id: true, fullName: true },
    });

    if (orphanWorkers.length === 0) {
      return { success: true, workersUpdated: 0 };
    }

    // Update all workers in a transaction
    await prisma.$transaction(async (tx) => {
      // Bulk update workers
      await tx.worker.updateMany({
        where: {
          siteId,
          supervisorId: null,
          isActive: true,
        },
        data: {
          supervisorId,
        },
      });

      // Create audit log for auto-assignment
      await tx.auditLog.create({
        data: {
          action: 'AUTO_ASSIGN_WORKERS',
          entity: 'Worker',
          entityId: siteId,
          userId,
          userEmail,
          userRole,
          before: {
            workerIds: orphanWorkers.map(w => w.id),
            supervisorId: null,
          },
          after: {
            workerIds: orphanWorkers.map(w => w.id),
            supervisorId,
            reason: 'First supervisor added to site',
          },
        },
      });
    });

    return {
      success: true,
      workersUpdated: orphanWorkers.length,
    };
  } catch (error) {
    console.error('Error auto-assigning workers to first supervisor:', error);
    return {
      success: false,
      workersUpdated: 0,
      error: error instanceof Error ? error.message : 'Auto-assignment failed',
    };
  }
}

/**
 * Reassign workers when supervisor is removed (not the last one)
 *
 * Called when: Non-last supervisor is removed/unassigned from site
 * Strategy: Load balancing - assign to supervisor with fewest workers
 */
export async function reassignWorkersFromRemovedSupervisor(
  siteId: string,
  removedSupervisorId: string,
  userId: string,
  userEmail: string,
  userRole: string
): Promise<{ success: boolean; workersReassigned: number; error?: string }> {
  try {
    // Get current supervisors (including the one being removed)
    const currentSupervisorCount = await getSiteSupervisorCount(siteId);

    // Calculate remaining count AFTER removal
    const remainingSupervisorCount = currentSupervisorCount - 1;

    // Get workers of removed supervisor
    const affectedWorkers = await prisma.worker.findMany({
      where: {
        siteId,
        supervisorId: removedSupervisorId,
        isActive: true,
      },
      select: { id: true, fullName: true },
    });

    if (affectedWorkers.length === 0) {
      return { success: true, workersReassigned: 0 };
    }

    await prisma.$transaction(async (tx) => {
      if (remainingSupervisorCount === 0) {
        // Last supervisor removed - workers back to site
        await tx.worker.updateMany({
          where: {
            siteId,
            supervisorId: removedSupervisorId,
            isActive: true,
          },
          data: {
            supervisorId: null,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'AUTO_UNASSIGN_WORKERS',
            entity: 'Worker',
            entityId: siteId,
            userId,
            userEmail,
            userRole,
            before: {
              workerIds: affectedWorkers.map(w => w.id),
              supervisorId: removedSupervisorId,
            },
            after: {
              workerIds: affectedWorkers.map(w => w.id),
              supervisorId: null,
              reason: 'Last supervisor removed from site',
            },
          },
        });
      } else {
        // Reassign to least loaded supervisor (load balancing)
        const targetSupervisorId = await findLeastLoadedSupervisor(siteId);

        if (!targetSupervisorId) {
          throw new Error('No available supervisor found for reassignment');
        }

        await tx.worker.updateMany({
          where: {
            siteId,
            supervisorId: removedSupervisorId,
            isActive: true,
          },
          data: {
            supervisorId: targetSupervisorId,
          },
        });

        await tx.auditLog.create({
          data: {
            action: 'AUTO_REASSIGN_WORKERS',
            entity: 'Worker',
            entityId: siteId,
            userId,
            userEmail,
            userRole,
            before: {
              workerIds: affectedWorkers.map(w => w.id),
              supervisorId: removedSupervisorId,
            },
            after: {
              workerIds: affectedWorkers.map(w => w.id),
              supervisorId: targetSupervisorId,
              reason: 'Supervisor removed, reassigned to least loaded supervisor',
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
    console.error('Error reassigning workers from removed supervisor:', error);
    return {
      success: false,
      workersReassigned: 0,
      error: error instanceof Error ? error.message : 'Reassignment failed',
    };
  }
}

/**
 * Check if supervisor can be removed from site
 *
 * Validation: Block removal if supervisor has active workers in that site
 */
export async function canRemoveSupervisorFromSite(
  supervisorId: string,
  siteId: string
): Promise<{ canRemove: boolean; error?: string; workerCount?: number }> {
  const workerCount = await prisma.worker.count({
    where: {
      siteId,
      supervisorId,
      isActive: true,
    },
  });

  if (workerCount > 0) {
    return {
      canRemove: false,
      error: `Cannot remove supervisor. They have ${workerCount} active worker(s) in this site.`,
      workerCount,
    };
  }

  return { canRemove: true, workerCount: 0 };
}

/**
 * Find orphan workers (site has supervisors, but worker has no supervisor)
 * Used for data integrity checks and tree visualization
 */
export async function findOrphanWorkers(siteId?: string) {
  const where: Prisma.WorkerWhereInput = {
    supervisorId: null,
    isActive: true,
    site: {
      supervisorAssignments: {
        some: {
          supervisor: {
            isActive: true,
          },
        },
      },
    },
  };

  if (siteId) {
    where.siteId = siteId;
  }

  return await prisma.worker.findMany({
    where,
    include: {
      site: {
        select: {
          id: true,
          name: true,
          supervisorAssignments: {
            include: {
              supervisor: {
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
