/**
 * Voter Bulk Import Server Action
 *
 * Handles Excel file bulk import of voters
 */

'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { getUserContext } from '@/lib/voters/actions/context';

type BulkVoterInput = {
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  email: string;
};

type ImportResult = {
  success: number;
  failed: number;
  errors: Array<{ row: number; error: string }>;
};

/**
 * Bulk import voters from Excel
 * Validates required fields and creates voters (allows duplicates)
 */
export async function bulkImportVoters(voters: BulkVoterInput[]): Promise<ImportResult> {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    errors: [],
  };

  try {
    const viewer = await getUserContext();

    console.log(`[bulkImportVoters] Starting import of ${voters.length} voters by ${viewer.fullName}`);

    for (let i = 0; i < voters.length; i++) {
      const row = voters[i];
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and first row is header

      try {
        // Validate required fields
        if (!row.firstName?.trim()) {
          result.failed++;
          result.errors.push({ row: rowNumber, error: 'שם פרטי חסר' });
          continue;
        }

        if (!row.lastName?.trim()) {
          result.failed++;
          result.errors.push({ row: rowNumber, error: 'שם משפחה חסר' });
          continue;
        }

        if (!row.phone?.trim()) {
          result.failed++;
          result.errors.push({ row: rowNumber, error: 'טלפון חסר' });
          continue;
        }

        const phone = row.phone.toString().trim();
        const fullName = `${row.firstName.trim()} ${row.lastName.trim()}`;

        // Create voter (allow duplicates from Excel import)
        await prisma.voter.create({
          data: {
            fullName,
            phone,
            idNumber: '', // Not in Excel
            email: row.email?.trim() || null,
            dateOfBirth: null, // Not in Excel
            gender: '', // Not in Excel
            voterAddress: '', // Not in Excel
            voterCity: row.city?.trim() || '',
            voterNeighborhood: '', // Not in Excel
            supportLevel: '', // Not in Excel
            contactStatus: '', // Not in Excel
            priority: '', // Not in Excel
            notes: `יובא מאקסל ע״י ${viewer.fullName}`,
            isActive: true,
            insertedByUserId: viewer.userId,
            insertedByUserName: viewer.fullName,
            insertedByUserRole: viewer.role,
            insertedByCityName: null, // Not available in UserContext
            insertedByNeighborhoodName: null, // Not available in UserContext
          },
        });

        result.success++;
        console.log(`[bulkImportVoters] Row ${rowNumber}: Created voter ${fullName} (${phone})`);
      } catch (error) {
        result.failed++;
        const errorMsg = error instanceof Error ? error.message : 'שגיאה לא ידועה';
        result.errors.push({ row: rowNumber, error: errorMsg });
        console.error(`[bulkImportVoters] Row ${rowNumber} error:`, error);
      }
    }

    console.log(
      `[bulkImportVoters] Completed: ${result.success} success, ${result.failed} failed`
    );

    // Revalidate voters page
    revalidatePath('/voters');
    revalidatePath('/dashboard');

    return result;
  } catch (error) {
    console.error('[bulkImportVoters] Fatal error:', error);
    return {
      success: 0,
      failed: voters.length,
      errors: [
        {
          row: 0,
          error: error instanceof Error ? error.message : 'שגיאה קריטית בתהליך הייבוא',
        },
      ],
    };
  }
}
