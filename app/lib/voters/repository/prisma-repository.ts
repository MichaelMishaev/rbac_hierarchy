/**
 * Prisma Voter Repository Implementation
 *
 * SOLID Principles:
 * - Liskov Substitution: Can be swapped with InMemoryVoterRepository
 * - Single Responsibility: Only handles data access via Prisma
 * - Dependency Inversion: Implements abstract interfaces
 */

import { PrismaClient } from '@prisma/client';
import type {
  Voter,
  VoterWithHistory,
  CreateVoterInput,
  UpdateVoterInput,
  DuplicateVoter,
  UserContext,
} from '../core/types';
import type { IVoterRepository } from './interfaces';
import { VoterVisibilityService } from '../visibility/service';
import {
  guardCreateVoter,
  guardUpdateVoter,
  guardSoftDeleteOnly,
} from '../core/invariants';

export class PrismaVoterRepository implements IVoterRepository {
  private visibilityService: VoterVisibilityService;

  constructor(private prisma: PrismaClient) {
    this.visibilityService = new VoterVisibilityService(prisma);
  }

  // ============================================
  // READER OPERATIONS
  // ============================================

  async findById(voterId: string): Promise<Voter | null> {
    return this.prisma.voter.findUnique({
      where: { id: voterId },
    });
  }

  async findByIdWithHistory(voterId: string): Promise<VoterWithHistory | null> {
    return this.prisma.voter.findUnique({
      where: { id: voterId },
      include: {
        editHistory: {
          orderBy: { editedAt: 'desc' },
        },
      },
    });
  }

  async findByPhone(phone: string): Promise<Voter[]> {
    return this.prisma.voter.findMany({
      where: { phone, isActive: true },
    });
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
    const visibilityFilter = this.visibilityService.getVisibilityFilter(viewer);

    return this.prisma.voter.findMany({
      where: {
        ...visibilityFilter,
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
        ...(options?.supportLevel && { supportLevel: options.supportLevel }),
        ...(options?.contactStatus && { contactStatus: options.contactStatus }),
      },
      orderBy: { insertedAt: 'desc' },
      take: options?.limit,
      skip: options?.offset,
    });
  }

  async countVisibleVoters(
    viewer: UserContext,
    options?: {
      isActive?: boolean;
      supportLevel?: string;
      contactStatus?: string;
    }
  ): Promise<number> {
    const visibilityFilter = this.visibilityService.getVisibilityFilter(viewer);

    return this.prisma.voter.count({
      where: {
        ...visibilityFilter,
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
        ...(options?.supportLevel && { supportLevel: options.supportLevel }),
        ...(options?.contactStatus && { contactStatus: options.contactStatus }),
      },
    });
  }

  async findByInserter(
    insertedByUserId: string,
    options?: { isActive?: boolean }
  ): Promise<Voter[]> {
    return this.prisma.voter.findMany({
      where: {
        insertedByUserId,
        ...(options?.isActive !== undefined && { isActive: options.isActive }),
      },
      orderBy: { insertedAt: 'desc' },
    });
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

    return this.prisma.voter.create({
      data: {
        ...input,
        isActive: true,
        insertedAt: new Date(),
      },
    });
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

    // Get current voter for edit history
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

    // Update voter and create edit history in transaction
    return this.prisma.$transaction(async (tx) => {
      // Update voter
      const updatedVoter = await tx.voter.update({
        where: { id: voterId },
        data: {
          ...updates,
          updatedAt: new Date(),
        },
      });

      // Create edit history entries
      if (changedFields.length > 0) {
        await tx.voterEditHistory.createMany({
          data: changedFields.map((field) => ({
            voterId,
            editedByUserId: editor.userId,
            editedByUserName: editor.fullName,
            editedByUserRole: editor.role,
            ...field,
            editedAt: new Date(),
          })),
        });
      }

      return updatedVoter;
    });
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

    return this.prisma.voter.update({
      where: { id: voterId },
      data: {
        ...softDeleteUpdates,
        deletedByUserName: deletedBy.fullName,
      },
    });
  }

  async restore(voterId: string): Promise<Voter> {
    return this.prisma.voter.update({
      where: { id: voterId },
      data: {
        isActive: true,
        deletedAt: null,
        deletedByUserId: null,
        deletedByUserName: null,
      },
    });
  }

  // ============================================
  // ANALYZER OPERATIONS
  // ============================================

  async findDuplicates(phone: string): Promise<DuplicateVoter[]> {
    const voters = await this.prisma.voter.findMany({
      where: { phone, isActive: true },
      select: {
        id: true,
        phone: true,
        fullName: true,
        insertedByUserName: true,
        insertedByUserRole: true,
        insertedAt: true,
      },
    });

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
    // Find all phones with duplicates
    const duplicatePhones = await this.prisma.voter.groupBy({
      by: ['phone'],
      where: { isActive: true },
      having: {
        phone: {
          _count: {
            gt: 1,
          },
        },
      },
      _count: {
        phone: true,
      },
    });

    // Get details for each duplicate group
    const duplicateGroups = await Promise.all(
      duplicatePhones.map(async (group) => ({
        phone: group.phone,
        count: group._count.phone,
        voters: await this.findDuplicates(group.phone),
      }))
    );

    const totalDuplicates = duplicatePhones.reduce((sum, group) => sum + group._count.phone, 0);

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
    const visibilityFilter = this.visibilityService.getVisibilityFilter(viewer);

    const [total, active, deleted, supportLevels, contactStatuses] = await Promise.all([
      this.prisma.voter.count({ where: visibilityFilter }),
      this.prisma.voter.count({ where: { ...visibilityFilter, isActive: true } }),
      this.prisma.voter.count({ where: { ...visibilityFilter, isActive: false } }),
      this.prisma.voter.groupBy({
        by: ['supportLevel'],
        where: { ...visibilityFilter, isActive: true },
        _count: true,
      }),
      this.prisma.voter.groupBy({
        by: ['contactStatus'],
        where: { ...visibilityFilter, isActive: true },
        _count: true,
      }),
    ]);

    return {
      total,
      active,
      deleted,
      bySupportLevel: Object.fromEntries(
        supportLevels.map((s) => [s.supportLevel || 'לא מוגדר', s._count])
      ),
      byContactStatus: Object.fromEntries(
        contactStatuses.map((c) => [c.contactStatus || 'לא מוגדר', c._count])
      ),
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
    const visibilityFilter = this.visibilityService.getVisibilityFilter(viewer);

    const activity = await this.prisma.voter.groupBy({
      by: ['insertedByUserId', 'insertedByUserName', 'insertedByUserRole'],
      where: {
        ...visibilityFilter,
        isActive: true,
        ...(options?.startDate && { insertedAt: { gte: options.startDate } }),
        ...(options?.endDate && { insertedAt: { lte: options.endDate } }),
      },
      _count: true,
      orderBy: {
        _count: {
          insertedByUserId: 'desc',
        },
      },
    });

    return activity.map((a) => ({
      userId: a.insertedByUserId,
      userName: a.insertedByUserName,
      userRole: a.insertedByUserRole,
      count: a._count,
    }));
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
    // Placeholder - would use a library like ExcelJS
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
}
