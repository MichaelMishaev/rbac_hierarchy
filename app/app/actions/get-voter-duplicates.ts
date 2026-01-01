/**
 * Get Voter Duplicates - RBAC-aware
 *
 * Finds all duplicate voters (same phone + email) visible to current user
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getUserContext } from '@/lib/voters/actions/context';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

type VoterDuplicate = {
  id: string;
  fullName: string;
  phone: string;
  email: string | null;
  insertedByUserName: string;
  insertedByUserRole: string;
  insertedAt: Date;
};

/**
 * Get all duplicates for a specific voter (same phone + email)
 * Filtered by RBAC - user only sees duplicates they have permission to see
 */
export async function getVoterDuplicates(
  voterId: string
): Promise<{ success: true; duplicates: VoterDuplicate[] } | { success: false; error: string }> {
  return withServerActionErrorHandler(async () => {
    const viewer = await getUserContext();

    // Get the target voter
    const targetVoter = await prisma.voter.findUnique({
      where: { id: voterId },
      select: {
        phone: true,
        email: true,
      },
    });

    if (!targetVoter) {
      return { success: false, error: 'Voter not found' };
    }

    // Build RBAC where clause
    const { role, userId, cityId, areaManagerId } = viewer;
    let whereClause: any = {
      isActive: true,
      phone: targetVoter.phone,
      email: targetVoter.email,
      NOT: { id: voterId }, // Exclude the voter itself
    };

    if (role === 'SUPERADMIN') {
      // SuperAdmin sees ALL duplicates
      whereClause = {
        ...whereClause,
      };
    } else if (role === 'AREA_MANAGER') {
      // Area Manager sees duplicates uploaded by him + his subordinates
      const cities = await prisma.city.findMany({
        where: { areaManagerId },
        select: { id: true },
      });
      const cityIds = cities.map((c) => c.id);

      const subordinateUsers = await prisma.user.findMany({
        where: {
          OR: [
            { id: userId },
            { coordinatorOf: { some: { cityId: { in: cityIds } } } },
            { activistCoordinatorOf: { some: { cityId: { in: cityIds } } } },
          ],
        },
        select: { id: true },
      });

      const userIds = subordinateUsers.map((u) => u.id);

      whereClause = {
        ...whereClause,
        insertedByUserId: { in: userIds },
      };
    } else if (role === 'CITY_COORDINATOR') {
      // City Coordinator sees duplicates uploaded by him + his Activist Coordinators
      const activistCoordinators = await prisma.activistCoordinator.findMany({
        where: { cityId },
        select: { userId: true },
      });

      const userIds = [userId, ...activistCoordinators.map((ac) => ac.userId)];

      whereClause = {
        ...whereClause,
        insertedByUserId: { in: userIds },
      };
    } else if (role === 'ACTIVIST_COORDINATOR') {
      // Activist Coordinator sees ONLY duplicates he uploaded himself
      whereClause = {
        ...whereClause,
        insertedByUserId: userId,
      };
    }

    // Find all duplicates
    const duplicates = await prisma.voter.findMany({
      where: whereClause,
      select: {
        id: true,
        fullName: true,
        phone: true,
        email: true,
        insertedByUserName: true,
        insertedByUserRole: true,
        insertedAt: true,
      },
      orderBy: {
        insertedAt: 'desc',
      },
    });

    console.log(`[getVoterDuplicates] Found ${duplicates.length} duplicates for voter ${voterId} by ${viewer.fullName}`);

    return { success: true, duplicates };
  }, 'getVoterDuplicates');
}

/**
 * Get count of all voters with duplicates (for UI indicators)
 * Returns Map of voterId -> duplicate count
 */
export async function getVotersWithDuplicates(): Promise<
  { success: true; data: Record<string, number> } | { success: false; error: string }
> {
  return withServerActionErrorHandler(async () => {
    const viewer = await getUserContext();

    // Get visible voters with RBAC filtering
    const { role, userId, cityId, areaManagerId } = viewer;
    const whereClause: any = { isActive: true };

    if (role !== 'SUPERADMIN') {
      if (role === 'AREA_MANAGER') {
        const cities = await prisma.city.findMany({
          where: { areaManagerId },
          select: { id: true },
        });
        const cityIds = cities.map((c) => c.id);

        const subordinateUsers = await prisma.user.findMany({
          where: {
            OR: [
              { id: userId },
              { coordinatorOf: { some: { cityId: { in: cityIds } } } },
              { activistCoordinatorOf: { some: { cityId: { in: cityIds } } } },
            ],
          },
          select: { id: true },
        });

        whereClause.insertedByUserId = { in: subordinateUsers.map((u) => u.id) };
      } else if (role === 'CITY_COORDINATOR') {
        const activistCoordinators = await prisma.activistCoordinator.findMany({
          where: { cityId },
          select: { userId: true },
        });

        whereClause.insertedByUserId = { in: [userId, ...activistCoordinators.map((ac) => ac.userId)] };
      } else if (role === 'ACTIVIST_COORDINATOR') {
        whereClause.insertedByUserId = userId;
      }
    }

    // Get all voters with phone+email
    const voters = await prisma.voter.findMany({
      where: {
        ...whereClause,
        email: { not: null },
        phone: { not: '' },
      },
      select: {
        id: true,
        phone: true,
        email: true,
      },
    });

    // Group by phone+email to find duplicates
    const duplicateMap: Record<string, number> = {};
    const phoneEmailGroups = new Map<string, string[]>();

    voters.forEach((v) => {
      const key = `${v.phone}|${v.email}`;
      if (!phoneEmailGroups.has(key)) {
        phoneEmailGroups.set(key, []);
      }
      phoneEmailGroups.get(key)!.push(v.id);
    });

    // Build map of voterId -> duplicate count
    phoneEmailGroups.forEach((voterIds) => {
      if (voterIds.length > 1) {
        voterIds.forEach((id) => {
          duplicateMap[id] = voterIds.length - 1; // Exclude self
        });
      }
    });

    return { success: true, data: duplicateMap };
  }, 'getVotersWithDuplicates');
}
