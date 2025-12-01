'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, requireManager, hasAccessToCorporation, getUserCorporations } from '@/lib/auth';
import { revalidatePath } from 'next/cache';
import { Role, InvitationStatus } from '@prisma/client';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';

// ============================================
// TYPE DEFINITIONS
// ============================================

export type CreateInvitationInput = {
  email: string;
  role: Role;
  message?: string;
  corporationId?: string;
  expiresInDays?: number; // Default: 7 days
};

export type ListInvitationsFilters = {
  status?: InvitationStatus;
  role?: Role;
  corporationId?: string;
  search?: string;
};

export type AcceptInvitationInput = {
  token: string;
  name: string;
  phone?: string;
  password: string;
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Generate a secure random invitation token
 */
function generateInvitationToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Send invitation email (for MVP, logs to console/MailHog)
 */
async function sendInvitationEmail(
  email: string,
  token: string,
  corporationName: string,
  message?: string
) {
  const invitationUrl = `${process.env.NEXTAUTH_URL}/invitation/accept?token=${token}`;

  // In production, use a real email service
  // For MVP, just log to console (MailHog will capture it if configured)
  console.log('='.repeat(80));
  console.log('📧 INVITATION EMAIL');
  console.log('='.repeat(80));
  console.log(`To: ${email}`);
  console.log(`Corporation: ${corporationName}`);
  console.log(`Invitation URL: ${invitationUrl}`);
  if (message) console.log(`Message: ${message}`);
  console.log('='.repeat(80));

  // TODO: Implement actual email sending with nodemailer/sendgrid
  return true;
}

// ============================================
// CREATE INVITATION
// ============================================

/**
 * Create a new invitation and send email
 *
 * Permissions:
 * - SUPERADMIN: Can invite anyone to any corporation/site
 * - MANAGER: Can invite managers and supervisors to their corporation
 * - SUPERVISOR: Cannot create invitations
 */
export async function createInvitation(data: CreateInvitationInput) {
  try {
    // Only SUPERADMIN and MANAGER can create invitations
    const currentUser = await requireManager();

    // Validate role-based constraints
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      // Managers can only invite within their corporations
      if (!data.corporationId || !hasAccessToCorporation(currentUser, data.corporationId)) {
        return {
          success: false,
          error: 'Must specify a corporation you have access to for invitations',
        };
      }

      // Managers cannot invite SUPERADMIN or AREA_MANAGER
      if (data.role === 'SUPERADMIN' || data.role === 'AREA_MANAGER') {
        return {
          success: false,
          error: 'Cannot invite SuperAdmin or Area Manager users',
        };
      }
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }

    // Check if there's already a pending invitation
    const pendingInvitation = await prisma.invitation.findFirst({
      where: {
        email: data.email,
        status: 'PENDING',
      },
    });

    if (pendingInvitation) {
      return {
        success: false,
        error: 'Pending invitation already exists for this email',
      };
    }

    // Verify corporation exists
    let corporation = null;
    if (data.corporationId) {
      corporation = await prisma.corporation.findUnique({
        where: { id: data.corporationId },
      });

      if (!corporation) {
        return {
          success: false,
          error: 'Corporation not found',
        };
      }
    }

    // Generate unique token
    const token = generateInvitationToken();

    // Calculate expiration date
    const expiresInDays = data.expiresInDays ?? 7;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    // Create invitation
    const newInvitation = await prisma.invitation.create({
      data: {
        email: data.email,
        role: data.role,
        token,
        message: data.message,
        expiresAt,
        corporationId: data.corporationId,
        createdById: currentUser.id,
        status: 'PENDING',
      },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Send invitation email
    await sendInvitationEmail(
      data.email,
      token,
      corporation?.name ?? 'Hierarchy Platform',
      data.message
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE_INVITATION',
        entity: 'Invitation',
        entityId: newInvitation.id,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: undefined,
        newValue: {
          id: newInvitation.id,
          email: newInvitation.email,
          role: newInvitation.role,
          corporationId: newInvitation.corporationId,
        },
      },
    });

    revalidatePath('/invitations');
    revalidatePath('/dashboard');

    return {
      success: true,
      invitation: newInvitation,
    };
  } catch (error) {
    console.error('Error creating invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create invitation',
    };
  }
}

// ============================================
// LIST INVITATIONS
// ============================================

/**
 * List invitations with proper filtering based on role
 *
 * Permissions:
 * - SUPERADMIN: Can see all invitations
 * - MANAGER: Can see invitations in their corporation
 * - SUPERVISOR: Cannot access invitations
 */
