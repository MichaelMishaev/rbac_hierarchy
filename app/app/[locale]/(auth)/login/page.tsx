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
import dynamic from 'next/dynamic';

// ✅ SECURITY FIX (VULN-AUTH-003): Dev-only component stripped from production via webpack
const DevTestUsers = dynamic(() => import('./DevTestUsers'), { ssr: false });

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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

        {/* DEV ONLY: Test Users Quick Login - Stripped from production */}
        {isDev && <DevTestUsers />}

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
