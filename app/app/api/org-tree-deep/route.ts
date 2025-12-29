import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';

/**
 * Deep Tree Example API - 5 Levels Deep
 *
 * Hierarchy:
 * Level 1: SuperAdmin
 * Level 2: Corporation (Acme Corp)
 * Level 3: Site (Tel Aviv HQ)
 * Level 4: Department (Engineering)
 * Level 5: Team (Frontend, Backend, DevOps)
 *
 * NOTE: This is static mock data for testing/examples.
 * ✅ SECURITY FIX (VULN-RBAC-001): Now requires authentication.
 */
export async function GET(req: NextRequest) {
  // ✅ SECURITY FIX (VULN-RBAC-001): Require authentication
  const authResult = await requireAuth(req);
  if (authResult instanceof NextResponse) return authResult;

  try {
  const deepTree = {
    id: 'superadmin-root',
    name: 'System Administrator',
    type: 'superadmin',
    count: {
      cities: 1,
      neighborhoods: 1,
      departments: 3,
      teams: 8,
    },
    children: [
      {
        id: 'corp-acme',
        name: 'Acme Corporation',
        type: 'corporation',
        count: {
          coordinators: 3,
          neighborhoods: 1,
          departments: 3,
          teams: 8,
        },
        children: [
          {
            id: 'site-tlv',
            name: 'Tel Aviv HQ',
            type: 'site',
            count: {
              activistCoordinators: 2,
              activists: 25,
              departments: 3,
            },
            children: [
              {
                id: 'dept-eng',
                name: 'Engineering',
                type: 'department',
                count: {
                  teams: 3,
                  employees: 14,
                },
                children: [
                  {
                    id: 'team-frontend',
                    name: 'Frontend Team',
                    type: 'team',
                    count: {
                      members: 5,
                    },
                  },
                  {
                    id: 'team-backend',
                    name: 'Backend Team',
                    type: 'team',
                    count: {
                      members: 6,
                    },
                  },
                  {
                    id: 'team-devops',
                    name: 'DevOps Team',
                    type: 'team',
                    count: {
                      members: 3,
                    },
                  },
                ],
              },
              {
                id: 'dept-product',
                name: 'Product',
                type: 'department',
                count: {
                  teams: 2,
                  employees: 7,
                },
                children: [
                  {
                    id: 'team-design',
                    name: 'Design Team',
                    type: 'team',
                    count: {
                      members: 4,
                    },
                  },
                  {
                    id: 'team-research',
                    name: 'Research Team',
                    type: 'team',
                    count: {
                      members: 3,
                    },
                  },
                ],
              },
              {
                id: 'dept-marketing',
                name: 'Marketing',
                type: 'department',
                count: {
                  teams: 3,
                  employees: 9,
                },
                children: [
                  {
                    id: 'team-content',
                    name: 'Content Team',
                    type: 'team',
                    count: {
                      members: 3,
                    },
                  },
                  {
                    id: 'team-social',
                    name: 'Social Media',
                    type: 'team',
                    count: {
                      members: 4,
                    },
                  },
                  {
                    id: 'team-analytics',
                    name: 'Analytics Team',
                    type: 'team',
                    count: {
                      members: 2,
                    },
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  };

    return NextResponse.json(deepTree);
  } catch (error) {
    console.error('[Org Tree Deep] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch organization tree' },
      { status: 500 }
    );
  }
}
