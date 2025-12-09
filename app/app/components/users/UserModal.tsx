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
  Autocomplete,
  Chip,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CloseIcon from '@mui/icons-material/Close';
import { createUser, updateUser } from '@/app/actions/users';

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR' | 'SUPERADMIN';
  // Note: cityId is derived from role tables, not stored directly on User
  cityId?: string | null;
  regionName?: string | null; // For Area Manager
};

type Corporation = {
  id: string;
  name: string;
  code: string;
};

type Site = {
  id: string;
  name: string;
  cityId: string;
};

type UserModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user?: User | null;
  corporations: Corporation[];
  sites?: Site[];
  currentUserRole: 'SUPERADMIN' | 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR';
  currentUserCorporationId?: string | null;
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR' | 'SUPERADMIN';
  cityId: string;
  regionName: string; // For Area Manager
  siteIds: string[]; // For ActivistCoordinator - multiple sites
};

export default function UserModal({
  open,
  onClose,
  onSuccess,
  user,
  corporations,
  sites = [],
  currentUserRole,
  currentUserCorporationId,
}: UserModalProps) {
  const t = useTranslations('users');
  const tCommon = useTranslations('common');

  const isEdit = !!user;

  const [formData, setFormData] = useState<FormData>({
    name: user?.fullName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    password: '',
    role: user?.role || 'ACTIVIST_COORDINATOR',
    cityId: user?.cityId || currentUserCorporationId || '',
    regionName: user?.regionName || '',
    siteIds: [],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName,
        email: user.email,
        phone: user.phone || '',
        password: '',
        role: user.role,
        cityId: user.cityId || currentUserCorporationId || '',
        regionName: user.regionName || '',
        siteIds: [],
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'ACTIVIST_COORDINATOR',
        cityId: currentUserCorporationId || '',
        regionName: '',
        siteIds: [],
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

    // Region name required for AREA_MANAGER
    if (formData.role === 'AREA_MANAGER' && !formData.regionName.trim()) {
      setError('שם אזור הוא שדה חובה עבור מנהל אזור');
      return false;
    }

    // Corporation required for CITY_COORDINATOR/ACTIVIST_COORDINATOR (not for SUPERADMIN or AREA_MANAGER)
    if (
      formData.role !== 'SUPERADMIN' &&
      formData.role !== 'AREA_MANAGER' &&
      (formData.role === 'CITY_COORDINATOR' || formData.role === 'ACTIVIST_COORDINATOR') &&
      !formData.cityId
    ) {
      setError('יש לבחור תאגיד עבור מנהל או מפקח');
      return false;
    }

    // Sites required for ACTIVIST_COORDINATOR
    if (formData.role === 'ACTIVIST_COORDINATOR' && formData.siteIds.length === 0) {
      setError('יש לבחור לפחות אתר אחד עבור מפקח');
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
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          cityId: formData.cityId || undefined,
          regionName: formData.role === 'AREA_MANAGER' ? formData.regionName : undefined,
          ...(formData.password && { password: formData.password }),
        });
      } else {
        // Create user
        result = await createUser({
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
          role: formData.role,
          cityId: formData.cityId || undefined,
          regionName: formData.role === 'AREA_MANAGER' ? formData.regionName : undefined,
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
          { value: 'AREA_MANAGER', label: t('area_manager') },
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
          fontWeight: 600,
          color: colors.neutral[800],
        }}
      >
        {isEdit ? t('editUser') : t('createUser')}
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

          {/* Region Name (for AREA_MANAGER) */}
          {formData.role === 'AREA_MANAGER' && (
            <TextField
              label="שם אזור"
              value={formData.regionName}
              onChange={handleChange('regionName')}
              fullWidth
              required
              disabled={loading}
              helperText="למשל: מרכז, דרום, צפון"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.md,
                },
              }}
            />
          )}

          {/* Corporation (for CITY_COORDINATOR/ACTIVIST_COORDINATOR) */}
          {(formData.role === 'CITY_COORDINATOR' || formData.role === 'ACTIVIST_COORDINATOR') && (
            <TextField
              label={t('corporation')}
              select
              value={formData.cityId}
              onChange={handleChange('cityId')}
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

          {/* Sites (for SUPERVISOR only) */}
          {formData.role === 'SUPERVISOR' && formData.cityId && (
            <Box sx={{ direction: 'rtl' }}>
              <Autocomplete
                multiple
                options={sites.filter((site) => site.cityId === formData.cityId)}
                getOptionLabel={(option) => option.name}
                value={sites.filter((site) => formData.siteIds.includes(site.id))}
                onChange={(_, newValue) => {
                  console.log('Autocomplete onChange called. New value:', newValue);
                  console.log('Site IDs:', newValue.map((site) => site.id));
                  setFormData((prev) => ({
                    ...prev,
                    siteIds: newValue.map((site) => site.id),
                  }));
                  setError(null);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loading}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="אתרים"
                    required
                    helperText="בחר את האתרים שהמפקח יהיה אחראי עליהם"
                    inputProps={{
                      ...params.inputProps,
                      dir: 'rtl',
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: borderRadius.md,
                        flexDirection: 'row-reverse',
                        paddingRight: '14px',
                      },
                      '& .MuiInputLabel-root': {
                        right: 0,
                        left: 'auto',
                        transformOrigin: 'top right',
                        '&.MuiInputLabel-shrink': {
                          right: 0,
                          left: 'auto',
                        },
                      },
                      '& .MuiAutocomplete-endAdornment': {
                        right: 'auto',
                        left: '9px',
                      },
                    }}
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const handleDelete = (event: any) => {
                      console.log('🔴 CHIP ONDELETE FIRED!', option.name);
                      event.stopPropagation();
                      event.preventDefault();
                      const newSiteIds = formData.siteIds.filter(id => id !== option.id);
                      console.log('Removing ID:', option.id);
                      console.log('New site IDs:', newSiteIds);
                      setFormData((prev) => ({
                        ...prev,
                        siteIds: newSiteIds,
                      }));
                    };

                    return (
                      <Chip
                        key={option.id}
                        label={option.name}
                        onDelete={handleDelete}
                        deleteIcon={
                          <CloseIcon
                            onClick={(e) => {
                              console.log('🟢 DELETE ICON CLICKED!');
                              handleDelete(e);
                            }}
                            sx={{
                              fontSize: 18,
                              cursor: 'pointer !important',
                              pointerEvents: 'all !important',
                            }}
                          />
                        }
                        sx={{
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[900],
                          fontWeight: 600,
                          margin: '2px',
                          border: `1px solid ${colors.neutral[300]}`,
                          '& .MuiChip-deleteIcon': {
                            color: colors.neutral[600],
                            marginRight: '5px',
                            marginLeft: '-6px',
                            pointerEvents: 'all !important',
                            '&:hover': {
                              color: colors.neutral[900],
                              backgroundColor: 'rgba(0, 0, 0, 0.08)',
                            },
                          },
                        }}
                        data-testid={`site-chip-${option.id}`}
                      />
                    );
                  })
                }
                sx={{
                  '& .MuiAutocomplete-inputRoot': {
                    flexDirection: 'row-reverse',
                    gap: '4px',
                  },
                  '& .MuiAutocomplete-tag': {
                    margin: '2px',
                  },
                }}
                data-testid="sites-autocomplete"
              />
            </Box>
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
