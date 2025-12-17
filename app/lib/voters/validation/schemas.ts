/**
 * Zod Validation Schemas for Voter Management
 *
 * SOLID Principles:
 * - Single Responsibility: Only defines validation schemas
 * - DRY: Shared schemas reused across client and server
 *
 * These schemas ensure type-safe validation on both client (React Hook Form)
 * and server (Server Actions)
 */

import { z } from 'zod';
import { SUPPORT_LEVELS, CONTACT_STATUSES, PRIORITIES } from '../core/types';

// ============================================
// BASE SCHEMAS
// ============================================

/**
 * Israeli phone number validation
 * Format: 05xxxxxxxx (10 digits)
 */
export const phoneSchema = z
  .string()
  .min(1, 'מספר טלפון נדרש')
  .regex(/^05\d{8}$/, 'מספר טלפון חייב להיות בפורמט 05xxxxxxxx (10 ספרות)');

/**
 * Israeli ID number validation
 * Format: 9 digits
 */
export const idNumberSchema = z
  .string()
  .regex(/^\d{9}$/, 'תעודת זהות חייבת להיות 9 ספרות')
  .optional()
  .or(z.literal(''));

/**
 * Email validation (optional)
 */
export const emailSchema = z
  .string()
  .email('כתובת אימייל לא תקינה')
  .optional()
  .or(z.literal(''));

/**
 * Full name validation
 */
export const fullNameSchema = z
  .string()
  .min(2, 'שם מלא חייב להכיל לפחות 2 תווים')
  .max(100, 'שם מלא ארוך מדי');

/**
 * Support level validation
 */
export const supportLevelSchema = z
  .enum(['תומך', 'מהסס', 'מתנגד', 'לא ענה'])
  .optional()
  .or(z.literal(''));

/**
 * Contact status validation
 */
export const contactStatusSchema = z
  .enum(['נוצר קשר', 'נקבע פגישה', 'הצביע', 'לא זמין'])
  .optional()
  .or(z.literal(''));

/**
 * Priority validation
 */
export const prioritySchema = z
  .enum(['גבוה', 'בינוני', 'נמוך'])
  .optional()
  .or(z.literal(''));

/**
 * Gender validation
 */
export const genderSchema = z
  .enum(['זכר', 'נקבה', 'אחר'])
  .optional()
  .or(z.literal(''));

// ============================================
// CREATE VOTER SCHEMA
// ============================================

/**
 * Schema for creating a new voter
 * Used in client-side forms (React Hook Form)
 */
export const createVoterSchema = z.object({
  // Personal Info (required)
  fullName: fullNameSchema,
  phone: phoneSchema,

  // Personal Info (optional)
  idNumber: idNumberSchema,
  email: emailSchema,
  dateOfBirth: z.date().optional().nullable(),
  gender: genderSchema,

  // Geographic Info (text only)
  voterAddress: z.string().max(200).optional().or(z.literal('')),
  voterCity: z.string().max(100).optional().or(z.literal('')),
  voterNeighborhood: z.string().max(100).optional().or(z.literal('')),

  // Campaign Status
  supportLevel: supportLevelSchema,
  contactStatus: contactStatusSchema,
  priority: prioritySchema,
  notes: z.string().max(1000).optional().or(z.literal('')),
  lastContactedAt: z.date().optional().nullable(),
});

/**
 * Type inference from schema
 */
export type CreateVoterFormData = z.infer<typeof createVoterSchema>;

// ============================================
// UPDATE VOTER SCHEMA
// ============================================

/**
 * Schema for updating an existing voter
 * All fields are optional (partial update)
 */
export const updateVoterSchema = z.object({
  fullName: fullNameSchema.optional(),
  phone: phoneSchema.optional(),
  idNumber: idNumberSchema,
  email: emailSchema,
  dateOfBirth: z.date().optional().nullable(),
  gender: genderSchema,

  voterAddress: z.string().max(200).optional().or(z.literal('')),
  voterCity: z.string().max(100).optional().or(z.literal('')),
  voterNeighborhood: z.string().max(100).optional().or(z.literal('')),

  supportLevel: supportLevelSchema,
  contactStatus: contactStatusSchema,
  priority: prioritySchema,
  notes: z.string().max(1000).optional().or(z.literal('')),
  lastContactedAt: z.date().optional().nullable(),
});

/**
 * Type inference from schema
 */
export type UpdateVoterFormData = z.infer<typeof updateVoterSchema>;

// ============================================
// SEARCH/FILTER SCHEMAS
// ============================================

/**
 * Schema for searching voters
 */
export const searchVotersSchema = z.object({
  query: z.string().optional(),
  phone: phoneSchema.optional(),
  supportLevel: supportLevelSchema,
  contactStatus: contactStatusSchema,
  isActive: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

/**
 * Type inference from schema
 */
export type SearchVotersFormData = z.infer<typeof searchVotersSchema>;

// ============================================
// BULK OPERATIONS SCHEMAS
// ============================================

/**
 * Schema for bulk delete
 */
export const bulkDeleteSchema = z.object({
  voterIds: z.array(z.string().uuid()).min(1, 'נא לבחור לפחות בוחר אחד'),
});

/**
 * Schema for bulk export
 */
export const bulkExportSchema = z.object({
  voterIds: z.array(z.string().uuid()).min(1, 'נא לבחור לפחות בוחר אחד'),
  format: z.enum(['csv', 'excel']),
});

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate and parse create voter form data
 */
export function validateCreateVoter(data: unknown): CreateVoterFormData {
  return createVoterSchema.parse(data);
}

/**
 * Validate and parse update voter form data
 */
export function validateUpdateVoter(data: unknown): UpdateVoterFormData {
  return updateVoterSchema.parse(data);
}

/**
 * Validate and parse search voters form data
 */
export function validateSearchVoters(data: unknown): SearchVotersFormData {
  return searchVotersSchema.parse(data);
}

/**
 * Safe validation that returns result with error handling
 */
export function safeValidateCreateVoter(data: unknown): {
  success: boolean;
  data?: CreateVoterFormData;
  error?: z.ZodError;
} {
  const result = createVoterSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Safe validation for update
 */
export function safeValidateUpdateVoter(data: unknown): {
  success: boolean;
  data?: UpdateVoterFormData;
  error?: z.ZodError;
} {
  const result = updateVoterSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

// ============================================
// ERROR FORMATTING
// ============================================

/**
 * Format Zod errors for Hebrew RTL display
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return errors;
}

/**
 * Get first error message from Zod error
 */
export function getFirstErrorMessage(error: z.ZodError): string {
  return error.errors[0]?.message || 'שגיאת אימות';
}
