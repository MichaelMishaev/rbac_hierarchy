import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { listErrors, getErrorTypes, getErrorStats } from '@/app/actions/admin-errors';
import ErrorsDashboardClient from '@/app/components/admin/ErrorsDashboardClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function ErrorsDashboardPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  // RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    return (
      <div dir="rtl" lang="he" style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>אין הרשאה</h1>
        <p>רק מנהל-על יכול לגשת לדף זה.</p>
      </div>
    );
  }

  // Parse search params
  const dateRange = (searchParams.dateRange as '24h' | '7d' | '30d' | 'custom') || '7d';
  const customDateFrom = searchParams.customDateFrom as string | undefined;
  const customDateTo = searchParams.customDateTo as string | undefined;
  const level = searchParams.level as any;
  const errorType = searchParams.errorType as string | undefined;
  const userEmail = searchParams.userEmail as string | undefined;
  const cityId = searchParams.cityId as string | undefined;
  const httpStatus = searchParams.httpStatus ? parseInt(searchParams.httpStatus as string) : undefined;
  const page = searchParams.page ? parseInt(searchParams.page as string) : 1;

  // Fetch data
  let errorsResult, errorTypes, stats;
  try {
    [errorsResult, errorTypes, stats] = await Promise.all([
      listErrors({
        dateRange,
        customDateFrom,
        customDateTo,
        level,
        errorType,
        userEmail,
        cityId,
        httpStatus,
        page,
        limit: 50,
      }),
      getErrorTypes(),
      getErrorStats(7),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load errors';
    return (
      <div dir="rtl" lang="he" style={{ padding: '2rem' }}>
        <h1>שגיאה בטעינת נתונים</h1>
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <ErrorsDashboardClient
      errors={errorsResult.errors}
      total={errorsResult.total}
      page={errorsResult.page}
      totalPages={errorsResult.totalPages}
      errorTypes={errorTypes}
      stats={stats}
      initialFilters={{
        dateRange,
        customDateFrom,
        customDateTo,
        level,
        errorType,
        userEmail,
        cityId,
        httpStatus,
      }}
    />
  );
}
