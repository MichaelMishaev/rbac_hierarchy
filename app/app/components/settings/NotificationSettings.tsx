'use client';

/**
 * Notification Settings Component
 *
 * Provides UI for:
 * 1. PWA installation (Add to Home Screen)
 * 2. Push notification subscription
 *
 * Hebrew, RTL interface
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import InstallMobileIcon from '@mui/icons-material/InstallMobile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors, borderRadius } from '@/lib/design-system';

export default function NotificationSettings() {
  // Push notifications state
  const {
    isSubscribed,
    isLoading: isPushLoading,
    isSupported: isPushSupported,
    permission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  // PWA install state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  // Messages
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Listen for PWA install prompt
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log('[PWA Install] Install prompt ready');
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log('[PWA Install] App installed successfully');
      showSuccess('האפליקציה הותקנה בהצלחה!');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      console.log('[PWA Install] App is already installed');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setErrorMessage(null);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (message: string) => {
    setErrorMessage(message);
    setSuccessMessage(null);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  // Handle PWA install
  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      showError('לא ניתן להתקין את האפליקציה כעת');
      return;
    }

    setIsInstalling(true);

    try {
      // Show install prompt
      deferredPrompt.prompt();

      // Wait for user choice
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === 'accepted') {
        console.log('[PWA Install] User accepted install');
        showSuccess('האפליקציה הותקנה בהצלחה!');
        setIsInstalled(true);
        setIsInstallable(false);
      } else {
        console.log('[PWA Install] User dismissed install');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('[PWA Install] Install failed:', error);
      showError('שגיאה בהתקנת האפליקציה');
    } finally {
      setIsInstalling(false);
    }
  };

  // Handle push notification toggle
  const handleNotificationToggle = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = event.target.checked;

    try {
      if (enabled) {
        const success = await subscribe();
        if (success) {
          showSuccess('התראות הופעלו בהצלחה! תקבל התראות על משימות חדשות');
        } else {
          showError('שגיאה בהפעלת התראות. אנא נסה שוב');
        }
      } else {
        const success = await unsubscribe();
        if (success) {
          showSuccess('התראות בוטלו בהצלחה');
        } else {
          showError('שגיאה בביטול התראות');
        }
      }
    } catch (error) {
      console.error('[Notification Toggle] Error:', error);
      showError('שגיאה בשינוי הגדרות התראות');
    }
  };

  return (
    <Box sx={{ maxWidth: 800, margin: '0 auto', p: 3 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 700,
          color: colors.primary,
          textAlign: 'right',
        }}
      >
        🔔 הגדרות התראות
      </Typography>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert severity="success" sx={{ mb: 3, textAlign: 'right' }}>
          {successMessage}
        </Alert>
      )}
      {errorMessage && (
        <Alert severity="error" sx={{ mb: 3, textAlign: 'right' }}>
          {errorMessage}
        </Alert>
      )}

      {/* Push Notifications Card */}
      <Card sx={{ mb: 3, borderRadius: borderRadius.lg }}>
        <CardContent sx={{ direction: 'rtl' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isSubscribed ? (
                <NotificationsActiveIcon sx={{ fontSize: 32, color: colors.success }} />
              ) : (
                <NotificationsOffIcon sx={{ fontSize: 32, color: colors.neutral[500] }} />
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  התראות דחיפה
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.neutral[600], textAlign: 'right' }}
                >
                  קבל התראות על משימות חדשות בזמן אמת
                </Typography>
              </Box>
            </Box>

            {isPushSupported ? (
              <FormControlLabel
                control={
                  <Switch
                    checked={isSubscribed}
                    onChange={handleNotificationToggle}
                    disabled={isPushLoading}
                    color="primary"
                  />
                }
                label=""
                sx={{ margin: 0 }}
              />
            ) : (
              <Chip
                label="לא נתמך"
                size="small"
                sx={{ backgroundColor: colors.neutral[300] }}
              />
            )}
          </Box>

          {isPushSupported && (
            <>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="body2" sx={{ color: colors.neutral[700], mb: 1 }}>
                  📱 <strong>סטטוס:</strong>{' '}
                  {isSubscribed ? (
                    <span style={{ color: colors.success }}>✅ פעיל</span>
                  ) : (
                    <span style={{ color: colors.neutral[500] }}>⚪ כבוי</span>
                  )}
                </Typography>
                <Typography variant="body2" sx={{ color: colors.neutral[700], mb: 1 }}>
                  🔐 <strong>הרשאה:</strong>{' '}
                  {permission === 'granted' && (
                    <span style={{ color: colors.success }}>✅ ניתנה</span>
                  )}
                  {permission === 'denied' && (
                    <span style={{ color: colors.error }}>❌ נדחתה</span>
                  )}
                  {permission === 'default' && (
                    <span style={{ color: colors.neutral[500] }}>⏳ לא נתבקשה</span>
                  )}
                </Typography>

                {permission === 'denied' && (
                  <Alert severity="warning" sx={{ mt: 2, textAlign: 'right' }}>
                    <Typography variant="body2">
                      הרשאת התראות נדחתה. כדי להפעיל התראות, אנא אפשר אותן בהגדרות הדפדפן.
                    </Typography>
                  </Alert>
                )}

                {isSubscribed && (
                  <Alert severity="info" sx={{ mt: 2, textAlign: 'right' }}>
                    <Typography variant="body2">
                      🎯 <strong>התראות פעילות!</strong>
                      <br />
                      תקבל התראה כאשר משימה חדשה נשלחת אליך.
                    </Typography>
                  </Alert>
                )}
              </Box>
            </>
          )}

          {!isPushSupported && (
            <Alert severity="warning" sx={{ mt: 2, textAlign: 'right' }}>
              <Typography variant="body2">
                הדפדפן שלך לא תומך בהתראות דחיפה. אנא השתמש בדפדפן מודרני (Chrome, Firefox,
                Safari 16.4+).
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* PWA Installation Card */}
      <Card sx={{ borderRadius: borderRadius.lg }}>
        <CardContent sx={{ direction: 'rtl' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              mb: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {isInstalled ? (
                <CheckCircleIcon sx={{ fontSize: 32, color: colors.success }} />
              ) : (
                <InstallMobileIcon sx={{ fontSize: 32, color: colors.primary }} />
              )}
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600, textAlign: 'right' }}>
                  התקנת אפליקציה
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: colors.neutral[600], textAlign: 'right' }}
                >
                  {isInstalled
                    ? 'האפליקציה מותקנת על המכשיר שלך'
                    : 'התקן את האפליקציה למסך הבית לגישה מהירה'}
                </Typography>
              </Box>
            </Box>

            {isInstallable && !isInstalled && (
              <Button
                variant="contained"
                onClick={handleInstallClick}
                disabled={isInstalling}
                sx={{
                  backgroundColor: colors.primary,
                  '&:hover': { backgroundColor: colors.primary, filter: 'brightness(0.9)' },
                }}
              >
                {isInstalling ? 'מתקין...' : 'התקן'}
              </Button>
            )}

            {isInstalled && (
              <Chip
                label="מותקנת"
                size="small"
                sx={{ backgroundColor: colors.success, color: '#fff' }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ textAlign: 'right' }}>
            {isInstalled && (
              <Alert severity="success" sx={{ textAlign: 'right' }}>
                <Typography variant="body2">
                  ✅ <strong>האפליקציה מותקנת!</strong>
                  <br />
                  תוכל לגשת אליה ישירות ממסך הבית של המכשיר.
                </Typography>
              </Alert>
            )}

            {!isInstalled && !isInstallable && (
              <Alert severity="info" sx={{ textAlign: 'right' }}>
                <Typography variant="body2">
                  💡 <strong>טיפ:</strong> האפליקציה תהיה זמינה להתקנה בקרוב.
                  <br />
                  ניתן להוסיף אותה למסך הבית דרך תפריט הדפדפן (⋮).
                </Typography>
              </Alert>
            )}

            {isInstallable && !isInstalled && (
              <Box sx={{ mt: 2 }}>
                <Typography
                  variant="body2"
                  sx={{ color: colors.neutral[700], mb: 2, fontWeight: 600 }}
                >
                  יתרונות התקנת האפליקציה:
                </Typography>
                <Box
                  component="ul"
                  sx={{ listStyle: 'none', padding: 0, margin: 0, textAlign: 'right' }}
                >
                  <li>
                    <Typography variant="body2" sx={{ color: colors.neutral[700], mb: 1 }}>
                      ⚡ גישה מהירה ממסך הבית
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: colors.neutral[700], mb: 1 }}>
                      🔔 התראות דחיפה (דורש הפעלה נפרדת)
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: colors.neutral[700], mb: 1 }}>
                      📱 חוויה כמו אפליקציה רגילה
                    </Typography>
                  </li>
                  <li>
                    <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                      💾 עובדת במצב לא מקוון (בקרוב)
                    </Typography>
                  </li>
                </Box>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Info Footer */}
      <Box sx={{ mt: 3, textAlign: 'right' }}>
        <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
          💡 <strong>לידיעתך:</strong> התראות דחיפה והתקנת אפליקציה הן אופציונליות. המערכת
          תמשיך לעבוד בצורה רגילה בדפדפן.
        </Typography>
      </Box>
    </Box>
  );
}
