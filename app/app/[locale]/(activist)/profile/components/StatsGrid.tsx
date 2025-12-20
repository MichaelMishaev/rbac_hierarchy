'use client';

import { motion } from 'framer-motion';
import { Grid2, Card, CardContent, Typography, Box } from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import { useEffect, useState } from 'react';

interface StatsGridProps {
  stats: {
    totalVoters: number;
    supporterVoters: number;
    totalAttendance: number;
    daysActive: number;
  };
}

interface StatCardConfig {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  borderColor: string;
  iconColor: string;
  textColor: string;
}

// Number counter animation hook
function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number;
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);

      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(easeOut * end));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [end, duration]);

  return count;
}

function StatCard({ config, index }: { config: StatCardConfig; index: number }) {
  const animatedValue = useCountUp(config.value);
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.1,
        type: 'spring',
        stiffness: 100,
        damping: 15,
      }}
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { type: 'spring', stiffness: 300, damping: 20 },
      }}
      whileTap={{ scale: 0.98 }}
    >
      <Card
        sx={{
          background: config.gradient,
          borderRadius: borderRadius['2xl'],
          border: `2px solid ${config.borderColor}`,
          boxShadow: shadows.soft,
          height: '100%',
          minHeight: { xs: '130px', md: '150px' },
          transition: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default',
          '&:hover': {
            boxShadow: shadows.medium,
          },
        }}
      >
        <CardContent
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            textAlign: 'center',
            padding: { xs: 2, md: 3 },
          }}
        >
          {/* Icon */}
          <Box
            sx={{
              width: { xs: 48, md: 56 },
              height: { xs: 48, md: 56 },
              borderRadius: borderRadius.full,
              bgcolor: 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              boxShadow: shadows.soft,
            }}
          >
            <Icon
              sx={{
                fontSize: { xs: 28, md: 32 },
                color: config.iconColor,
              }}
            />
          </Box>

          {/* Number */}
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2.5rem', md: '3rem' },
              color: config.textColor,
              lineHeight: 1,
              mb: 0.5,
              fontFamily: 'Poppins, sans-serif',
            }}
          >
            {animatedValue.toLocaleString('he-IL')}
          </Typography>

          {/* Label */}
          <Typography
            variant="body2"
            sx={{
              fontWeight: 600,
              color: config.textColor,
              opacity: 0.8,
              fontSize: { xs: '0.875rem', md: '1rem' },
            }}
          >
            {config.label}
          </Typography>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StatsGrid({ stats }: StatsGridProps) {
  const statCards: StatCardConfig[] = [
    {
      label: 'בוחרים שהוספתי',
      value: stats.totalVoters,
      icon: PeopleIcon,
      gradient: colors.gradients.pastelBlue,
      borderColor: '#E8E8FF',
      iconColor: colors.primary.main,
      textColor: colors.primary.dark,
    },
    {
      label: 'תומכים',
      value: stats.supporterVoters,
      icon: ThumbUpIcon,
      gradient: colors.gradients.pastelGreen,
      borderColor: '#CCF8E6',
      iconColor: colors.status.green,
      textColor: colors.status.green,
    },
    {
      label: 'ימי נוכחות',
      value: stats.totalAttendance,
      icon: CheckCircleIcon,
      gradient: 'linear-gradient(135deg, #F8F5FF 0%, #F0EBFF 100%)',
      borderColor: '#F0EBFF',
      iconColor: colors.status.purple,
      textColor: colors.status.purple,
    },
    {
      label: 'ימי פעילות',
      value: stats.daysActive,
      icon: CalendarMonthIcon,
      gradient: 'linear-gradient(135deg, #FFF8E8 0%, #FFEBD6 100%)',
      borderColor: '#FFEBD6',
      iconColor: colors.status.orange,
      textColor: colors.status.orange,
    },
  ];

  return (
    <Grid2 container spacing={2} dir="rtl">
      {statCards.map((config, index) => (
        <Grid2 key={config.label} size={{ xs: 6, md: 3 }}>
          <StatCard config={config} index={index} />
        </Grid2>
      ))}
    </Grid2>
  );
}
