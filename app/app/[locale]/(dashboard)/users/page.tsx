import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { listUsers } from '@/app/actions/users';
import { listCities } from '@/app/actions/cities';
import { listNeighborhoods } from '@/app/actions/neighborhoods';
import { getCurrentUser } from '@/lib/auth';
import UsersClient from '@/app/components/users/UsersClient';

// Force dynamic rendering to prevent stale cache after deletions
export const dynamic = 'force-dynamic';

export default async function UsersPage() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // Get current user with role relations to extract cityId
  const currentUser = await getCurrentUser();

  // Extract cityId based on role
  let currentUserCityId: string | null = null;
  if (currentUser.role === 'CITY_COORDINATOR' && currentUser.coordinatorOf.length > 0) {
    currentUserCityId = currentUser.coordinatorOf[0]?.cityId ?? null;
  } else if (currentUser.role === 'ACTIVIST_COORDINATOR' && currentUser.activistCoordinatorOf.length > 0) {
    currentUserCityId = currentUser.activistCoordinatorOf[0]?.cityId ?? null;
  }

  // Fetch users, cities, and neighborhoods
  let usersResult, citiesResult, neighborhoodsResult;
  try {
    [usersResult, citiesResult, neighborhoodsResult] = await Promise.all([
      listUsers(),
      listCities(),
      listNeighborhoods(),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load data';
    return (
      <div>
        <p>Error loading users: {errorMessage}</p>
      </div>
    );
  }

  return (
    <UsersClient
      users={usersResult.users}
      cities={citiesResult.cities || []}
      neighborhoods={neighborhoodsResult.neighborhoods || []}
      currentUserRole={session.user.role as 'SUPERADMIN' | 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR'}
      currentUserCityId={currentUserCityId}
    />
  );
}
