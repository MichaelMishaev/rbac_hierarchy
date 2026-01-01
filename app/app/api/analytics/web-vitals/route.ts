import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/api-auth';
import { withErrorHandler } from '@/lib/error-handler';

/**
 * Web Vitals Analytics Endpoint
 *
 * Receives Core Web Vitals metrics from the client-side WebVitalsReporter.
 * Currently logs to console; can be extended to send to analytics services
 * like Vercel Analytics, Google Analytics, or custom tracking.
 *
 * ✅ SECURITY FIX (VULN-RBAC-001): Restricted to SUPERADMIN and AREA_MANAGER
 */
export const POST = withErrorHandler(async (request: Request) => {
  // ✅ SECURITY FIX (VULN-RBAC-001): Require SUPERADMIN or AREA_MANAGER role
  const authResult = await requireRole(request, ['SUPERADMIN', 'AREA_MANAGER']);
  if (authResult instanceof NextResponse) return authResult;

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
});
