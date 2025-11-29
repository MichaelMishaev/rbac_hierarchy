'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireRole } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateUserInput = {
  email: string;
  name: string;
  phone?: string;
  password: string;
  role: Role;
  corporationId?: string;
};

export type UpdateUserInput = {
  name?: string;
  phone?: string;
  email?: string;
  avatar?: string;
  corporationId?: string;
  role?: Role;
  password?: string;
};

export type ListUsersFilters = {
  role?: Role;
  corporationId?: string;
  search?: string;
  isActive?: boolean;
  siteId?: string;
};

// ============================================
// CREATE USER
// ============================================

/**
 * Create a new user with role-based validation
 *
 * Permissions:
 * - SUPERADMIN: Can create any user in any corporation
 * - MANAGER: Can create MANAGER or SUPERVISOR in their corporation only
 * - SUPERVISOR: Cannot create users
 */
export async function createUser(data: CreateUserInput) {
  try {
    const currentUser = await getCurrentUser();

    // SUPERVISOR cannot create users
    if (currentUser.role === 'SUPERVISOR') {
      return {
        success: false,
        error: 'Supervisors cannot create users',
      };
    }

    // Validate MANAGER constraints
    if (currentUser.role === 'MANAGER') {
      // Must provide corporation ID
      if (!data.corporationId) {
        return {
          success: false,
          error: 'Corporation ID is required',
        };
      }

      // Can only create users in their own corporation
      if (data.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Cannot create user for different corporation',
        };
      }

      // Cannot create SUPERADMIN
      if (data.role === 'SUPERADMIN') {
        return {
          success: false,
          error: 'Cannot create SuperAdmin users',
        };
      }
    }

    // Validate email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'Email already exists',
      };
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Create user
    const newUser = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        password: hashedPassword,
        role: data.role,
        corporationId: data.corporationId,
      },
      include: {
        corporation: true,
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_USER',
        entity: 'User',
        entityId: newUser.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: undefined,
        newValue: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          corporationId: newUser.corporationId,
        },
      },
    });

    revalidatePath('/users');
    revalidatePath('/dashboard');

    return {
      success: true,
      user: newUser,
    };
  } catch (error) {
    console.error('Error creating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}

// ============================================
// LIST USERS
// ============================================

/**
 * List users with proper filtering based on role
 *
 * Permissions:
 * - SUPERADMIN: Can see all users across all corporations
 * - MANAGER: Can see users in their corporation only
 * - SUPERVISOR: Can see users in their assigned sites only
 */
export async function listUsers(filters: ListUsersFilters = {}) {
  try {
    const currentUser = await getCurrentUser();

    // Build where clause based on role and filters
    const where: any = {};

    // Role-based filtering
    if (currentUser.role === 'MANAGER') {
      // Managers can only see users in their corporation
      where.corporationId = currentUser.corporationId;
    } else if (currentUser.role === 'SUPERVISOR') {
      // Supervisors can see users in their assigned sites
      // This requires fetching their assigned sites first
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { supervisorId: currentUser.id },
        select: { siteId: true },
      });

      const siteIds = supervisorSites.map(ss => ss.siteId);

      // Filter to users who are supervisors in those sites
      where.supervisorSites = {
        some: {
          siteId: { in: siteIds },
        },
      };
    }

    // Apply additional filters
    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.corporationId && currentUser.role === 'SUPERADMIN') {
      where.corporationId = filters.corporationId;
    }

    if (filters.siteId) {
      // Filter users assigned to a specific site
      where.supervisorSites = {
        some: {
          siteId: filters.siteId,
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Query users
    const users = await prisma.user.findMany({
      where,
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        supervisorSites: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        _count: {
          select: {
            workers: true,
            invitationsSent: true,
          },
        },
      },
      orderBy: [
        { role: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Remove password from response
    const sanitizedUsers = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      success: true,
      users: sanitizedUsers,
      count: sanitizedUsers.length,
    };
  } catch (error) {
    console.error('Error listing users:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list users',
      users: [],
      count: 0,
    };
  }
}

// ============================================
// GET USER BY ID
// ============================================

/**
 * Get a specific user by ID with access validation
 *
 * Permissions:
 * - SUPERADMIN: Can view any user
 * - MANAGER: Can view users in their corporation
 * - SUPERVISOR: Can view users in their assigned sites
 */
export async function getUserById(userId: string) {
  try {
    const currentUser = await getCurrentUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        corporation: true,
        supervisorSites: {
          include: {
            site: {
              select: {
                id: true,
                name: true,
                city: true,
              },
            },
          },
        },
        _count: {
          select: {
            workers: true,
            invitationsSent: true,
          },
        },
      },
    });

    if (!user) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate access permissions
    if (currentUser.role === 'MANAGER') {
      if (user.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    } else if (currentUser.role === 'SUPERVISOR') {
      // Check if the target user is assigned to any of the current supervisor's sites
      const currentUserSites = await prisma.supervisorSite.findMany({
        where: { supervisorId: currentUser.id },
        select: { siteId: true },
      });

      const currentUserSiteIds = currentUserSites.map(ss => ss.siteId);
      const targetUserSiteIds = user.supervisorSites.map(ss => ss.siteId);

      const hasCommonSite = targetUserSiteIds.some(siteId =>
        currentUserSiteIds.includes(siteId)
      );

      if (!hasCommonSite) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
    };
  } catch (error) {
    console.error('Error getting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user',
    };
  }
}

// ============================================
// UPDATE USER
// ============================================

/**
 * Update user information with role validation
 *
 * Permissions:
 * - SUPERADMIN: Can update any user
 * - MANAGER: Can update users in their corporation (except other managers' roles)
 * - SUPERVISOR: Cannot update users
 */
export async function updateUser(userId: string, data: UpdateUserInput) {
  try {
    const currentUser = await getCurrentUser();

    // SUPERVISOR cannot update users
    if (currentUser.role === 'SUPERVISOR') {
      return {
        success: false,
        error: 'Supervisors cannot update users',
      };
    }

    // Get existing user
    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate MANAGER constraints
    if (currentUser.role === 'MANAGER') {
      // Can only update users in their own corporation
      if (existingUser.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Cannot update user from different corporation',
        };
      }

      // Cannot change role to SUPERADMIN
      if (data.role === 'SUPERADMIN') {
        return {
          success: false,
          error: 'Cannot set role to SuperAdmin',
        };
      }

      // Cannot change another manager's role
      if (existingUser.role === 'MANAGER' && existingUser.id !== currentUser.id && data.role) {
        return {
          success: false,
          error: 'Cannot change other managers\' roles',
        };
      }
    }

    // Check email uniqueness if email is being updated
    if (data.email && data.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (emailExists) {
        return {
          success: false,
          error: 'Email already exists',
        };
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        phone: data.phone,
        email: data.email,
        avatar: data.avatar,
        corporationId: data.corporationId,
        role: data.role,
      },
      include: {
        corporation: true,
        supervisorSites: {
          include: {
            site: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: updatedUser.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          name: existingUser.name,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
          corporationId: existingUser.corporationId,
        },
        newValue: {
          name: updatedUser.name,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
          corporationId: updatedUser.corporationId,
        },
      },
    });

    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);

    // Remove password from response
    const { password, ...userWithoutPassword } = updatedUser;

    return {
      success: true,
      user: userWithoutPassword,
    };
  } catch (error) {
    console.error('Error updating user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user',
    };
  }
}

