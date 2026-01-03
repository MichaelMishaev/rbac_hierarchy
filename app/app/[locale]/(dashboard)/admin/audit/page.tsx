import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { listAuditLogs, getEntityTypes, getAuditStats } from '@/app/actions/admin-audit';
import AuditLogsDashboardClient from '@/app/components/admin/AuditLogsDashboardClient';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default async function AuditLogsDashboardPage({
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
  const action = searchParams.action as 'CREATE' | 'UPDATE' | 'DELETE' | undefined;
  const entity = searchParams.entity as string | undefined;
  const entityId = searchParams.entityId as string | undefined;
  const userEmail = searchParams.userEmail as string | undefined;
  const cityId = searchParams.cityId as string | undefined;
  const page = searchParams.page ? parseInt(searchParams.page as string) : 1;

  // Fetch data
  let logsResult, entityTypes, stats;
  try {
    [logsResult, entityTypes, stats] = await Promise.all([
      listAuditLogs({
        dateRange,
        customDateFrom,
        customDateTo,
        action,
        entity,
        entityId,
        userEmail,
        cityId,
        page,
        limit: 50,
      }),
      getEntityTypes(),
      getAuditStats(7),
    ]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load audit logs';
    return (
      <div dir="rtl" lang="he" style={{ padding: '2rem' }}>
        <h1>שגיאה בטעינת נתונים</h1>
        <p>{errorMessage}</p>
      </div>
    );
  }

  return (
    <AuditLogsDashboardClient
      logs={logsResult.logs}
      total={logsResult.total}
      page={logsResult.page}
      totalPages={logsResult.totalPages}
      entityTypes={entityTypes}
      stats={stats}
      initialFilters={{
        dateRange,
        customDateFrom,
        customDateTo,
        action,
        entity,
        entityId,
        userEmail,
        cityId,
      }}
    />
  );
}
