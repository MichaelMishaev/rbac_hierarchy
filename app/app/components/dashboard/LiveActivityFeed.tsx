/**
 * Live Activity Feed Component
 * Displays real-time campaign events in a scrollable feed
 *
 * Features:
 * - Animated entry for new events
 * - Connection status indicator
 * - Event icons and colors
 * - Hebrew RTL support
 * - Relative timestamps
 */

'use client';

import { Box, List, ListItem, ListItemAvatar, Avatar, ListItemText, Chip, Typography, CircularProgress } from '@mui/material';
import { colors, shadows } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import AssignmentIcon from '@mui/icons-material/Assignment';
import WifiIcon from '@mui/icons-material/Wifi';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import { useLiveFeed, type LiveEvent } from '@/app/hooks/useLiveFeed';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

const getEventIcon = (type: LiveEvent['type']) => {
  switch (type) {
    case 'check_in':
      return <CheckCircleIcon sx={{ color: colors.status.green }} />;
    case 'check_out':
      return <LogoutIcon sx={{ color: colors.status.orange }} />;
    case 'task_complete':
      return <AssignmentTurnedInIcon sx={{ color: colors.primary.main }} />;
    case 'activist_added':
      return <PersonAddIcon sx={{ color: colors.status.purple }} />;
    case 'task_assigned':
      return <AssignmentIcon sx={{ color: colors.status.blue }} />;
    default:
      return null;
  }
};

const getEventText = (event: LiveEvent): string => {
  switch (event.type) {
    case 'check_in':
      return `${event.data.activist_name} נכנס לנוכחות - ${event.data.neighborhood}`;
    case 'check_out':
      return `${event.data.activist_name} יצא מנוכחות - ${event.data.neighborhood}`;
    case 'task_complete':
      return `${event.data.user_name} השלים משימה: ${event.data.task_title}`;
    case 'activist_added':
      return `פעיל חדש נוסף: ${event.data.activist_name} - ${event.data.neighborhood}`;
    case 'task_assigned':
      return `משימה חדשה הוקצתה: ${event.data.task_title}`;
    default:
      return 'פעילות חדשה';
  }
};

const getEventColor = (type: LiveEvent['type']): string => {
  switch (type) {
    case 'check_in':
      return colors.status.green;
    case 'check_out':
      return colors.status.orange;
    case 'task_complete':
      return colors.primary.main;
    case 'activist_added':
      return colors.status.purple;
    case 'task_assigned':
      return colors.status.blue;
    default:
      return colors.neutral[600];
  }
};

export default function LiveActivityFeed() {
  const { events, isConnected, error } = useLiveFeed();

  return (
    <Box>
      {/* Connection Status */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          mb: 2,
          p: 1.5,
          borderRadius: '12px',
          bgcolor: isConnected ? colors.pastel.greenLight : colors.pastel.orangeLight,
        }}
      >
        {isConnected ? (
          <WifiIcon sx={{ color: colors.status.green, fontSize: 20 }} />
        ) : (
          <WifiOffIcon sx={{ color: colors.status.orange, fontSize: 20 }} />
        )}
        <Typography variant="body2" fontWeight={600} sx={{ color: isConnected ? colors.status.green : colors.status.orange }}>
          {isConnected ? 'מחובר לזמן אמת' : 'מתחבר מחדש...'}
        </Typography>
        {!isConnected && <CircularProgress size={16} sx={{ color: colors.status.orange }} />}
      </Box>

      {/* Error Message */}
      {error && (
        <Box sx={{ mb: 2, p: 2, bgcolor: colors.pastel.redLight, borderRadius: '12px' }}>
          <Typography variant="body2" color="error">
            {error}
          </Typography>
        </Box>
      )}

      {/* Activity Feed */}
      {events.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body1" color="text.secondary">
            אין פעילות אחרונה
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            פעילויות חדשות יופיעו כאן בזמן אמת
          </Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {events.map((event, index) => (
            <ListItem
              key={`${event.timestamp}-${index}`}
              sx={{
                borderRadius: '12px',
                mb: 1,
                bgcolor: index === 0 ? colors.pastel.blueLight : colors.neutral[50],
                animation: index === 0 ? 'slideIn 0.3s ease' : 'none',
                '@keyframes slideIn': {
                  '0%': {
                    transform: 'translateX(-20px)',
                    opacity: 0,
                  },
                  '100%': {
                    transform: 'translateX(0)',
                    opacity: 1,
                  },
                },
                border: `1px solid ${colors.neutral[200]}`,
                transition: 'all 0.3s ease',
                '&:hover': {
                  bgcolor: colors.pastel.blueLight,
                  transform: 'translateY(-2px)',
                  boxShadow: shadows.medium,
                },
              }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: getEventColor(event.type) + '20' }}>
                  {getEventIcon(event.type)}
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={getEventText(event)}
                secondary={formatDistanceToNow(new Date(event.timestamp), {
                  addSuffix: true,
                  locale: he,
                })}
                primaryTypographyProps={{
                  fontWeight: index === 0 ? 700 : 400,
                  fontSize: '0.9rem',
                }}
                secondaryTypographyProps={{
                  fontSize: '0.75rem',
                }}
              />
              {index === 0 && (
                <Chip
                  label="חדש"
                  size="small"
                  sx={{
                    bgcolor: colors.primary.main,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: '0.7rem',
                  }}
                />
              )}
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
