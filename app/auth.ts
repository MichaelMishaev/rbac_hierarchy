import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { logLoginAudit } from '@/lib/audit-logger';

/**
 * Full NextAuth configuration with Prisma (Node.js runtime only)
 * Used by API routes and server components
 * @see https://authjs.dev/getting-started/installation
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[Auth] Missing credentials');
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;

          console.log('[Auth] Login attempt for email:', email);

          // Find user by email
          const user = await prisma.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log('[Auth] User not found:', email);

            // Log failed login attempt (user not found)
            const headersList = await headers();
            const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
            const userAgent = headersList.get('user-agent');

            await logLoginAudit({
              userId: 'UNKNOWN',
              userEmail: email,
              userRole: 'UNKNOWN',
              ipAddress: ipAddress || undefined,
              userAgent: userAgent || undefined,
              success: false,
            });

            return null;
          }

          if (!user.passwordHash) {
            console.log('[Auth] User has no password hash:', email);
            return null;
          }

          console.log('[Auth] User found:', user.email, 'Role:', user.role);

          // Verify password
          const isValid = await bcrypt.compare(password, user.passwordHash);

          if (!isValid) {
            console.log('[Auth] Invalid password for:', email);

            // Log failed login attempt (invalid password)
            const headersList = await headers();
            const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
            const userAgent = headersList.get('user-agent');

            await logLoginAudit({
              userId: user.id,
              userEmail: user.email,
              userRole: user.role,
              ipAddress: ipAddress || undefined,
              userAgent: userAgent || undefined,
              success: false,
            });

            return null;
          }

          console.log('[Auth] Login successful for:', email);

          // Update last login
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          });

          // Invalidate cached user data to force fresh fetch on next request
          const { revalidateTag } = await import('next/cache');
          revalidateTag(`user-${user.id}`);

          // Log successful login audit
          const headersList = await headers();
          const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
          const userAgent = headersList.get('user-agent');

          await logLoginAudit({
            userId: user.id,
            userEmail: user.email,
            userRole: user.role,
            ipAddress: ipAddress || undefined,
            userAgent: userAgent || undefined,
            success: true,
          });

          // Return user data for session
          return {
            id: user.id,
            email: user.email,
            name: user.fullName,
            role: user.role,
            avatar: user.avatarUrl,
            isSuperAdmin: user.isSuperAdmin,
            requirePasswordChange: user.requirePasswordChange,
          };
        } catch (error) {
          console.error('[Auth] Login error:', error);

          // Log failed login attempt (system error)
          if (credentials?.email) {
            const headersList = await headers();
            const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
            const userAgent = headersList.get('user-agent');

            await logLoginAudit({
              userId: 'ERROR',
              userEmail: credentials.email as string,
              userRole: 'ERROR',
              ipAddress: ipAddress || undefined,
              userAgent: userAgent || undefined,
              success: false,
            });
          }

          return null;
        }
      },
    }),
  ],
});
