/**
 * GET /api/tasks/available-recipients - Get searchable paginated recipients
 * v2.2: Task Broadcast System
 *
 * Used for the searchable multi-select dropdown in task creation form
 * Supports search, pagination, and filtering by corporation/role
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAvailableRecipients } from '@/lib/tasks';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { error: 'נדרש אימות' },
        { status: 401 }
      );
    }

    const userId = session.user.id as string;
    const userRole = session.user.role as Role;

    // 2. Validate that user can send tasks
    if (userRole === 'ACTIVIST_COORDINATOR') {
      return NextResponse.json(
        { error: 'מפקחים לא יכולים לשלוח משימות' },
        { status: 403 }
      );
    }

    // 3. Parse query parameters
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || undefined;
    const corporationId = searchParams.get('corporation_id') || undefined;
    const roleFilter = searchParams.get('role') as
      | 'area_manager'
      | 'corporation_manager'
      | 'supervisor'
      | undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

    // 4. Get recipients
    const { recipients, total } = await getAvailableRecipients(userId, userRole, {
      search,
      cityId,
      role: roleFilter,
      page,
      limit,
    });

    // 5. Return response
    return NextResponse.json({
      recipients: recipients.map((r) => ({
        user_id: r.userId,
        full_name: r.fullName,
        email: r.email,
        role: r.role,
        corporation_name: r.corporationName,
        site_names: r.siteNames || [],
      })),
      pagination: {
        page,
        limit,
        total_count: total,
        total_pages: Math.ceil(total / limit),
        has_more: page * limit < total,
      },
    });
  } catch (error: any) {
    console.error('Error fetching available recipients:', error);

    if (error.message) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'שגיאה בטעינת רשימת נמענים' },
      { status: 500 }
    );
  }
}
