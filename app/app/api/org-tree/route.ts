import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();

    // Only SuperAdmin can access organizational tree
    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized: SuperAdmin access required' },
        { status: 403 }
      );
    }

    // Fetch all corporations with their sites
    const corporations = await prisma.corporation.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            managers: true,
            sites: true,
          },
        },
        sites: {
          where: {
            isActive: true,
          },
          include: {
            _count: {
              select: {
                workers: true,
                supervisorAssignments: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // If no corporations exist, return mock demo data
    if (corporations.length === 0) {
      const mockTree = {
        id: 'root',
        name: 'SuperAdmin',
        type: 'superadmin' as const,
        count: {
          corporations: 7,
        },
        children: [
          {
            id: 'corp-1',
            name: 'תאגיד טכנולוגיה בע"מ',
            type: 'corporation' as const,
            count: { managers: 3, sites: 5 },
            children: [
              { id: 'site-1', name: 'משרד ראשי - תל אביב', type: 'site' as const, count: { workers: 120, supervisors: 4 } },
              { id: 'site-2', name: 'סניף חיפה', type: 'site' as const, count: { workers: 45, supervisors: 2 } },
              { id: 'site-3', name: 'סניף באר שבע', type: 'site' as const, count: { workers: 32, supervisors: 2 } },
            ],
          },
          {
            id: 'corp-2',
            name: 'חברת שירותים מקצועיים',
            type: 'corporation' as const,
            count: { managers: 2, sites: 3 },
            children: [
              { id: 'site-4', name: 'משרד מרכז', type: 'site' as const, count: { workers: 67, supervisors: 3 } },
              { id: 'site-5', name: 'סניף צפון', type: 'site' as const, count: { workers: 28, supervisors: 1 } },
            ],
          },
          {
            id: 'corp-3',
            name: 'תעשיות בניין (1998)',
            type: 'corporation' as const,
            count: { managers: 4, sites: 8 },
            children: [
              { id: 'site-6', name: 'אתר בנייה א\'', type: 'site' as const, count: { workers: 89, supervisors: 5 } },
              { id: 'site-7', name: 'אתר בנייה ב\'', type: 'site' as const, count: { workers: 76, supervisors: 4 } },
              { id: 'site-8', name: 'משרד ניהול', type: 'site' as const, count: { workers: 15, supervisors: 1 } },
            ],
          },
          {
            id: 'corp-4',
            name: 'רשת קמעונאות ארצית',
            type: 'corporation' as const,
            count: { managers: 5, sites: 12 },
            children: [
              { id: 'site-9', name: 'סניף תל אביב מרכז', type: 'site' as const, count: { workers: 34, supervisors: 2 } },
              { id: 'site-10', name: 'סניף ירושלים', type: 'site' as const, count: { workers: 28, supervisors: 2 } },
            ],
          },
          {
            id: 'corp-5',
            name: 'קבוצת היי-טק אינטרנשיונל',
            type: 'corporation' as const,
            count: { managers: 6, sites: 4 },
            children: [
              { id: 'site-11', name: 'מרכז מו"פ הרצליה', type: 'site' as const, count: { workers: 156, supervisors: 8 } },
              { id: 'site-12', name: 'משרד פיתוח עסקי', type: 'site' as const, count: { workers: 42, supervisors: 3 } },
            ],
          },
          {
            id: 'corp-6',
            name: 'שירותי אחזקה ותפעול',
            type: 'corporation' as const,
            count: { managers: 2, sites: 6 },
            children: [
              { id: 'site-13', name: 'אזור מרכז', type: 'site' as const, count: { workers: 45, supervisors: 3 } },
              { id: 'site-14', name: 'אזור דרום', type: 'site' as const, count: { workers: 38, supervisors: 2 } },
            ],
          },
          {
            id: 'corp-7',
            name: 'יבוא ושיווק בינלאומי',
            type: 'corporation' as const,
            count: { managers: 3, sites: 5 },
            children: [
              { id: 'site-15', name: 'מחסן ראשי אשדוד', type: 'site' as const, count: { workers: 92, supervisors: 6 } },
              { id: 'site-16', name: 'משרדי ניהול', type: 'site' as const, count: { workers: 23, supervisors: 2 } },
            ],
          },
        ],
      };
      return NextResponse.json(mockTree);
    }

    // Build hierarchical tree structure from real data
    const tree = {
      id: 'root',
      name: 'SuperAdmin',
      type: 'superadmin' as const,
      count: {
        corporations: corporations.length,
      },
      children: corporations.map(corp => ({
        id: corp.id,
        name: corp.name,
        type: 'corporation' as const,
        count: {
          managers: corp._count.managers,
          sites: corp._count.sites,
        },
        children: corp.sites.map(site => ({
          id: site.id,
          name: site.name,
          type: 'site' as const,
          count: {
            workers: site._count.workers,
            supervisors: site._count.supervisorAssignments,
          },
        })),
      })),
    };

    return NextResponse.json(tree);
  } catch (error) {
    console.error('Error fetching organizational tree:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organizational tree' },
      { status: 500 }
    );
  }
}
