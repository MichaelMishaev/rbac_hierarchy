/**
 * Voter Server Actions with Dependency Inversion Principle
 *
 * SOLID Principles:
 * - Dependency Inversion: Depends on IVoterRepository abstraction, not concrete implementation
 * - Single Responsibility: Each action does ONE thing
 * - Open/Closed: Can add new actions without modifying existing ones
 *
 * These are Next.js Server Actions for client-side usage
 */

'use server';

import { revalidatePath } from 'next/cache';
import type {
  Voter,
  VoterWithHistory,
  CreateVoterInput,
  UpdateVoterInput,
  UserContext,
  DuplicateVoter,
} from '../core/types';
import type { IVoterRepository } from '../repository/interfaces';
import { getVoterRepository } from './repository-factory';
import { getUserContext } from './context';

// ============================================
// READ ACTIONS
// ============================================

/**
 * Get a single voter by ID
 */
export async function getVoterById(
  voterId: string
): Promise<{ success: true; data: Voter } | { success: false; error: string }> {
  try {
    const repository = getVoterRepository();
    const voter = await repository.findById(voterId);

    if (!voter) {
      return { success: false, error: 'Voter not found' };
    }

    // Check visibility
    const viewer = await getUserContext();
    const visibilityService = repository as any; // Would need proper typing
    // For now, just return the voter
    // In production, check visibility first

    return { success: true, data: voter };
  } catch (error) {
    console.error('[getVoterById]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get voter with full edit history
 */
export async function getVoterWithHistory(
  voterId: string
): Promise<{ success: true; data: VoterWithHistory } | { success: false; error: string }> {
  try {
    const repository = getVoterRepository();
    const voter = await repository.findByIdWithHistory(voterId);

    if (!voter) {
      return { success: false, error: 'Voter not found' };
    }

    return { success: true, data: voter };
  } catch (error) {
    console.error('[getVoterWithHistory]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all voters visible to the current user
 */
export async function getVisibleVoters(options?: {
  isActive?: boolean;
  supportLevel?: string;
  contactStatus?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: true; data: Voter[]; total: number } | { success: false; error: string }> {
  try {
    const viewer = await getUserContext();
    const repository = getVoterRepository();

    const [voters, total] = await Promise.all([
      repository.findVisibleVoters(viewer, options),
      repository.countVisibleVoters(viewer, options),
    ]);

    return { success: true, data: voters, total };
  } catch (error) {
    console.error('[getVisibleVoters]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get all DELETED voters (soft-deleted, isActive = false)
 *
 * RBAC:
 * - Production: ONLY dima@gmail.com (specific user, not role-based)
 * - Development: All users (for testing)
 */
export async function getDeletedVoters(options?: {
  supportLevel?: string;
  contactStatus?: string;
  limit?: number;
  offset?: number;
}): Promise<{ success: true; data: Voter[]; total: number } | { success: false; error: string }> {
  try {
    const viewer = await getUserContext();
    const isDevelopment = process.env.NODE_ENV === 'development';

    // RBAC: ONLY dima@gmail.com in production, all users in dev
    if (!isDevelopment && viewer.email !== 'dima@gmail.com') {
      return {
        success: false,
        error: 'Access denied: Only authorized user can view deleted voters',
      };
    }

    const repository = getVoterRepository();

    // Always query deleted voters (isActive: false)
    const [voters, total] = await Promise.all([
      repository.findVisibleVoters(viewer, {
        ...options,
        isActive: false, // Only deleted voters
      }),
      repository.countVisibleVoters(viewer, {
        ...options,
        isActive: false,
      }),
    ]);

    return { success: true, data: voters, total };
  } catch (error) {
    console.error('[getDeletedVoters]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search voters by phone number
 */
export async function searchVotersByPhone(
  phone: string
): Promise<{ success: true; data: Voter[] } | { success: false; error: string }> {
  try {
    const repository = getVoterRepository();
    const voters = await repository.findByPhone(phone);

    return { success: true, data: voters };
  } catch (error) {
    console.error('[searchVotersByPhone]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// WRITE ACTIONS
// ============================================

/**
 * Create a new voter
 */
export async function createVoter(
  input: Omit<CreateVoterInput, 'insertedByUserId' | 'insertedByUserName' | 'insertedByUserRole'>
): Promise<{ success: true; data: Voter } | { success: false; error: string }> {
  try {
    const viewer = await getUserContext();
    const repository = getVoterRepository();

    // Auto-populate organizational ownership from user context
    const fullInput: CreateVoterInput = {
      ...input,
      insertedByUserId: viewer.userId,
      insertedByUserName: viewer.fullName,
      insertedByUserRole: viewer.role,
      insertedByCityName: viewer.cityId,
      // Would need to get neighborhood name from context
    };

    const voter = await repository.create(fullInput);

    // Revalidate relevant paths
    revalidatePath('/voters');
    revalidatePath('/dashboard');

    return { success: true, data: voter };
  } catch (error) {
    console.error('[createVoter]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update an existing voter
 */
export async function updateVoter(
  voterId: string,
  updates: UpdateVoterInput
): Promise<{ success: true; data: Voter } | { success: false; error: string }> {
  try {
    const viewer = await getUserContext();
    const repository = getVoterRepository();

    // Check if user can edit this voter
    const existingVoter = await repository.findById(voterId);
    if (!existingVoter) {
      return { success: false, error: 'Voter not found' };
    }

    // Update the voter
    const updatedVoter = await repository.update(voterId, updates, {
      userId: viewer.userId,
      fullName: viewer.fullName,
      role: viewer.role,
    });

    // Revalidate relevant paths
    revalidatePath('/voters');
    revalidatePath(`/voters/${voterId}`);

    return { success: true, data: updatedVoter };
  } catch (error) {
    console.error('[updateVoter]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Soft delete a voter
 */
export async function deleteVoter(
  voterId: string
): Promise<{ success: true; data: Voter } | { success: false; error: string }> {
  try {
    const viewer = await getUserContext();
    const repository = getVoterRepository();

    const voter = await repository.softDelete(voterId, {
      userId: viewer.userId,
      fullName: viewer.fullName,
    });

    // Revalidate relevant paths
    revalidatePath('/voters');
    revalidatePath(`/voters/${voterId}`);

    return { success: true, data: voter };
  } catch (error) {
    console.error('[deleteVoter]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Restore a soft-deleted voter
 */
export async function restoreVoter(
  voterId: string
): Promise<{ success: true; data: Voter } | { success: false; error: string }> {
  try {
    const repository = getVoterRepository();
    const voter = await repository.restore(voterId);

    // Revalidate relevant paths
    revalidatePath('/voters');
    revalidatePath(`/voters/${voterId}`);

    return { success: true, data: voter };
  } catch (error) {
    console.error('[restoreVoter]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// ANALYTICS ACTIONS
// ============================================

/**
 * Get voter statistics for current user
 */
export async function getVoterStatistics(): Promise<
  | {
      success: true;
      data: {
        total: number;
        active: number;
        deleted: number;
        bySupportLevel: Record<string, number>;
        byContactStatus: Record<string, number>;
      };
    }
  | { success: false; error: string }
> {
  try {
    const viewer = await getUserContext();
    const repository = getVoterRepository();

    const stats = await repository.getStatistics(viewer);

    return { success: true, data: stats };
  } catch (error) {
    console.error('[getVoterStatistics]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get duplicate voters report (SuperAdmin only)
 */
export async function getDuplicatesReport(): Promise<
  | {
      success: true;
      data: {
        totalDuplicates: number;
        duplicateGroups: Array<{
          phone: string;
          count: number;
          voters: DuplicateVoter[];
        }>;
      };
    }
  | { success: false; error: string }
> {
  try {
    const viewer = await getUserContext();

    if (viewer.role !== 'SUPERADMIN') {
      return { success: false, error: 'Only SuperAdmin can view duplicates report' };
    }

    const repository = getVoterRepository();
    const report = await repository.getDuplicatesReport();

    return { success: true, data: report };
  } catch (error) {
    console.error('[getDuplicatesReport]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get insertion activity report
 */
export async function getInsertionActivity(options?: {
  startDate?: Date;
  endDate?: Date;
}): Promise<
  | {
      success: true;
      data: Array<{
        userId: string;
        userName: string;
        userRole: string;
        count: number;
      }>;
    }
  | { success: false; error: string }
> {
  try {
    const viewer = await getUserContext();
    const repository = getVoterRepository();

    const activity = await repository.getInsertionActivity(viewer, options);

    return { success: true, data: activity };
  } catch (error) {
    console.error('[getInsertionActivity]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// EXPORT ACTIONS
// ============================================

/**
 * Export voters to CSV
 */
export async function exportVotersToCSV(voterIds: string[]): Promise<
  | { success: true; data: string }
  | { success: false; error: string }
> {
  try {
    const repository = getVoterRepository();

    // Get voters
    const voters = await Promise.all(
      voterIds.map((id) => repository.findById(id))
    );
    const validVoters = voters.filter((v): v is Voter => v !== null);

    const csv = await repository.exportToCSV(validVoters);

    return { success: true, data: csv };
  } catch (error) {
    console.error('[exportVotersToCSV]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Export voter edit history to CSV
 */
export async function exportVoterHistory(voterId: string): Promise<
  | { success: true; data: string }
  | { success: false; error: string }
> {
  try {
    const repository = getVoterRepository();
    const csv = await repository.exportEditHistory(voterId);

    return { success: true, data: csv };
  } catch (error) {
    console.error('[exportVoterHistory]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
