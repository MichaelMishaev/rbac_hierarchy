'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
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
  Collapse,
  Chip,
  Divider,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BusinessIcon from '@mui/icons-material/Business';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoginIcon from '@mui/icons-material/Login';
import { colors, shadows, borderRadius } from '@/lib/design-system';

// DEV ONLY: Test users from seed.ts
const DEV_TEST_USERS = [
  { email: 'admin@election.test', role: 'SuperAdmin', name: 'מנהל מערכת', password: 'admin123' },
  { email: 'sarah.cohen@telaviv-district.test', role: 'Area Manager', name: 'שרה כהן - מחוז ת"א', password: 'admin123' },
  { email: 'manager@north-district.test', role: 'Area Manager', name: 'יעל גולן - מחוז צפון', password: 'admin123' },
  { email: 'david.levi@telaviv.test', role: 'City Coordinator', name: 'דוד לוי - תל אביב', password: 'admin123' },
  { email: 'moshe.israeli@ramatgan.test', role: 'City Coordinator', name: 'משה ישראלי - רמת גן', password: 'admin123' },
  { email: 'florentin@campaign.test', role: 'Activist Coordinator', name: 'פלורנטין', password: 'admin123' },
  { email: 'nevetzedek@campaign.test', role: 'Activist Coordinator', name: 'נווה צדק', password: 'admin123' },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDevUsers, setShowDevUsers] = useState(false);
  const isDev = process.env.NODE_ENV !== 'production';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Trim whitespace from inputs to prevent accidental spaces
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      // Convert phone number to email format if it looks like a phone
      let loginEmail = trimmedEmail;
      const cleanedInput = trimmedEmail.replace(/[^0-9]/g, '');

      // If input is all digits (phone number), convert to email format
      if (cleanedInput && cleanedInput.length >= 9 && !trimmedEmail.includes('@')) {
        loginEmail = `${cleanedInput}@activist.login`;
      }

      const result = await signIn('credentials', {
        email: loginEmail,
        password: trimmedPassword,
        redirect: false,
      });

      if (result?.error) {
        setError('מספר טלפון/אימייל או סיסמה שגויים');
      } else {
        // Redirect activists to /activists/voters, others to dashboard
        window.location.href = '/dashboard'; // Middleware will redirect activists
      }
    } catch {
      setError('אירעה שגיאה. נסה שנית.');
    } finally {
      setLoading(false);
    }
  };

  // DEV ONLY: Quick login with test user
  const handleDevLogin = async (testUser: typeof DEV_TEST_USERS[0]) => {
    setEmail(testUser.email);
    setPassword(testUser.password);
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email: testUser.email,
        password: testUser.password,
        redirect: false,
      });

      if (result?.error) {
        setError('שגיאת התחברות');
      } else {
        window.location.href = '/dashboard';
      }
    } catch {
      setError('אירעה שגיאה. נסה שנית.');
    } finally {
      setLoading(false);
    }
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
      {/* Main Login Card - Neo-morphic style */}
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
        {/* Logo & Header */}
        <Stack spacing={3} alignItems="center" sx={{ mb: 4 }}>
          {/* Neo-morphic Logo Circle */}
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
            <BusinessIcon sx={{ fontSize: 40, color: colors.pastel.blue }} />
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
              !ברוכים הבאים
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontWeight: 500, direction: 'rtl' }}
            >
              התחבר כדי להמשיך
            </Typography>
          </Stack>
        </Stack>

        {/* Error Alert - Soft pastel */}
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

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <Stack spacing={3}>
            {/* Email/Phone Input - Inset shadow */}
            <TextField
              fullWidth
              name="email"
              label="מספר טלפון או אימייל"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="0501234567 או email@example.com"
              required
              autoFocus
              autoComplete="username"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailOutlinedIcon sx={{ color: colors.neutral[400], fontSize: 22 }} />
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

            {/* Password Input - Inset shadow */}
            <TextField
              fullWidth
              name="password"
              label="סיסמה"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="off"
              placeholder="הכנס סיסמה"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockOutlinedIcon sx={{ color: colors.neutral[400], fontSize: 22 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: colors.neutral[500] }}
                    >
                      {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
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

            {/* Sign In Button - Neo-morphic elevated */}
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
              {loading ? 'מתחבר...' : 'התחבר'}
            </Button>
          </Stack>
        </form>

        {/* DEV ONLY: Test Users Quick Login */}
        {isDev && (
          <>
            <Divider sx={{ my: 4 }} />

            <Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowDevUsers(!showDevUsers)}
                endIcon={
                  <ExpandMoreIcon
                    sx={{
                      transform: showDevUsers ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.3s',
                    }}
                  />
                }
                sx={{
                  color: colors.pastel.blue,
                  borderColor: colors.neutral[300],
                  textTransform: 'none',
                  fontWeight: 600,
                  fontSize: '14px',
                  '&:hover': {
                    borderColor: colors.pastel.blue,
                    backgroundColor: colors.pastel.blueLight,
                  },
                }}
              >
                🔧 Dev: Quick Login ({DEV_TEST_USERS.length} users)
              </Button>

              <Collapse in={showDevUsers}>
                <Stack spacing={1.5} sx={{ mt: 2 }}>
                  {DEV_TEST_USERS.map((user) => (
                    <Box
                      key={user.email}
                      sx={{
                        p: 2,
                        borderRadius: '12px',
                        background: colors.neutral[50],
                        border: `1px solid ${colors.neutral[200]}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 2,
                        direction: 'rtl',
                      }}
                    >
                      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            color: colors.neutral[800],
                            direction: 'rtl',
                          }}
                        >
                          {user.name}
                        </Typography>
                        <Chip
                          label={user.role}
                          size="small"
                          sx={{
                            alignSelf: 'flex-start',
                            height: '20px',
                            fontSize: '11px',
                            fontWeight: 600,
                            backgroundColor: colors.pastel.blueLight,
                            color: colors.pastel.blue,
                          }}
                        />
                        <Typography
                          variant="caption"
                          sx={{
                            color: colors.neutral[500],
                            direction: 'ltr',
                            textAlign: 'right',
                            fontSize: '10px',
                          }}
                        >
                          {user.email}
                        </Typography>
                      </Stack>

                      <IconButton
                        onClick={() => handleDevLogin(user)}
                        disabled={loading}
                        sx={{
                          backgroundColor: colors.pastel.blue,
                          color: colors.neutral[0],
                          '&:hover': {
                            backgroundColor: colors.pastel.blue,
                            opacity: 0.8,
                          },
                          '&:disabled': {
                            backgroundColor: colors.neutral[300],
                          },
                        }}
                      >
                        <LoginIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  ))}
                </Stack>

                <Alert
                  severity="warning"
                  sx={{
                    mt: 2,
                    backgroundColor: colors.pastel.yellowLight,
                    borderColor: colors.warning,
                    fontSize: '12px',
                  }}
                >
                  ⚠️ סיסמה לכל המשתמשים: <strong>admin123</strong>
                </Alert>
              </Collapse>
            </Box>
          </>
        )}

        {/* Footer */}
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Corporations MVP · Neo-Morphic Design · 2025
            {isDev && ' · 🔧 DEV MODE'}
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
