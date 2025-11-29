import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { listUsers } from '@/app/actions/users';
import { listCorporations } from '@/app/actions/corporations';
import UsersClient from '@/app/components/users/UsersClient';

export default async function UsersPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch users and corporations
  const [usersResult, corporationsResult] = await Promise.all([
    listUsers(),
    listCorporations(),
  ]);

  if (!usersResult.success) {
    return (
      <div>
        <p>Error loading users: {usersResult.error}</p>
      </div>
    );
  }

  return (
    <UsersClient
      users={usersResult.users}
      corporations={corporationsResult.success ? corporationsResult.corporations : []}
      currentUserRole={session.user.role as 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR'}
    />
  );
}
