import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';

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
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        // Find user by email
        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        // Verify password
        const isValid = await bcrypt.compare(password, user.passwordHash);

        if (!isValid) {
          return null;
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Return user data for session
        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          avatar: user.avatarUrl,
          isSuperAdmin: user.isSuperAdmin, // ADDED: Include isSuperAdmin flag
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.avatar = user.avatar;
        token.isSuperAdmin = user.isSuperAdmin; // ADDED: Include isSuperAdmin flag
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.role = token.role as string;
        session.user.avatar = token.avatar as string | null;
        session.user.isSuperAdmin = token.isSuperAdmin as boolean; // ADDED: Include isSuperAdmin flag
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
});
