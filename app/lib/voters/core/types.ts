/**
 * Core Domain Types for Voter Management System
 *
 * SOLID Principles:
 * - Single Responsibility: This file ONLY defines types, no logic
 * - Interface Segregation: Types are minimal and focused
 */

import { Voter as PrismaVoter, VoterEditHistory as PrismaVoterEditHistory } from '@prisma/client';

// ============================================
// VOTER DOMAIN TYPES
// ============================================

/**
 * Full voter entity from database
 */
export type Voter = PrismaVoter;

/**
 * Voter with edit history included
 */
export type VoterWithHistory = Voter & {
  editHistory: VoterEditHistory[];
};

/**
 * Edit history entry
 */
export type VoterEditHistory = PrismaVoterEditHistory;

/**
 * Voter input for creating new voter
 */
export interface CreateVoterInput {
  // Personal Info
  fullName: string;
  phone: string;
  idNumber?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;

  // Geographic Info (text only)
  voterAddress?: string;
  voterCity?: string;
  voterNeighborhood?: string;

  // Campaign Status
  supportLevel?: string;
  contactStatus?: string;
  priority?: string;
  notes?: string;
  lastContactedAt?: Date;

  // Organizational Ownership (auto-populated by system)
  insertedByUserId: string;
  insertedByUserName: string;
  insertedByUserRole: string;
  insertedByNeighborhoodName?: string;
  insertedByCityName?: string;

  // Optional: For Area Manager use case
  assignedCityId?: string;
  assignedCityName?: string;
}

/**
 * Voter input for updating existing voter
 */
export interface UpdateVoterInput {
  fullName?: string;
  phone?: string;
  idNumber?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;

  voterAddress?: string;
  voterCity?: string;
  voterNeighborhood?: string;

  supportLevel?: string;
  contactStatus?: string;
  priority?: string;
  notes?: string;
  lastContactedAt?: Date;

  assignedCityId?: string;
  assignedCityName?: string;
}

/**
 * User context for visibility and permissions
 */
export interface UserContext {
  userId: string;
  role: 'SUPERADMIN' | 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR';
  fullName: string;

  // Role-specific context
  areaManagerId?: string;
  cityId?: string;
  cityCoordinatorId?: string;
  activistCoordinatorId?: string;
  assignedNeighborhoodIds?: string[];
}

/**
 * Visibility result indicating if user can see a voter
 */
export interface VisibilityResult {
  canSee: boolean;
  reason?: string;
  ruleName?: string;
}

/**
 * Permission result indicating if user can perform action
 */
export interface PermissionResult {
  canPerform: boolean;
  reason?: string;
}

/**
 * Duplicate voter detection result
 */
export interface DuplicateVoter {
  voterId: string;
  phone: string;
  fullName: string;
  insertedByUserName: string;
  insertedByUserRole: string;
  insertedAt: Date;
  matchType: 'exact_phone' | 'similar_name_and_phone';
}

/**
 * Campaign status enums
 */
export const SUPPORT_LEVELS = ['תומך', 'מהסס', 'מתנגד', 'לא ענה'] as const;
export type SupportLevel = typeof SUPPORT_LEVELS[number];

export const CONTACT_STATUSES = ['נוצר קשר', 'נקבע פגישה', 'הצביע', 'לא זמין'] as const;
export type ContactStatus = typeof CONTACT_STATUSES[number];

export const PRIORITIES = ['גבוה', 'בינוני', 'נמוך'] as const;
export type Priority = typeof PRIORITIES[number];