export async function listInvitations(filters: ListInvitationsFilters = {}) {
  try {
    const currentUser = await requireManager();

    // Build where clause based on role and filters
    const where: any = {};

    // Role-based filtering
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      where.corporationId = { in: userCorps };
    }

    // Apply additional filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.corporationId && currentUser.role === 'SUPERADMIN') {
      where.corporationId = filters.corporationId;
    }

    if (filters.search) {
      where.email = {
        contains: filters.search,
        mode: 'insensitive',
      };
    }

    // Query invitations
    const invitations = await prisma.invitation.findMany({
      where,
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // PENDING first
        { createdAt: 'desc' },
      ],
    });

    return {
      success: true,
      invitations,
      count: invitations.length,
    };
  } catch (error) {
    console.error('Error listing invitations:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to list invitations',
      invitations: [],
      count: 0,
    };
  }
}

// ============================================
// GET INVITATION BY TOKEN
// ============================================

/**
 * Get invitation details by token (public endpoint for acceptance page)
 *
 * Permissions: Public (no auth required)
 */
export async function getInvitationByToken(token: string) {
  try {
    const invitation = await prisma.invitation.findUnique({
      where: { token },
      include: {
        corporation: {
          select: {
            id: true,
            name: true,
            code: true,
            logo: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    // Check if invitation is already accepted
    if (invitation.status === 'ACCEPTED') {
      return {
        success: false,
        error: 'This invitation has already been accepted',
      };
    }

    // Check if invitation is revoked
    if (invitation.status === 'REVOKED') {
      return {
        success: false,
        error: 'This invitation has been revoked',
      };
    }

    // Check if invitation is expired
    if (invitation.expiresAt < new Date()) {
      // Update status to EXPIRED
      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'EXPIRED' },
      });

      return {
        success: false,
        error: 'This invitation has expired',
      };
    }

    return {
      success: true,
      invitation,
    };
  } catch (error) {
    console.error('Error getting invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invitation',
    };
  }
}

// ============================================
// ACCEPT INVITATION
// ============================================

/**
 * Accept an invitation and create user account
 *
 * Permissions: Public (no auth required, uses token)
 */
export async function acceptInvitation(data: AcceptInvitationInput) {
  try {
    // Validate invitation
    const invitationResult = await getInvitationByToken(data.token);

    if (!invitationResult.success || !invitationResult.invitation) {
      return {
        success: false,
        error: invitationResult.error || 'Invalid invitation',
      };
    }

    const invitation = invitationResult.invitation;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: invitation.email },
    });

    if (existingUser) {
      return {
        success: false,
        error: 'User with this email already exists',
      };
    }

    // Hash password
    const hashedPassword = await hash(data.password, 12);

    // Create user and mark invitation as accepted in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email: invitation.email,
          name: data.name,
          phone: data.phone,
          password: hashedPassword,
          role: invitation.role,
        },
      });

      // Create role-specific record if corporation is provided
      if (invitation.corporationId) {
        if (invitation.role === 'MANAGER') {
          await tx.corporationManager.create({
            data: {
              userId: newUser.id,
              corporationId: invitation.corporationId,
              title: 'Manager',
            },
          });
        } else if (invitation.role === 'SUPERVISOR') {
          await tx.siteManager.create({
            data: {
              userId: newUser.id,
              corporationId: invitation.corporationId,
              title: 'Supervisor',
            },
          });
        }
      }

      // Update invitation status
      const updatedInvitation = await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          action: 'ACCEPT_INVITATION',
          entity: 'Invitation',
          entityId: invitation.id,
          userId: newUser.id,
          userEmail: newUser.email,
          userRole: newUser.role,
          oldValue: {
            status: 'PENDING',
          },
          newValue: {
            status: 'ACCEPTED',
            userId: newUser.id,
            acceptedAt: updatedInvitation.acceptedAt,
          },
        },
      });

      return { user: newUser, invitation: updatedInvitation };
    });

    revalidatePath('/invitations');
    revalidatePath('/users');
    revalidatePath('/dashboard');

    return {
      success: true,
      user: result.user,
      invitation: result.invitation,
    };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to accept invitation',
    };
  }
}

// ============================================
// REVOKE INVITATION
// ============================================

/**
 * Revoke a pending invitation
 *
 * Permissions:
 * - SUPERADMIN: Can revoke any invitation
 * - MANAGER: Can revoke invitations in their corporation
 * - SUPERVISOR: Cannot revoke invitations
 */
