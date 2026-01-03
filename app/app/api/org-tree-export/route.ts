import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import ExcelJS from 'exceljs';
import { withErrorHandler, UnauthorizedError, ForbiddenError } from '@/lib/error-handler';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

export const GET = withErrorHandler(async (req: Request) => {
  try {
    const session = await auth();

    // Only SuperAdmin can access organizational tree
    if (!session?.user) {
      const context = await extractRequestContext(req);
      logger.authFailure('Unauthenticated access to org-tree export', context);
      throw new UnauthorizedError('נדרשת הזדהות');
    }

    if (!session.user.isSuperAdmin) {
      const context = await extractRequestContext(req);
      logger.rbacViolation('Non-SuperAdmin attempted org-tree export', {
        ...context,
        ...extractSessionContext(session),
      });
      throw new ForbiddenError('רק מנהל מערכת יכול לייצא את המבנה הארגוני');
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
        'מנהל מחוז': area.user?.fullName || 'ממתין למינוי',
        'אימייל מנהל': area.user?.email || 'לא משויך',
        'טלפון מנהל': area.user?.phone || 'לא משויך',
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
          'מנהל מחוז': area.user?.fullName || 'ממתין למינוי',
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
            'מנהל מחוז': area.user?.fullName || 'ממתין למינוי',
            'אימייל מנהל': '',
            'טלפון מנהל': '',
            'עיר': city.name,
            'רכז עיר': coord.user?.fullName || 'ממתין למינוי',
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
            'מנהל מחוז': area.user?.fullName || 'ממתין למינוי',
            'אימייל מנהל': '',
            'טלפון מנהל': '',
            'עיר': city.name,
            'רכז עיר': '',
            'רכז שכונתי': coord.user?.fullName || 'ממתין למינוי',
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
            'מנהל מחוז': area.user?.fullName || 'ממתין למינוי',
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
              'מנהל מחוז': area.user?.fullName || 'ממתין למינוי',
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
      'מנהל מחוז': area.user?.fullName || 'ממתין למינוי',
      'אימייל': area.user?.email || 'לא משויך',
      'טלפון': area.user?.phone || 'לא משויך',
      'מספר ערים': area.cities.length,
      'מספר שכונות': area.cities.reduce((sum, c) => sum + c.neighborhoods.length, 0),
      'מספר פעילים': area.cities.reduce(
        (sum, c) => sum + c.neighborhoods.reduce((s, n) => s + n.activists.length, 0),
        0
      ),
    }));

    // Create workbook
    const workbook = new ExcelJS.Workbook();

    // Add summary sheet
    const summarySheet = workbook.addWorksheet('סיכום מחוזות');
    if (summaryData.length > 0) {
      summarySheet.columns = Object.keys(summaryData[0]).map((key) => ({
        header: key,
        key,
        width: 20,
      }));
      summaryData.forEach((row) => summarySheet.addRow(row));
    }

    // Add full hierarchy sheet
    const hierarchySheet = workbook.addWorksheet('היררכיה מלאה');
    if (hierarchyData.length > 0) {
      hierarchySheet.columns = Object.keys(hierarchyData[0]).map((key) => ({
        header: key,
        key,
        width: 20,
      }));
      hierarchyData.forEach((row) => hierarchySheet.addRow(row));
    }

    // Generate Excel file as buffer
    const excelBuffer = await workbook.xlsx.writeBuffer();

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
    // Re-throw known errors (withErrorHandler will handle them)
    if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
      throw error;
    }

    // Log and re-throw unknown errors
    console.error('Error generating Excel export:', error);
    throw error;
  }
});
