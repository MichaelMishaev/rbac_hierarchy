import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-compatible auth configuration for middleware
 * NO Prisma imports allowed here - runs in Edge Runtime
 * @see https://authjs.dev/getting-started/session-management/protecting
 */
export const authConfig = {
  trustHost: true, // Required for Railway and production deployments
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 1 * 24 * 60 * 60, // ✅ SECURITY FIX (2025 Standards): 1 day (JWT RFC 8725 + OWASP 2025)
  },
  callbacks: {
    // ✅ Edge-compatible: only checks JWT, no database access
    async jwt({ token, user, trigger }) {
      // Only runs during signIn in Node.js runtime (Credentials provider)
      if (trigger === 'signIn' && user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.avatar = user.avatar;
        token.isSuperAdmin = user.isSuperAdmin;
        token.requirePasswordChange = user.requirePasswordChange;
      }
      return token;
    },
    // ✅ Edge-compatible: only transforms token to session, no database access
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean;
        session.user.requirePasswordChange = token.requirePasswordChange as boolean;
      }
      return session;
    },
  },
  providers: [], // Providers added in auth.ts (Node.js runtime only)
} satisfies NextAuthConfig;
