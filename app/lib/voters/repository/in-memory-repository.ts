/**
 * In-Memory Voter Repository for Fast Testing
 *
 * SOLID Principles:
 * - Liskov Substitution: Drop-in replacement for PrismaVoterRepository
 * - Single Responsibility: Only manages in-memory voter storage
 *
 * Use this in unit tests for 100x faster tests (no database roundtrip)
 */

import type {
  Voter,
  VoterWithHistory,
  CreateVoterInput,
  UpdateVoterInput,
  DuplicateVoter,
  UserContext,
  VoterEditHistory,
} from '../core/types';
import type { IVoterRepository } from './interfaces';
import {
  guardCreateVoter,
  guardUpdateVoter,
  guardSoftDeleteOnly,
} from '../core/invariants';

export class InMemoryVoterRepository implements IVoterRepository {
  private voters: Map<string, Voter> = new Map();
  private editHistory: Map<string, VoterEditHistory[]> = new Map();
  private idCounter = 1;

  // ============================================
  // READER OPERATIONS
  // ============================================

  async findById(voterId: string): Promise<Voter | null> {
    return this.voters.get(voterId) || null;
  }

  async findByIdWithHistory(voterId: string): Promise<VoterWithHistory | null> {
    const voter = await this.findById(voterId);
    if (!voter) return null;

    const history = this.editHistory.get(voterId) || [];
    return {
      ...voter,
      editHistory: history,
    };
  }

  async findByPhone(phone: string): Promise<Voter[]> {
    return Array.from(this.voters.values()).filter(
      (v) => v.phone === phone && v.isActive
    );
  }

