import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { ForbiddenError } from '@/lib/error-handler';
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
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      const context = await extractRequestContext(request);
      logger.rbacViolation('Non-activist attempted voter update', {
        ...context,
        ...(session ? extractSessionContext(session) : {}),
        metadata: { attemptedRole: session?.user?.role || 'unauthenticated' },
      });
      throw new ForbiddenError('רק פעילים יכולים לערוך בוחרים');
    }

    // Next.js 15: params is now a Promise
    const { id } = await context.params;

    // Check voter exists and was inserted by this user
    const existingVoter = await prisma.voter.findUnique({
      where: { id },
    });

    if (!existingVoter) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 });
    }

    // CRITICAL: Verify ownership
    if (existingVoter.insertedByUserId !== session.user.id) {
      const context = await extractRequestContext(request);
      logger.rbacViolation('Activist attempted to edit voter not created by them', {
        ...context,
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
  } catch (error) {
    console.error(`[PUT /api/activists/voters/[id]] Error:`, error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/activists/voters/[id]
 * Get single voter (only if inserted by current activist)
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      const context = await extractRequestContext(request);
      logger.rbacViolation('Non-activist attempted voter retrieval', {
        ...context,
        ...(session ? extractSessionContext(session) : {}),
        metadata: { attemptedRole: session?.user?.role || 'unauthenticated' },
      });
      throw new ForbiddenError('רק פעילים יכולים לצפות בבוחרים');
    }

    // Next.js 15: params is now a Promise
    const { id } = await context.params;

    const voter = await prisma.voter.findUnique({
      where: { id },
    });

    if (!voter) {
      return NextResponse.json({ error: 'Voter not found' }, { status: 404 });
    }

    // CRITICAL: Verify ownership
    if (voter.insertedByUserId !== session.user.id) {
      const context = await extractRequestContext(request);
      logger.rbacViolation('Activist attempted to view voter not created by them', {
        ...context,
        ...extractSessionContext(session),
        metadata: {
          voterId: id,
          voterOwnerId: voter.insertedByUserId,
        },
      });
      throw new ForbiddenError('ניתן לצפות רק בבוחרים שהוספת בעצמך');
    }

    return NextResponse.json(voter);
  } catch (error) {
    console.error(`[GET /api/activists/voters/[id]] Error:`, error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
