/**
 * Duplicate Detection for Excel Import
 *
 * Checks for duplicates based on phone + email combination:
 * 1. Within Excel file (row vs row)
 * 2. Against visible voters in database (RBAC-filtered)
 */

'use server';

import { prisma } from '@/lib/prisma';
import { getUserContext } from '@/lib/voters/actions/context';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

type BulkVoterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  email: string;
};

type DuplicateInfo = {
  row: number;
  phone: string;
  email: string;
  existingVoter?: {
    id: string;
    fullName: string;
    insertedByUserName: string;
    insertedByUserRole: string;
    createdAt: Date;
  };
  type: 'within_excel' | 'in_database';
};

/**
 * Check for duplicates in Excel import
 * Returns list of duplicates found
 */
export async function checkExcelDuplicates(
  voters: BulkVoterInput[]
): Promise<{ success: true; duplicates: DuplicateInfo[] } | { success: false; error: string }> {
  return withServerActionErrorHandler(async () => {
    const viewer = await getUserContext();
    const duplicates: DuplicateInfo[] = [];

    // Step 1: Check for duplicates WITHIN Excel file
    const seen = new Map<string, number>(); // key = phone+email, value = first row number

    for (let i = 0; i < voters.length; i++) {
      const row = voters[i];
      const rowNumber = i + 2; // Excel rows start at 1, +1 for header
      const phone = row.phone?.toString().trim() || '';
      const email = row.email?.toString().trim() || '';

      if (!phone || !email) continue; // Skip if missing phone or email

      const key = `${phone}|${email}`;

      if (seen.has(key)) {
        duplicates.push({
          row: rowNumber,
          phone,
          email,
          type: 'within_excel',
        });
      } else {
        seen.set(key, rowNumber);
      }
    }

    // Step 2: Get visible voters for current user (RBAC-filtered)
    const visibleVoters = await getVisibleVotersForUser(viewer);

    // Step 3: Check Excel rows against visible voters in DB
    for (let i = 0; i < voters.length; i++) {
      const row = voters[i];
      const rowNumber = i + 2;
      const phone = row.phone?.toString().trim() || '';
      const email = row.email?.toString().trim() || '';

      if (!phone || !email) continue;

      // Find matching voter in visible voters (phone AND email match)
      const matchingVoter = visibleVoters.find(
        (v) => v.phone === phone && v.email === email
      );

      if (matchingVoter) {
        duplicates.push({
          row: rowNumber,
          phone,
          email,
          existingVoter: {
            id: matchingVoter.id,
            fullName: matchingVoter.fullName,
            insertedByUserName: matchingVoter.insertedByUserName,
            insertedByUserRole: matchingVoter.insertedByUserRole,
            createdAt: matchingVoter.createdAt,
          },
          type: 'in_database',
        });
      }
    }

    console.log(`[checkExcelDuplicates] Found ${duplicates.length} duplicates for ${viewer.fullName}`);

    return { success: true, duplicates };
  }, 'checkExcelDuplicates');
}

/**
 * Get voters visible to current user based on RBAC hierarchy
 */
async function getVisibleVotersForUser(viewer: Awaited<ReturnType<typeof getUserContext>>) {
  const { role, userId, cityId, areaManagerId } = viewer;

  let whereClause: any = { isActive: true };

  if (role === 'SUPERADMIN') {
    // SuperAdmin sees ALL voters
    whereClause = { isActive: true };
  } else if (role === 'AREA_MANAGER') {
    // Area Manager sees voters uploaded by him + his subordinates (City/Activist Coordinators)
    // Get all cities under this area manager
    const cities = await prisma.city.findMany({
      where: { areaManagerId: areaManagerId },
      select: { id: true },
    });
    const cityIds = cities.map((c) => c.id);

    // Get all users under this area (City Coordinators + Activist Coordinators in these cities)
    const subordinateUsers = await prisma.user.findMany({
      where: {
        OR: [
          { id: userId }, // Area Manager himself
          {
            coordinatorOf: {
              some: { cityId: { in: cityIds } },
            },
          },
          {
            activistCoordinatorOf: {
              some: { cityId: { in: cityIds } },
            },
          },
        ],
      },
      select: { id: true },
    });

    const userIds = subordinateUsers.map((u) => u.id);

    whereClause = {
      isActive: true,
      insertedByUserId: { in: userIds },
    };
  } else if (role === 'CITY_COORDINATOR') {
    // City Coordinator sees voters uploaded by him + his Activist Coordinators
    const activistCoordinators = await prisma.activistCoordinator.findMany({
      where: { cityId },
      select: { userId: true },
    });

    const userIds = [userId, ...activistCoordinators.map((ac) => ac.userId)];

    whereClause = {
      isActive: true,
      insertedByUserId: { in: userIds },
    };
  } else if (role === 'ACTIVIST_COORDINATOR') {
    // Activist Coordinator sees ONLY voters he uploaded himself
    whereClause = {
      isActive: true,
      insertedByUserId: userId,
    };
  }

  const voters = await prisma.voter.findMany({
    where: whereClause,
    select: {
      id: true,
      fullName: true,
      phone: true,
      email: true,
      insertedByUserId: true,
      insertedByUserName: true,
      insertedByUserRole: true,
      insertedAt: true,
    },
  });

  // Map insertedAt to createdAt for consistency with return type
  return voters.map((v) => ({
    ...v,
    createdAt: v.insertedAt,
  }));
}
