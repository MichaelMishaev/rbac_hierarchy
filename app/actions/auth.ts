'use server';

/**
 * Auth Actions - Server-side authentication operations
 *
 * Security Fix: VULN-AUTH-002 - Implements token blacklisting on logout
 */

import { auth } from '@/auth';
import { blacklistToken } from '@/lib/token-blacklist';
import { logLogoutAudit } from '@/lib/audit-logger';

/**
 * Logout with token blacklisting
 *
 * Blacklists the current JWT token to prevent reuse after logout.
 * Returns the token JTI for client-side signOut() call.
 *
 * @returns Promise<{ jti: string | null }>
 */
export async function logoutWithBlacklist(): Promise<{ jti: string | null }> {
  try {
    const session = await auth();

    if (!session?.user) {
      console.log('[Auth] No active session to logout');
      return { jti: null };
    }

    // Get JWT token from session
    // NextAuth v5 exposes token via getToken which reads from cookies automatically
    const { getToken } = await import('next-auth/jwt');

    // getToken reads from request cookies automatically
    // We need to create a mock request object with cookies
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();

    // Create a minimal request object for getToken
    const req = {
      cookies: {
        get: (name: string) => cookieStore.get(name),
      },
      headers: {
        get: () => null,
      },
    } as any;

    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET!,
    });

    if (!token?.jti) {
      console.log('[Auth] No JTI in token');
      return { jti: null };
    }

    const jti = token.jti as string;

    // Blacklist token for remaining TTL (7 days)
    const maxAge = 7 * 24 * 60 * 60; // 7 days in seconds
    await blacklistToken(jti, maxAge);

    // Log logout audit
    await logLogoutAudit({
      userId: session.user.id!,
      userEmail: session.user.email!,
      userRole: session.user.role!,
      cityId: undefined, // cityId not available on session.user, populated from activistProfile
    });

    console.log(`[Auth] Logout successful, token blacklisted: ${jti}`);
    return { jti };
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    // Don't block logout on blacklist failure
    return { jti: null };
  }
}
