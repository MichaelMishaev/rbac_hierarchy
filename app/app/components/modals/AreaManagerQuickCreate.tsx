'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Autocomplete,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import BusinessIcon from '@mui/icons-material/Business';
import { createArea, getAvailableAreaManagerUsers } from '@/app/actions/areas';
import { generateCityCode } from '@/lib/transliteration';

type AvailableUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
};

type AreaManagerQuickCreateProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: (newAreaManager: { id: string; regionName: string; fullName: string; email: string }) => void;
};

export default function AreaManagerQuickCreate({
  open,
  onClose,
  onSuccess,
}: AreaManagerQuickCreateProps) {
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState({
    regionName: '',
    regionCode: '',
    description: '',
    userId: '', // REQUIRED - must select a user
  });

  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);

  // Load available users when dialog opens
  useEffect(() => {
    if (open) {
      loadAvailableUsers();
    }
  }, [open]);

  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const result = await getAvailableAreaManagerUsers();
      if (result.success && result.users) {
        setAvailableUsers(result.users);
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('שגיאה בטעינת רשימת משתמשים');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Auto-generate code from region name
  const handleRegionNameChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      regionName: value,
      regionCode: generateCityCode(value),
    }));
    setError(null);
  };

  const handleSubmit = async () => {
    // Basic validation
    if (!formData.regionName.trim()) {
      setError('שם אזור הוא שדה חובה');
      return;
    }

    if (!formData.regionCode.trim()) {
      setError('קוד אזור הוא שדה חובה');
      return;
    }

    if (!formData.userId.trim()) {
      setError('בחירת מנהל מחוז היא שדה חובה');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await createArea({
        regionName: formData.regionName,
        regionCode: formData.regionCode,
        description: formData.description || undefined,
        isActive: true,
        userId: formData.userId, // REQUIRED - assign user to area
      });

      if (result.success && result.area) {
        // Notify parent with the new area manager info
        onSuccess({
          id: result.area.id,
          regionName: result.area.regionName,
          fullName: result.area.user?.fullName || 'אין מנהל',
          email: result.area.user?.email || 'לא שויך',
        });

        // Reset form
        setFormData({
          regionName: '',
          regionCode: '',
          description: '',
          userId: '',
        });

        onClose();
      } else {
        setError(result.error || 'שגיאה ביצירת מנהל מחוז');
      }
    } catch (err) {
      console.error('Error creating area manager:', err);
      setError('שגיאה בלתי צפויה');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        regionName: '',
        regionCode: '',
        description: '',
        userId: '',
      });
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.xl,
          boxShadow: shadows.large,
          overflow: 'hidden',
        },
      }}
      TransitionProps={{
        timeout: 300,
      }}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: 'blur(8px)',
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          pb: 2,
          pt: 3,
          px: 3,
          background: `linear-gradient(135deg, ${colors.pastel.orangeLight} 0%, ${colors.neutral[0]} 100%)`,
          borderBottom: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: borderRadius.md,
              background: colors.gradients.primary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: shadows.medium,
            }}
          >
            <BusinessIcon sx={{ fontSize: 28, color: colors.neutral[0] }} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: colors.neutral[800] }}>
              יצירת מנהל מחוז חדש
            </Typography>
            <Typography variant="caption" sx={{ color: colors.neutral[600] }}>
              צור מנהל מחוז במהירות ושייך אותו לעיר
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 3, pb: 2, px: 3 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: borderRadius.md }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TextField
            label="שם האזור *"
            value={formData.regionName}
            onChange={(e) => handleRegionNameChange(e.target.value)}
            fullWidth
            required
            autoFocus
            placeholder="לדוגמה: מחוז הצפון"
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.lg,
                backgroundColor: colors.neutral[0],
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: `0 2px 8px ${colors.primary.main}20`,
                },
                '&.Mui-focused': {
                  boxShadow: `0 4px 12px ${colors.primary.main}30`,
                },
              },
            }}
          />

          {formData.regionCode && (
            <Box
              sx={{
                p: 2,
                borderRadius: borderRadius.md,
                backgroundColor: colors.pastel.blueLight,
                border: `1px dashed ${colors.pastel.blue}`,
              }}
            >
              <Typography variant="caption" sx={{ color: colors.pastel.blue, fontWeight: 600 }}>
                קוד אזור: {formData.regionCode} (נוצר אוטומטית)
              </Typography>
            </Box>
          )}

          <TextField
            label="תיאור (אופציונלי)"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            fullWidth
            multiline
            rows={2}
            placeholder="תיאור האזור..."
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.lg,
                backgroundColor: colors.neutral[0],
                transition: 'all 0.2s ease',
                '&:hover': {
                  boxShadow: `0 2px 8px ${colors.primary.main}20`,
                },
                '&.Mui-focused': {
                  boxShadow: `0 4px 12px ${colors.primary.main}30`,
                },
              },
            }}
          />

          <Autocomplete
            value={availableUsers.find((u) => u.id === formData.userId) || null}
            onChange={(event, newValue) => {
              setFormData((prev) => ({ ...prev, userId: newValue?.id || '' }));
              setError(null);
            }}
            options={availableUsers}
            getOptionLabel={(option) => `${option.fullName} (${option.email})`}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText="אין משתמשים זמינים עם תפקיד מנהל מחוז"
            loading={loadingUsers}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="בחר מנהל מחוז *"
                placeholder="חפש לפי שם או אימייל..."
                required
                error={!formData.userId && !!error}
                helperText="רק משתמשים עם תפקיד 'מנהל מחוז' שטרם שויכו לאזור"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: borderRadius.lg,
                    backgroundColor: colors.neutral[0],
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: `0 2px 8px ${colors.primary.main}20`,
                    },
                    '&.Mui-focused': {
                      boxShadow: `0 4px 12px ${colors.primary.main}30`,
                    },
                  },
                }}
              />
            )}
            renderOption={(props, option) => {
              const { key, ...otherProps } = props as any;
              return (
                <Box
                  component="li"
                  key={key}
                  {...otherProps}
                  sx={{
                    padding: '12px 16px !important',
                    '&:hover': {
                      backgroundColor: `${colors.primary.main}15`,
                    },
                  }}
                >
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.email}
                      {option.phone && ` • ${option.phone}`}
                    </Typography>
                  </Box>
                </Box>
              );
            }}
            filterOptions={(options, { inputValue }) => {
              const searchTerm = inputValue.toLowerCase();
              return options.filter(
                (option) =>
                  option.fullName.toLowerCase().includes(searchTerm) ||
                  option.email.toLowerCase().includes(searchTerm) ||
                  (option.phone && option.phone.includes(searchTerm))
              );
            }}
          />

          {availableUsers.length === 0 && !loadingUsers && (
            <Alert severity="warning" sx={{ borderRadius: borderRadius.md }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                אין משתמשים זמינים עם תפקיד &quot;מנהל מחוז&quot;. צור משתמש חדש בעמוד המשתמשים תחילה.
              </Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 3,
          py: 2,
          gap: 2,
          backgroundColor: colors.neutral[50],
          borderTop: `1px solid ${colors.neutral[200]}`,
        }}
      >
        <Button
          onClick={handleClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderRadius: borderRadius.lg,
            px: 3,
            py: 1,
            fontWeight: 600,
            borderWidth: 2,
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            '&:hover': {
              borderWidth: 2,
              borderColor: colors.primary.main,
              backgroundColor: 'transparent',
              color: colors.primary.main,
            },
          }}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading || !formData.regionName.trim()}
          sx={{
            borderRadius: borderRadius.lg,
            px: 3,
            py: 1,
            fontWeight: 600,
            background: colors.gradients.primary,
            boxShadow: shadows.medium,
            '&:hover': {
              background: colors.primary.dark,
              boxShadow: shadows.glowBlue,
              transform: 'translateY(-2px)',
            },
            transition: 'all 0.2s ease-in-out',
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: colors.neutral[0] }} /> : 'צור מנהל מחוז'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
