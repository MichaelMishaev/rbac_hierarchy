import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function getCurrentUser() {
  const session = await auth();

  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      corporation: true,
      supervisorSites: {
        include: {
          site: true,
        },
      },
    },
  });

  if (!dbUser) {
    throw new Error('User not found');
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

export async function requireManager() {
  return requireRole(['SUPERADMIN', 'MANAGER']);
}

export async function requireSupervisor() {
  return requireRole(['SUPERADMIN', 'MANAGER', 'SUPERVISOR']);
}
