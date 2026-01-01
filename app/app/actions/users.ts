'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, getUserCorporations, hasAccessToCorporation } from '@/lib/auth';
import { hash } from 'bcryptjs';
import { revalidatePath } from 'next/cache';
import { Role } from '@prisma/client';
import { withServerActionErrorHandler } from '@/lib/server-action-error-handler';

// ============================================
// HIERARCHY HELPER FUNCTIONS
// ============================================

/**
 * Get hierarchy level for a role
 * Lower number = higher in hierarchy
 */
function getHierarchyLevel(role: Role): number {
  switch (role) {
    case 'SUPERADMIN':
      return 1;
    case 'AREA_MANAGER':
      return 2;
    case 'CITY_COORDINATOR':
      return 3;
    case 'ACTIVIST_COORDINATOR':
      return 4;
    default:
      return 999; // Unknown roles are lowest
  }
}

/**
 * Check if currentUser can manage targetUser based on hierarchy
 * Rule: You can only manage users BELOW you in the hierarchy
 */
function canManageUser(currentUserRole: Role, targetUserRole: Role): boolean {
  const currentLevel = getHierarchyLevel(currentUserRole);
  const targetLevel = getHierarchyLevel(targetUserRole);

  // Can only manage users at a LOWER level (higher number)
  return targetLevel > currentLevel;
}

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
 * STRICT BUSINESS RULES (from ADD_NEW_DESIGN.md):
 * 1. SuperAdmin:
 *    - Can create: Area Managers, City Coordinators, Activist Coordinators
 *    - CANNOT create SuperAdmin via UI (DB only)
 * 2. Area Manager:
 *    - Can create: City Coordinators (cities in their area), Activist Coordinators (cities in their area)
 *    - MUST assign to city in their area
 * 3. City Coordinator:
 *    - Can create: Activist Coordinators ONLY
 *    - MUST assign to their city
 * 4. Email MUST be unique
 * 5. Role MUST be valid
 * 6. If role requires city/area → MUST provide and validate scope
 *
 * Permissions:
 * - SUPERADMIN: Can create Area Managers, City Coordinators, Activist Coordinators
 * - AREA_MANAGER: Can create City Coordinators, Activist Coordinators (cities in their area)
 * - CITY_COORDINATOR: Can create Activist Coordinators (their city ONLY)
 * - ACTIVIST_COORDINATOR: Cannot create users
 */
export async function createUser(data: CreateUserInput) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // ACTIVIST_COORDINATOR cannot create users
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      return {
        success: false,
        error: 'Activist Coordinators cannot create users.',
      };
    }

    // CANNOT create SUPERADMIN via UI (database/seed only)
    if (data.role === 'SUPERADMIN') {
      return {
        success: false,
        error: 'לא ניתן ליצור משתמש Super Admin דרך הממשק. משתמשי Super Admin נוצרים רק דרך מסד הנתונים מטעמי אבטחה.',
      };
    }

    // Only SUPERADMIN can create AREA_MANAGER users
    if (data.role === 'AREA_MANAGER' && currentUser.role !== 'SUPERADMIN') {
      return {
        success: false,
        error: 'Only SuperAdmin can create Area Manager users.',
      };
    }

    // AREA_MANAGER users are created without area assignment
    // Areas are assigned later in /areas page

    // City-based roles require cityId
    if ((data.role === 'CITY_COORDINATOR' || data.role === 'ACTIVIST_COORDINATOR') && !data.cityId) {
      return {
        success: false,
        error: 'City is required for this role.',
      };
    }

    // CRITICAL SCOPE VALIDATION: Enforce strict hierarchy
    if (currentUser.role === 'AREA_MANAGER') {
      // Area Manager can create: City Coordinators, Activist Coordinators
      if (data.role !== 'CITY_COORDINATOR' && data.role !== 'ACTIVIST_COORDINATOR') {
        return {
          success: false,
          error: 'Area Managers can only create City Coordinators or Activist Coordinators.',
        };
      }

      // Validate city belongs to Area Manager's area
      if (data.cityId) {
        const currentUserAreaManager = await prisma.areaManager.findFirst({
          where: { userId: currentUser.id },
        });

        if (!currentUserAreaManager) {
          return {
            success: false,
            error: 'Area Manager record not found for current user.',
          };
        }

        const city = await prisma.city.findUnique({
          where: { id: data.cityId },
          select: { areaManagerId: true },
        });

        if (!city || city.areaManagerId !== currentUserAreaManager.id) {
          return {
            success: false,
            error: 'Area Managers can only create users in cities within their area.',
          };
        }
      }
    } else if (currentUser.role === 'CITY_COORDINATOR') {
      // City Coordinator can ONLY create Activist Coordinators
      if (data.role !== 'ACTIVIST_COORDINATOR') {
        return {
          success: false,
          error: 'City Coordinators can only create Activist Coordinators.',
        };
      }

      // Validate city matches City Coordinator's city
      if (data.cityId) {
        const currentUserCityCoordinator = await prisma.cityCoordinator.findFirst({
          where: { userId: currentUser.id },
        });

        if (!currentUserCityCoordinator) {
          return {
            success: false,
            error: 'City Coordinator record not found for current user.',
          };
        }

        // STRICT: Can ONLY create in their city
        if (data.cityId !== currentUserCityCoordinator.cityId) {
          return {
            success: false,
            error: 'City Coordinators can only create users in their own city.',
          };
        }
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
        requirePasswordChange: true, // Force password change on first login
      },
    });

    // Create role-specific record based on role type
    // AREA_MANAGER: User is created without area assignment
    // Area assignment happens later in /areas page (create or edit area)

    if (data.cityId) {
      if (data.role === 'CITY_COORDINATOR') {
        await prisma.cityCoordinator.create({
          data: {
            userId: newUser.id,
            cityId: data.cityId,
            title: 'Manager',
          },
        });
      } else if (data.role === 'ACTIVIST_COORDINATOR') {
        await prisma.activistCoordinator.create({
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
      // Return the password for display (only on creation)
      generatedPassword: data.password,
    };
  }, 'createUser');
}

