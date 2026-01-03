/**
 * API Authentication Helpers
 *
 * Security Fix: VULN-RBAC-001 - Centralized auth checks for API routes
 *
 * Provides reusable authentication and authorization helpers for API endpoints.
 */

import { auth } from '@/auth';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Require authentication for API route
 *
 * @param request - Request object
 * @returns Session if authenticated, NextResponse with 401 if not
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireAuth(request);
 *   if (authResult instanceof NextResponse) return authResult; // 401
 *
 *   const session = authResult;
 *   // ... use session.user ...
 * }
 * ```
 */
export async function requireAuth(request: Request) {
  const session = await auth();

  if (!session?.user) {
    console.log('[API Auth] Unauthenticated request to:', request.url);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return session;
}

/**
 * Require specific role(s) for API route
 *
 * @param request - Request object
 * @param allowedRoles - Array of allowed roles
 * @returns Session if authorized, NextResponse with 401/403 if not
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const authResult = await requireRole(request, ['SUPERADMIN', 'AREA_MANAGER']);
 *   if (authResult instanceof NextResponse) return authResult; // 401/403
 *
 *   const session = authResult;
 *   // ... user has required role ...
 * }
 * ```
 */
export async function requireRole(
  request: Request,
  allowedRoles: string[]
) {
  const session = await auth();

  if (!session?.user) {
    console.log('[API Auth] Unauthenticated request to:', request.url);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!allowedRoles.includes(session.user.role)) {
    console.log(
      `[API Auth] Forbidden: User ${session.user.email} (${session.user.role}) attempted to access ${request.url}. Required roles: ${allowedRoles.join(', ')}`
    );
    return NextResponse.json(
      { error: 'Forbidden', requiredRoles: allowedRoles },
      { status: 403 }
    );
  }

  return session;
}

/**
 * Require SuperAdmin role for API route
 *
 * @param request - Request object
 * @returns Session if SuperAdmin, NextResponse with 401/403 if not
 */
export async function requireSuperAdmin(request: NextRequest) {
  const session = await auth();

  if (!session?.user) {
    console.log('[API Auth] Unauthenticated request to:', request.url);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!session.user.isSuperAdmin) {
    console.log(
      `[API Auth] Forbidden: Non-superadmin ${session.user.email} attempted to access ${request.url}`
    );
    return NextResponse.json(
      { error: 'Forbidden', message: 'SuperAdmin access required' },
      { status: 403 }
    );
  }

  return session;
}
