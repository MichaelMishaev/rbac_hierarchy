import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      return NextResponse.json(
        { error: 'You can only edit voters you created' },
        { status: 403 }
      );
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
      return NextResponse.json(
        { error: 'You can only view voters you created' },
        { status: 403 }
      );
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