export async function revokeInvitation(invitationId: string) {
  try {
    const currentUser = await requireManager();

    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    // Check if already accepted or revoked
    if (invitation.status === 'ACCEPTED') {
      return {
        success: false,
        error: 'Cannot revoke accepted invitation',
      };
    }

    if (invitation.status === 'REVOKED') {
      return {
        success: false,
        error: 'Invitation already revoked',
      };
    }

    // Validate MANAGER and AREA_MANAGER constraints
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      if (invitation.corporationId && !hasAccessToCorporation(currentUser, invitation.corporationId)) {
        return {
          success: false,
          error: 'Cannot revoke invitation from different corporation',
        };
      }
    }

    // Revoke invitation
    const revokedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        status: 'REVOKED',
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'REVOKE_INVITATION',
        entity: 'Invitation',
        entityId: invitationId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          status: invitation.status,
        },
        newValue: {
          status: 'REVOKED',
        },
      },
    });

    revalidatePath('/invitations');
    revalidatePath('/dashboard');

    return {
      success: true,
      invitation: revokedInvitation,
    };
  } catch (error) {
    console.error('Error revoking invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to revoke invitation',
    };
  }
}

// ============================================
// RESEND INVITATION
// ============================================

/**
 * Resend invitation email (generates new token and extends expiration)
 *
 * Permissions:
 * - SUPERADMIN: Can resend any invitation
 * - MANAGER: Can resend invitations in their corporation
 * - SUPERVISOR: Cannot resend invitations
 */
export async function resendInvitation(invitationId: string) {
  try {
    const currentUser = await requireManager();

    // Get invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: {
        corporation: true,
      },
    });

    if (!invitation) {
      return {
        success: false,
        error: 'Invitation not found',
      };
    }

    // Can only resend pending or expired invitations
    if (invitation.status === 'ACCEPTED') {
      return {
        success: false,
        error: 'Cannot resend accepted invitation',
      };
    }

    if (invitation.status === 'REVOKED') {
      return {
        success: false,
        error: 'Cannot resend revoked invitation',
      };
    }

    // Validate MANAGER and AREA_MANAGER constraints
    if (currentUser.role === 'MANAGER' || currentUser.role === 'AREA_MANAGER') {
      if (invitation.corporationId && !hasAccessToCorporation(currentUser, invitation.corporationId)) {
        return {
          success: false,
          error: 'Cannot resend invitation from different corporation',
        };
      }
    }

    // Generate new token and extend expiration
    const newToken = generateInvitationToken();
    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);

    // Update invitation
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: {
        token: newToken,
        expiresAt: newExpiresAt,
        status: 'PENDING',
      },
    });

    // Resend email
    await sendInvitationEmail(
      invitation.email,
      newToken,
      invitation.corporation?.name ?? 'Hierarchy Platform',
      invitation.message ?? undefined
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'RESEND_INVITATION',
        entity: 'Invitation',
        entityId: invitationId,
        userId: currentUser.id,
        userEmail: currentUser.email,
        userRole: currentUser.role,
        oldValue: {
          token: invitation.token,
          expiresAt: invitation.expiresAt,
          status: invitation.status,
        },
        newValue: {
          token: newToken,
          expiresAt: newExpiresAt,
          status: 'PENDING',
        },
      },
    });

    revalidatePath('/invitations');

    return {
      success: true,
      invitation: updatedInvitation,
    };
  } catch (error) {
    console.error('Error resending invitation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resend invitation',
    };
  }
}

// ============================================
// GET INVITATION STATS
// ============================================

/**
 * Get invitation statistics
 *
 * Permissions:
 * - SUPERADMIN: Global stats
 * - MANAGER: Corporation stats
 * - SUPERVISOR: No access
 */
export async function getInvitationStats() {
  try {
    const currentUser = await requireManager();

    const where: any = {};

    // Apply role-based filtering
    const userCorps = getUserCorporations(currentUser);
    if (userCorps !== 'all') {
      where.corporationId = { in: userCorps };
    }

    const [
      totalInvitations,
      pendingInvitations,
      acceptedInvitations,
      expiredInvitations,
      revokedInvitations,
      recentInvitations,
    ] = await Promise.all([
      prisma.invitation.count({ where }),
      prisma.invitation.count({ where: { ...where, status: 'PENDING' } }),
      prisma.invitation.count({ where: { ...where, status: 'ACCEPTED' } }),
      prisma.invitation.count({ where: { ...where, status: 'EXPIRED' } }),
      prisma.invitation.count({ where: { ...where, status: 'REVOKED' } }),
      prisma.invitation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          expiresAt: true,
          corporation: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    return {
      success: true,
      stats: {
        totalInvitations,
        pendingInvitations,
        acceptedInvitations,
        expiredInvitations,
        revokedInvitations,
        recentInvitations,
      },
    };
  } catch (error) {
    console.error('Error getting invitation stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get invitation stats',
    };
  }
}
