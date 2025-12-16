import { NextResponse } from 'next/server';

/**
 * Web Vitals Analytics Endpoint
 *
 * Receives Core Web Vitals metrics from the client-side WebVitalsReporter.
 * Currently logs to console; can be extended to send to analytics services
 * like Vercel Analytics, Google Analytics, or custom tracking.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Log to console for debugging (can be removed in production)
    console.log('[Web Vitals]', {
      name: body.name,
      value: body.value,
      rating: body.rating,
      id: body.id,
    });

    // TODO: Send to analytics service
    // Examples:
    // - await sendToVercelAnalytics(body);
    // - await sendToGoogleAnalytics(body);
    // - await prisma.webVitals.create({ data: body });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Web Vitals] Error processing metrics:', error);
    return NextResponse.json(
      { error: 'Failed to process web vitals' },
      { status: 500 }
    );
  }
}
