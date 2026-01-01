import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { headers } from 'next/headers';
import { logLoginAudit } from '@/lib/audit-logger';

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true, // Required for Railway and production deployments
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
  callbacks: {
    async jwt({ token, user, trigger }) {
      // ✅ SECURITY FIX (VULN-AUTH-002): Generate JTI for new tokens
      if (trigger === 'signIn' && user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.avatar = user.avatar;
        token.isSuperAdmin = user.isSuperAdmin;
        token.requirePasswordChange = user.requirePasswordChange;
        token.jti = randomUUID(); // Unique token ID for blacklist tracking

        // Extract request headers for login audit
        const headersList = await headers();
        const ipAddress = headersList.get('x-forwarded-for') || headersList.get('x-real-ip');
        const userAgent = headersList.get('user-agent');

        // Store temporarily for session callback
        token.loginIpAddress = ipAddress;
        token.loginUserAgent = userAgent;
      }

      // Note: Blacklist checking happens server-side in API routes/server actions
      // Cannot check here due to Edge Runtime limitations (no Redis access)

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.requirePasswordChange = token.requirePasswordChange as boolean;

        // Log successful login audit (only on first session creation)
        if (token.loginIpAddress !== undefined || token.loginUserAgent !== undefined) {
          await logLoginAudit({
            userId: session.user.id,
            userEmail: session.user.email!,
            userRole: session.user.role,
            cityId: undefined, // Will be populated when user data is loaded
            ipAddress: token.loginIpAddress as string | undefined,
            userAgent: token.loginUserAgent as string | undefined,
            success: true,
          });

          // Clear temporary login data
          delete token.loginIpAddress;
          delete token.loginUserAgent;
        }

        // Note: Activist profile is loaded separately via getCurrentUser() in lib/auth.ts
        // We cannot query Prisma here as this runs in Edge Runtime (middleware)
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 1 * 24 * 60 * 60, // ✅ SECURITY FIX (2025 Standards): Reduced to 1 day (JWT RFC 8725 + OWASP 2025)
  },
  secret: process.env.NEXTAUTH_SECRET,
});
