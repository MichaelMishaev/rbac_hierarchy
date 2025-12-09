'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireRole, getUserCorporations, hasAccessToCorporation } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateUserInput = {
  email: string;
  fullName: string;
  phone?: string;
  password: string;
  role: Role;
  cityId?: string;
  regionName?: string; // Required for AREA_MANAGER role
};

export type UpdateUserInput = {
  fullName?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  cityId?: string;
  role?: Role;
  password?: string;
  regionName?: string; // For AREA_MANAGER role updates
};

export type ListUsersFilters = {
  role?: Role;
  cityId?: string;
  search?: string;
  isActive?: boolean;
  neighborhoodId?: string;
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
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      return {
        success: false,
        error: 'Supervisors cannot create users',
      };
    }

    // Only SUPERADMIN can create AREA_MANAGER users
    if (data.role === 'AREA_MANAGER' && currentUser.role !== 'SUPERADMIN') {
      return {
        success: false,
        error: 'Only SuperAdmin can create Area Manager users',
      };
    }

    // AREA_MANAGER requires region name
    if (data.role === 'AREA_MANAGER' && !data.regionName) {
      return {
        success: false,
        error: 'Region name is required for Area Manager',
      };
    }

    // Validate MANAGER and AREA_MANAGER constraints
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      // Must provide corporation ID for MANAGER/SUPERVISOR roles
      if ((data.role === 'CITY_COORDINATOR' || data.role === 'ACTIVIST_COORDINATOR') && !data.corporationId) {
        return {
          success: false,
          error: 'Corporation ID is required',
        };
      }

      // Can only create users in corporations they have access to
      if (data.corporationId && !hasAccessToCorporation(currentUser, data.corporationId)) {
        return {
          success: false,
          error: 'Cannot create user for different corporation',
        };
      }

      // Cannot create SUPERADMIN or AREA_MANAGER
      if (data.role === 'SUPERADMIN' || data.role === 'AREA_MANAGER') {
        return {
          success: false,
          error: 'Cannot create SuperAdmin or Area Manager users',
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
        fullName: data.fullName,
        phone: data.phone,
        passwordHash: hashedPassword,
        role: data.role,
      },
    });

    // Create role-specific record based on role type
    if (data.role === 'AREA_MANAGER' && data.regionName) {
      // v1.4: AreaManager requires regionCode (unique identifier)
      const regionCode = `REGION-${Date.now()}`; // Generate unique code

      // Create AreaManager record for AREA_MANAGER role
      await prisma.areaManager.create({
        data: {
          userId: newUser.id,
          regionName: data.regionName,
          regionCode, // v1.4: Required field
        },
      });
    } else if (data.corporationId) {
      if (data.role === 'CITY_COORDINATOR') {
        await prisma.cityCoordinator.create({
          data: {
            userId: newUser.id,
            cityId: data.cityId,
            title: 'Manager',
          },
        });
      } else if (data.role === 'ACTIVIST_COORDINATOR') {
        await prisma.supervisor.create({
          data: {
            userId: newUser.id,
            cityId: data.cityId,
            title: 'Supervisor',
          },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_USER',
        entity: 'User',
        entityId: newUser.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: undefined,
        after: {
          id: newUser.id,
          email: newUser.email,
          fullName: newUser.fullName,
          role: newUser.role,
          cityId: data.cityId,
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
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      // Non-superadmins can only see users in their corporations
      where.OR = [
        { managerOf: { some: { cityId: { in: userCorps } } } },
        { supervisorOf: { some: { cityId: { in: userCorps } } } },
        { areaManager: { corporations: { some: { id: { in: userCorps } } } } },
      ];
    }

    // Apply additional filters
    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.corporationId && currentUser.role === 'SUPERADMIN') {
      where.OR = [
        { managerOf: { some: { cityId: filters.corporationId } } },
        { supervisorOf: { some: { cityId: filters.corporationId } } },
        { areaManager: { corporations: { some: { id: filters.corporationId } } } },
      ];
    }

    if (filters.siteId) {
      // Filter users assigned to a specific site
      where.activistCoordinatorNeighborhoods = {
        some: {
          neighborhoodId: filters.neighborhoodId,
        },
      };
    }

    if (filters.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
        { phone: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Query users
    const users = await prisma.user.findMany({
      where,
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
      const { passwordHash, ...userWithoutPassword } = user;
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
    const userCorps = getUserCorporations(currentUser);
    const targetUserCorps = getUserCorporations(user);

    if (userCorps !== 'all' && targetUserCorps !== 'all') {
      // Check if there's any overlap in corporations
      const hasAccess = Array.isArray(targetUserCorps) && targetUserCorps.some(corpId =>
        Array.isArray(userCorps) && userCorps.includes(corpId)
      );

      if (!hasAccess) {
        return {
          success: false,
          error: 'Access denied',
        };
      }
    }

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = user;

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
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
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

    // Get user corporations for validation
    const existingUserCorps = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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
        areaManager: { include: { corporations: true } },
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

    if (!existingUserCorps) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate MANAGER/AREA_MANAGER constraints
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      // Check if current user has access to any of the target user's corporations
      const targetCorps = getUserCorporations(existingUserCorps);
      const hasAccess = targetCorps === 'all' ? false : Array.isArray(targetCorps) && targetCorps.some(corpId =>
        hasAccessToCorporation(currentUser, corpId)
      );

      if (!hasAccess) {
        return {
          success: false,
          error: 'Cannot update user from different corporation',
        };
      }

      // Cannot change role to SUPERADMIN or AREA_MANAGER
      if (data.role === 'SUPERADMIN' || data.role === 'AREA_MANAGER') {
        return {
          success: false,
          error: 'Cannot set role to SuperAdmin or Area Manager',
        };
      }

      // Cannot change another manager's role
      if (existingUser.role === 'CITY_COORDINATOR' && existingUser.id !== currentUser.id && data.role) {
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

    // Update user basic fields
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: data.fullName,
        phone: data.phone,
        email: data.email,
        avatarUrl: data.avatarUrl,
        role: data.role,
      },
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
            site: true,
          },
        },
        _count: {
          select: {
            invitationsSent: true,
          },
        },
      },
    });

    // Update corporation assignment if provided and role changed
    if (data.corporationId && data.role) {
      // Remove old role assignments
      if (existingUser.role === 'CITY_COORDINATOR') {
        await prisma.cityCoordinator.deleteMany({
          where: { userId },
        });
      } else if (existingUser.role === 'ACTIVIST_COORDINATOR') {
        await prisma.supervisor.deleteMany({
          where: { userId },
        });
      }

      // Create new role assignment
      if (data.role === 'CITY_COORDINATOR') {
        await prisma.cityCoordinator.create({
          data: {
            userId,
            cityId: data.cityId,
            title: 'Manager',
          },
        });
      } else if (data.role === 'ACTIVIST_COORDINATOR') {
        await prisma.supervisor.create({
          data: {
            userId,
            cityId: data.cityId,
            title: 'Supervisor',
          },
        });
      }
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE_USER',
        entity: 'User',
        entityId: updatedUser.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        before: {
          fullName: existingUser.fullName,
          email: existingUser.email,
          phone: existingUser.phone,
          role: existingUser.role,
        },
        after: {
          fullName: updatedUser.fullName,
          email: updatedUser.email,
          phone: updatedUser.phone,
          role: updatedUser.role,
        },
      },
    });

    revalidatePath('/users');
    revalidatePath(`/users/${userId}`);

    // Remove password from response
    const { passwordHash, ...userWithoutPassword } = updatedUser;

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
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
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
      include: {
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
        areaManager: { include: { corporations: true } },
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

    if (!userToDelete) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // Validate MANAGER/AREA_MANAGER constraints
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      // Check if current user has access to any of the target user's corporations
      const targetCorps = getUserCorporations(userToDelete);
      const hasAccess = targetCorps === 'all' ? false : Array.isArray(targetCorps) && targetCorps.some(corpId =>
        hasAccessToCorporation(currentUser, corpId)
      );

      if (!hasAccess) {
        return {
          success: false,
          error: 'Cannot delete user from different corporation',
        };
      }

      // Cannot delete other managers, superadmins, or area managers
      if (userToDelete.role === 'CITY_COORDINATOR' || userToDelete.role === 'SUPERADMIN' || userToDelete.role === 'AREA_MANAGER') {
        return {
          success: false,
          error: 'Cannot delete managers, area managers, or superadmins',
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
        before: {
          id: userToDelete.id,
          email: userToDelete.email,
          fullName: userToDelete.fullName,
          role: userToDelete.role,
        },
        after: undefined,
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
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      where.OR = [
        { managerOf: { some: { cityId: { in: userCorps } } } },
        { supervisorOf: { some: { cityId: { in: userCorps } } } },
        { areaManager: { corporations: { some: { id: { in: userCorps } } } } },
      ];
    }

    const [
      totalUsers,
      managerCount,
      supervisorCount,
      recentUsers,
    ] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.count({ where: { ...where, role: 'CITY_COORDINATOR' } }),
      prisma.user.count({ where: { ...where, role: 'ACTIVIST_COORDINATOR' } }),
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          fullName: true,
          email: true,
          role: true,
          createdAt: true,
          managerOf: {
            include: {
              corporation: {
                select: {
                  name: true,
                },
              },
            },
          },
          supervisorOf: {
            include: {
              corporation: {
                select: {
                  name: true,
                },
              },
            },
          },
          areaManager: {
            include: {
              corporations: {
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
