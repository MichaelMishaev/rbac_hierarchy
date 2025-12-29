'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import {
  Box,
  Button,
  Stack,
  Typography,
  Chip,
  IconButton,
  Collapse,
  Alert,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoginIcon from '@mui/icons-material/Login';
import { colors } from '@/lib/design-system';

// ⚠️ DEV ONLY: This file is stripped from production builds via webpack
// Test users from seed.ts
const DEV_TEST_USERS = [
  { email: 'admin@election.test', role: 'SuperAdmin', name: 'מנהל מערכת', password: 'admin123' },
  { email: 'sarah.cohen@telaviv-district.test', role: 'Area Manager', name: 'שרה כהן - מחוז ת"א', password: 'admin123' },
  { email: 'manager@north-district.test', role: 'Area Manager', name: 'יעל גולן - מחוז צפון', password: 'admin123' },
  { email: 'david.levi@telaviv.test', role: 'City Coordinator', name: 'דוד לוי - תל אביב', password: 'admin123' },
  { email: 'moshe.israeli@ramatgan.test', role: 'City Coordinator', name: 'משה ישראלי - רמת גן', password: 'admin123' },
  { email: 'florentin@campaign.test', role: 'Activist Coordinator', name: 'פלורנטין', password: 'admin123' },
  { email: 'nevetzedek@campaign.test', role: 'Activist Coordinator', name: 'נווה צדק', password: 'admin123' },
];

export default function DevTestUsers() {
  const [showDevUsers, setShowDevUsers] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDevLogin = async (testUser: typeof DEV_TEST_USERS[0]) => {
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

          {error && (
            <Alert
              severity="error"
              sx={{
                mt: 2,
                backgroundColor: colors.pastel.redLight,
                borderColor: colors.error,
                fontSize: '12px',
              }}
            >
              {error}
            </Alert>
          )}
        </Collapse>
      </Box>
    </>
  );
}
