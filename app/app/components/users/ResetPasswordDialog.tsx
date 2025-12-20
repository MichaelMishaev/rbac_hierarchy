'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  TextField,
  Alert,
  IconButton,
  Box,
  Button,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockResetIcon from '@mui/icons-material/LockReset';
import CloseIcon from '@mui/icons-material/Close';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import { resetUserPasswordByManager } from '@/app/actions/password-reset';

type ResetPasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  userId: string | null;
  userFullName: string | null;
  userEmail: string | null;
  onSuccess?: () => void;
};

export default function ResetPasswordDialog({
  open,
  onClose,
  userId,
  userFullName,
  userEmail,
  onSuccess,
}: ResetPasswordDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await resetUserPasswordByManager(userId);

      if (result.success) {
        setTempPassword(result.tempPassword);
        if (onSuccess) {
          onSuccess();
        }
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה באיפוס הסיסמה');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setTempPassword(null);
    setError(null);
    setCopied(false);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.large,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
          borderBottom: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockResetIcon sx={{ color: colors.primary.main }} />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            איפוס סיסמה - {userFullName}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: borderRadius.md }}>
            {error}
          </Alert>
        )}

        {!tempPassword ? (
          <>
            <Alert severity="warning" sx={{ mb: 2, borderRadius: borderRadius.md }}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                ⚠️ שים לב!
              </Typography>
              <Typography variant="body2">
                • סיסמה זמנית תוצג <strong>רק פעם אחת</strong>
              </Typography>
              <Typography variant="body2">
                • המשתמש יאלץ לשנות את הסיסמה בכניסה הבאה
              </Typography>
              <Typography variant="body2">
                • העתק את הסיסמה ושלח אותה למשתמש בערוץ מאובטח
              </Typography>
            </Alert>

            <Box
              sx={{
                p: 2,
                backgroundColor: colors.neutral[50],
                borderRadius: borderRadius.md,
                border: `1px solid ${colors.neutral[200]}`,
              }}
            >
              <Typography variant="body2" sx={{ color: colors.neutral[600], mb: 0.5 }}>
                משתמש:
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                {userFullName}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.neutral[500], fontSize: '13px' }}>
                {userEmail}
              </Typography>
            </Box>
          </>
        ) : (
          <>
            <Alert severity="success" sx={{ mb: 2, borderRadius: borderRadius.md }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ color: colors.success }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  הסיסמה אופסה בהצלחה!
                </Typography>
              </Box>
            </Alert>

            <Alert severity="warning" sx={{ mb: 2, borderRadius: borderRadius.md }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                העתק את הסיסמה עכשיו - לא תוכל לראות אותה שוב!
              </Typography>
            </Alert>

            <Box sx={{ position: 'relative' }}>
              <TextField
                fullWidth
                value={tempPassword}
                variant="outlined"
                inputProps={{
                  readOnly: true,
                  dir: 'ltr',
                  style: {
                    textAlign: 'center',
                    fontSize: '24px',
                    fontWeight: 600,
                    letterSpacing: '4px',
                    fontFamily: 'monospace',
                    color: colors.primary.main,
                  },
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: colors.primary.ultraLight,
                    borderRadius: borderRadius.md,
                    '& fieldset': {
                      borderColor: colors.primary.main,
                      borderWidth: 2,
                    },
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={handleCopy}
                      sx={{
                        color: copied ? colors.success : colors.primary.main,
                        '&:hover': {
                          backgroundColor: copied
                            ? `${colors.success}20`
                            : `${colors.primary.main}20`,
                        },
                      }}
                    >
                      {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                    </IconButton>
                  ),
                }}
              />
            </Box>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 2,
                color: colors.neutral[500],
              }}
            >
              המשתמש יאלץ לשנות סיסמה זו בכניסה הבאה למערכת
            </Typography>
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
        {!tempPassword ? (
          <>
            <Button onClick={handleClose} sx={{ color: colors.neutral[600] }}>
              ביטול
            </Button>
            <Button
              onClick={handleReset}
              variant="contained"
              disabled={loading}
              sx={{
                backgroundColor: colors.primary.main,
                color: colors.secondary.white,
                fontWeight: 600,
                borderRadius: borderRadius.md,
                '&:hover': {
                  backgroundColor: colors.primary.dark,
                },
              }}
            >
              {loading ? 'מאפס...' : 'אפס סיסמה'}
            </Button>
          </>
        ) : (
          <Button
            onClick={handleClose}
            variant="contained"
            fullWidth
            sx={{
              backgroundColor: colors.primary.main,
              color: colors.secondary.white,
              fontWeight: 600,
              borderRadius: borderRadius.md,
              '&:hover': {
                backgroundColor: colors.primary.dark,
              },
            }}
          >
            סגור
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
