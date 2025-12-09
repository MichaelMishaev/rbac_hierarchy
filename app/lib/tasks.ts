/**
 * Task System Utilities - v2.2
 * Helper functions for RBAC, recipient resolution, and audit logging
 * Hebrew-first task broadcast system (one-way communication)
 */

import { prisma } from './prisma';
import { Role } from '@prisma/client';

export interface Recipient {
  userId: string;
  fullName: string;
  email: string;
  role: string;
  corporationName?: string;
  siteNames?: string[];
}

export interface RecipientBreakdown {
  count: number;
  breakdown: {
    by_role: {
      area_manager: number;
      corporation_manager: number;
      supervisor: number;
    };
    by_corporation: Array<{
      corporation_id: string;
      name: string;
      count: number;
    }>;
  };
}

/**
 * Get all recipients under the current user based on their role
 * SuperAdmin → all non-SuperAdmins
 * Area Manager → Corp Managers + Supervisors in their region
 * Corporation Manager → Supervisors in their corporation
 * Supervisor → CANNOT send (throws error)
 */
export async function getAllRecipientsUnderMe(
  userId: string,
  userRole: Role
): Promise<Recipient[]> {
  if (userRole === 'ACTIVIST_COORDINATOR') {
    throw new Error('Supervisors cannot send tasks');
  }

  if (userRole === 'SUPERADMIN') {
    // SuperAdmin: all non-SuperAdmins
    // FIX: Use DISTINCT ON to avoid duplicate users (e.g., Area Manager managing multiple corps)
    const users = await prisma.$queryRaw<any[]>`
      SELECT DISTINCT ON (u.id)
        u.id as "userId",
        u.full_name as "fullName",
        u.email,
        u.role,
        COALESCE(c1.name, c2.name, c3.name) as "corporationName"
      FROM users u
      LEFT JOIN area_managers am ON am.user_id = u.id
      LEFT JOIN corporations c1 ON c1.area_manager_id = am.id
      LEFT JOIN corporation_managers cm ON cm.user_id = u.id
      LEFT JOIN corporations c2 ON c2.id = cm.corporation_id
      LEFT JOIN supervisors s ON s.user_id = u.id
      LEFT JOIN corporations c3 ON c3.id = s.corporation_id
      WHERE u.is_super_admin = FALSE
        AND u.is_active = TRUE
        AND (am.user_id IS NOT NULL OR cm.user_id IS NOT NULL OR s.user_id IS NOT NULL)
      ORDER BY u.id, u.full_name
    `;

    return users.map((u) => ({
      userId: u.userId,
      fullName: u.fullName,
      email: u.email,
      role: u.role.toLowerCase(),
      corporationName: u.corporationName,
    }));
  }

  if (userRole === 'AREA_MANAGER') {
    // Area Manager: Corp Managers + Supervisors in their region
    const areaManager = await prisma.areaManager.findUnique({
      where: { userId },
    });

    if (!areaManager) {
      throw new Error('Area Manager record not found');
    }

    const users = await prisma.$queryRaw<any[]>`
      -- Corporation Managers in my region
      SELECT
        u.id as "userId",
        u.full_name as "fullName",
        u.email,
        'CITY_COORDINATOR' as role,
        c.name as "corporationName"
      FROM corporation_managers cm
      JOIN users u ON u.id = cm.user_id
      JOIN corporations c ON c.id = cm.corporation_id
      WHERE c.area_manager_id = ${areaManager.id}
        AND u.is_active = TRUE
        AND cm.is_active = TRUE

      UNION

      -- Supervisors in my region
      SELECT
        u.id as "userId",
        u.full_name as "fullName",
        u.email,
        'ACTIVIST_COORDINATOR' as role,
        c.name as "corporationName"
      FROM supervisors s
      JOIN users u ON u.id = s.user_id
      JOIN corporations c ON c.id = s.corporation_id
      WHERE c.area_manager_id = ${areaManager.id}
        AND u.is_active = TRUE
        AND s.is_active = TRUE

      ORDER BY "fullName"
    `;

    return users.map((u) => ({
      userId: u.userId,
      fullName: u.fullName,
      email: u.email,
      role: u.role.toLowerCase(),
      corporationName: u.corporationName,
    }));
  }

  if (userRole === 'CITY_COORDINATOR') {
    // Corporation Manager: Supervisors in their corporation
    const manager = await prisma.cityCoordinator.findFirst({
      where: { userId },
      include: { corporation: true },
    });

    if (!manager) {
      throw new Error('Corporation Manager record not found');
    }

    const supervisors = await prisma.supervisor.findMany({
      where: {
        cityId: manager.cityId,
        isActive: true,
        user: { isActive: true },
      },
      include: {
        user: true,
        corporation: true,
        siteAssignments: {
          include: {
            site: {
              select: { name: true },
            },
          },
        },
      },
    });

    return supervisors.map((s) => ({
      userId: s.userId,
      fullName: s.user.fullName,
      email: s.user.email,
      role: 'supervisor',
      corporationName: s.corporation.name,
      siteNames: s.siteAssignments.map((sa) => sa.site.name),
    }));
  }

  throw new Error(`Invalid role: ${userRole}`);
}

