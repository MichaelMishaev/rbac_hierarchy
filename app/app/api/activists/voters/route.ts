import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

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
export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
  } catch (error) {
    console.error('[GET /api/activists/voters] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/activists/voters
 * Create a new voter (activist can only create, not edit others')
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    // CRITICAL: Only ACTIVIST role can access
    if (!session || session.user.role !== 'ACTIVIST') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = voterSchema.parse(body);

    // CRITICAL: Force insertedByUserId to session user (prevent spoofing)
    if (validatedData.insertedByUserId !== session.user.id) {
      return NextResponse.json(
        { error: 'Cannot create voter for another user' },
        { status: 403 }
      );
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
  } catch (error) {
    console.error('[POST /api/activists/voters] Error:', error);

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
