import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/auth.config';

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

  if (!session) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|sw.js|icon-.*\\.png).*)'],
};
