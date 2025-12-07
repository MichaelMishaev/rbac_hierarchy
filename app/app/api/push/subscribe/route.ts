/**
 * POST /api/push/subscribe
 *
 * Save or remove push notification subscription for the current user.
 *
 * Auth: Required (all authenticated users)
 * Body:
 *   - subscription: PushSubscription object from browser
 *   - action: 'subscribe' | 'unsubscribe' | 'renew'
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SubscribeRequest {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  action: 'subscribe' | 'unsubscribe' | 'renew';
}

export async function POST(req: NextRequest) {
  try {
    // 1. Authenticate user
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'לא מאומת - נדרשת התחברות' },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    // 2. Parse request body
    const body: SubscribeRequest = await req.json();

    const { subscription, action } = body;

    // 3. Validate request
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return NextResponse.json(
        { error: 'מידע מנוי לא תקין' },
        { status: 400 }
      );
    }

    if (!['subscribe', 'unsubscribe', 'renew'].includes(action)) {
      return NextResponse.json(
        { error: 'פעולה לא חוקית' },
        { status: 400 }
      );
    }

    // 4. Get user agent from request headers
    const userAgent = req.headers.get('user-agent') || 'Unknown';

    // 5. Handle action
    if (action === 'subscribe' || action === 'renew') {
      // Save subscription to database (upsert to handle duplicates)
      const savedSubscription = await prisma.pushSubscription.upsert({
        where: {
          userId_endpoint: {
            userId,
            endpoint: subscription.endpoint,
          },
        },
        update: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          lastUsedAt: new Date(),
        },
        create: {
          userId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          userAgent,
          lastUsedAt: new Date(),
        },
      });

      console.log(`[Push Subscribe] User ${userId} subscribed (${action}):`, subscription.endpoint);

      return NextResponse.json(
        {
          success: true,
          message: action === 'renew' ? 'מנוי חודש בהצלחה' : 'נרשמת להתראות בהצלחה',
          subscriptionId: savedSubscription.id,
        },
        { status: 200 }
      );
    } else if (action === 'unsubscribe') {
      // Remove subscription from database
      const deleted = await prisma.pushSubscription.deleteMany({
        where: {
          userId,
          endpoint: subscription.endpoint,
        },
      });

      console.log(`[Push Unsubscribe] User ${userId} unsubscribed:`, subscription.endpoint);

      return NextResponse.json(
        {
          success: true,
          message: 'ביטלת את ההתראות בהצלחה',
          deletedCount: deleted.count,
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'פעולה לא נתמכת' },
      { status: 400 }
    );
  } catch (error) {
    console.error('[Push Subscribe] Error:', error);

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `שגיאה בשמירת מנוי: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'שגיאה בלתי צפויה בשמירת מנוי' },
      { status: 500 }
    );
  }
}
