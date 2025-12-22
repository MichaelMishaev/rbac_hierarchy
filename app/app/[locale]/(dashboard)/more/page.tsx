/**
 * More Page - Mobile Navigation Overflow
 * Shows additional menu items organized in collapsible groups
 */

import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import MorePageClient from './MorePageClient';

export default async function MorePage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  const role = session.user.role;
  const userEmail = session.user.email;

  return <MorePageClient role={role} userEmail={userEmail} />;
}
