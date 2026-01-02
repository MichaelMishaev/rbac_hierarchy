import { PrismaClient } from '@prisma/client';
import { initializePrismaGuards } from './prisma-middleware';
import { initializeAuditMiddleware } from './audit-middleware';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

// Initialize runtime guards and audit middleware
if (!globalForPrisma.prisma) {
  initializePrismaGuards(prisma);
  initializeAuditMiddleware(prisma);
}

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
