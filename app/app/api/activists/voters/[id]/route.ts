import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ForbiddenError, withErrorHandler } from '@/lib/error-handler';
import { logger, extractRequestContext, extractSessionContext } from '@/lib/logger';

const voterUpdateSchema = z.object({
  fullName: z.string().min(1).optional(),
  phone: z.string().min(9).optional(),
  supportLevel: z.string().optional(),
  voterAddress: z.string().optional(),
  voterCity: z.string().optional(),
  voterNeighborhood: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * PUT /api/activists/voters/[id]
 * Update voter (only if inserted by current activist)
 */
export const PUT = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      const reqContext = await extractRequestContext(request);
      logger.rbacViolation('Non-activist attempted voter update', {
        ...reqContext,
        ...(session ? extractSessionContext(session) : {}),
        metadata: { attemptedRole: session?.user?.role || 'unauthenticated' },
      });
      throw new ForbiddenError('רק פעילים יכולים לערוך בוחרים');
    }

    // Next.js 15: params is now a Promise
    const { id } = await params;

    // Check voter exists and was inserted by this user
    const existingVoter = await prisma.voter.findUnique({
      where: { id },
    });

    if (!existingVoter) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 });
    }

    // CRITICAL: Verify ownership
    if (existingVoter.insertedByUserId !== session.user.id) {
      const reqContext = await extractRequestContext(request);
      logger.rbacViolation('Activist attempted to edit voter not created by them', {
        ...reqContext,
        ...extractSessionContext(session),
        metadata: {
          voterId: id,
          voterOwnerId: existingVoter.insertedByUserId,
        },
      });
      throw new ForbiddenError('ניתן לערוך רק בוחרים שהוספת בעצמך');
    }

    const body = await request.json();
    const validatedData = voterUpdateSchema.parse(body);

    // Update voter
    const updatedVoter = await prisma.voter.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(updatedVoter);
});

/**
 * GET /api/activists/voters/[id]
 * Get single voter (only if inserted by current activist)
 */
export const GET = withErrorHandler(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) => {
  const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      const reqContext = await extractRequestContext(request);
      logger.rbacViolation('Non-activist attempted voter retrieval', {
        ...reqContext,
        ...(session ? extractSessionContext(session) : {}),
        metadata: { attemptedRole: session?.user?.role || 'unauthenticated' },
      });
      throw new ForbiddenError('רק פעילים יכולים לצפות בבוחרים');
    }

    // Next.js 15: params is now a Promise
    const { id } = await params;

    const voter = await prisma.voter.findUnique({
      where: { id },
    });

    if (!voter) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 });
    }

    // CRITICAL: Verify ownership
    if (voter.insertedByUserId !== session.user.id) {
      const reqContext = await extractRequestContext(request);
      logger.rbacViolation('Activist attempted to view voter not created by them', {
        ...reqContext,
        ...extractSessionContext(session),
        metadata: {
          voterId: id,
          voterOwnerId: voter.insertedByUserId,
        },
      });
      throw new ForbiddenError('ניתן לצפות רק בבוחרים שהוספת בעצמך');
    }

    return NextResponse.json(voter);
});
