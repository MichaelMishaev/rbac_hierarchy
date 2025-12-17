/**
 * Repository Factory - Dependency Inversion Principle
 *
 * SOLID Principles:
 * - Dependency Inversion: Server actions depend on IVoterRepository, not concrete implementation
 * - Open/Closed: Can swap implementations without modifying server actions
 * - Single Responsibility: Only creates repository instances
 *
 * Factory Pattern allows easy swapping for testing:
 * - Production: PrismaVoterRepository
 * - Tests: InMemoryVoterRepository
 */

import { PrismaClient } from '@prisma/client';
import type { IVoterRepository } from '../repository/interfaces';
import { PrismaVoterRepository } from '../repository/prisma-repository';
import { InMemoryVoterRepository } from '../repository/in-memory-repository';

/**
 * Global Prisma instance (Next.js best practice)
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Repository instance cache (singleton per request)
 */
let repositoryInstance: IVoterRepository | null = null;

/**
 * Get the voter repository (DIP: returns abstraction, not concrete class)
 *
 * In production: Returns PrismaVoterRepository
 * In tests: Can be overridden to return InMemoryVoterRepository
 */
export function getVoterRepository(): IVoterRepository {
  if (!repositoryInstance) {
    // Check if we're in test mode
    if (process.env.NODE_ENV === 'test' || process.env.USE_IN_MEMORY_REPO === 'true') {
      repositoryInstance = new InMemoryVoterRepository();
    } else {
      repositoryInstance = new PrismaVoterRepository(prisma);
    }
  }

  return repositoryInstance;
}

/**
 * Override the repository for testing (LSP: swap implementations)
 */
export function setVoterRepository(repository: IVoterRepository): void {
  repositoryInstance = repository;
}

/**
 * Reset the repository (for test cleanup)
 */
export function resetVoterRepository(): void {
  repositoryInstance = null;
}

/**
 * Get Prisma client directly (for advanced use cases)
 */
export function getPrismaClient(): PrismaClient {
  return prisma;
}
