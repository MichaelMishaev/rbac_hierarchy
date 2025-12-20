'use client';

import { motion } from 'framer-motion';
import { Box, Card, CardContent, Typography, Avatar, Divider } from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

interface Activity {
  type: 'VOTER_ADDED' | 'ATTENDANCE';
  timestamp: string;
  data: {
    voterName?: string;
    supportLevel?: string;
  };
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const activityConfig = {
  VOTER_ADDED: {
    icon: PersonAddIcon,
    color: colors.status.green,
    bgColor: colors.pastel.greenLight,
    getLabel: (data: Activity['data']) => `הוספת בוחר: ${data.voterName || 'לא ידוע'}`,
    getSubLabel: (data: Activity['data']) => {
      const supportLabels: Record<string, string> = {
        תומך: '🟢 תומך',
        מהסס: '🟡 מהסס',
        מתנגד: '🔴 מתנגד',
        'לא ענה': '⚪ לא ענה',
      };
      return supportLabels[data.supportLevel || ''] || data.supportLevel || '';
    },
  },
  ATTENDANCE: {
    icon: CheckCircleIcon,
    color: colors.status.blue,
    bgColor: colors.pastel.blueLight,
    getLabel: () => 'רישום נוכחות',
    getSubLabel: () => 'נרשמת בהצלחה',
  },
};

function ActivityItem({ activity, index }: { activity: Activity; index: number }) {
  const config = activityConfig[activity.type];
  const Icon = config.icon;

  // Format timestamp to Hebrew relative time
  const relativeTime = formatDistanceToNow(new Date(activity.timestamp), {
    addSuffix: true,
    locale: he,
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }} // RTL: from left
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Card
        sx={{
          mb: 2,
          borderRadius: borderRadius.xl,
          border: `1px solid ${colors.neutral[200]}`,
          boxShadow: shadows.soft,
          background: colors.neutral[0],
          position: 'relative',
          overflow: 'visible',
          transition: 'all 250ms ease',
          '&:hover': {
            boxShadow: shadows.medium,
            transform: 'translateY(-2px)',
          },
          // RTL: Accent bar on right
          '&::before': {
            content: '""',
            position: 'absolute',
            right: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            background: config.color,
            borderRadius: `0 ${borderRadius.xl} ${borderRadius.xl} 0`,
          },
        }}
      >
        <CardContent sx={{ py: 2, px: 2 }}>
          <Box display="flex" alignItems="center" gap={2}>
            {/* Icon */}
            <Avatar
              sx={{
                bgcolor: config.bgColor,
                width: 48,
                height: 48,
              }}
            >
              <Icon sx={{ color: config.color, fontSize: 24 }} />
            </Avatar>

            {/* Content */}
            <Box flex={1}>
              <Typography
                variant="body1"
                sx={{
                  fontWeight: 600,
                  color: colors.neutral[800],
                  mb: 0.5,
                }}
              >
                {config.getLabel(activity.data)}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: colors.neutral[600],
                  fontSize: '0.875rem',
                }}
              >
                {config.getSubLabel(activity.data)}
              </Typography>
            </Box>

            {/* Timestamp */}
            <Typography
              variant="caption"
              sx={{
                color: colors.neutral[500],
                fontSize: '0.75rem',
                whiteSpace: 'nowrap',
              }}
            >
              {relativeTime}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function ActivityTimeline({ activities }: ActivityTimelineProps) {
  return (
    <Box dir="rtl" lang="he">
      {/* Header */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: colors.neutral[900],
          mb: 2,
        }}
      >
        📋 פעילות אחרונה
      </Typography>

      <Divider sx={{ mb: 2 }} />

      {/* Timeline */}
      {activities.length === 0 ? (
        <Card
          sx={{
            borderRadius: borderRadius.xl,
            border: `1px solid ${colors.neutral[200]}`,
            boxShadow: 'none',
          }}
        >
          <CardContent>
            <Typography
              variant="body1"
              color="text.secondary"
              textAlign="center"
              sx={{ py: 3 }}
            >
              אין פעילות לתצוגה
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Box>
          {activities.map((activity, index) => (
            <ActivityItem
              key={`${activity.type}-${activity.timestamp}-${index}`}
              activity={activity}
              index={index}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
