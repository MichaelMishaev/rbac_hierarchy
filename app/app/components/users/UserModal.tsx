'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  MenuItem,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CloseIcon from '@mui/icons-material/Close';
import { createUser, updateUser } from '@/app/actions/users';

type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: 'MANAGER' | 'SUPERVISOR' | 'SUPERADMIN';
  corporationId: string | null;
};

type Corporation = {
  id: string;
  name: string;
  code: string;
};

type UserModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  corporations: Corporation[];
  currentUserRole: 'SUPERADMIN' | 'MANAGER' | 'SUPERVISOR';
  currentUserCorporationId?: string | null;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'MANAGER' | 'SUPERVISOR' | 'SUPERADMIN';
  corporationId: string;
};

export default function UserModal({
  open,
  onClose,
  onSuccess,
  user,
  corporations,
  currentUserRole,
  currentUserCorporationId,
}: UserModalProps) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');

  const isEdit = !!user;

  const [formData, setFormData] = useState<FormData>({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'SUPERVISOR',
    corporationId: user?.corporationId || currentUserCorporationId || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        password: '',
        role: user.role,
        corporationId: user.corporationId || currentUserCorporationId || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'SUPERVISOR',
        corporationId: currentUserCorporationId || '',
      });
    }
    setError(null);
  }, [user, currentUserCorporationId]);

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('שם הוא שדה חובה');
      return false;
    }

    if (!formData.email.trim()) {
      setError('אימייל הוא שדה חובה');
      return false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('כתובת אימייל לא תקינה');
      return false;
    }

    // Password required for new users
    if (!isEdit && !formData.password) {
      setError('סיסמה היא שדה חובה');
      return false;
    }

    // Password length validation
    if (formData.password && formData.password.length < 6) {
      setError('הסיסמה צריכה להיות לפחות 6 תווים');
      return false;
    }

    // Corporation required for MANAGER/SUPERVISOR
    if (
      (formData.role === 'MANAGER' || formData.role === 'SUPERVISOR') &&
      !formData.corporationId
    ) {
      setError('יש לבחור תאגיד עבור מנהל או מפקח');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let result;

      if (isEdit) {
        // Update user
        result = await updateUser(user.id, {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          corporationId: formData.corporationId || undefined,
          ...(formData.password && { password: formData.password }),
        });
      } else {
        // Create user
        result = await createUser({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          role: formData.role,
          corporationId: formData.corporationId || undefined,
        });
      }

      if (!result.success) {
        setError(result.error || 'אירעה שגיאה');
        setLoading(false);
        return;
      }

      // Success
      onSuccess();
      onClose();
    } catch (err) {
      setError('אירעה שגיאה בלתי צפויה');
      setLoading(false);
    }
  };

  // Filter corporations for MANAGER role
  const availableCorporations =
    currentUserRole === 'SUPERADMIN'
      ? corporations
      : corporations.filter((corp) => corp.id === currentUserCorporationId);

  // Role options based on current user
  const roleOptions =
    currentUserRole === 'SUPERADMIN'
      ? [
          { value: 'SUPERADMIN', label: t('superadmin') },
          { value: 'MANAGER', label: t('manager') },
          { value: 'SUPERVISOR', label: t('supervisor') },
        ]
      : [
          { value: 'MANAGER', label: t('manager') },
          { value: 'SUPERVISOR', label: t('supervisor') },
        ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.lg,
          boxShadow: shadows.large,
        },
      }}
    >
      {/* Header */}
      <DialogTitle
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `1px solid ${colors.neutral[200]}`,
          pb: 2,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
          {isEdit ? t('editUser') : t('createUser')}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {/* Error Alert */}
          {error && (
            <Alert severity="error" sx={{ borderRadius: borderRadius.md }}>
              {error}
            </Alert>
          )}

          {/* Name */}
          <TextField
            label={t('name')}
            value={formData.name}
            onChange={handleChange('name')}
            fullWidth
            required
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
              },
            }}
          />

          {/* Email */}
          <TextField
            label={t('email')}
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            fullWidth
            required
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
              },
            }}
          />

          {/* Phone */}
          <TextField
            label={t('phone')}
            value={formData.phone}
            onChange={handleChange('phone')}
            fullWidth
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
              },
            }}
          />

          {/* Password */}
          <TextField
            label={isEdit ? t('passwordOptional') : t('password')}
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            fullWidth
            required={!isEdit}
            disabled={loading}
            helperText={isEdit ? 'השאר ריק כדי לא לשנות' : 'לפחות 6 תווים'}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
              },
            }}
          />

          {/* Role */}
          <TextField
            label={t('role')}
            select
            value={formData.role}
            onChange={handleChange('role')}
            fullWidth
            required
            disabled={loading}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.md,
              },
            }}
          >
            {roleOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          {/* Corporation (for MANAGER/SUPERVISOR) */}
          {(formData.role === 'MANAGER' || formData.role === 'SUPERVISOR') && (
            <TextField
              label={t('corporation')}
              select
              value={formData.corporationId}
              onChange={handleChange('corporationId')}
              fullWidth
              required
              disabled={loading || availableCorporations.length === 0}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.md,
                },
              }}
            >
              {availableCorporations.length === 0 ? (
                <MenuItem value="">אין תאגידים זמינים</MenuItem>
              ) : (
                availableCorporations.map((corp) => (
                  <MenuItem key={corp.id} value={corp.id}>
                    {corp.name} ({corp.code})
                  </MenuItem>
                ))
              )}
            </TextField>
          )}
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          borderTop: `1px solid ${colors.neutral[200]}`,
          px: 3,
          py: 2,
          gap: 1.5,
        }}
      >
        <Button
          onClick={onClose}
          disabled={loading}
          sx={{
            color: colors.neutral[600],
            '&:hover': {
              backgroundColor: colors.neutral[100],
            },
          }}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            background: colors.primary.main,
            color: colors.secondary.white,
            px: 3,
            borderRadius: borderRadius.md,
            boxShadow: shadows.soft,
            '&:hover': {
              background: colors.primary.dark,
              boxShadow: shadows.glowBlue,
            },
          }}
        >
          {loading ? (
            <CircularProgress size={20} sx={{ color: colors.secondary.white }} />
          ) : isEdit ? (
            tCommon('save')
          ) : (
            tCommon('create')
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