// ============================================
// LIST USERS
// ============================================

/**
 * List users with proper filtering based on role and hierarchy
 *
 * HIERARCHY RULES (CRITICAL):
 * - SUPERADMIN: Can see Area Managers, City Coordinators, Activist Coordinators (NOT other SuperAdmins)
 * - AREA_MANAGER: Can see City Coordinators, Activist Coordinators (in their area ONLY)
 * - CITY_COORDINATOR: Can see Activist Coordinators (in their city ONLY)
 * - ACTIVIST_COORDINATOR: Cannot see any users (they manage activists, not users)
 *
 * Rule: "Each user sees only themselves and what's UNDER them in hierarchy"
 */
export async function listUsers(filters: ListUsersFilters = {}) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // ACTIVIST_COORDINATOR cannot see any users
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      return {
        success: true,
        users: [],
        count: 0,
      };
    }

    // Build where clause based on role and filters
    const where: any = {};

    // CRITICAL: Hierarchy filtering - show only users BELOW current user
    // Get roles that are below current user in hierarchy
    const allowedRoles: Role[] = [];

    if (currentUser.role === 'SUPERADMIN') {
      // SuperAdmin can see: Area Manager, City Coordinator, Activist Coordinator
      // NOT other SuperAdmins
      allowedRoles.push('AREA_MANAGER', 'CITY_COORDINATOR', 'ACTIVIST_COORDINATOR');
    } else if (currentUser.role === 'AREA_MANAGER') {
      // Area Manager can see: City Coordinator, Activist Coordinator
      allowedRoles.push('CITY_COORDINATOR', 'ACTIVIST_COORDINATOR');
    } else if (currentUser.role === 'CITY_COORDINATOR') {
      // City Coordinator can see: Activist Coordinator ONLY
      allowedRoles.push('ACTIVIST_COORDINATOR');
    }

    // Filter by allowed roles
    if (allowedRoles.length > 0) {
      where.role = { in: allowedRoles };
    } else {
      // No allowed roles - return empty
      return {
        success: true,
        users: [],
        count: 0,
      };
    }

    // Role-based city/area filtering
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      // Non-superadmins can only see users in their cities/area
      where.OR = [
        { coordinatorOf: { some: { cityId: { in: userCorps } } } },
        { activistCoordinatorOf: { some: { cityId: { in: userCorps } } } },
        { areaManager: { cities: { some: { id: { in: userCorps } } } } },
      ];
    }

    // Apply additional filters
    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.cityId && currentUser.role === 'SUPERADMIN') {
      where.OR = [
        { coordinatorOf: { some: { cityId: filters.cityId } } },
        { activistCoordinatorOf: { some: { cityId: filters.cityId } } },
        { areaManager: { cities: { some: { id: filters.cityId } } } },
      ];
    }

    if (filters.neighborhoodId) {
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
      const { passwordHash: _passwordHash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return {
      success: true,
      users: sanitizedUsers,
      count: sanitizedUsers.length,
    };
  }, 'listUsers');
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
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    // Extract user data without _count for getUserCorporations
    const { _count, ...userWithoutCount } = user;
    const targetUserCorps = getUserCorporations(userWithoutCount as Awaited<ReturnType<typeof getCurrentUser>>);

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
    const { passwordHash: _passwordHash, ...userWithoutPassword } = user;

    return {
      success: true,
      user: userWithoutPassword,
    };
  }, 'getUserById');
}

