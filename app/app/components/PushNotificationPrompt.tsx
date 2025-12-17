'use client';

/**
 * Push Notification Prompt Component
 *
 * Shows a prominent dialog/banner prompting users to enable push notifications.
 * Appears automatically for users who haven't enabled notifications yet.
 *
 * Features:
 * - Auto-shows on first visit (if not subscribed)
 * - Dismissable (stores in localStorage)
 * - One-click enable
 * - Hebrew UI with clear instructions
 */

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Alert,
  Snackbar,
  Slide,
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { colors, borderRadius } from '@/lib/design-system';

const STORAGE_KEY = 'push-prompt-dismissed';
const SHOW_DELAY_MS = 3000; // Show after 3 seconds

function SlideTransition(props: TransitionProps & { children: React.ReactElement<any, any> }) {
  return <Slide {...props} direction="up" />;
}

export default function PushNotificationPrompt() {
  const [open, setOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  const {
    isSubscribed,
    isSupported,
    permission,
    subscribe,
    isLoading,
  } = usePushNotifications();

  useEffect(() => {
    // Don't show if:
    // 1. Push notifications not supported
    // 2. Already subscribed
    // 3. Permission denied
    // 4. User dismissed prompt
    if (!isSupported) return;
    if (isSubscribed) return;
    if (permission === 'denied') return;

    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') return;

    // Show prompt after delay
    const timer = setTimeout(() => {
      setOpen(true);
    }, SHOW_DELAY_MS);

    return () => clearTimeout(timer);
  }, [isSupported, isSubscribed, permission]);

  const handleEnable = async () => {
    try {
      await subscribe();
      setSnackbarMessage('✅ התראות דחיפה הופעלו בהצלחה!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
      setOpen(false);
      // Don't mark as dismissed - if they disable later, show again
    } catch (error: any) {
      console.error('Failed to enable push notifications:', error);
      setSnackbarMessage(error.message || 'שגיאה בהפעלת התראות');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  const handleRemindLater = () => {
    setOpen(false);
    // Don't set localStorage - will show again next session
  };

  if (!isSupported || isSubscribed || permission === 'denied') {
    return null;
  }

  return (
    <>
      <Dialog
        open={open}
        onClose={handleRemindLater}
        maxWidth="sm"
        fullWidth
        TransitionComponent={SlideTransition}
        PaperProps={{
          sx: {
            borderRadius: `${borderRadius.large}px`,
            direction: 'rtl',
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            pb: 1,
          }}
        >
          <NotificationsActiveIcon
            sx={{
              fontSize: 40,
              color: colors.primary,
            }}
          />
          <Typography variant="h5" component="div" fontWeight="bold">
            קבל התראות על משימות חדשות
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body1" paragraph>
            הפעל התראות דחיפה כדי לקבל עדכונים מיידיים כאשר:
          </Typography>

          <Box component="ul" sx={{ mr: 3, mb: 2 }}>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              📋 <strong>משימה חדשה נשלחה אליך</strong>
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              ⏰ <strong>תזכורת למשימה קרובה</strong>
            </Typography>
            <Typography component="li" variant="body1" sx={{ mb: 1 }}>
              ✅ <strong>עדכונים חשובים מהמערכת</strong>
            </Typography>
          </Box>

          <Alert severity="info" sx={{ borderRadius: `${borderRadius.medium}px` }}>
            <Typography variant="body2">
              💡 <strong>טיפ:</strong> ההתראות יופיעו גם כאשר האפליקציה סגורה!
            </Typography>
          </Alert>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            🔒 אפשר להפסיק את ההתראות בכל עת דרך הגדרות המערכת
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1, flexDirection: 'row-reverse' }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleEnable}
            disabled={isLoading}
            startIcon={<NotificationsActiveIcon />}
            sx={{
              flex: 1,
              borderRadius: `${borderRadius.medium}px`,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
            }}
          >
            {isLoading ? 'מפעיל...' : 'הפעל התראות'}
          </Button>

          <Button
            variant="outlined"
            size="large"
            onClick={handleRemindLater}
            sx={{
              borderRadius: `${borderRadius.medium}px`,
              textTransform: 'none',
            }}
          >
            אחר כך
          </Button>

          <Button
            variant="text"
            size="small"
            onClick={handleDismiss}
            startIcon={<CloseIcon />}
            sx={{
              color: 'text.secondary',
              textTransform: 'none',
            }}
          >
            אל תציג שוב
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          sx={{
            width: '100%',
            borderRadius: `${borderRadius.medium}px`,
            direction: 'rtl',
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