  async findVisibleVoters(
    viewer: UserContext,
    options?: {
      isActive?: boolean;
      supportLevel?: string;
      contactStatus?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<Voter[]> {
    let voters = Array.from(this.voters.values());

    // Apply visibility filter (simplified for in-memory)
    if (viewer.role !== 'SUPERADMIN') {
      voters = voters.filter((v) => {
        // User can see voters they inserted
        if (v.insertedByUserId === viewer.userId) return true;

        // Area Manager can see voters in their area
        if (viewer.role === 'AREA_MANAGER') {
          // Simplified: would need full hierarchy check
          return true;
        }

        // City Coordinator can see voters in their city
        if (viewer.role === 'CITY_COORDINATOR' && viewer.cityId) {
          return v.insertedByCityName === viewer.cityId;
        }

        return false;
      });
    }

    // Apply filters
    if (options?.isActive !== undefined) {
      voters = voters.filter((v) => v.isActive === options.isActive);
    }
    if (options?.supportLevel) {
      voters = voters.filter((v) => v.supportLevel === options.supportLevel);
    }
    if (options?.contactStatus) {
      voters = voters.filter((v) => v.contactStatus === options.contactStatus);
    }

    // Sort by insertedAt desc
    voters.sort((a, b) => b.insertedAt.getTime() - a.insertedAt.getTime());

    // Apply pagination
    if (options?.offset) {
      voters = voters.slice(options.offset);
    }
    if (options?.limit) {
      voters = voters.slice(0, options.limit);
    }

    return voters;
  }

  async countVisibleVoters(
    viewer: UserContext,
    options?: {
      isActive?: boolean;
      supportLevel?: string;
      contactStatus?: string;
    }
  ): Promise<number> {
    const voters = await this.findVisibleVoters(viewer, options);
    return voters.length;
  }

  async findByInserter(
    insertedByUserId: string,
    options?: { isActive?: boolean }
  ): Promise<Voter[]> {
    let voters = Array.from(this.voters.values()).filter(
      (v) => v.insertedByUserId === insertedByUserId
    );

    if (options?.isActive !== undefined) {
      voters = voters.filter((v) => v.isActive === options.isActive);
    }

    return voters;
  }

  // ============================================
  // WRITER OPERATIONS
  // ============================================

  async create(input: CreateVoterInput): Promise<Voter> {
    // Run invariant guards
    guardCreateVoter(input);

    // Check for duplicates (allowed but log)
    const existingVoters = await this.findByPhone(input.phone);
    if (existingVoters.length > 0) {
      console.warn(`[DUPLICATE] Phone ${input.phone} already exists ${existingVoters.length} time(s)`);
    }

    const voter: Voter = {
      id: `voter-${this.idCounter++}`,
      ...input,
      email: input.email || null,
      idNumber: input.idNumber || null,
      dateOfBirth: input.dateOfBirth || null,
      gender: input.gender || null,
      voterAddress: input.voterAddress || null,
      voterCity: input.voterCity || null,
      voterNeighborhood: input.voterNeighborhood || null,
      supportLevel: input.supportLevel || null,
      contactStatus: input.contactStatus || null,
      priority: input.priority || null,
      notes: input.notes || null,
      lastContactedAt: input.lastContactedAt || null,
      assignedCityId: input.assignedCityId || null,
      assignedCityName: input.assignedCityName || null,
      insertedByNeighborhoodName: input.insertedByNeighborhoodName || null,
      insertedByCityName: input.insertedByCityName || null,
      isActive: true,
      deletedAt: null,
      deletedByUserId: null,
      deletedByUserName: null,
      insertedAt: new Date(),
      updatedAt: new Date(),
    };

    this.voters.set(voter.id, voter);
    return voter;
  }

  async update(
    voterId: string,
    updates: UpdateVoterInput,
    editor: {
      userId: string;
      fullName: string;
      role: UserContext['role'];
    }
  ): Promise<Voter> {
    // Run invariant guards
    guardUpdateVoter(updates, editor as any);

    const currentVoter = await this.findById(voterId);
    if (!currentVoter) {
      throw new Error(`Voter ${voterId} not found`);
    }

    // Track changed fields for edit history
    const changedFields: Array<{
      fieldName: string;
      oldValue: string | null;
      newValue: string | null;
    }> = [];

    for (const [key, newValue] of Object.entries(updates)) {
      const oldValue = currentVoter[key as keyof Voter];
      if (oldValue !== newValue) {
        changedFields.push({
          fieldName: key,
          oldValue: oldValue ? String(oldValue) : null,
          newValue: newValue ? String(newValue) : null,
        });
      }
    }

    // Update voter
    const updatedVoter: Voter = {
      ...currentVoter,
      ...updates,
      updatedAt: new Date(),
    };

    this.voters.set(voterId, updatedVoter);

    // Create edit history entries
    if (changedFields.length > 0) {
      const history = this.editHistory.get(voterId) || [];
      const newEntries: VoterEditHistory[] = changedFields.map((field, idx) => ({
        id: BigInt(Date.now() + idx),
        voterId,
        editedByUserId: editor.userId,
        editedByUserName: editor.fullName,
        editedByUserRole: editor.role,
        ...field,
        editedAt: new Date(),
      }));
      this.editHistory.set(voterId, [...history, ...newEntries]);
    }

    return updatedVoter;
  }

  async softDelete(
    voterId: string,
    deletedBy: {
      userId: string;
      fullName: string;
    }
  ): Promise<Voter> {
    const voter = await this.findById(voterId);
    if (!voter) {
      throw new Error(`Voter ${voterId} not found`);
    }

    // Get soft delete updates (enforces invariant)
    const softDeleteUpdates = guardSoftDeleteOnly(voter, deletedBy.userId);

    const updatedVoter: Voter = {
      ...voter,
      ...softDeleteUpdates,
      deletedByUserName: deletedBy.fullName,
      updatedAt: new Date(),
    };

    this.voters.set(voterId, updatedVoter);
    return updatedVoter;
  }

  async restore(voterId: string): Promise<Voter> {
    const voter = await this.findById(voterId);
    if (!voter) {
      throw new Error(`Voter ${voterId} not found`);
    }

    const restoredVoter: Voter = {
      ...voter,
      isActive: true,
      deletedAt: null,
      deletedByUserId: null,
      deletedByUserName: null,
      updatedAt: new Date(),
    };

    this.voters.set(voterId, restoredVoter);
    return restoredVoter;
  }

  // ============================================
  // ANALYZER OPERATIONS
  // ============================================

  async findDuplicates(phone: string): Promise<DuplicateVoter[]> {
    const voters = await this.findByPhone(phone);
    return voters.map((v) => ({
      voterId: v.id,
      phone: v.phone,
      fullName: v.fullName,
      insertedByUserName: v.insertedByUserName,
      insertedByUserRole: v.insertedByUserRole,
      insertedAt: v.insertedAt,
      matchType: 'exact_phone' as const,
    }));
  }

  async getDuplicatesReport(): Promise<{
    totalDuplicates: number;
    duplicateGroups: Array<{
      phone: string;
      count: number;
      voters: DuplicateVoter[];
    }>;
  }> {
    // Group voters by phone
    const phoneGroups = new Map<string, Voter[]>();
    for (const voter of this.voters.values()) {
      if (!voter.isActive) continue;

      const group = phoneGroups.get(voter.phone) || [];
      group.push(voter);
      phoneGroups.set(voter.phone, group);
    }

    // Find duplicates
    const duplicateGroups = Array.from(phoneGroups.entries())
      .filter(([_, voters]) => voters.length > 1)
      .map(([phone, voters]) => ({
        phone,
        count: voters.length,
        voters: voters.map((v) => ({
          voterId: v.id,
          phone: v.phone,
          fullName: v.fullName,
          insertedByUserName: v.insertedByUserName,
          insertedByUserRole: v.insertedByUserRole,
          insertedAt: v.insertedAt,
          matchType: 'exact_phone' as const,
        })),
      }));

    const totalDuplicates = duplicateGroups.reduce((sum, g) => sum + g.count, 0);

    return {
      totalDuplicates,
      duplicateGroups,
    };
  }

  async getStatistics(viewer: UserContext): Promise<{
    total: number;
    active: number;
    deleted: number;
    bySupportLevel: Record<string, number>;
    byContactStatus: Record<string, number>;
  }> {
    const visibleVoters = await this.findVisibleVoters(viewer);

    const active = visibleVoters.filter((v) => v.isActive).length;
    const deleted = visibleVoters.filter((v) => !v.isActive).length;

    const bySupportLevel: Record<string, number> = {};
    const byContactStatus: Record<string, number> = {};

    for (const voter of visibleVoters.filter((v) => v.isActive)) {
      const level = voter.supportLevel || 'לא מוגדר';
      bySupportLevel[level] = (bySupportLevel[level] || 0) + 1;

      const status = voter.contactStatus || 'לא מוגדר';
      byContactStatus[status] = (byContactStatus[status] || 0) + 1;
    }

    return {
      total: visibleVoters.length,
      active,
      deleted,
      bySupportLevel,
      byContactStatus,
    };
  }

  async getInsertionActivity(
    viewer: UserContext,
    options?: {
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<Array<{
    userId: string;
    userName: string;
    userRole: string;
    count: number;
  }>> {
    const visibleVoters = await this.findVisibleVoters(viewer, { isActive: true });

    // Filter by date range
    let filtered = visibleVoters;
    if (options?.startDate) {
      filtered = filtered.filter((v) => v.insertedAt >= options.startDate!);
    }
    if (options?.endDate) {
      filtered = filtered.filter((v) => v.insertedAt <= options.endDate!);
    }

    // Group by inserter
    const activity = new Map<string, {
      userId: string;
      userName: string;
      userRole: string;
      count: number;
    }>();

    for (const voter of filtered) {
      const key = voter.insertedByUserId;
      const existing = activity.get(key);
      if (existing) {
        existing.count++;
      } else {
        activity.set(key, {
          userId: voter.insertedByUserId,
          userName: voter.insertedByUserName,
          userRole: voter.insertedByUserRole,
          count: 1,
        });
      }
    }

    return Array.from(activity.values()).sort((a, b) => b.count - a.count);
  }

  // ============================================
  // EXPORTER OPERATIONS
  // ============================================

  async exportToCSV(voters: Voter[]): Promise<string> {
    const headers = [
      'שם מלא',
      'טלפון',
      'תעודת זהות',
      'אימייל',
      'רמת תמיכה',
      'סטטוס קשר',
      'הוכנס על ידי',
      'תפקיד',
      'תאריך הכנסה',
    ];

    const rows = voters.map((v) => [
      v.fullName,
      v.phone,
      v.idNumber || '',
      v.email || '',
      v.supportLevel || '',
      v.contactStatus || '',
      v.insertedByUserName,
      v.insertedByUserRole,
      v.insertedAt.toISOString().split('T')[0],
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  async exportToExcel(voters: Voter[]): Promise<Buffer> {
    throw new Error('Excel export not yet implemented');
  }

  async exportEditHistory(voterId: string): Promise<string> {
    const voterWithHistory = await this.findByIdWithHistory(voterId);
    if (!voterWithHistory) {
      throw new Error(`Voter ${voterId} not found`);
    }

    const headers = ['תאריך', 'נערך על ידי', 'תפקיד', 'שדה', 'ערך קודם', 'ערך חדש'];

    const rows = voterWithHistory.editHistory.map((h) => [
      h.editedAt.toISOString().split('T')[0],
      h.editedByUserName,
      h.editedByUserRole,
      h.fieldName,
      h.oldValue || '',
      h.newValue || '',
    ]);

    return [headers, ...rows].map((row) => row.join(',')).join('\n');
  }

  // ============================================
  // TESTING HELPERS
  // ============================================

  /**
   * Clear all data (for test setup)
   */
  clear(): void {
    this.voters.clear();
    this.editHistory.clear();
    this.idCounter = 1;
  }

  /**
   * Seed with test data
   */
  async seed(voters: Voter[]): Promise<void> {
    for (const voter of voters) {
      this.voters.set(voter.id, voter);
    }
  }
}
