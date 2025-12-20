'use client';

import { Box } from '@mui/material';
import { motion } from 'framer-motion';
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
    transition: {
      duration: 0.6,
      ease: [0.4, 0, 0.2, 1],
      staggerChildren: 0.1,
    },
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
    <motion.div {...animationProps}>
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
    </motion.div>
  );
}
