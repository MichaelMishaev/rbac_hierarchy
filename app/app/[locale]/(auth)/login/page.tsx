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
  Avatar,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import BusinessIcon from '@mui/icons-material/Business';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { colors, shadows, borderRadius } from '@/lib/design-system';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (testEmail: string, testPassword: string, role: string) => {
    setEmail(testEmail);
    setPassword(testPassword);
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
              }}
            >
              Welcome Back!
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 500 }}>
              Sign in to continue
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
            {/* Email Input - Inset shadow */}
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              placeholder="your.email@company.com"
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
                },
              }}
            />

            {/* Password Input - Inset shadow */}
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
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
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </Stack>
        </form>

        {/* Divider */}
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: colors.neutral[500],
              letterSpacing: '0.5px',
            }}
          >
            QUICK ACCESS
          </Typography>
        </Box>

        {/* Demo Account Pills - Monday style */}
        <Stack spacing={2}>
          {/* SuperAdmin */}
          <Box
            onClick={() => quickLogin('superadmin@hierarchy.test', 'admin123', 'SuperAdmin')}
            sx={{
              p: 2,
              borderRadius: borderRadius.lg,
              background: colors.pastel.purpleLight,
              border: `2px solid ${colors.pastel.purple}40`,
              cursor: 'pointer',
              transition: 'all 250ms ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: shadows.glowPurple,
                borderColor: colors.pastel.purple,
              },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: colors.pastel.purple,
                  fontWeight: 700,
                }}
              >
                SA
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                  SuperAdmin
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  superadmin@hierarchy.test
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Manager */}
          <Box
            onClick={() => quickLogin('manager@acme.com', 'manager123', 'Manager')}
            sx={{
              p: 2,
              borderRadius: borderRadius.lg,
              background: colors.pastel.blueLight,
              border: `2px solid ${colors.pastel.blue}40`,
              cursor: 'pointer',
              transition: 'all 250ms ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: shadows.glowBlue,
                borderColor: colors.pastel.blue,
              },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: colors.pastel.blue,
                  fontWeight: 700,
                }}
              >
                M
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                  Manager
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  manager@acme.com
                </Typography>
              </Box>
            </Stack>
          </Box>

          {/* Supervisor */}
          <Box
            onClick={() => quickLogin('supervisor@acme.com', 'supervisor123', 'Supervisor')}
            sx={{
              p: 2,
              borderRadius: borderRadius.lg,
              background: colors.pastel.greenLight,
              border: `2px solid ${colors.pastel.green}40`,
              cursor: 'pointer',
              transition: 'all 250ms ease',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: shadows.glowGreen,
                borderColor: colors.pastel.green,
              },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: colors.pastel.green,
                  fontWeight: 700,
                }}
              >
                S
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                  Supervisor
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  supervisor@acme.com
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Stack>

        {/* Footer */}
        <Box sx={{ mt: 5, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Corporations MVP · Neo-Morphic Design · 2025
          </Typography>
        </Box>
      </Card>
    </Box>
  );
}
