import { NextResponse } from 'next/server';
import { auth } from '@/auth.config';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { withErrorHandler, ValidationError } from '@/lib/error-handler';
import { logger, extractRequestContext } from '@/lib/logger';
import { passwordChangeRateLimiter, checkRateLimit } from '@/lib/ratelimit';

export const POST = withErrorHandler(async (req: Request) => {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      const context = await extractRequestContext(req);
      logger.authFailure('Unauthenticated password change attempt', context);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ SECURITY FIX (2025 Standards): Rate limit password changes (5 per day per user)
    const rateLimit = await checkRateLimit(passwordChangeRateLimiter, session.user.id);
    if (!rateLimit.success) {
      const context = await extractRequestContext(req);
      logger.authFailure(`Password change rate limit exceeded (${rateLimit.remaining}/${rateLimit.limit})`, {
        ...context,
        userId: session.user.id,
      });
      return NextResponse.json(
        {
          error: 'ניסית לשנות סיסמה יותר מדי פעמים. נסה שוב מאוחר יותר',
          resetAt: rateLimit.reset,
        },
        { status: 429 }
      );
    }

    const { newPassword } = await req.json();

    // ✅ SECURITY FIX (2025 Standards): Throw ValidationError for proper logging
    if (!newPassword || typeof newPassword !== 'string') {
      throw new ValidationError('הסיסמה לא חוקית');
    }

    // ✅ SECURITY FIX (OWASP 2025): 15 characters minimum (no MFA implemented)
    // OWASP 2025 Standard: 8+ chars WITH MFA OR 15+ chars WITHOUT MFA
    if (newPassword.length < 15) {
      throw new ValidationError('הסיסמה חייבת להכיל לפחות 15 תווים (ללא אימות דו-שלבי)');
    }

    // Hash the new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear requirePasswordChange flag
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        passwordHash,
        requirePasswordChange: false,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json({ error: 'Failed to change password' }, { status: 500 });
  }
});
