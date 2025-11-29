'use client';

import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Avatar,
} from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupIcon from '@mui/icons-material/Group';
import MailIcon from '@mui/icons-material/Mail';
import { formatDistanceToNow } from 'date-fns';

export type ActivityItem = {
  id: string;
  action: string;
  entity: string;
  userEmail: string | null;
  userRole: string | null;
  createdAt: Date;
};

export type RecentActivityProps = {
  activities: ActivityItem[];
  maxItems?: number;
};

export default function RecentActivity({ activities, maxItems = 10 }: RecentActivityProps) {
  const displayActivities = activities.slice(0, maxItems);

  // Get icon based on entity type
  const getEntityIcon = (entity: string) => {
    switch (entity.toLowerCase()) {
      case 'corporation':
        return <BusinessIcon />;
      case 'user':
        return <PersonIcon />;
      case 'site':
        return <LocationOnIcon />;
      case 'worker':
        return <GroupIcon />;
      case 'invitation':
        return <MailIcon />;
      default:
        return <BusinessIcon />;
    }
  };

  // Get color based on action
  const getActionColor = (action: string) => {
    if (action.includes('CREATE')) return colors.success;
    if (action.includes('UPDATE')) return colors.info;
    if (action.includes('DELETE')) return colors.error;
    return colors.neutral[600];
  };

  // Format action text
  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <Box
      sx={{
        background: colors.neutral[0],
        borderRadius: borderRadius.xl,
        boxShadow: shadows.soft,
        border: `1px solid ${colors.neutral[200]}`,
        p: 3,
        height: '100%',
      }}
    >
      <Typography
        variant="h6"
        sx={{
          fontWeight: 600,
          color: colors.neutral[800],
          mb: 3,
        }}
      >
        Recent Activity
      </Typography>

      {displayActivities.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            color: colors.neutral[400],
          }}
        >
          <Typography variant="body2">No recent activity</Typography>
        </Box>
      ) : (
        <List sx={{ p: 0 }}>
          {displayActivities.map((activity, index) => (
            <ListItem
              key={activity.id}
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: borderRadius.lg,
                mb: index < displayActivities.length - 1 ? 1 : 0,
                transition: 'all 200ms ease',
                '&:hover': {
                  backgroundColor: colors.neutral[50],
                  transform: 'translateX(4px)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 48 }}>
                <Avatar
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: colors.pastel.blueLight,
                    color: colors.pastel.blue,
                  }}
                >
                  {getEntityIcon(activity.entity)}
                </Avatar>
              </ListItemIcon>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: colors.neutral[800],
                      }}
                    >
                      {formatAction(activity.action)}
                    </Typography>
                    <Chip
                      label={activity.entity}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '11px',
                        fontWeight: 600,
                        backgroundColor: colors.neutral[100],
                        color: colors.neutral[600],
                      }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[500],
                      }}
                    >
                      by {activity.userEmail || 'System'}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[400],
                      }}
                    >
                      •
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[500],
                      }}
                    >
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                    </Typography>
                  </Box>
                }
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
}
