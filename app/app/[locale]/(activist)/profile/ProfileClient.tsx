'use client';

import { Box } from '@mui/material';
// 🚀 PERFORMANCE: Dynamic import of framer-motion saves ~350KB from initial bundle
import { MotionDiv, staggerTransition } from '@/app/components/ui/DynamicMotion';
import { ProfileHeader } from './components/ProfileHeader';
import { StatsGrid } from './components/StatsGrid';
import { QuickActions } from './components/QuickActions';
import { ActivityTimeline } from './components/ActivityTimeline';

interface ProfileClientProps {
  user: {
    fullName: string;
    email: string;
    phone: string | null;
    avatarUrl: string | null;
    neighborhood: string;
    city: string;
  };
  stats: {
    totalVoters: number;
    supporterVoters: number;
    hesitantVoters: number;
    opposedVoters: number;
    noAnswerVoters: number;
    totalAttendance: number;
    daysActive: number;
  };
  recentActivity: Array<{
    type: 'VOTER_ADDED' | 'ATTENDANCE';
    timestamp: string;
    data: {
      voterName?: string;
      supportLevel?: string;
    };
  }>;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: staggerTransition,
  },
};

export default function ProfileClient({ user, stats, recentActivity }: ProfileClientProps) {
  // Respect user's motion preferences
  const shouldReduceMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const animationProps = shouldReduceMotion
    ? {}
    : { initial: 'initial', animate: 'animate', variants: pageVariants };

  return (
    <MotionDiv {...animationProps}>
      <Box dir="rtl" lang="he">
        {/* Header with glassmorphism */}
        <ProfileHeader user={user} />

        {/* Stats Grid */}
        <Box sx={{ mt: 3 }}>
          <StatsGrid stats={stats} />
        </Box>

        {/* Quick Actions */}
        <Box sx={{ mt: 3 }}>
          <QuickActions />
        </Box>

        {/* Activity Timeline */}
        <Box sx={{ mt: 3 }}>
          <ActivityTimeline activities={recentActivity} />
        </Box>
      </Box>
    </MotionDiv>
  );
}
