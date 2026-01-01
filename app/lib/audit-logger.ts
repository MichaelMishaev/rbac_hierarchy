/**
 * Centralized Audit Logging Utilities
 *
 * Provides reusable functions for logging authentication events to audit_logs table.
 * Used for: Login, Logout, Password Changes
 *
 * Features:
 * - Captures IP address and User Agent for security monitoring
 * - Supports both successful and failed login attempts
 * - Tracks password changes (by manager vs self-service)
 */

import { prisma } from './prisma';

/**
 * Log login attempt (successful or failed) to audit_logs
 */
export async function logLoginAudit({
  userId,
  userEmail,
  userRole,
  cityId,
  ipAddress,
  userAgent,
  success,
}: {
  userId: string;
  userEmail: string;
  userRole: string;
  cityId?: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: success ? 'LOGIN' : 'LOGIN_FAILED',
        entity: 'User',
        entityId: userId,
        userId,
        userEmail,
        userRole,
        cityId,
        ipAddress,
        userAgent,
      },
    });
  } catch (error) {
    // Don't throw - we don't want audit logging to break the login flow
    console.error('[Audit Logger] Failed to log login audit:', error);
  }
}

/**
 * Log logout event to audit_logs
 */
export async function logLogoutAudit({
  userId,
  userEmail,
  userRole,
  cityId,
}: {
  userId: string;
  userEmail: string;
  userRole: string;
  cityId?: string;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action: 'LOGOUT',
        entity: 'User',
        entityId: userId,
        userId,
        userEmail,
        userRole,
        cityId,
      },
    });
  } catch (error) {
    console.error('[Audit Logger] Failed to log logout audit:', error);
  }
}

/**
 * Log password change/reset event to audit_logs
 */
export async function logPasswordChangeAudit({
  targetUserId,
  targetUserEmail,
  changedBy,
  changedByEmail,
  changedByRole,
  action,
}: {
  targetUserId: string;
  targetUserEmail: string;
  changedBy: string;
  changedByEmail: string;
  changedByRole: string;
  action: 'PASSWORD_RESET_BY_MANAGER' | 'PASSWORD_CHANGE';
}) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        entity: 'User',
        entityId: targetUserId,
        userId: changedBy,
        userEmail: changedByEmail,
        userRole: changedByRole,
        after: { targetUserEmail }, // Track whose password was changed
      },
    });
  } catch (error) {
    console.error('[Audit Logger] Failed to log password change audit:', error);
  }
}