// ============================================
// DELETE USER
// ============================================

/**
 * Delete a user (hard delete)
 *
 * Permissions:
 * - SUPERADMIN: Can delete any user (except themselves)
 * - MANAGER: Can delete users in their corporation (except themselves and other managers)
 * - SUPERVISOR: Cannot delete users
 */
export async function deleteUser(userId: string) {
  try {
    const currentUser = await getCurrentUser();

    // SUPERVISOR cannot delete users
    if (currentUser.role === 'SUPERVISOR') {
      return {
        success: false,
        error: 'Supervisors cannot delete users',
      };
    }

    // Cannot delete yourself
    if (userId === currentUser.id) {
      return {
        success: false,
        error: 'Cannot delete your own account',
      };
    }

    // Get user to delete
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToDelete) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate MANAGER constraints
    if (currentUser.role === 'MANAGER') {
      // Can only delete users in their own corporation
      if (userToDelete.corporationId !== currentUser.corporationId) {
        return {
          success: false,
          error: 'Cannot delete user from different corporation',
        };
      }

      // Cannot delete other managers or superadmins
      if (userToDelete.role === 'MANAGER' || userToDelete.role === 'SUPERADMIN') {
        return {
          success: false,
          error: 'Cannot delete managers or superadmins',
        };
      }
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE_USER',
        entity: 'User',
        entityId: userId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          id: userToDelete.id,
          email: userToDelete.email,
          name: userToDelete.name,
          role: userToDelete.role,
          corporationId: userToDelete.corporationId,
        },
        newValue: undefined,
      },
    });

    revalidatePath('/users');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  } catch (error) {
    console.error('Error deleting user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

// ============================================
// GET USER STATS
// ============================================

/**
 * Get user statistics for dashboard
 *
 * Permissions:
 * - SUPERADMIN: Global stats
 * - MANAGER: Corporation stats
 * - SUPERVISOR: Stats for assigned sites
 */
export async function getUserStats() {
  try {
    const currentUser = await getCurrentUser();

    const where: any = {};

    // Apply role-based filtering
    if (currentUser.role === 'MANAGER') {
      where.corporationId = currentUser.corporationId;
    } else if (currentUser.role === 'SUPERVISOR') {
      // Get supervisor's assigned sites
      const supervisorSites = await prisma.supervisorSite.findMany({
        where: { supervisorId: currentUser.id },
        select: { siteId: true },
      });

      const siteIds = supervisorSites.map(ss => ss.siteId);

      // Filter to users assigned to those sites
      where.supervisorSites = {
        some: {
          siteId: { in: siteIds },
        },
      };
    }

    const [
      totalUsers,
      managerCount,
      supervisorCount,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, role: 'MANAGER' } }),
      prisma.user.count({ where: { ...where, role: 'SUPERVISOR' } }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          corporation: {
            select: {
              name: true,
            },
          },
          supervisorSites: {
            include: {
              site: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalUsers,
        managerCount,
        supervisorCount,
        recentUsers,
      },
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user stats',
    };
  }
}
