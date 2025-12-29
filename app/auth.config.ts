import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

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
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // ✅ SECURITY FIX (VULN-AUTH-002): Generate JTI for new tokens
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.avatar = user.avatar;
        token.isSuperAdmin = user.isSuperAdmin;
        token.requirePasswordChange = user.requirePasswordChange;
        token.jti = randomUUID(); // Unique token ID for blacklist tracking
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
    maxAge: 7 * 24 * 60 * 60, // ✅ SECURITY FIX (VULN-AUTH-001): Reduced from 30 days to 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
