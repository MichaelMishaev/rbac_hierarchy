import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { withErrorHandler } from '@/lib/error-handler';

export const GET = withErrorHandler(async () => {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({
      authenticated: false,
      error: 'No session found'
    });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isSuperAdmin: true,
    },
  });

  return NextResponse.json({
    authenticated: true,
    session: {
      userId: session.user.id,
      email: session.user.email,
    },
    dbUser,
  });
});
