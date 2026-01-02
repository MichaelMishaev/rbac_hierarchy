/**
 * Prisma Audit Middleware - Track Entity Mutations
 *
 * SAFE FOR PRODUCTION:
 * - Non-blocking async writes
 * - Fails gracefully (doesn't break operations)
 * - Optional user context (logs what's available)
 * - Feature flag controlled
 *
 * Audited Models:
 * - City (create, update, delete)
 * - Neighborhood (create, update, delete)
 * - User (create, update - soft delete via isActive)
 * - Activist (create, update - soft delete via isActive)
 * - CityCoordinator (create, delete)
 * - ActivistCoordinator (create, delete)
 * - ActivistCoordinatorNeighborhood (create, delete)
 */

import { Prisma } from '@prisma/client';

// Feature flag (default: enabled)
const ENABLE_AUDIT_LOGGING = process.env.ENABLE_AUDIT_LOGGING !== 'false';

// Models to audit
const AUDITED_MODELS = [
  'City',
  'Neighborhood',
  'User',
  'Activist',
  'CityCoordinator',
  'ActivistCoordinator',
  'ActivistCoordinatorNeighborhood',
];

// Sensitive fields to redact from audit logs
const SENSITIVE_FIELDS = ['passwordHash', 'password'];

/**
 * Sanitize data - remove sensitive fields
 */
function sanitizeData(data: any): any {
  if (!data || typeof data !== 'object') return data;

  const sanitized = { ...data };

  for (const field of SENSITIVE_FIELDS) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  return sanitized;
}

/**
 * Write audit log entry (async, non-blocking)
 */
async function writeAuditLog(prismaClient: any, entry: {
  action: string;
  entity: string;
  entityId: string;
  before?: any;
  after?: any;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  cityId?: string;
}) {
  if (!ENABLE_AUDIT_LOGGING) return;

  try {
    // Write to audit log (separate transaction)
    await prismaClient.auditLog.create({
      data: {
        action: entry.action,
        entity: entry.entity,
        entityId: entry.entityId,
        before: entry.before ? sanitizeData(entry.before) : null,
        after: entry.after ? sanitizeData(entry.after) : null,
        userId: entry.userId || null,
        userEmail: entry.userEmail || null,
        userRole: entry.userRole || null,
        cityId: entry.cityId || null,
        ipAddress: null, // Not available in Prisma middleware
        userAgent: null, // Not available in Prisma middleware
      },
    });
  } catch (error) {
    // Fail gracefully - don't break the operation
    console.error('[AuditMiddleware] Failed to write audit log:', error);
  }
}

/**
 * Extract cityId from entity data
 */
function extractCityId(model: string, data: any): string | undefined {
  // Direct cityId field
  if (data?.cityId) return data.cityId;

  // For CityCoordinator/ActivistCoordinator
  if (model === 'CityCoordinator' || model === 'ActivistCoordinator') {
    return data?.cityId;
  }

  // For ActivistCoordinatorNeighborhood
  if (model === 'ActivistCoordinatorNeighborhood') {
    return data?.cityId;
  }

  return undefined;
}

/**
 * Register audit middleware
 */
export function registerAuditMiddleware(prismaClient: any) {
  if (!ENABLE_AUDIT_LOGGING) {
    console.log('[AuditMiddleware] Audit logging disabled');
    return;
  }

  // Middleware for CREATE operations
  prismaClient.$use(async (params: Prisma.MiddlewareParams, next: any) => {
    const result = await next(params);

    // Only audit specified models
    if (!params.model || !AUDITED_MODELS.includes(params.model)) {
      return result;
    }

    // Audit CREATE operations
    if (params.action === 'create') {
      const entityId = result.id || result.userId || 'unknown';
      const cityId = extractCityId(params.model, result);

      // Non-blocking audit write
      writeAuditLog(prismaClient, {
        action: 'CREATE',
        entity: params.model,
        entityId,
        after: result,
        cityId,
      }).catch(console.error);
    }

    return result;
  });

  // Middleware for UPDATE operations
  prismaClient.$use(async (params: Prisma.MiddlewareParams, next: any) => {
    if (!params.model || !AUDITED_MODELS.includes(params.model)) {
      return next(params);
    }

    if (params.action === 'update' || params.action === 'updateMany') {
      // Fetch current state BEFORE update
      let beforeState: any = null;

      try {
        if (params.action === 'update') {
          beforeState = await prismaClient[params.model.toLowerCase()].findUnique({
            where: params.args.where,
          });
        }
      } catch (err) {
        console.error('[AuditMiddleware] Failed to fetch before state:', err);
      }

      // Execute update
      const result = await next(params);

      // Log audit entry
      if (beforeState) {
        const entityId = beforeState.id || beforeState.userId || 'unknown';
        const cityId = extractCityId(params.model, result || beforeState);

        writeAuditLog(prismaClient, {
          action: 'UPDATE',
          entity: params.model,
          entityId,
          before: beforeState,
          after: result,
          cityId,
        }).catch(console.error);
      }

      return result;
    }

    return next(params);
  });

  // Middleware for DELETE operations
  prismaClient.$use(async (params: Prisma.MiddlewareParams, next: any) => {
    if (!params.model || !AUDITED_MODELS.includes(params.model)) {
      return next(params);
    }

    if (params.action === 'delete' || params.action === 'deleteMany') {
      // Fetch current state BEFORE delete
      let beforeState: any = null;

      try {
        if (params.action === 'delete') {
          beforeState = await prismaClient[params.model.toLowerCase()].findUnique({
            where: params.args.where,
          });
        }
      } catch (err) {
        console.error('[AuditMiddleware] Failed to fetch before state:', err);
      }

      // Execute delete
      const result = await next(params);

      // Log audit entry
      if (beforeState) {
        const entityId = beforeState.id || beforeState.userId || 'unknown';
        const cityId = extractCityId(params.model, beforeState);

        writeAuditLog(prismaClient, {
          action: 'DELETE',
          entity: params.model,
          entityId,
          before: beforeState,
          cityId,
        }).catch(console.error);
      }

      return result;
    }

    return next(params);
  });

  console.log('[AuditMiddleware] ✅ Audit middleware registered for:', AUDITED_MODELS.join(', '));
}

/**
 * Initialize audit middleware
 */
export function initializeAuditMiddleware(prismaClient: any) {
  try {
    registerAuditMiddleware(prismaClient);
    console.log('[AuditMiddleware] ✅ Audit logging initialized');
  } catch (error) {
    console.error('[AuditMiddleware] ❌ Failed to initialize audit middleware:', error);
    // Don't throw - fail gracefully
  }
}
