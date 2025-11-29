import { auth } from '@/auth.config';
import createIntlMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const intlMiddleware = createIntlMiddleware({
  locales: ['he', 'en'],
  defaultLocale: 'he',
  localePrefix: 'as-needed', // Don't show /he prefix for default locale
  localeDetection: false, // Disable automatic locale detection from browser
});

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const pathname = req.nextUrl.pathname;

  // Remove locale prefix for checking
  const pathnameWithoutLocale = pathname.replace(/^\/(he|en)/, '') || '/';

  const isOnLoginPage = pathnameWithoutLocale.startsWith('/login');
  const isOnPublicPage = pathnameWithoutLocale === '/' ||
                         pathnameWithoutLocale.startsWith('/invite');

  // Apply i18n middleware first
  const response = intlMiddleware(req as NextRequest);

  // Allow public pages
  if (isOnPublicPage) {
    return response;
  }

  // Redirect to login if not authenticated
  if (!isLoggedIn && !isOnLoginPage) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Redirect to dashboard if logged in and on login page
  if (isLoggedIn && isOnLoginPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
