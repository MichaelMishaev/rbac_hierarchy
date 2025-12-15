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
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SearchIcon from '@mui/icons-material/Search';
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
  cities: Corporation[];
  neighborhoods?: Site[];
  currentUserRole: 'SUPERADMIN' | 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR';
  currentUserCityId?: string | null;
  existingRegions?: string[];
};

type FormData = {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'AREA_MANAGER' | 'CITY_COORDINATOR' | 'ACTIVIST_COORDINATOR' | 'SUPERADMIN';
  cityId: string;
  regionName: string; // For Area Manager
  neighborhoodIds: string[]; // For ActivistCoordinator - multiple neighborhoods
};

export default function UserModal({
  open,
  onClose,
  onSuccess,
  user,
  cities,
  neighborhoods = [],
  currentUserRole,
  currentUserCityId,
  existingRegions = [],
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
    cityId: user?.cityId || currentUserCityId || '',
    regionName: user?.regionName || '',
    neighborhoodIds: [],
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
        cityId: user.cityId || currentUserCityId || '',
        regionName: user.regionName || '',
        neighborhoodIds: [],
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'ACTIVIST_COORDINATOR',
        cityId: currentUserCityId || '',
        regionName: '',
        neighborhoodIds: [],
      });
    }
    setError(null);
  }, [user, currentUserCityId]);

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

    // AREA_MANAGER: No area assignment during user creation
    // Area assignment happens later in /areas page

    // City required for CITY_COORDINATOR (always needs to select city)
    if (formData.role === 'CITY_COORDINATOR' && !formData.cityId) {
      setError('יש לבחור עיר עבור רכז עיר');
      return false;
    }

    // Neighborhoods required for ACTIVIST_COORDINATOR
    // Note: cityId is NOT required here - it will be derived from neighborhoods on server
    if (formData.role === 'ACTIVIST_COORDINATOR' && formData.neighborhoodIds.length === 0) {
      setError('יש לבחור לפחות שכונה אחת עבור רכז פעילים');
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

      // For Activist Coordinators, derive cityId from first selected neighborhood
      let effectiveCityId = formData.cityId;
      if (formData.role === 'ACTIVIST_COORDINATOR' && formData.neighborhoodIds.length > 0) {
        const firstNeighborhood = neighborhoods.find(n => n.id === formData.neighborhoodIds[0]);
        if (firstNeighborhood) {
          effectiveCityId = firstNeighborhood.cityId;
        }
      }

      if (isEdit) {
        // Update user
        result = await updateUser(user.id, {
          fullName: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          role: formData.role,
          cityId: effectiveCityId || undefined,
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
          cityId: effectiveCityId || undefined,
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

  // Filter cities based on current user's role
  const availableCorporations =
    currentUserRole === 'SUPERADMIN' || currentUserRole === 'AREA_MANAGER'
      ? cities // SuperAdmin and Area Managers can see all cities
      : cities.filter((corp) => corp.id === currentUserCityId); // City Coordinators see only their city

  // Role options based on current user
  const roleOptions =
    currentUserRole === 'SUPERADMIN'
      ? [
          { value: 'SUPERADMIN', label: t('superadmin') },
          { value: 'AREA_MANAGER', label: t('area_manager') },
          { value: 'CITY_COORDINATOR', label: t('cityCoordinator') },
          { value: 'ACTIVIST_COORDINATOR', label: t('activistCoordinator') },
        ]
      : currentUserRole === 'AREA_MANAGER'
      ? [
          { value: 'CITY_COORDINATOR', label: t('cityCoordinator') },
          { value: 'ACTIVIST_COORDINATOR', label: t('activistCoordinator') },
        ]
      : currentUserRole === 'CITY_COORDINATOR'
      ? [
          { value: 'ACTIVIST_COORDINATOR', label: t('activistCoordinator') },
        ]
      : []; // Activist Coordinators cannot create users via this modal

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
            name="user-role-select"
            autoComplete="off"
            inputProps={{
              autoComplete: 'off',
              'data-form-type': 'other',
            }}
            SelectProps={{
              native: false,
              autoComplete: 'off',
            }}
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

          {/* AREA_MANAGER: No area assignment during user creation */}
          {/* Area assignment happens later in /areas page */}

          {/* City dropdown - Show ONLY when creating CITY_COORDINATOR
              When creating ACTIVIST_COORDINATOR: NO city dropdown (cityId derived from neighborhoods)
          */}
          {formData.role === 'CITY_COORDINATOR' && (
            <TextField
              label={t('corporation')}
              select
              value={formData.cityId}
              onChange={handleChange('cityId')}
              fullWidth
              required
              disabled={loading || availableCorporations.length === 0}
              name="user-city-select"
              autoComplete="off"
              inputProps={{
                autoComplete: 'off',
                'data-form-type': 'other',
              }}
              SelectProps={{
                native: false,
                autoComplete: 'off',
              }}
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

          {/* Neighborhoods (for ACTIVIST_COORDINATOR only) - 2025 UX Best Practices */}
          {formData.role === 'ACTIVIST_COORDINATOR' && (
            <Box sx={{ direction: 'rtl' }}>
              <Autocomplete
                multiple
                options={
                  // City Coordinator: Show only their city's neighborhoods
                  currentUserRole === 'CITY_COORDINATOR' && currentUserCityId
                    ? neighborhoods.filter((site) => site.cityId === currentUserCityId)
                    // SuperAdmin/Area Manager: Show all available neighborhoods
                    : neighborhoods
                }
                groupBy={(option) => {
                  // Group by city for better UX (2025 best practice)
                  const city = cities.find(c => c.id === option.cityId);
                  return city ? city.name : 'אחר';
                }}
                getOptionLabel={(option) => option.name}
                value={neighborhoods.filter((site) => formData.neighborhoodIds.includes(site.id))}
                onChange={(_, newValue) => {
                  setFormData((prev) => ({
                    ...prev,
                    neighborhoodIds: newValue.map((site) => site.id),
                  }));
                  setError(null);
                }}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                disabled={loading}
                loading={loading}
                noOptionsText="אין שכונות זמינות"
                loadingText="טוען שכונות..."
                renderOption={(props, option) => (
                  <Box
                    component="li"
                    {...props}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      padding: '8px 12px !important',
                      '&:hover': {
                        backgroundColor: `${colors.primary.light}20 !important`,
                      },
                    }}
                  >
                    <LocationOnIcon sx={{ fontSize: 18, color: colors.primary.main }} />
                    <Typography variant="body2">{option.name}</Typography>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="שכונות"
                    placeholder="חפש ובחר שכונות..."
                    required
                    helperText="בחר את השכונות שרכז הפעילים יהיה אחראי עליהן"
                    InputProps={{
                      ...params.InputProps,
                      startAdornment: (
                        <>
                          <SearchIcon sx={{ color: colors.neutral[400], marginLeft: 1 }} />
                          {params.InputProps.startAdornment}
                        </>
                      ),
                    }}
                    inputProps={{
                      ...params.inputProps,
                      dir: 'rtl',
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: borderRadius.md,
                        flexDirection: 'row-reverse',
                        paddingRight: '14px',
                        backgroundColor: colors.neutral[50],
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: colors.neutral[100],
                        },
                        '&.Mui-focused': {
                          backgroundColor: colors.secondary.white,
                          boxShadow: `0 0 0 2px ${colors.primary.light}40`,
                        },
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
                      event.stopPropagation();
                      event.preventDefault();
                      const newSiteIds = formData.neighborhoodIds.filter(id => id !== option.id);
                      setFormData((prev) => ({
                        ...prev,
                        neighborhoodIds: newSiteIds,
                      }));
                    };

                    const city = cities.find(c => c.id === option.cityId);

                    return (
                      <Chip
                        key={option.id}
                        icon={<LocationOnIcon sx={{ fontSize: 16 }} />}
                        label={`${option.name}${city ? ` (${city.name})` : ''}`}
                        onDelete={handleDelete}
                        size="medium"
                        sx={{
                          backgroundColor: colors.primary.light,
                          color: colors.primary.dark,
                          fontWeight: 600,
                          margin: '4px 2px',
                          border: `1px solid ${colors.primary.main}30`,
                          borderRadius: borderRadius.md,
                          fontSize: '0.875rem',
                          height: '32px',
                          '& .MuiChip-icon': {
                            color: colors.primary.main,
                            marginRight: '4px',
                            marginLeft: '-4px',
                          },
                          '& .MuiChip-deleteIcon': {
                            color: colors.primary.main,
                            marginRight: '5px',
                            marginLeft: '-6px',
                            fontSize: 18,
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              color: colors.status.red,
                              transform: 'scale(1.1)',
                            },
                          },
                          '&:hover': {
                            backgroundColor: colors.primary.main,
                            color: colors.secondary.white,
                            '& .MuiChip-icon': {
                              color: colors.secondary.white,
                            },
                            '& .MuiChip-deleteIcon': {
                              color: colors.secondary.white,
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
                    padding: '8px !important',
                  },
                  '& .MuiAutocomplete-tag': {
                    margin: '2px',
                  },
                  '& .MuiAutocomplete-groupLabel': {
                    backgroundColor: colors.neutral[100],
                    color: colors.neutral[700],
                    fontWeight: 700,
                    fontSize: '0.75rem',
                    padding: '8px 12px',
                    borderRadius: borderRadius.sm,
                    margin: '4px 8px',
                    textAlign: 'right',
                  },
                  '& .MuiAutocomplete-listbox': {
                    padding: '8px',
                  },
                }}
                data-testid="neighborhoods-autocomplete"
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
