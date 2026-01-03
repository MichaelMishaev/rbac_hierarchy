/**
 * CSV Export API for Error Dashboard
 * RBAC: SuperAdmin only
 * Exports filtered errors to CSV file
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ErrorLevel } from '@prisma/client';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Parse query parameters (same as listErrors)
  const searchParams = request.nextUrl.searchParams;
  const dateRange = searchParams.get('dateRange') as '24h' | '7d' | '30d' | 'custom' | null;
  const customDateFrom = searchParams.get('customDateFrom');
  const customDateTo = searchParams.get('customDateTo');
  const level = searchParams.get('level') as ErrorLevel | null;
  const errorType = searchParams.get('errorType');
  const userEmail = searchParams.get('userEmail');
  const cityId = searchParams.get('cityId');
  const httpStatus = searchParams.get('httpStatus');

  // Build where clause (same logic as server action)
  const where: any = {};

  // Date range filter
  if (dateRange) {
    const now = new Date();
    let fromDate: Date;

    switch (dateRange) {
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
        if (customDateFrom) {
          fromDate = new Date(customDateFrom);
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

    if (dateRange === 'custom' && customDateTo) {
      where.createdAt.lte = new Date(customDateTo);
    }
  } else {
    // Default: last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: sevenDaysAgo };
  }

  if (level) {
    where.level = level;
  }
  if (errorType) {
    where.errorType = { contains: errorType, mode: 'insensitive' };
  }
  if (userEmail) {
    where.userEmail = { contains: userEmail, mode: 'insensitive' };
  }
  if (cityId) {
    where.cityId = cityId;
  }
  if (httpStatus) {
    where.httpStatus = parseInt(httpStatus);
  }

  try {
    // Fetch all errors matching the filter (limit to 10,000 for safety)
    const errors = await prisma.errorLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 10000,
    });

    // Convert to CSV
    const csvHeader =
      'ID,Level,ErrorType,Message,Code,HTTPMethod,HTTPStatus,URL,Referer,UserEmail,UserRole,CityID,IPAddress,UserAgent,RequestID,Environment,CreatedAt\n';

    const csvRows = errors
      .map((error) => {
        // Escape CSV fields
        const escape = (str: any) => {
          if (str === null || str === undefined) return '';
          const value = String(str);
          if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        };

        return [
          escape(error.id),
          escape(error.level),
          escape(error.errorType),
          escape(error.message),
          escape(error.code),
          escape(error.httpMethod),
          escape(error.httpStatus),
          escape(error.url),
          escape(error.referer),
          escape(error.userEmail),
          escape(error.userRole),
          escape(error.cityId),
          escape(error.ipAddress),
          escape(error.userAgent),
          escape(error.requestId),
          escape(error.environment),
          escape(error.createdAt.toISOString()),
        ].join(',');
      })
      .join('\n');

    const csv = csvHeader + csvRows;

    // Return CSV file
    const filename = `errors-export-${new Date().toISOString().split('T')[0]}.csv`;

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('[CSV Export] Error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
