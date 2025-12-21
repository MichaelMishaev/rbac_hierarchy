import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { withErrorHandler, ForbiddenError } from '@/lib/error-handler';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

const voterSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(9),
  supportLevel: z.string().optional(),
  voterAddress: z.string().optional(),
  voterCity: z.string().optional(),
  voterNeighborhood: z.string().optional(),
  notes: z.string().optional(),
  insertedByUserId: z.string(),
  insertedByUserName: z.string(),
  insertedByUserRole: z.string(),
  insertedByNeighborhoodName: z.string(),
  insertedByCityName: z.string(),
});

/**
 * GET /api/activists/voters
 * Get all voters inserted by the authenticated activist
 */
export const GET = withErrorHandler(async (request: Request) => {
  const session = await auth();

  // CRITICAL: Only ACTIVIST role can access
  if (!session || session.user.role !== 'ACTIVIST') {
    // Explicit RBAC violation logging
    const requestContext = await extractRequestContext(request);
    logger.rbacViolation('Non-activist attempted to access voter list', {
      ...requestContext,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    });

    throw new ForbiddenError('רק פעילים יכולים לגשת לרשימת בוחרים');
  }

  // CRITICAL: Only return voters inserted by this user
  const voters = await prisma.voter.findMany({
    where: {
      insertedByUserId: session.user.id,
      isActive: true,
    },
    orderBy: {
      insertedAt: 'desc',
    },
  });

  return NextResponse.json(voters);
});

/**
 * POST /api/activists/voters
 * Create a new voter (activist can only create, not edit others')
 */
export const POST = withErrorHandler(async (request: Request) => {
  const session = await auth();

  // CRITICAL: Only ACTIVIST role can access
  if (!session || session.user.role !== 'ACTIVIST') {
    const requestContext = await extractRequestContext(request);
    logger.rbacViolation('Non-activist attempted to create voter', {
      ...requestContext,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    });

    throw new ForbiddenError('רק פעילים יכולים ליצור בוחרים');
  }

  const body = await request.json();
  const validatedData = voterSchema.parse(body);

  // CRITICAL: Force insertedByUserId to session user (prevent spoofing)
  if (validatedData.insertedByUserId !== session.user.id) {
    const requestContext = await extractRequestContext(request);
    logger.rbacViolation('Activist attempted to create voter for another user', {
      ...requestContext,
      ...extractSessionContext(session),
      metadata: {
        attemptedUserId: validatedData.insertedByUserId,
        actualUserId: session.user.id,
      },
    });

    throw new ForbiddenError('לא ניתן ליצור בוחר עבור משתמש אחר');
  }

  // Create voter
  const voter = await prisma.voter.create({
    data: {
      fullName: validatedData.fullName,
      phone: validatedData.phone,
      supportLevel: validatedData.supportLevel || null,
      voterAddress: validatedData.voterAddress || null,
      voterCity: validatedData.voterCity || null,
      voterNeighborhood: validatedData.voterNeighborhood || null,
      notes: validatedData.notes || null,
      insertedByUserId: session.user.id, // ← ENFORCE
      insertedByUserName: validatedData.insertedByUserName,
      insertedByUserRole: validatedData.insertedByUserRole,
      insertedByNeighborhoodName: validatedData.insertedByNeighborhoodName,
      insertedByCityName: validatedData.insertedByCityName,
    },
  });

  return NextResponse.json(voter, { status: 201 });
});
