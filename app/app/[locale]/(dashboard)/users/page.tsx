import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { listUsers } from '@/app/actions/users';
import { listCities } from '@/app/actions/cities';
import { listNeighborhoods } from '@/app/actions/neighborhoods';
import UsersClient from '@/app/components/users/UsersClient';

// Enable route caching - revalidate every 30 seconds
export const revalidate = 30;

export default async function UsersPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Fetch users, cities, and neighborhoods
  const [usersResult, citiesResult, neighborhoodsResult] = await Promise.all([
    listUsers(),
    listCities(),
    listNeighborhoods(),
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
      cities={citiesResult.success ? citiesResult.cities : []}
      neighborhoods={neighborhoodsResult.success ? neighborhoodsResult.neighborhoods : []}
      currentUserRole={session.user.role as 'SUPERADMIN' | 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR'}
    />
  );
}
