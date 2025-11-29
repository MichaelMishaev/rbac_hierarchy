/**
 * Integration Test Helpers for Server Actions
 *
 * These helpers allow testing server actions directly without
 * requiring full E2E browser tests.
 */

import { prisma } from '@/lib/prisma';
import { hash } from 'bcryptjs';

// Test user credentials
export const TEST_USERS = {
  superadmin: {
    email: 'superadmin@hierarchy.test',
    password: 'admin123',
    name: 'Super Admin',
    role: 'SUPERADMIN' as const,
  },
  manager: {
    email: 'manager@acme.com',
    password: 'manager123',
    name: 'John Manager',
    role: 'MANAGER' as const,
  },
  supervisor: {
    email: 'supervisor@acme.com',
    password: 'supervisor123',
    name: 'Jane Supervisor',
    role: 'SUPERVISOR' as const,
  },
};

/**
 * Clean up test data from database
 */
export async function cleanupTestData() {
  // Delete in correct order to respect foreign key constraints
  await prisma.auditLog.deleteMany({});
  await prisma.invitation.deleteMany({});
  await prisma.worker.deleteMany({});
  await prisma.site.deleteMany({});
  await prisma.user.deleteMany({
    where: {
      role: { not: 'SUPERADMIN' },
    },
  });
  await prisma.corporation.deleteMany({});
}

/**
 * Seed test data
 */
export async function seedTestData() {
  // Clean first
  await cleanupTestData();

  // Create test corporation
  const acmeCorp = await prisma.corporation.create({
    data: {
      name: 'ACME Corporation',
      code: 'ACME',
      description: 'Test Corporation',
      email: 'contact@acme.test',
      isActive: true,
    },
  });

  // Create test site
  const testSite = await prisma.site.create({
    data: {
      name: 'Main Office',
      city: 'Tel Aviv',
      address: '123 Test St',
      corporationId: acmeCorp.id,
      isActive: true,
    },
  });

  // Hash passwords
  const hashedSuperAdminPassword = await hash(TEST_USERS.superadmin.password, 12);
  const hashedManagerPassword = await hash(TEST_USERS.manager.password, 12);
  const hashedSupervisorPassword = await hash(TEST_USERS.supervisor.password, 12);

  // Create SuperAdmin
  const superAdmin = await prisma.user.create({
    data: {
      email: TEST_USERS.superadmin.email,
      name: TEST_USERS.superadmin.name,
      password: hashedSuperAdminPassword,
      role: 'SUPERADMIN',
    },
  });

  // Create Manager
  const manager = await prisma.user.create({
    data: {
      email: TEST_USERS.manager.email,
      name: TEST_USERS.manager.name,
      password: hashedManagerPassword,
      role: 'MANAGER',
      corporationId: acmeCorp.id,
    },
  });

  // Create Supervisor
  const supervisor = await prisma.user.create({
    data: {
      email: TEST_USERS.supervisor.email,
      name: TEST_USERS.supervisor.name,
      password: hashedSupervisorPassword,
      role: 'SUPERVISOR',
      corporationId: acmeCorp.id,
      siteId: testSite.id,
    },
  });

  return {
    corporation: acmeCorp,
    site: testSite,
    users: {
      superAdmin,
      manager,
      supervisor,
    },
  };
}

/**
 * Mock auth context for server action testing
 *
 * Note: This is a simplified mock. In real tests, you'd use
 * NextAuth test helpers or mock the auth() function.
 */
export function mockAuthContext(userId: string) {
  // This would need to be implemented based on your auth setup
  // For now, this is a placeholder showing the concept
  return {
    user: {
      id: userId,
    },
  };
}

/**
 * Create test corporation
 */
export async function createTestCorporation(data: {
  name?: string;
  code?: string;
  isActive?: boolean;
}) {
  return prisma.corporation.create({
    data: {
      name: data.name || 'Test Corp ' + Date.now(),
      code: data.code || 'TEST' + Date.now(),
      isActive: data.isActive ?? true,
    },
  });
}

/**
 * Create test site
 */
export async function createTestSite(corporationId: string, data?: {
  name?: string;
  city?: string;
}) {
  return prisma.site.create({
    data: {
      name: data?.name || 'Test Site ' + Date.now(),
      city: data?.city || 'Tel Aviv',
      corporationId,
      isActive: true,
    },
  });
}

/**
 * Create test worker
 */
export async function createTestWorker(siteId: string, supervisorId: string, data?: {
  name?: string;
  position?: string;
}) {
  return prisma.worker.create({
    data: {
      name: data?.name || 'Test Worker ' + Date.now(),
      position: data?.position || 'Worker',
      siteId,
      supervisorId,
      isActive: true,
    },
  });
}

/**
 * Create test invitation
 */
export async function createTestInvitation(
  createdById: string,
  data: {
    email: string;
    role: 'MANAGER' | 'SUPERVISOR';
    corporationId?: string;
    siteId?: string;
  }
) {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  return prisma.invitation.create({
    data: {
      email: data.email,
      role: data.role,
      token: 'test-token-' + Date.now(),
      expiresAt,
      corporationId: data.corporationId,
      siteId: data.siteId,
      createdById,
      status: 'PENDING',
    },
  });
}

/**
 * Assertion helpers
 */
export const assertions = {
  /**
   * Assert that a server action succeeded
   */
  assertSuccess(result: any) {
    if (!result.success) {
      throw new Error(`Expected success but got error: ${result.error}`);
    }
  },

  /**
   * Assert that a server action failed with expected error
   */
  assertError(result: any, expectedError?: string) {
    if (result.success) {
      throw new Error('Expected error but got success');
    }
    if (expectedError && !result.error?.includes(expectedError)) {
      throw new Error(`Expected error containing "${expectedError}" but got: ${result.error}`);
    }
  },

  /**
   * Assert RBAC violation
   */
  assertUnauthorized(result: any) {
    if (result.success) {
      throw new Error('Expected unauthorized error but got success');
    }
    const errorLower = result.error?.toLowerCase() || '';
    const isAuthError =
      errorLower.includes('unauthorized') ||
      errorLower.includes('forbidden') ||
      errorLower.includes('access denied') ||
      errorLower.includes('permission');

    if (!isAuthError) {
      throw new Error(`Expected auth error but got: ${result.error}`);
    }
  },
};

/**
 * Database query helpers
 */
export const db = {
  async getUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  },

  async getCorporationByCode(code: string) {
    return prisma.corporation.findUnique({ where: { code } });
  },

  async getSiteById(id: string) {
    return prisma.site.findUnique({ where: { id } });
  },

  async getWorkerById(id: string) {
    return prisma.worker.findUnique({ where: { id } });
  },

  async getInvitationByEmail(email: string) {
    return prisma.invitation.findFirst({ where: { email } });
  },

  async countAuditLogs(filters?: { action?: string; userId?: string }) {
    return prisma.auditLog.count({ where: filters });
  },
};
