import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

// Re-export auth for convenience
export { auth };

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      areaManager: {
        include: {
          corporations: true,
        },
      },
      managerOf: {
        include: {
          corporation: true,
        },
      },
      supervisorOf: {
        include: {
          corporation: true,
        },
      },
      activistCoordinatorNeighborhoods: {
        include: {
          site: {
            include: {
              corporation: true,
            },
          },
        },
      },
    },
  });

  if (!dbUser) {
    // User exists in session but not in database (stale JWT token)
    // This can happen after database resets/seeds
    console.error(`[Auth Error] Session contains invalid user ID: ${session.user.id}`);
    console.error('[Auth Error] User needs to sign out and sign back in');
    throw new Error('SESSION_INVALID: User session is stale. Please sign out and sign back in.');
  }

  return dbUser;
}

export async function requireRole(allowedRoles: string[]) {
  const user = await getCurrentUser();

  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden: Insufficient permissions');
  }

  return user;
}

export async function requireSuperAdmin() {
  return requireRole(['SUPERADMIN']);
}

export async function requireAreaManager() {
  return requireRole(['SUPERADMIN', 'AREA_MANAGER']);
}

export async function requireManager() {
  return requireRole(['SUPERADMIN', 'AREA_MANAGER', 'CITY_COORDINATOR']);
}

export async function requireSupervisor() {
  return requireRole(['SUPERADMIN', 'AREA_MANAGER', 'CITY_COORDINATOR', 'ACTIVIST_COORDINATOR']);
}

/**
 * Get all corporation IDs that a user has access to
 * Returns 'all' for SUPERADMIN, array of corporation IDs for others
 */
export function getUserCorporations(user: Awaited<ReturnType<typeof getCurrentUser>>): string[] | 'all' {
  if (user.role === 'SUPERADMIN') {
    return 'all';
  }

  if (user.role === 'AREA_MANAGER' && user.areaManager) {
    return user.areaManager.corporations.map(c => c.id);
  }

  if (user.role === 'CITY_COORDINATOR') {
    return user.managerOf.map(m => m.corporationId);
  }

  if (user.role === 'ACTIVIST_COORDINATOR') {
    // Get unique corporation IDs from supervisorOf and activistCoordinatorNeighborhoods
    const corpsFromRole = user.supervisorOf.map(s => s.corporationId);
    const corpsFromSites = user.activistCoordinatorNeighborhoods.map(ss => ss.site.corporation.id);
    return [...new Set([...corpsFromRole, ...corpsFromSites])];
  }

  return [];
}

/**
 * Check if user has access to a specific corporation
 */
export function hasAccessToCorporation(user: Awaited<ReturnType<typeof getCurrentUser>>, cityId: string): boolean {
  const userCorps = getUserCorporations(user);
  return userCorps === 'all' || userCorps.includes(corporationId);
}
