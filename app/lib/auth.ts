import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import { unstable_cache } from 'next/cache';

// Re-export auth for convenience
export { auth };

/**
 * Get current user with all relations (cached for 30 seconds)
 * PERFORMANCE: This function loads heavy nested data, so we cache it
 * to avoid duplicate expensive queries per page load
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Query user directly without caching to avoid stale data issues
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      areaManager: {
        include: {
          cities: true,
        },
      },
      coordinatorOf: {
        include: {
          city: true,
        },
      },
      activistCoordinatorOf: {
        include: {
          city: true,
        },
      },
      activistCoordinatorNeighborhoods: {
        include: {
          neighborhood: {
            include: {
              cityRelation: true,
            },
          },
        },
      },
      activistProfile: {
        include: {
          neighborhood: true,
          city: true,
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

export async function requireActivist() {
  return requireRole(['ACTIVIST']);
}

/**
 * Get all corporation IDs that a user has access to
 * Returns 'all' for SUPERADMIN, array of corporation IDs for others
 */
export function getUserCorporations(user: Awaited<ReturnType<typeof getCurrentUser>>): string[] | 'all' {
  if (user.role === 'SUPERADMIN') {
    return 'all';
  }

  if (user.role === 'AREA_MANAGER') {
    if (!user.areaManager) {
      console.error('[getUserCorporations] CRITICAL: User has AREA_MANAGER role but no areaManager relation!');
      console.error('[getUserCorporations] User ID:', user.id, 'Email:', user.email);
      return []; // Deny access - something is wrong
    }
    console.log('[getUserCorporations] Area Manager detected');
    console.log('[getUserCorporations] user.areaManager.id:', user.areaManager.id);
    console.log('[getUserCorporations] user.areaManager.cities length:', user.areaManager.cities?.length);
    console.log('[getUserCorporations] user.areaManager.cities:', user.areaManager.cities);
    const cityIds = user.areaManager.cities.map(c => c.id);
    console.log('[getUserCorporations] Returning city IDs:', cityIds);
    return cityIds;
  }

  if (user.role === 'CITY_COORDINATOR') {
    return user.coordinatorOf.map(m => m.cityId);
  }

  if (user.role === 'ACTIVIST_COORDINATOR') {
    // Get unique city IDs from activistCoordinatorOf and activistCoordinatorNeighborhoods
    const citiesFromRole = user.activistCoordinatorOf.map(s => s.cityId);
    const citiesFromNeighborhoods = user.activistCoordinatorNeighborhoods.map(ss => ss.neighborhood.cityRelation.id);
    return [...new Set([...citiesFromRole, ...citiesFromNeighborhoods])];
  }

  if (user.role === 'ACTIVIST') {
    // Activists only have access to their own city
    if (!user.activistProfile) {
      console.error('[getUserCorporations] CRITICAL: User has ACTIVIST role but no activistProfile relation!');
      console.error('[getUserCorporations] User ID:', user.id, 'Email:', user.email);
      return []; // Deny access - something is wrong
    }
    return [user.activistProfile.cityId];
  }

  return [];
}

/**
 * Check if user has access to a specific corporation
 */
export function hasAccessToCorporation(user: Awaited<ReturnType<typeof getCurrentUser>>, cityId: string): boolean {
  const userCorps = getUserCorporations(user);
  return userCorps === 'all' || userCorps.includes(cityId);
}
