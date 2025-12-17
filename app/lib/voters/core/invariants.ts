/**
 * Runtime Invariant Guards for Voter System
 *
 * SOLID Principles:
 * - Single Responsibility: Each guard checks ONE invariant
 * - Open/Closed: Can add new guards without modifying existing ones
 *
 * Enforces the 5 Core Invariants from voter-system.md:
 * - INV-V01: Voters belong to people, not places
 * - INV-V02: Upward visibility chain only
 * - INV-V03: Soft deletes only
 * - INV-V04: Duplicate detection (allow but report)
 * - INV-V05: Full edit history with names
 */

import type { Voter, UserContext, CreateVoterInput, UpdateVoterInput } from './types';

/**
 * Base error for invariant violations
 */
export class InvariantViolationError extends Error {
  constructor(
    public invariantCode: string,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(`[${invariantCode}] ${message}`);
    this.name = 'InvariantViolationError';
  }
}

// ============================================
// INV-V01: Voters belong to people, not places
// ============================================

/**
 * Guard: Voter MUST have insertedByUserId (organizational ownership)
 */
export function guardVoterHasOwner(input: CreateVoterInput): void {
  if (!input.insertedByUserId) {
    throw new InvariantViolationError(
      'INV-V01',
      'Voter must have insertedByUserId (organizational ownership)',
      { input }
    );
  }

  if (!input.insertedByUserName) {
    throw new InvariantViolationError(
      'INV-V01',
      'Voter must have insertedByUserName for manager-friendly UX',
      { input }
    );
  }

  if (!input.insertedByUserRole) {
    throw new InvariantViolationError(
      'INV-V01',
      'Voter must have insertedByUserRole for visibility chain',
      { input }
    );
  }
}

/**
 * Guard: Voter MUST NOT have foreign keys to neighborhood/city
 * (Only text fields for geographic info)
 */
export function guardNoGeographicForeignKeys(input: CreateVoterInput): void {
  // This is enforced by schema, but double-check input doesn't have FKs
  const invalidKeys = ['neighborhoodId', 'cityId'] as const;
  const foundInvalidKeys = invalidKeys.filter((key) => key in input);

  if (foundInvalidKeys.length > 0) {
    throw new InvariantViolationError(
      'INV-V01',
      'Voter must NOT have foreign keys to neighborhood/city (voters belong to people, not places)',
      { invalidKeys: foundInvalidKeys, input }
    );
  }
}

// ============================================
// INV-V02: Upward visibility chain only
// ============================================

/**
 * Guard: User can only see voters inserted by themselves or people below them
 * This is enforced by visibility logic, not a creation guard
 */
export function guardUpwardVisibilityChain(
  viewer: UserContext,
  voter: Voter
): void {
  // SuperAdmin can see all voters
  if (viewer.role === 'SUPERADMIN') {
    return;
  }

  // If viewer inserted the voter, they can see it
  if (voter.insertedByUserId === viewer.userId) {
    return;
  }

  // Otherwise, visibility must be determined by hierarchical rules
  // This guard is a placeholder - actual logic in visibility module
  // We're just ensuring the concept is clear
}

// ============================================
// INV-V03: Soft deletes only
// ============================================

/**
 * Guard: Voter deletion MUST be soft delete (set isActive = false)
 */
export function guardSoftDeleteOnly(voter: Voter, deletedByUserId: string): Partial<Voter> {
  if (!deletedByUserId) {
    throw new InvariantViolationError(
      'INV-V03',
      'Soft delete must record who deleted the voter',
      { voterId: voter.id }
    );
  }

  // Return the soft delete update
  return {
    isActive: false,
    deletedAt: new Date(),
    deletedByUserId,
  };
}

/**
 * Guard: Hard delete is NEVER allowed
 */
export function guardNoHardDelete(): never {
  throw new InvariantViolationError(
    'INV-V03',
    'Hard delete of voters is FORBIDDEN. Use soft delete only (isActive = false)',
    {}
  );
}

// ============================================
// INV-V04: Duplicate detection (allow but report)
// ============================================

/**
 * Guard: Duplicates are ALLOWED but must be tracked
 * This is not a blocking guard - just validation that we're aware of duplicates
 */
export function guardDuplicateDetection(
  phone: string,
  existingVotersWithPhone: Voter[]
): { hasDuplicates: boolean; count: number } {
  const hasDuplicates = existingVotersWithPhone.length > 0;
  const count = existingVotersWithPhone.length;

  // We allow duplicates but return the info for reporting
  return { hasDuplicates, count };
}

// ============================================
// INV-V05: Full edit history with names
// ============================================

/**
 * Guard: Edit history MUST include editor name (not just ID)
 */
export function guardEditHistoryHasName(
  editedByUserId: string,
  editedByUserName: string,
  editedByUserRole: string
): void {
  if (!editedByUserId) {
    throw new InvariantViolationError(
      'INV-V05',
      'Edit history must record editedByUserId',
      {}
    );
  }

  if (!editedByUserName) {
    throw new InvariantViolationError(
      'INV-V05',
      'Edit history must record editedByUserName for manager-friendly display',
      { editedByUserId }
    );
  }

  if (!editedByUserRole) {
    throw new InvariantViolationError(
      'INV-V05',
      'Edit history must record editedByUserRole for audit context',
      { editedByUserId }
    );
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate phone number format (Israeli format)
 */
export function validatePhoneFormat(phone: string): boolean {
  // Israeli phone: 10 digits starting with 05
  const phoneRegex = /^05\d{8}$/;
  return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
}

/**
 * Validate Israeli ID number (9 digits)
 */
export function validateIdNumber(idNumber: string): boolean {
  const cleanId = idNumber.replace(/[^0-9]/g, '');
  return cleanId.length === 9;
}

/**
 * All-in-one guard for creating a voter
 */
export function guardCreateVoter(input: CreateVoterInput): void {
  guardVoterHasOwner(input);
  guardNoGeographicForeignKeys(input);

  // Validate phone format
  if (!validatePhoneFormat(input.phone)) {
    throw new InvariantViolationError(
      'VALIDATION',
      'Phone number must be in Israeli format (05xxxxxxxx)',
      { phone: input.phone }
    );
  }

  // Validate ID number if provided
  if (input.idNumber && !validateIdNumber(input.idNumber)) {
    throw new InvariantViolationError(
      'VALIDATION',
      'ID number must be 9 digits',
      { idNumber: input.idNumber }
    );
  }
}

/**
 * All-in-one guard for updating a voter
 */
export function guardUpdateVoter(
  updates: UpdateVoterInput,
  editorContext: Pick<UserContext, 'userId' | 'fullName' | 'role'>
): void {
  // Validate phone format if updating phone
  if (updates.phone && !validatePhoneFormat(updates.phone)) {
    throw new InvariantViolationError(
      'VALIDATION',
      'Phone number must be in Israeli format (05xxxxxxxx)',
      { phone: updates.phone }
    );
  }

  // Validate ID number if updating
  if (updates.idNumber && !validateIdNumber(updates.idNumber)) {
    throw new InvariantViolationError(
      'VALIDATION',
      'ID number must be 9 digits',
      { idNumber: updates.idNumber }
    );
  }

  // Ensure editor context is complete for edit history
  guardEditHistoryHasName(editorContext.userId, editorContext.fullName, editorContext.role);
}
