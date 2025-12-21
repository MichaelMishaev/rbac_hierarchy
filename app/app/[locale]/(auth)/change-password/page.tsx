'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  Stack,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockResetIcon from '@mui/icons-material/LockReset';
import { colors, shadows } from '@/lib/design-system';
import { changeOwnPassword } from '@/actions/password-reset';

export default function ChangePasswordPage() {
  const { data: session } = useSession();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate current password is provided
    if (!currentPassword) {
      setError('נא להזין את הסיסמה הנוכחית (זמנית)');
      return;
    }

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }

    setLoading(true);

    try {
      // Trim whitespace to prevent accidental spaces
      const trimmedCurrentPassword = currentPassword.trim();
      const trimmedNewPassword = newPassword.trim();

      // Use server action to change password
      const result = await changeOwnPassword(trimmedCurrentPassword, trimmedNewPassword);

      if (!result.success) {
        setError(result.error || 'שגיאה בשינוי הסיסמה');
        setLoading(false);
        return;
      }

      // Password changed successfully - now sign in again with new password to get fresh JWT
      // This is necessary because the old JWT still has requirePasswordChange: true
      const signInResult = await signIn('credentials', {
        email: session?.user?.email,
        password: trimmedNewPassword,
        redirect: false,
      });

      if (signInResult?.error) {
        setError('הסיסמה שונתה בהצלחה, אך אירעה שגיאה בהתחברות מחדש. אנא התחבר שוב.');
        setLoading(false);
        return;
      }

      // Wait a moment for the new session to be fully established
      await new Promise(resolve => setTimeout(resolve, 500));

      // Redirect based on role with full page reload to ensure fresh session
      if (session?.user.role === 'ACTIVIST') {
        window.location.href = '/voters';
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'אירעה שגיאה. נסה שנית.');
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: colors.neutral[50],
        p: 2,
      }}
    >
      <Card
        sx={{
          maxWidth: 500,
          width: '100%',
          p: { xs: 4, sm: 5 },
          background: colors.neutral[0],
          boxShadow: shadows.neomorph,
          border: `2px solid ${colors.neutral[100]}`,
        }}
      >
        {/* Header */}
        <Stack spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: colors.neutral[50],
              boxShadow: shadows.neomorph,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LockResetIcon sx={{ fontSize: 40, color: colors.pastel.blue }} />
          </Box>

          <Stack spacing={1} alignItems="center">
            <Typography
              variant="h3"
              component="h1"
              sx={{
                fontWeight: 700,
                color: colors.neutral[800],
                letterSpacing: '-0.02em',
                direction: 'rtl',
              }}
            >
              שינוי סיסמה נדרש
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500, direction: 'rtl', textAlign: 'center' }}
            >
              נא להזין סיסמה חדשה לפני שתוכל להמשיך
            </Typography>
          </Stack>
        </Stack>

        {/* Error Alert */}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 3,
              backgroundColor: colors.pastel.redLight,
              borderColor: colors.error,
              color: colors.neutral[800],
            }}
          >
            {error}
          </Alert>
        )}

        {/* Change Password Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Current Password (Temporary) */}
            <TextField
              fullWidth
              name="currentPassword"
              label="סיסמה נוכחית (זמנית)"
              type={showCurrentPassword ? 'text' : 'password'}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoFocus
              autoComplete="off"
              placeholder="הכנס את הסיסמה הזמנית שקיבלת"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      edge="end"
                      sx={{ color: colors.neutral[500] }}
                    >
                      {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colors.neutral[50],
                  boxShadow: shadows.innerMedium,
                  direction: 'ltr',
                },
                '& .MuiInputLabel-root': {
                  right: 35,
                  left: 'auto',
                  transformOrigin: 'right',
                },
              }}
            />

            {/* New Password */}
            <TextField
              fullWidth
              name="newPassword"
              label="סיסמה חדשה"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="הכנס סיסמה חדשה (לפחות 6 תווים)"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                      sx={{ color: colors.neutral[500] }}
                    >
                      {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colors.neutral[50],
                  boxShadow: shadows.innerMedium,
                  direction: 'ltr',
                },
                '& .MuiInputLabel-root': {
                  right: 35,
                  left: 'auto',
                  transformOrigin: 'right',
                },
              }}
            />

            {/* Confirm Password */}
            <TextField
              fullWidth
              name="confirmPassword"
              label="אימות סיסמה"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
              placeholder="הכנס שוב את הסיסמה החדשה"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                      sx={{ color: colors.neutral[500] }}
                    >
                      {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: colors.neutral[50],
                  boxShadow: shadows.innerMedium,
                  direction: 'ltr',
                },
                '& .MuiInputLabel-root': {
                  right: 35,
                  left: 'auto',
                  transformOrigin: 'right',
                },
              }}
            />

            {/* Submit Button */}
            <Button
              fullWidth
              type="submit"
              variant="contained"
              size="large"
              disabled={loading}
              sx={{
                py: 1.75,
                fontSize: '17px',
                fontWeight: 600,
                mt: 1,
                background: colors.gradients.primary,
                boxShadow: shadows.soft,
                '&:hover': {
                  boxShadow: shadows.glowBlue,
                },
              }}
            >
              {loading ? 'משנה סיסמה...' : 'שנה סיסמה'}
            </Button>

            {/* Logout Button */}
            <Button
              fullWidth
              variant="outlined"
              size="large"
              onClick={handleLogout}
              sx={{
                py: 1.5,
                fontSize: '16px',
                fontWeight: 600,
                borderWidth: 2,
                '&:hover': {
                  borderWidth: 2,
                },
              }}
            >
              התנתק
            </Button>
          </Stack>
        </form>

        {/* Footer */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            לצורכי אבטחה, נא לבחור סיסמה חזקה ייחודית
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
