import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import ToastProvider from '@/app/components/ui/ToastProvider';
import { VersionChecker } from '@/app/components/ui/VersionChecker';

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Validate locale
  const locales = ['he', 'en'];
  if (!locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
      <ToastProvider />
      <VersionChecker />
    </NextIntlClientProvider>
  );
}
