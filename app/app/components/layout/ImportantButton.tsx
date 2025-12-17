'use client';

/**
 * Important Button
 *
 * Prominent button to show the push notification enable prompt
 * Displayed in the header for all users who haven't enabled push
 */

import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CampaignIcon from '@mui/icons-material/Campaign';
import CloseIcon from '@mui/icons-material/Close';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { colors, borderRadius } from '@/lib/design-system';

export default function ImportantButton() {
  const [open, setOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const {
    isSubscribed,
    isSupported,
    permission,
    subscribe,
    isLoading,
  } = usePushNotifications();

  // Don't show if already subscribed or not supported
  if (!isSupported || isSubscribed) {
    return null;
  }

  const handleEnable = async () => {
    try {
      await subscribe();
      setSnackbarMessage('✅ התראות הופעלו בהצלחה!');
      setOpen(false);
    } catch (error: any) {
      console.error('Failed to enable push notifications:', error);
      setSnackbarMessage(error.message || 'שגיאה בהפעלת התראות');
    }
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={() => setOpen(true)}
        startIcon={<CampaignIcon />}
        sx={{
          bgcolor: colors.error,
          color: 'white',
          fontWeight: 'bold',
          textTransform: 'none',
          borderRadius: `${borderRadius.medium}px`,
          px: { xs: 2, sm: 3 },
          fontSize: { xs: '0.875rem', sm: '1rem' },
          animation: 'pulse 2s infinite',
          '@keyframes pulse': {
            '0%, 100%': {
              transform: 'scale(1)',
              boxShadow: `0 0 0 0 ${colors.error}`,
            },
            '50%': {
              transform: 'scale(1.05)',
              boxShadow: `0 0 20px 5px ${colors.error}40`,
            },
          },
          '&:hover': {
            bgcolor: colors.errorDark,
            animation: 'none',
          },
        }}
        data-testid="important-button"
      >
        <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
          חשוב! הפעל התראות
        </Box>
        <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
          חשוב!
        </Box>
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: { xs: 0, sm: `${borderRadius.large}px` },
            direction: 'rtl',
            m: { xs: 0, sm: 2 },
            width: { xs: '100%', sm: 'auto' },
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            bgcolor: colors.errorLight,
            color: colors.error,
          }}
        >
          <CampaignIcon sx={{ fontSize: 40 }} />
          <Typography variant="h5" component="div" fontWeight="bold">
            חשוב! הפעל התראות עכשיו
          </Typography>
        </DialogTitle>

        <DialogContent sx={{ py: 3 }}>
          <Alert severity="error" sx={{ mb: 3, borderRadius: `${borderRadius.medium}px` }}>
            <Typography fontWeight="bold" gutterBottom>
              ⚠️ אתה עלול לפספס משימות חשובות!
            </Typography>
            <Typography variant="body2">
              בלי התראות, לא תקבל עדכונים כאשר משימה חדשה מוקצית לך.
            </Typography>
          </Alert>

          <Typography variant="h6" gutterBottom fontWeight="bold">
            למה להפעיל התראות?
          </Typography>

          <Box component="ul" sx={{ mr: 3, mb: 2 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              📋 <strong>קבל עדכון מיידי</strong> כאשר משימה חדשה נשלחה אליך
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              ⏰ <strong>אל תפספס תזכורות</strong> למשימות קרובות
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              ✅ <strong>היה מעודכן</strong> גם כאשר האפליקציה סגורה
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              🔔 <strong>התראות בזמן אמת</strong> גם במסך נעול
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: `${borderRadius.medium}px` }}>
            <Typography variant="body2">
              💡 <strong>טיפ:</strong> התראות עוזרות לך להישאר מעודכן ולא לפספס משימות חשובות.
              אפשר תמיד להפסיק בהגדרות.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            gap: 1,
            flexDirection: { xs: 'column', sm: 'row-reverse' },
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={handleEnable}
            disabled={isLoading}
            startIcon={<NotificationsActiveIcon />}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              bgcolor: colors.error,
              '&:hover': {
                bgcolor: colors.errorDark,
              },
              borderRadius: `${borderRadius.medium}px`,
              textTransform: 'none',
              fontWeight: 'bold',
              py: 1.5,
            }}
          >
            {isLoading ? 'מפעיל...' : 'כן, הפעל התראות עכשיו'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={() => setOpen(false)}
            startIcon={<CloseIcon />}
            sx={{
              width: { xs: '100%', sm: 'auto' },
              borderRadius: `${borderRadius.medium}px`,
              textTransform: 'none',
            }}
          >
            לא עכשיו
          </Button>
        </DialogActions>
      </Dialog>

      {snackbarMessage && (
        <Alert
          severity={snackbarMessage.includes('✅') ? 'success' : 'error'}
          onClose={() => setSnackbarMessage('')}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 9999,
            borderRadius: `${borderRadius.medium}px`,
          }}
        >
          {snackbarMessage}
        </Alert>
      )}
    </>
  );
}
