/**
 * Integration Tests for Voter System
 *
 * Tests the entire SOLID architecture:
 * - Repository Pattern (LSP)
 * - Visibility Rules (OCP)
 * - Invariant Guards
 * - Server Actions (DIP)
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { InMemoryVoterRepository } from '../repository/in-memory-repository';
import type { UserContext, CreateVoterInput, Voter } from '../core/types';
import { VoterVisibilityEngine, SuperAdminVisibilityRule, DirectInserterVisibilityRule } from '../visibility/rules';
import { InvariantViolationError, guardCreateVoter } from '../core/invariants';

describe('Voter System Integration Tests', () => {
  let repository: InMemoryVoterRepository;

  beforeEach(() => {
    repository = new InMemoryVoterRepository();
  });

  describe('Repository Pattern (LSP)', () => {
    it('should create a voter with all required fields', async () => {
      const input: CreateVoterInput = {
        fullName: 'יוסי כהן',
        phone: '0501234567',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל בן-דוד',
        insertedByUserRole: 'רכז פעילים',
        supportLevel: 'תומך',
        contactStatus: 'נוצר קשר',
      };

      const voter = await repository.create(input);

      expect(voter.id).toBeDefined();
      expect(voter.fullName).toBe('יוסי כהן');
      expect(voter.phone).toBe('0501234567');
      expect(voter.isActive).toBe(true);
      expect(voter.insertedByUserId).toBe('user-1');
    });

    it('should update a voter and track edit history', async () => {
      // Create voter
      const voter = await repository.create({
        fullName: 'דני לוי',
        phone: '0509876543',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      // Update voter
      const updated = await repository.update(
        voter.id,
        { supportLevel: 'תומך' },
        {
          userId: 'user-2',
          fullName: 'דוד',
          role: 'CITY_COORDINATOR',
        }
      );

      expect(updated.supportLevel).toBe('תומך');

      // Check edit history
      const withHistory = await repository.findByIdWithHistory(voter.id);
      expect(withHistory?.editHistory).toHaveLength(1);
      expect(withHistory?.editHistory[0].editedByUserName).toBe('דוד');
      expect(withHistory?.editHistory[0].fieldName).toBe('supportLevel');
    });

    it('should soft delete a voter', async () => {
      const voter = await repository.create({
        fullName: 'מיכל שמיר',
        phone: '0502223333',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      const deleted = await repository.softDelete(voter.id, {
        userId: 'user-1',
        fullName: 'רחל',
      });

      expect(deleted.isActive).toBe(false);
      expect(deleted.deletedAt).toBeDefined();
      expect(deleted.deletedByUserId).toBe('user-1');
    });

    it('should find voters by phone', async () => {
      await repository.create({
        fullName: 'אחד',
        phone: '0501111111',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      await repository.create({
        fullName: 'שניים',
        phone: '0501111111', // Duplicate!
        insertedByUserId: 'user-2',
        insertedByUserName: 'יעל',
        insertedByUserRole: 'רכז פעילים',
      });

      const duplicates = await repository.findByPhone('0501111111');
      expect(duplicates).toHaveLength(2);
    });
  });

  describe('Visibility Rules (OCP)', () => {
    it('should allow SuperAdmin to see all voters', async () => {
      const engine = new VoterVisibilityEngine([
        new SuperAdminVisibilityRule(),
        new DirectInserterVisibilityRule(),
      ]);

      const superAdmin: UserContext = {
        userId: 'super-1',
        role: 'SUPERADMIN',
        fullName: 'מנהל על',
      };

      const voter: Voter = await repository.create({
        fullName: 'בוחר',
        phone: '0501234567',
        insertedByUserId: 'other-user',
        insertedByUserName: 'אחר',
        insertedByUserRole: 'רכז פעילים',
      });

      const result = await engine.canSee(superAdmin, voter);
      expect(result.canSee).toBe(true);
      expect(result.ruleName).toBe('SuperAdminRule');
    });

    it('should allow user to see voters they inserted', async () => {
      const engine = new VoterVisibilityEngine([
        new SuperAdminVisibilityRule(),
        new DirectInserterVisibilityRule(),
      ]);

      const user: UserContext = {
        userId: 'user-1',
        role: 'ACTIVIST_COORDINATOR',
        fullName: 'רחל',
      };

      const voter: Voter = await repository.create({
        fullName: 'בוחר',
        phone: '0501234567',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      const result = await engine.canSee(user, voter);
      expect(result.canSee).toBe(true);
      expect(result.ruleName).toBe('DirectInserterRule');
    });

    it('should deny visibility to voters from other users', async () => {
      const engine = new VoterVisibilityEngine([
        new SuperAdminVisibilityRule(),
        new DirectInserterVisibilityRule(),
      ]);

      const user: UserContext = {
        userId: 'user-1',
        role: 'ACTIVIST_COORDINATOR',
        fullName: 'רחל',
      };

      const voter: Voter = await repository.create({
        fullName: 'בוחר',
        phone: '0501234567',
        insertedByUserId: 'other-user',
        insertedByUserName: 'אחר',
        insertedByUserRole: 'רכז פעילים',
      });

      const result = await engine.canSee(user, voter);
      expect(result.canSee).toBe(false);
    });
  });

  describe('Invariant Guards', () => {
    it('should enforce INV-V01: Voter must have owner', () => {
      const invalidInput = {
        fullName: 'בוחר',
        phone: '0501234567',
        insertedByUserId: '', // INVALID!
        insertedByUserName: '',
        insertedByUserRole: '',
      } as CreateVoterInput;

      expect(() => guardCreateVoter(invalidInput)).toThrow(InvariantViolationError);
      expect(() => guardCreateVoter(invalidInput)).toThrow('INV-V01');
    });

    it('should enforce phone format validation', () => {
      const invalidInput = {
        fullName: 'בוחר',
        phone: '123', // INVALID!
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      } as CreateVoterInput;

      expect(() => guardCreateVoter(invalidInput)).toThrow(InvariantViolationError);
      expect(() => guardCreateVoter(invalidInput)).toThrow('Israeli format');
    });

    it('should enforce ID number validation', () => {
      const invalidInput = {
        fullName: 'בוחר',
        phone: '0501234567',
        idNumber: '12345', // INVALID! Must be 9 digits
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      } as CreateVoterInput;

      expect(() => guardCreateVoter(invalidInput)).toThrow(InvariantViolationError);
      expect(() => guardCreateVoter(invalidInput)).toThrow('9 digits');
    });

    it('should allow valid voter creation', () => {
      const validInput: CreateVoterInput = {
        fullName: 'בוחר תקין',
        phone: '0501234567',
        idNumber: '123456789',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      };

      expect(() => guardCreateVoter(validInput)).not.toThrow();
    });
  });

  describe('Analytics & Reporting', () => {
    beforeEach(async () => {
      // Seed test data
      await repository.create({
        fullName: 'תומך 1',
        phone: '0501111111',
        supportLevel: 'תומך',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      await repository.create({
        fullName: 'תומך 2',
        phone: '0502222222',
        supportLevel: 'תומך',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      await repository.create({
        fullName: 'מהסס 1',
        phone: '0503333333',
        supportLevel: 'מהסס',
        insertedByUserId: 'user-2',
        insertedByUserName: 'יעל',
        insertedByUserRole: 'רכז פעילים',
      });
    });

    it('should get statistics for visible voters', async () => {
      const viewer: UserContext = {
        userId: 'super-1',
        role: 'SUPERADMIN',
        fullName: 'מנהל על',
      };

      const stats = await repository.getStatistics(viewer);

      expect(stats.total).toBe(3);
      expect(stats.active).toBe(3);
      expect(stats.bySupportLevel['תומך']).toBe(2);
      expect(stats.bySupportLevel['מהסס']).toBe(1);
    });

    it('should get insertion activity report', async () => {
      const viewer: UserContext = {
        userId: 'super-1',
        role: 'SUPERADMIN',
        fullName: 'מנהל על',
      };

      const activity = await repository.getInsertionActivity(viewer);

      expect(activity).toHaveLength(2);
      expect(activity[0].count).toBe(2); // user-1 inserted 2
      expect(activity[1].count).toBe(1); // user-2 inserted 1
    });

    it('should get duplicates report', async () => {
      // Add duplicate
      await repository.create({
        fullName: 'כפול',
        phone: '0501111111', // Duplicate!
        insertedByUserId: 'user-3',
        insertedByUserName: 'דן',
        insertedByUserRole: 'רכז עיר',
      });

      const report = await repository.getDuplicatesReport();

      expect(report.duplicateGroups).toHaveLength(1);
      expect(report.duplicateGroups[0].phone).toBe('0501111111');
      expect(report.duplicateGroups[0].count).toBe(2);
    });
  });

  describe('Export Functionality', () => {
    it('should export voters to CSV', async () => {
      const voter1 = await repository.create({
        fullName: 'בוחר 1',
        phone: '0501111111',
        supportLevel: 'תומך',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      const voter2 = await repository.create({
        fullName: 'בוחר 2',
        phone: '0502222222',
        supportLevel: 'מהסס',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      const csv = await repository.exportToCSV([voter1, voter2]);

      expect(csv).toContain('שם מלא');
      expect(csv).toContain('טלפון');
      expect(csv).toContain('בוחר 1');
      expect(csv).toContain('0501111111');
      expect(csv).toContain('בוחר 2');
      expect(csv).toContain('0502222222');
    });

    it('should export voter edit history', async () => {
      const voter = await repository.create({
        fullName: 'בוחר',
        phone: '0501234567',
        insertedByUserId: 'user-1',
        insertedByUserName: 'רחל',
        insertedByUserRole: 'רכז פעילים',
      });

      await repository.update(
        voter.id,
        { supportLevel: 'תומך' },
        { userId: 'user-2', fullName: 'דוד', role: 'CITY_COORDINATOR' }
      );

      const csv = await repository.exportEditHistory(voter.id);

      expect(csv).toContain('תאריך');
      expect(csv).toContain('נערך על ידי');
      expect(csv).toContain('דוד');
      expect(csv).toContain('supportLevel');
    });
  });
});
