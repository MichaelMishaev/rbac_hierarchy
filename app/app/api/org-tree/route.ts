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

    // Build hierarchical tree structure
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
