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

    // Step 2: Build unique phone+email pairs from Excel (for batch DB query)
    // OPTIMIZED: Instead of loading ALL visible voters, query only matching pairs
    const uniquePairs = new Map<string, { rowNumber: number; phone: string; email: string }[]>();

    for (let i = 0; i < voters.length; i++) {
      const row = voters[i];
      const rowNumber = i + 2;
      const phone = row.phone?.toString().trim() || '';
      const email = row.email?.toString().trim() || '';

      if (!phone || !email) continue;

      const key = `${phone}|${email}`;
      if (!uniquePairs.has(key)) {
        uniquePairs.set(key, []);
      }
      uniquePairs.get(key)!.push({ rowNumber, phone, email });
    }

    // Step 3: Batch query DB for matching voters (RBAC-filtered)
    // OPTIMIZED: Query only for phones/emails that exist in Excel
    if (uniquePairs.size > 0) {
      const phones = [...new Set([...uniquePairs.keys()].map(k => k.split('|')[0]))];
      const emails = [...new Set([...uniquePairs.keys()].map(k => k.split('|')[1]))];

      const visibleVoters = await getVisibleVotersForUserOptimized(viewer, phones, emails);

      // Create a lookup map for O(1) access
      const voterLookup = new Map<string, typeof visibleVoters[0]>();
      for (const v of visibleVoters) {
        const key = `${v.phone}|${v.email}`;
        // Keep the first match (oldest, for better duplicate reporting)
        if (!voterLookup.has(key)) {
          voterLookup.set(key, v);
        }
      }

      // Check each Excel row against the lookup map
      for (const [key, rows] of uniquePairs) {
        const matchingVoter = voterLookup.get(key);
        if (matchingVoter) {
          for (const { rowNumber, phone, email } of rows) {
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
      }
    }

    console.log(`[checkExcelDuplicates] Found ${duplicates.length} duplicates for ${viewer.fullName}`);

    return { success: true, duplicates };
  }, 'checkExcelDuplicates');
}

/**
 * OPTIMIZED: Get voters matching specific phones/emails with RBAC filtering
 * Instead of loading ALL visible voters, queries only matching ones
 */
async function getVisibleVotersForUserOptimized(
  viewer: Awaited<ReturnType<typeof getUserContext>>,
  phones: string[],
  emails: string[]
) {
  const { role, userId, cityId, areaManagerId } = viewer;

  // Base filter: only active voters with matching phone AND email
  let whereClause: any = {
    isActive: true,
    phone: { in: phones },
    email: { in: emails },
  };

  // Add RBAC filter based on role - using nested relations to avoid N+1
  if (role === 'SUPERADMIN') {
    // SuperAdmin sees ALL matching voters - no additional filter
  } else if (role === 'AREA_MANAGER') {
    // OPTIMIZED: Use nested relation query instead of separate queries
    whereClause = {
      ...whereClause,
      insertedByUser: {
        OR: [
          { id: userId }, // Area Manager himself
          {
            coordinatorOf: {
              some: {
                city: { areaManagerId },
              },
            },
          },
          {
            activistCoordinatorOf: {
              some: {
                city: { areaManagerId },
              },
            },
          },
        ],
      },
    };
  } else if (role === 'CITY_COORDINATOR') {
    // OPTIMIZED: Use nested relation query
    whereClause = {
      ...whereClause,
      insertedByUser: {
        OR: [
          { id: userId }, // City Coordinator himself
          {
            activistCoordinatorOf: {
              some: { cityId },
            },
          },
        ],
      },
    };
  } else if (role === 'ACTIVIST_COORDINATOR') {
    // Activist Coordinator sees ONLY voters he uploaded himself
    whereClause = {
      ...whereClause,
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
    orderBy: {
      insertedAt: 'asc', // Oldest first for better duplicate detection
    },
  });

  // Map insertedAt to createdAt for consistency with return type
  return voters.map((v) => ({
    ...v,
    createdAt: v.insertedAt,
  }));
}
