/**
 * Server Actions for Audit Log Dashboard (SuperAdmin Only)
 *
 * RBAC: SUPERADMIN only
 * Purpose: Query AuditLog table with filters and pagination
 */

'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { redirect } from 'next/navigation';

export interface AuditLogFilters {
  dateRange?: '24h' | '7d' | '30d' | 'custom';
  customDateFrom?: string;
  customDateTo?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE';
  entity?: string;
  entityId?: string;
  userEmail?: string;
  cityId?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  before: any;
  after: any;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  cityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface ListAuditLogsResult {
  logs: AuditLogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * List audit logs with filters and pagination
 * RBAC: SuperAdmin only
 */
export async function listAuditLogs(filters: AuditLogFilters = {}): Promise<ListAuditLogsResult> {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    throw new Error('Forbidden: Only SuperAdmin can access audit logs');
  }

  // Build where clause
  const where: any = {};

  // Date range filter
  if (filters.dateRange) {
    const now = new Date();
    let fromDate: Date;

    switch (filters.dateRange) {
      case '24h':
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'custom':
        if (filters.customDateFrom) {
          fromDate = new Date(filters.customDateFrom);
        } else {
          fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        break;
      default:
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    where.createdAt = {
      gte: fromDate,
    };

    if (filters.dateRange === 'custom' && filters.customDateTo) {
      where.createdAt.lte = new Date(filters.customDateTo);
    }
  } else {
    // Default: last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: sevenDaysAgo };
  }

  // Action filter
  if (filters.action) {
    where.action = filters.action;
  }

  // Entity filter
  if (filters.entity) {
    where.entity = { contains: filters.entity, mode: 'insensitive' };
  }

  // Entity ID filter
  if (filters.entityId) {
    where.entityId = { contains: filters.entityId, mode: 'insensitive' };
  }

  // User email filter
  if (filters.userEmail) {
    where.userEmail = { contains: filters.userEmail, mode: 'insensitive' };
  }

  // City filter
  if (filters.cityId) {
    where.cityId = filters.cityId;
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  // Fetch logs and total count
  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip,
    }),
    prisma.auditLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    logs: logs as AuditLogEntry[],
    total,
    page,
    totalPages,
  };
}

/**
 * Get unique entity types for filter dropdown
 * RBAC: SuperAdmin only
 */
export async function getEntityTypes(): Promise<string[]> {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    throw new Error('Forbidden');
  }

  const result = await prisma.auditLog.findMany({
    select: { entity: true },
    distinct: ['entity'],
    orderBy: { entity: 'asc' },
  });

  return result.map((r) => r.entity);
}

/**
 * Get audit stats
 * RBAC: SuperAdmin only
 */
export async function getAuditStats(days: number = 7) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    throw new Error('Forbidden');
  }

  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Total logs by action
  const logsByAction = await prisma.auditLog.groupBy({
    by: ['action'],
    _count: true,
    where: {
      createdAt: { gte: fromDate },
    },
  });

  // Logs by entity (top 10)
  const logsByEntity = await prisma.auditLog.groupBy({
    by: ['entity'],
    _count: true,
    where: {
      createdAt: { gte: fromDate },
    },
    orderBy: {
      _count: {
        entity: 'desc',
      },
    },
    take: 10,
  });

  return {
    byAction: logsByAction,
    byEntity: logsByEntity,
  };
}