/**
 * Validate and resolve specific recipient user IDs
 * Ensures sender has permission to send to these recipients
 */
export async function validateRecipients(
  recipientUserIds: string[],
  senderUserId: string,
  senderRole: Role
): Promise<string[]> {
  if (recipientUserIds.length === 0) {
    throw new Error('No recipients specified');
  }

  // Get all valid recipients under this sender
  const validRecipients = await getAllRecipientsUnderMe(senderUserId, senderRole);
  const validUserIds = new Set(validRecipients.map((r) => r.userId));

  // Filter to only those the sender can send to
  const resolvedUserIds = recipientUserIds.filter((id) => validUserIds.has(id));

  if (resolvedUserIds.length === 0) {
    throw new Error('No valid recipients found');
  }

  return resolvedUserIds;
}

/**
 * Get available recipients with search and pagination
 * Used for the searchable multi-select dropdown
 */
export async function getAvailableRecipients(
  userId: string,
  userRole: Role,
  options: {
    search?: string;
    cityId?: string;
    role?: 'area_manager' | 'corporation_manager' | 'supervisor';
    page?: number;
    limit?: number;
  } = {}
): Promise<{ recipients: Recipient[]; total: number }> {
  const { search, cityId, role, page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  // Get all recipients this user can send to
  const allRecipients = await getAllRecipientsUnderMe(userId, userRole);

  // Apply filters
  let filtered = allRecipients;

  if (search && search.length >= 2) {
    const searchLower = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.fullName.toLowerCase().includes(searchLower) ||
        r.email.toLowerCase().includes(searchLower)
    );
  }

  if (corporationId) {
    filtered = filtered.filter((r) => r.corporationName === corporationId);
  }

  if (role) {
    filtered = filtered.filter((r) => r.role === role);
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return { recipients: paginated, total };
}

/**
 * Preview recipients for confirmation modal
 * Returns count and breakdown by role/corporation
 */
export async function previewRecipients(
  userId: string,
  userRole: Role,
  sendTo: 'all' | 'selected',
  recipientUserIds?: string[]
): Promise<RecipientBreakdown> {
  let recipients: Recipient[];

  if (sendTo === 'all') {
    recipients = await getAllRecipientsUnderMe(userId, userRole);
  } else {
    if (!recipientUserIds || recipientUserIds.length === 0) {
      throw new Error('No recipients specified');
    }
    const validIds = await validateRecipients(recipientUserIds, userId, userRole);
    const allRecipients = await getAllRecipientsUnderMe(userId, userRole);
    recipients = allRecipients.filter((r) => validIds.includes(r.userId));
  }

  // Count by role
  const roleCount = {
    area_manager: 0,
    corporation_manager: 0,
    supervisor: 0,
  };

  recipients.forEach((r) => {
    if (r.role === 'area_manager') roleCount.area_manager++;
    else if (r.role === 'manager' || r.role === 'corporation_manager')
      roleCount.corporation_manager++;
    else if (r.role === 'supervisor') roleCount.supervisor++;
  });

  // Count by corporation
  const corpMap = new Map<string, { name: string; count: number }>();
  recipients.forEach((r) => {
    if (r.corporationName) {
      const existing = corpMap.get(r.corporationName);
      if (existing) {
        existing.count++;
      } else {
        corpMap.set(r.corporationName, { name: r.corporationName, count: 1 });
      }
    }
  });

  const byCorporation = Array.from(corpMap.entries()).map(([_, value]) => ({
    corporation_id: '',
    name: value.name,
    count: value.count,
  }));

  return {
    count: recipients.length,
    breakdown: {
      by_role: roleCount,
      by_corporation: byCorporation,
    },
  };
}

/**
 * Log task mutation to audit logs
 */
export async function logTaskAudit(params: {
  action: 'create' | 'update' | 'delete';
  entity: 'task' | 'task_assignment';
  entityId: string | bigint;
  userId: string;
  before?: any;
  after?: any;
  cityId?: string;
  ipAddress?: string;
  userAgent?: string;
}) {
  await prisma.auditLog.create({
    data: {
      action: params.action.toUpperCase(),
      entity: params.entity,
      entityId: params.entityId.toString(),
      before: params.before || null,
      after: params.after || null,
      userId: params.userId,
      userEmail: null, // Will be filled by middleware if needed
      userRole: null, // Will be filled by middleware if needed
      cityId: params.corporationId || null,
      ipAddress: params.ipAddress || null,
      userAgent: params.userAgent || null,
    },
  });
}
