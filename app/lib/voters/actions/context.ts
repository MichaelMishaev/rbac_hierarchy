/**
 * User Context Helper for Server Actions
 *
 * Gets the current user's context for visibility and permissions checks
 */

import { auth } from '@/lib/auth';
import type { UserContext } from '../core/types';
import { getPrismaClient } from './repository-factory';

/**
 * Get the current user's context from NextAuth session
 */
export async function getUserContext(): Promise<UserContext> {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized: No active session');
  }

  const prisma = getPrismaClient();

  // Get full user with role-specific information
  const user = (await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      areaManager: {
        select: {
          id: true,
          regionName: true,
        },
      },
      coordinatorOf: {
        select: {
          id: true,
          cityId: true,
        },
      },
      activistCoordinatorOf: {
        select: {
          id: true,
          cityId: true,
        },
      },
    },
  })) as any;

  if (!user) {
    throw new Error('User not found');
  }

  // Build UserContext based on role
  const context: UserContext = {
    userId: user.id,
    email: user.email,
    role: user.role as UserContext['role'],
    fullName: user.fullName,
  };

  // Add role-specific context
  if (user.areaManager) {
    context.areaManagerId = user.areaManager.id;
  }

  if (user.coordinatorOf && user.coordinatorOf.length > 0) {
    // City Coordinator (take first if multiple)
    const coord = user.coordinatorOf[0];
    context.cityId = coord.cityId;
    context.cityCoordinatorId = coord.id;
  }

  if (user.activistCoordinatorOf && user.activistCoordinatorOf.length > 0) {
    // Activist Coordinator (take first if multiple)
    const coord = user.activistCoordinatorOf[0];
    context.cityId = coord.cityId;
    context.activistCoordinatorId = coord.id;
    // Would need to query assignedNeighborhoods separately if needed
    // context.assignedNeighborhoodIds = ...
  }

  return context;
}
