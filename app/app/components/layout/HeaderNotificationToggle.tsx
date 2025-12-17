'use client';

/**
 * Header Notification Toggle
 *
 * Compact notification toggle for header/navigation
 * Shows push notification status and allows quick enable/disable
 */

import { useState } from 'react';
import {
  IconButton,
  Tooltip,
  Badge,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { colors, borderRadius } from '@/lib/design-system';

export default function HeaderNotificationToggle() {
  const [showDialog, setShowDialog] = useState(false);
  const {
    isSubscribed,
    isLoading,
    isSupported,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return null;
  }

  const handleClick = () => {
    if (permission === 'denied') {
      setShowDialog(true);
      return;
    }

    if (isSubscribed) {
      // Show confirmation before disabling
      setShowDialog(true);
    } else {
      // Enable notifications
      subscribe().catch((error) => {
        console.error('Failed to subscribe:', error);
        setShowDialog(true);
      });
    }
  };

  const handleToggle = async () => {
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
      setShowDialog(false);
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const getTooltipText = () => {
    if (permission === 'denied') return 'התראות נחסמו בדפדפן';
    if (isSubscribed) return 'התראות פעילות - לחץ לכיבוי';
    return 'התראות כבויות - לחץ להפעלה';
  };

  const getIcon = () => {
    if (isLoading) return <CircularProgress size={24} sx={{ color: 'white' }} />;
    if (isSubscribed) return <NotificationsActiveIcon />;
    if (permission === 'denied') return <NotificationsOffIcon />;
    return <NotificationsIcon />;
  };

  const getColor = () => {
    if (isSubscribed) return colors.success;
    if (permission === 'denied') return colors.error;
    return colors.neutral[400];
  };

  return (
    <>
      <Tooltip title={getTooltipText()} arrow>
        <IconButton
          onClick={handleClick}
          disabled={isLoading}
          sx={{
            bgcolor: isSubscribed ? `${colors.success}20` : 'transparent',
            color: getColor(),
            '&:hover': {
              bgcolor: isSubscribed ? `${colors.success}30` : colors.neutral[100],
            },
          }}
          data-testid="header-notification-toggle"
        >
          <Badge
            color={isSubscribed ? 'success' : 'default'}
            variant="dot"
            invisible={!isSubscribed}
          >
            {getIcon()}
          </Badge>
        </IconButton>
      </Tooltip>

      {/* Confirmation/Help Dialog */}
      <Dialog
        open={showDialog}
        onClose={() => setShowDialog(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: `${borderRadius.large}px`,
            direction: 'rtl',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {isSubscribed ? (
            <>
              <NotificationsOffIcon color="warning" />
              <span>כיבוי התראות</span>
            </>
          ) : permission === 'denied' ? (
            <>
              <NotificationsOffIcon color="error" />
              <span>התראות חסומות</span>
            </>
          ) : (
            <>
              <NotificationsActiveIcon color="primary" />
              <span>הפעלת התראות</span>
            </>
          )}
        </DialogTitle>

        <DialogContent>
          {isSubscribed ? (
            <Typography>
              האם אתה בטוח שברצונך לכבות את ההתראות? לא תקבל עדכונים על משימות חדשות.
            </Typography>
          ) : permission === 'denied' ? (
            <Box>
              <Typography paragraph>
                התראות נחסמו על ידי הדפדפן. כדי להפעיל התראות:
              </Typography>
              <Typography component="ol" sx={{ pl: 3 }}>
                <li>לחץ על סמל המנעול בשורת הכתובת</li>
                <li>אפשר התראות (Notifications)</li>
                <li>רענן את הדף</li>
              </Typography>
            </Box>
          ) : (
            <Typography>
              הפעל התראות כדי לקבל עדכונים מיידיים על משימות חדשות, גם כאשר האפליקציה סגורה.
            </Typography>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          {permission !== 'denied' && (
            <Button
              variant="contained"
              onClick={handleToggle}
              disabled={isLoading}
              sx={{
                borderRadius: `${borderRadius.medium}px`,
                textTransform: 'none',
              }}
            >
              {isLoading
                ? 'מעבד...'
                : isSubscribed
                ? 'כן, כבה התראות'
                : 'הפעל התראות'}
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={() => setShowDialog(false)}
            sx={{
              borderRadius: `${borderRadius.medium}px`,
              textTransform: 'none',
            }}
          >
            {permission === 'denied' ? 'סגור' : 'ביטול'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
