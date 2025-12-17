/**
 * Prisma Middleware - Runtime Invariant Guards
 *
 * CRITICAL: Last line of defense for data integrity
 * These guards enforce system invariants at runtime
 *
 * @owner backend-security
 * @created 2025-12-17
 */

import { Prisma } from '@prisma/client';
import { logger } from './logger';

/**
 * Register all Prisma middleware guards
 */
export function registerPrismaMiddleware(prisma: any) {
  // Guard 1: INV-001 - Multi-City Data Isolation
  prisma.$use(async (params: Prisma.MiddlewareParams, next: any) => {
    const result = await next(params);

    // Guard: Activists MUST have cityId (INV-001)
    if (params.model === 'Activist' && params.action === 'create') {
      if (!result.cityId) {
        logger.error('🚨 INVARIANT VIOLATION: Activist created without cityId', {
          invariant: 'INV-001',
          activistId: result.id,
          data: result
        });
        throw new Error('Data integrity violation: Activist missing cityId (INV-001)');
      }
    }

    return result;
  });

  // Guard 2: INV-005 - Soft Deletes Only
  prisma.$use(async (params: Prisma.MiddlewareParams, next: any) => {
    // Block hard deletes on activists
    if (params.model === 'Activist' && params.action === 'delete') {
      logger.error('🚨 INVARIANT VIOLATION: Hard delete attempted on Activist', {
        invariant: 'INV-005',
        params: params.args
      });
      throw new Error('Hard deletes not allowed on activists. Use isActive = false (INV-005)');
    }

    // Block hard deletes on users
    if (params.model === 'User' && params.action === 'delete') {
      logger.error('🚨 INVARIANT VIOLATION: Hard delete attempted on User', {
        invariant: 'INV-005',
        params: params.args
      });
      throw new Error('Hard deletes not allowed on users. Use isActive = false (INV-005)');
    }

    return next(params);
  });

  // Guard 3: INV-004 - Composite FK Integrity
  prisma.$use(async (params: Prisma.MiddlewareParams, next: any) => {
    // Validate cityId matches for ActivistCoordinatorNeighborhood
    if (params.model === 'ActivistCoordinatorNeighborhood' && params.action === 'create') {
      const data = params.args.data;

      // Fetch related entities to verify cityId match
      const coordinator = await prisma.activistCoordinator.findUnique({
        where: { id: data.activistCoordinatorId }
      });

      const neighborhood = await prisma.neighborhood.findUnique({
        where: { id: data.neighborhoodId }
      });

      if (coordinator && neighborhood && coordinator.cityId !== neighborhood.cityId) {
        logger.error('🚨 INVARIANT VIOLATION: cityId mismatch in assignment', {
          invariant: 'INV-004',
          coordinatorCityId: coordinator.cityId,
          neighborhoodCityId: neighborhood.cityId,
          data
        });
        throw new Error('Data integrity violation: cityId mismatch (INV-004)');
      }

      // Ensure cityId is set explicitly
      if (!data.cityId) {
        params.args.data.cityId = coordinator?.cityId;
      }
    }

    return next(params);
  });

  // Guard 4: INV-002 - SuperAdmin Cannot Be Created Via API
  prisma.$use(async (params: Prisma.MiddlewareParams, next: any) => {
    if (params.model === 'User' && (params.action === 'create' || params.action === 'update')) {
      const data = params.action === 'create' ? params.args.data : params.args.data;

      // Block isSuperAdmin flag via API
      if (data?.isSuperAdmin === true) {
        logger.error('🚨 INVARIANT VIOLATION: Attempted to create SuperAdmin via API', {
          invariant: 'INV-002',
          params: params.args
        });
        throw new Error('SuperAdmin can only be created via DB/bootstrap (INV-002)');
      }
    }

    return next(params);
  });

  logger.info('✅ Prisma middleware registered: 4 runtime guards active', {
    guards: ['INV-001', 'INV-004', 'INV-005', 'INV-002']
  });
}

/**
 * Initialize middleware on Prisma client
 */
export function initializePrismaGuards(prisma: any) {
  try {
    registerPrismaMiddleware(prisma);
    logger.info('✅ Runtime invariant guards initialized');
  } catch (error) {
    logger.error('❌ Failed to initialize Prisma guards', { error });
    throw error;
  }
}
