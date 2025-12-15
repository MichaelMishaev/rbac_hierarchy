import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

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

    // Fetch all organizational data
    const areaManagers = await prisma.areaManager.findMany({
      where: {
        isActive: true,
      },
      include: {
        user: {
          select: {
            fullName: true,
            email: true,
            phone: true,
          },
        },
        cities: {
          where: {
            isActive: true,
          },
          include: {
            coordinators: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            activistCoordinators: {
              where: {
                isActive: true,
              },
              include: {
                user: {
                  select: {
                    fullName: true,
                    email: true,
                    phone: true,
                  },
                },
              },
            },
            neighborhoods: {
              where: {
                isActive: true,
              },
              include: {
                activists: {
                  where: {
                    isActive: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        regionName: 'asc',
      },
    });

    // Create flattened data for Excel
    const hierarchyData: any[] = [];

    areaManagers.forEach((area) => {
      // Add area manager row
      hierarchyData.push({
        'רמה': 'מחוז',
        'מחוז': area.regionName,
        'מנהל מחוז': area.user?.fullName || 'N/A',
        'אימייל מנהל': area.user?.email || 'N/A',
        'טלפון מנהל': area.user?.phone || 'N/A',
        'עיר': '',
        'רכז עיר': '',
        'רכז שכונתי': '',
        'שכונה': '',
        'פעיל': '',
        'סה"כ ערים': area.cities.length,
        'סה"כ שכונות': area.cities.reduce((sum, c) => sum + c.neighborhoods.length, 0),
        'סה"כ פעילים': area.cities.reduce(
          (sum, c) => sum + c.neighborhoods.reduce((s, n) => s + n.activists.length, 0),
          0
        ),
      });

      area.cities.forEach((city) => {
        // Add city row
        hierarchyData.push({
          'רמה': 'עיר',
          'מחוז': area.regionName,
          'מנהל מחוז': area.user?.fullName || 'N/A',
          'אימייל מנהל': '',
          'טלפון מנהל': '',
          'עיר': city.name,
          'רכז עיר': '',
          'רכז שכונתי': '',
          'שכונה': '',
          'פעיל': '',
          'סה"כ ערים': '',
          'סה"כ שכונות': city.neighborhoods.length,
          'סה"כ פעילים': city.neighborhoods.reduce((s, n) => s + n.activists.length, 0),
        });

        // Add city coordinators
        city.coordinators.forEach((coord) => {
          hierarchyData.push({
            'רמה': 'רכז עיר',
            'מחוז': area.regionName,
            'מנהל מחוז': area.user?.fullName || 'N/A',
            'אימייל מנהל': '',
            'טלפון מנהל': '',
            'עיר': city.name,
            'רכז עיר': coord.user?.fullName || 'N/A',
            'רכז שכונתי': '',
            'שכונה': '',
            'פעיל': '',
            'סה"כ ערים': '',
            'סה"כ שכונות': '',
            'סה"כ פעילים': '',
          });
        });

        // Add activist coordinators
        city.activistCoordinators.forEach((coord) => {
          hierarchyData.push({
            'רמה': 'רכז שכונתי',
            'מחוז': area.regionName,
            'מנהל מחוז': area.user?.fullName || 'N/A',
            'אימייל מנהל': '',
            'טלפון מנהל': '',
            'עיר': city.name,
            'רכז עיר': '',
            'רכז שכונתי': coord.user?.fullName || 'N/A',
            'שכונה': '',
            'פעיל': '',
            'סה"כ ערים': '',
            'סה"כ שכונות': '',
            'סה"כ פעילים': '',
          });
        });

        city.neighborhoods.forEach((neighborhood) => {
          // Add neighborhood row
          hierarchyData.push({
            'רמה': 'שכונה',
            'מחוז': area.regionName,
            'מנהל מחוז': area.user?.fullName || 'N/A',
            'אימייל מנהל': '',
            'טלפון מנהל': '',
            'עיר': city.name,
            'רכז עיר': '',
            'רכז שכונתי': '',
            'שכונה': neighborhood.name,
            'פעיל': '',
            'סה"כ ערים': '',
            'סה"כ שכונות': '',
            'סה"כ פעילים': neighborhood.activists.length,
          });

          // Add activists
          neighborhood.activists.forEach((activist) => {
            hierarchyData.push({
              'רמה': 'פעיל',
              'מחוז': area.regionName,
              'מנהל מחוז': area.user?.fullName || 'N/A',
              'אימייל מנהל': '',
              'טלפון מנהל': '',
              'עיר': city.name,
              'רכז עיר': '',
              'רכז שכונתי': '',
              'שכונה': neighborhood.name,
              'פעיל': activist.fullName,
              'סה"כ ערים': '',
              'סה"כ שכונות': '',
              'סה"כ פעילים': '',
            });
          });
        });
      });
    });

    // Create summary sheet
    const summaryData = areaManagers.map((area) => ({
      'מחוז': area.regionName,
      'מנהל מחוז': area.user?.fullName || 'N/A',
      'אימייל': area.user?.email || 'N/A',
      'טלפון': area.user?.phone || 'N/A',
      'מספר ערים': area.cities.length,
      'מספר שכונות': area.cities.reduce((sum, c) => sum + c.neighborhoods.length, 0),
      'מספר פעילים': area.cities.reduce(
        (sum, c) => sum + c.neighborhoods.reduce((s, n) => s + n.activists.length, 0),
        0
      ),
    }));

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Add summary sheet
    const summarySheet = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'סיכום מחוזות');

    // Add full hierarchy sheet
    const hierarchySheet = XLSX.utils.json_to_sheet(hierarchyData);
    XLSX.utils.book_append_sheet(workbook, hierarchySheet, 'היררכיה מלאה');

    // Generate Excel file as buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Create filename with current date
    const date = new Date().toISOString().split('T')[0];
    const filename = `org-tree-${date}.xlsx`;

    // Return Excel file
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Error generating Excel export:', error);
    return NextResponse.json(
      { error: 'Failed to generate Excel export' },
      { status: 500 }
    );
  }
}
