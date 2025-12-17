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
import { he } from 'date-fns/locale';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('dashboard');
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

  // Format action text in Hebrew
  const formatAction = (action: string) => {
    const actionMap: Record<string, string> = {
      'CREATE': 'יצירה',
      'UPDATE': 'עדכון',
      'DELETE': 'מחיקה',
      'CREATE_WORKER': 'יצירת פעיל',
      'UPDATE_WORKER': 'עדכון פעיל',
      'DELETE_WORKER': 'מחיקת פעיל',
      'CREATE_CITY': 'יצירת עיר',
      'UPDATE_CITY': 'עדכון עיר',
      'DELETE_CITY': 'מחיקת עיר',
      'CREATE_NEIGHBORHOOD': 'יצירת שכונה',
      'UPDATE_NEIGHBORHOOD': 'עדכון שכונה',
      'DELETE_NEIGHBORHOOD': 'מחיקת שכונה',
      'CREATE_USER': 'יצירת משתמש',
      'UPDATE_USER': 'עדכון משתמש',
      'DELETE_USER': 'מחיקת משתמש',
    };
    return actionMap[action] || action;
  };

  // Format entity type in Hebrew
  const formatEntity = (entity: string) => {
    const entityMap: Record<string, string> = {
      'Worker': 'פעיל',
      'City': 'עיר',
      'Neighborhood': 'שכונה',
      'User': 'משתמש',
      'Invitation': 'הזמנה',
      'Corporation': 'עיר',
      'Site': 'שכונה',
    };
    return entityMap[entity] || entity;
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
        direction: 'rtl',
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
        {t('recentActivity')}
      </Typography>

      {displayActivities.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 6,
            color: colors.neutral[400],
          }}
        >
          <Typography variant="body2">{t('noActivity')}</Typography>
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
                      label={formatEntity(activity.entity)}
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
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.neutral[500],
                      }}
                    >
                      {activity.userEmail || 'מערכת'}
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.neutral[400],
                      }}
                    >
                      •
                    </Box>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.75rem',
                        color: colors.neutral[500],
                      }}
                    >
                      {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: he })}
                    </Box>
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