// ============================================
// UPDATE USER
// ============================================

/**
 * Update user information with role validation and hierarchy enforcement
 *
 * HIERARCHY RULES (CRITICAL):
 * - SUPERADMIN: Can update Area Managers, City Coordinators, Activist Coordinators (NOT other SuperAdmins)
 * - AREA_MANAGER: Can update City Coordinators, Activist Coordinators (in their area ONLY)
 * - CITY_COORDINATOR: Can update Activist Coordinators (in their city ONLY)
 * - ACTIVIST_COORDINATOR: Cannot update any users
 *
 * Rule: "You can only update users BELOW you in hierarchy"
 */
export async function updateUser(userId: string, data: UpdateUserInput) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // ACTIVIST_COORDINATOR cannot update users
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      return {
        success: false,
        error: 'Activist Coordinators cannot update users',
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

    // CRITICAL: Hierarchy validation - can only update users BELOW you
    if (!canManageUser(currentUser.role, existingUser.role)) {
      return {
        success: false,
        error: 'Cannot update user: User is at same level or above you in hierarchy',
      };
    }

    // Get user corporations for validation
    const existingUserCorps = await prisma.user.findUnique({
      where: { id: userId },
      include: {
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
        areaManager: { include: { cities: true } },
        activistCoordinatorNeighborhoods: {
          include: {
            neighborhood: { include: { cityRelation: true,
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
            neighborhood: true,
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
    if (data.cityId && data.role) {
      // Remove old role assignments using the existing records (to handle composite unique keys)
      if (existingUser.role === 'CITY_COORDINATOR' && existingUserCorps?.coordinatorOf) {
        // Delete all existing city coordinator records for this user
        for (const coord of existingUserCorps.coordinatorOf) {
          await prisma.cityCoordinator.delete({
            where: {
              cityId_userId: {
                cityId: coord.cityId,
                userId: userId,
              },
            },
          });
        }
      } else if (existingUser.role === 'ACTIVIST_COORDINATOR' && existingUserCorps?.activistCoordinatorOf) {
        // Delete all existing activist coordinator records for this user
        for (const coord of existingUserCorps.activistCoordinatorOf) {
          await prisma.activistCoordinator.delete({
            where: {
              cityId_userId: {
                cityId: coord.cityId,
                userId: userId,
              },
            },
          });
        }
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
        await prisma.activistCoordinator.create({
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
    const { passwordHash: _passwordHash, ...userWithoutPassword } = updatedUser;

    return {
      success: true,
      user: userWithoutPassword,
    };
  }, 'updateUser');
}

// ============================================
// DELETE USER
// ============================================

/**
 * Delete a user (hard delete) with hierarchy enforcement
 *
 * HIERARCHY RULES (CRITICAL):
 * - SUPERADMIN: Can delete Area Managers, City Coordinators, Activist Coordinators (NOT other SuperAdmins or themselves)
 * - AREA_MANAGER: Can delete City Coordinators, Activist Coordinators (in their area ONLY)
 * - CITY_COORDINATOR: Can delete Activist Coordinators (in their city ONLY)
 * - ACTIVIST_COORDINATOR: Cannot delete any users
 *
 * Rule: "You can only delete users BELOW you in hierarchy"
 */
export async function deleteUser(userId: string) {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    // ACTIVIST_COORDINATOR cannot delete users
    if (currentUser.role === 'ACTIVIST_COORDINATOR') {
      return {
        success: false,
        error: 'Activist Coordinators cannot delete users',
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
        areaManager: { include: { cities: true } },
        activistCoordinatorNeighborhoods: {
          include: {
            neighborhood: { include: { cityRelation: true,
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

    if (!userToDelete) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    // CRITICAL: Hierarchy validation - can only delete users BELOW you
    if (!canManageUser(currentUser.role, userToDelete.role)) {
      return {
        success: false,
        error: 'Cannot delete user: User is at same level or above you in hierarchy',
      };
    }

    // Validate city/area scope for non-SuperAdmin users
    if (currentUser.role === 'CITY_COORDINATOR' || currentUser.role === 'AREA_MANAGER') {
      // Check if current user has access to any of the target user's cities/area
      const targetCorps = getUserCorporations(userToDelete);
      const hasAccess = targetCorps === 'all' ? false : Array.isArray(targetCorps) && targetCorps.some(corpId =>
        hasAccessToCorporation(currentUser, corpId)
      );

      if (!hasAccess) {
        return {
          success: false,
          error: 'Cannot delete user from different city/area',
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
      },
    });

    revalidatePath('/users');
    revalidatePath('/dashboard');

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }, 'deleteUser');
}

// ============================================
// DANGEROUS: DELETE ALL USERS EXCEPT SUPERADMIN
// ============================================

/**
 * HARD DELETE all users except system admin(s).
 *
 * Safety rules:
 * - SuperAdmin only
 * - Keeps users where role === SUPERADMIN OR isSuperAdmin === true
 * - Reassigns AttendanceRecord.checkedInById / lastEditedById to the remaining admin
 *   because these FKs do not cascade and would otherwise block deletion.
 */
export async function deleteAllUsersExceptSystemAdmin() {
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    if (currentUser.role !== 'SUPERADMIN' && !currentUser.isSuperAdmin) {
      return {
        success: false,
        error: 'Forbidden: SuperAdmin only',
      };
    }

    const adminsToKeep = await prisma.user.findMany({
      where: {
        OR: [{ role: 'SUPERADMIN' }, { isSuperAdmin: true }],
      },
      select: { id: true },
    });

    if (adminsToKeep.length === 0) {
      return {
        success: false,
        error: 'No system admin user found to keep',
      };
    }

    const keepIds = adminsToKeep.map((u) => u.id);
    const keepAdminId = keepIds.includes(currentUser.id) ? currentUser.id : keepIds[0];

    const usersToDelete = await prisma.user.findMany({
      where: { id: { notIn: keepIds } },
      select: { id: true },
    });

    if (usersToDelete.length === 0) {
      return {
        success: true,
        deletedCount: 0,
        message: 'No users to delete',
      };
    }

    const deleteIds = usersToDelete.map((u) => u.id);

    const result = await prisma.$transaction(async (tx) => {
      // Reassign attendance FKs that do NOT cascade on delete
      await tx.attendanceRecord.updateMany({
        where: { checkedInById: { in: deleteIds } },
        data: { checkedInById: keepAdminId },
      });

      await tx.attendanceRecord.updateMany({
        where: { lastEditedById: { in: deleteIds } },
        data: { lastEditedById: keepAdminId },
      });

      // Now delete users (most related entities cascade)
      const deleted = await tx.user.deleteMany({
        where: { id: { in: deleteIds } },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          action: 'DELETE_ALL_USERS_EXCEPT_SYSTEM_ADMIN',
          entity: 'User',
          entityId: 'bulk',
          userId: currentUser.id,
          userEmail: currentUser.email,
          userRole: currentUser.role,
          before: { deletedUserIds: deleteIds },
          after: { keptUserIds: keepIds },
        },
      });

      return deleted;
    });

    revalidatePath('/users');
    revalidatePath('/dashboard');

    return {
      success: true,
      deletedCount: result.count,
      keptCount: keepIds.length,
    };
  }, 'deleteAllUsersExceptSystemAdmin');
}

// ============================================
// GET EXISTING REGIONS
// ============================================

/**
 * Get distinct region names from existing Area Managers
 * Used for autocomplete in user creation modal
 */
export async function getExistingRegions() {
  return withServerActionErrorHandler(async () => {
    const regions = await prisma.areaManager.findMany({
      select: {
        regionName: true,
      },
      distinct: ['regionName'],
      orderBy: {
        regionName: 'asc',
      },
    });

    return {
      success: true,
      regions: regions.map(r => r.regionName),
    };
  }, 'getExistingRegions');
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
  return withServerActionErrorHandler(async () => {
    const currentUser = await getCurrentUser();

    const where: any = {};

    // Apply role-based filtering
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      where.OR = [
        { coordinatorOf: { some: { cityId: { in: userCorps } } } },
        { activistCoordinatorOf: { some: { cityId: { in: userCorps } } } },
        { areaManager: { cities: { some: { id: { in: userCorps } } } } },
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
          coordinatorOf: {
            include: {
              city: {
                select: {
                  name: true,
                },
              },
            },
          },
          activistCoordinatorOf: {
            include: {
              city: {
                select: {
                  name: true,
                },
              },
            },
          },
          areaManager: {
            include: {
              cities: {
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
  }, 'getUserStats');
}
