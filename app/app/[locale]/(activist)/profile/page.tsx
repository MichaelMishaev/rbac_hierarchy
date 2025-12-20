import { redirect } from 'next/navigation';
import { auth, getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ProfileClient from './ProfileClient';

export default async function ActivistProfilePage() {
  const session = await auth();

  // CRITICAL: Only ACTIVIST role
  if (!session || session.user.role !== 'ACTIVIST') {
    redirect('/login');
  }

  // Get full user data including activist profile
  const user = await getCurrentUser();

  if (!user.activistProfile) {
    console.error('[ActivistProfilePage] CRITICAL: ACTIVIST user without activistProfile!');
    console.error('[ActivistProfilePage] User ID:', user.id, 'Email:', user.email);
    redirect('/login');
  }

  const activistId = user.activistProfile.id;

  // Parallel data fetching for performance
  const [voterStats, attendanceStats, recentActivity] = await Promise.all([
    // Voter statistics
    prisma.voter.findMany({
      where: {
        insertedByUserId: user.id,
        isActive: true,
      },
      select: {
        supportLevel: true,
        insertedAt: true,
      },
    }),

    // Attendance statistics
    prisma.attendanceRecord.findMany({
      where: {
        activistId,
      },
      select: {
        checkedInAt: true,
        status: true,
      },
      orderBy: {
        checkedInAt: 'desc',
      },
    }),

    // Recent activity (last 20 actions)
    Promise.all([
      // Recent voters added
      prisma.voter.findMany({
        where: {
          insertedByUserId: user.id,
          isActive: true,
        },
        select: {
          id: true,
          fullName: true,
          supportLevel: true,
          insertedAt: true,
        },
        orderBy: {
          insertedAt: 'desc',
        },
        take: 10,
      }),
      // Recent attendance
      prisma.attendanceRecord.findMany({
        where: {
          activistId,
        },
        select: {
          id: true,
          checkedInAt: true,
          status: true,
        },
        orderBy: {
          checkedInAt: 'desc',
        },
        take: 10,
      }),
    ]),
  ]);

  // Calculate statistics
  const stats = {
    totalVoters: voterStats.length,
    supporterVoters: voterStats.filter((v) => v.supportLevel === 'תומך').length,
    hesitantVoters: voterStats.filter((v) => v.supportLevel === 'מהסס').length,
    opposedVoters: voterStats.filter((v) => v.supportLevel === 'מתנגד').length,
    noAnswerVoters: voterStats.filter((v) => v.supportLevel === 'לא ענה').length,
    totalAttendance: attendanceStats.filter((a) => a.status === 'PRESENT').length,
    daysActive: new Set(
      attendanceStats
        .filter((a) => a.checkedInAt)
        .map((a) => a.checkedInAt!.toISOString().split('T')[0])
    ).size,
  };

  // Merge and sort recent activity
  const recentVoters = recentActivity[0];
  const recentAttendance = recentActivity[1];

  const mergedActivity = [
    ...recentVoters.map((v) => ({
      type: 'VOTER_ADDED' as const,
      timestamp: v.insertedAt,
      data: {
        voterName: v.fullName,
        supportLevel: v.supportLevel || undefined,
      },
    })),
    ...recentAttendance
      .filter((a) => a.checkedInAt)
      .map((a) => ({
        type: 'ATTENDANCE' as const,
        timestamp: a.checkedInAt!,
        data: {},
      })),
  ]
    .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
    .slice(0, 20);

  return (
    <ProfileClient
      user={{
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        avatarUrl: user.avatarUrl,
        neighborhood: user.activistProfile.neighborhood.name,
        city: user.activistProfile.city.name,
      }}
      stats={stats}
      recentActivity={mergedActivity.map((a) => ({
        ...a,
        timestamp: a.timestamp.toISOString(),
      }))}
    />
  );
}
