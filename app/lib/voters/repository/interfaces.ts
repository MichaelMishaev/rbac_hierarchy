/**
 * Repository Interfaces - Interface Segregation Principle
 *
 * SOLID Principles:
 * - Interface Segregation: Split into focused interfaces
 * - Liskov Substitution: Any implementation can replace another
 * - Dependency Inversion: Consumers depend on these abstractions
 *
 * Split into 4 interfaces instead of one fat interface:
 * - IVoterReader: Read operations
 * - IVoterWriter: Create/Update/Delete operations
 * - IVoterAnalyzer: Analytics and reporting
 * - IVoterExporter: Export functionality
 */

import type {
  Voter,
  VoterWithHistory,
  CreateVoterInput,
  UpdateVoterInput,
  DuplicateVoter,
  UserContext,
} from '../core/types';

// ============================================
// READER INTERFACE
// ============================================

/**
 * Read operations for voters (ISP)
 */
export interface IVoterReader {
  /**
   * Find voter by ID
   */
  findById(voterId: string): Promise<Voter | null>;

  /**
   * Find voter with edit history
   */
  findByIdWithHistory(voterId: string): Promise<VoterWithHistory | null>;

  /**
   * Find voters by phone number
   */
  findByPhone(phone: string): Promise<Voter[]>;

  /**
   * Find all voters visible to a user
   */
  findVisibleVoters(viewer: UserContext, options?: {
    isActive?: boolean;
    supportLevel?: string;
    contactStatus?: string;
    limit?: number;
    offset?: number;
  }): Promise<Voter[]>;

  /**
   * Count voters visible to a user
   */
  countVisibleVoters(viewer: UserContext, options?: {
    isActive?: boolean;
    supportLevel?: string;
    contactStatus?: string;
  }): Promise<number>;

  /**
   * Find voters inserted by a specific user
   */
  findByInserter(insertedByUserId: string, options?: {
    isActive?: boolean;
  }): Promise<Voter[]>;
}

// ============================================
// WRITER INTERFACE
// ============================================

/**
 * Write operations for voters (ISP)
 */
export interface IVoterWriter {
  /**
   * Create a new voter
   */
  create(input: CreateVoterInput): Promise<Voter>;

  /**
   * Update an existing voter
   */
  update(
    voterId: string,
    updates: UpdateVoterInput,
    editor: {
      userId: string;
      fullName: string;
      role: string;
    }
  ): Promise<Voter>;

  /**
   * Soft delete a voter
   */
  softDelete(
    voterId: string,
    deletedBy: {
      userId: string;
      fullName: string;
    }
  ): Promise<Voter>;

  /**
   * Restore a soft-deleted voter
   */
  restore(voterId: string): Promise<Voter>;
}

// ============================================
// ANALYZER INTERFACE
// ============================================

/**
 * Analytics and reporting operations (ISP)
 */
export interface IVoterAnalyzer {
  /**
   * Find duplicate voters by phone number
   */
  findDuplicates(phone: string): Promise<DuplicateVoter[]>;

  /**
   * Get duplicate voters report for SuperAdmin
   */
  getDuplicatesReport(): Promise<{
    totalDuplicates: number;
    duplicateGroups: Array<{
      phone: string;
      count: number;
      voters: DuplicateVoter[];
    }>;
  }>;

  /**
   * Get voter statistics for a user's visible voters
   */
  getStatistics(viewer: UserContext): Promise<{
    total: number;
    active: number;
    deleted: number;
    bySupportLevel: Record<string, number>;
    byContactStatus: Record<string, number>;
  }>;

  /**
   * Get insertion activity by user
   */
  getInsertionActivity(viewer: UserContext, options?: {
    startDate?: Date;
    endDate?: Date;
  }): Promise<Array<{
    userId: string;
    userName: string;
    userRole: string;
    count: number;
  }>>;
}

// ============================================
// EXPORTER INTERFACE
// ============================================

/**
 * Export operations for voters (ISP)
 */
export interface IVoterExporter {
  /**
   * Export voters to CSV format
   */
  exportToCSV(voters: Voter[]): Promise<string>;

  /**
   * Export voters to Excel format
   */
  exportToExcel(voters: Voter[]): Promise<Buffer>;

  /**
   * Export edit history for a voter
   */
  exportEditHistory(voterId: string): Promise<string>;
}

// ============================================
// COMPLETE REPOSITORY INTERFACE
// ============================================

/**
 * Complete voter repository combining all interfaces
 * Use this when you need all operations
 */
export interface IVoterRepository
  extends IVoterReader,
    IVoterWriter,
    IVoterAnalyzer,
    IVoterExporter {}
