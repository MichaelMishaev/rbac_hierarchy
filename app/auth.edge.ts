import NextAuth from 'next-auth';
import { authConfig } from '@/auth.config';

/**
 * Edge Runtime Auth Instance
 * Used ONLY by middleware (Edge Runtime)
 * NO Prisma, NO database access
 * @see https://authjs.dev/getting-started/session-management/protecting
 */
export const { auth } = NextAuth(authConfig);
