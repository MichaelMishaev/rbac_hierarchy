import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth.edge';

const intlMiddleware = createIntlMiddleware({
  locales: ['he', 'en'],
  defaultLocale: 'he',
  localePrefix: 'as-needed', // Don't show /he prefix for default locale
  localeDetection: false, // Disable automatic locale detection from browser
});

export default async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Remove locale prefix for checking
  const pathnameWithoutLocale = pathname.replace(/^\/(he|en)/, '') || '/';

  // Public pages that don't require authentication
  const isOnLoginPage = pathnameWithoutLocale.startsWith('/login');
  const isOnChangePasswordPage = pathnameWithoutLocale.startsWith('/change-password');
  const isOnPublicPage = pathnameWithoutLocale === '/' ||
                         pathnameWithoutLocale.startsWith('/invite') ||
                         isOnLoginPage;

  // Apply i18n middleware first
  const response = intlMiddleware(req);

  // Allow public pages without auth check
  if (isOnPublicPage) {
    return response;
  }

  // Check authentication for protected pages
  const session = await auth();

  if (!session || !session.user) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Check if password change is required (allow access to change-password page)
  if (session.user.requirePasswordChange && !isOnChangePasswordPage) {
    return NextResponse.redirect(new URL('/change-password', req.url));
  }

  // RBAC: Role-based route protection
  const userRole = session.user.role;

  // ACTIVIST-only routes
  if (pathnameWithoutLocale.startsWith('/activists/')) {
    if (userRole !== 'ACTIVIST') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Redirect admin/managers from /voters to /manage-voters
  if (userRole !== 'ACTIVIST' && pathnameWithoutLocale === '/voters') {
    return NextResponse.redirect(new URL('/manage-voters', req.url));
  }

  // ACTIVIST cannot access coordinator/admin routes
  if (userRole === 'ACTIVIST') {
    const blockedPaths = [
      '/dashboard',
      '/activists',
      '/neighborhoods',
      '/cities',
      '/areas',
      '/tasks',
      '/attendance',
      '/users',
      '/map',
      '/manage-voters', // Coordinators' voter management page
    ];

    if (blockedPaths.some(path => pathnameWithoutLocale.startsWith(path))) {
      return NextResponse.redirect(new URL('/voters', req.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png|logo\\.png).*)'],
};
