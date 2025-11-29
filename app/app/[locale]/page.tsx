import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';

export default async function LocaleHomePage() {
  const session = await auth();

  if (session) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
