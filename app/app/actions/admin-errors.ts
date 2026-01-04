/**
 * Server Actions for Error Dashboard (SuperAdmin Only)
 *
 * RBAC: SUPERADMIN only
 * Purpose: Query ErrorLog table with filters, pagination, and export
 */

'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { ErrorLevel } from '@prisma/client';
import { redirect } from 'next/navigation';

export interface ErrorLogFilters {
  dateRange?: '24h' | '7d' | '30d' | 'custom';
  customDateFrom?: string;
  customDateTo?: string;
  level?: ErrorLevel;
  errorType?: string;
  userEmail?: string;
  cityId?: string;
  httpStatus?: number;
  environment?: string; // 'development', 'production'
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'level' | 'errorType';
  sortOrder?: 'asc' | 'desc';
}

export interface ErrorLogWithContext {
  id: string;
  level: ErrorLevel;
  errorType: string;
  message: string;
  stack: string | null;
  code: string | null;
  httpMethod: string | null;
  httpStatus: number | null;
  url: string | null;
  referer: string | null;
  userId: string | null;
  userEmail: string | null;
  userRole: string | null;
  cityId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  metadata: any;
  environment: string;
  createdAt: Date;
}

export interface ListErrorsResult {
  errors: ErrorLogWithContext[];
  total: number;
  page: number;
  totalPages: number;
}

/**
 * List errors with filters and pagination
 * RBAC: SuperAdmin only
 */
export async function listErrors(filters: ErrorLogFilters = {}): Promise<ListErrorsResult> {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    throw new Error('Forbidden: Only SuperAdmin can access error logs');
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

  // Level filter
  if (filters.level) {
    where.level = filters.level;
  }

  // Error type filter
  if (filters.errorType) {
    where.errorType = { contains: filters.errorType, mode: 'insensitive' };
  }

  // User email filter
  if (filters.userEmail) {
    where.userEmail = { contains: filters.userEmail, mode: 'insensitive' };
  }

  // City filter
  if (filters.cityId) {
    where.cityId = filters.cityId;
  }

  // HTTP status filter
  if (filters.httpStatus) {
    where.httpStatus = filters.httpStatus;
  }

  // Environment filter
  if (filters.environment) {
    where.environment = filters.environment;
  }

  // Pagination
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  // Sorting
  const sortBy = filters.sortBy || 'createdAt';
  const sortOrder = filters.sortOrder || 'desc';

  // Fetch errors and total count
  const [errors, total] = await Promise.all([
    prisma.errorLog.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      take: limit,
      skip,
    }),
    prisma.errorLog.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    errors: errors as ErrorLogWithContext[],
    total,
    page,
    totalPages,
  };
}

/**
 * Get unique error types for filter dropdown
 * RBAC: SuperAdmin only
 */
export async function getErrorTypes(): Promise<string[]> {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    throw new Error('Forbidden');
  }

  const result = await prisma.errorLog.findMany({
    select: { errorType: true },
    distinct: ['errorType'],
    orderBy: { errorType: 'asc' },
  });

  return result.map((r) => r.errorType);
}

/**
 * Get error statistics for analytics
 * RBAC: SuperAdmin only
 */
export async function getErrorStats(days: number = 7) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    throw new Error('Forbidden');
  }

  const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  // Total errors by level
  const errorsByLevel = await prisma.errorLog.groupBy({
    by: ['level'],
    _count: true,
    where: {
      createdAt: { gte: fromDate },
    },
  });

  // Errors by type (top 10)
  const errorsByType = await prisma.errorLog.groupBy({
    by: ['errorType'],
    _count: true,
    where: {
      createdAt: { gte: fromDate },
    },
    orderBy: {
      _count: {
        errorType: 'desc',
      },
    },
    take: 10,
  });

  // Errors by role
  const errorsByRole = await prisma.errorLog.groupBy({
    by: ['userRole'],
    _count: true,
    where: {
      createdAt: { gte: fromDate },
      userRole: { not: null },
    },
  });

  // Errors by city
  const errorsByCity = await prisma.errorLog.groupBy({
    by: ['cityId'],
    _count: true,
    where: {
      createdAt: { gte: fromDate },
      cityId: { not: null },
    },
  });

  // Errors over time (last 7 days, grouped by day)
  const errorTrend = await prisma.$queryRaw<Array<{ date: Date; count: number }>>`
    SELECT
      DATE(created_at) as date,
      COUNT(*)::int as count
    FROM error_logs
    WHERE created_at >= ${fromDate}
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) ASC
  `;

  return {
    byLevel: errorsByLevel,
    byType: errorsByType,
    byRole: errorsByRole,
    byCity: errorsByCity,
    trend: errorTrend,
  };
}

/**
 * Get single error by ID
 * RBAC: SuperAdmin only
 */
export async function getErrorById(id: string): Promise<ErrorLogWithContext | null> {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    throw new Error('Forbidden');
  }

  const error = await prisma.errorLog.findUnique({
    where: { id },
  });

  return error as ErrorLogWithContext | null;
}
