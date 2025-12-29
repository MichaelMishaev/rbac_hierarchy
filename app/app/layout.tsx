import type { Metadata, Viewport } from 'next';
import { Providers } from '@/lib/providers';
import WebVitalsReporter from './components/WebVitalsReporter';
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration';
import OfflineBanner from './components/OfflineBanner';
import PwaInstallPrompt from './components/PwaInstallPrompt';
import ToastProvider from './components/ui/ToastProvider';
import './globals.css';

export const metadata: Metadata = {
  title: 'מערכת ניהול שטח בחירות - Election Campaign Management',
  description: 'מערכת ניהול פעילויות בחירות וניהול פעילים במגרשים - Campaign field operations platform',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'שטח בחירות',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#6161FF',
};

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale?: string }>;
}>) {
  const { locale } = await params;
  const lang = locale || 'he'; // Default to Hebrew (Hebrew-first system)
  const dir = lang === 'he' ? 'rtl' : 'ltr';

  return (
    <html lang={lang} dir={dir} suppressHydrationWarning>
      <body suppressHydrationWarning>
        <WebVitalsReporter />
        <ServiceWorkerRegistration />
        <OfflineBanner />
        <PwaInstallPrompt />
        <Providers>{children}</Providers>
        <ToastProvider />
      </body>
    </html>
  );
}
