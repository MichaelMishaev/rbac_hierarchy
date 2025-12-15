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
  Switch,
  FormControlLabel,
  CircularProgress,
  MenuItem,
  Typography,
  Alert,
  Autocomplete,
} from '@mui/material';
import {
  Public as PublicIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';

export type AreaFormData = {
  regionName: string;
  regionCode: string;
  userId: string;
  description: string;
  isActive: boolean;
};

type User = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
};

type AreaModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: AreaFormData) => Promise<{ success: boolean; error?: string }>;
  initialData?: Partial<AreaFormData>;
  mode: 'create' | 'edit';
  availableUsers: User[];
};

export default function AreaModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  availableUsers,
}: AreaModalProps) {
  const t = useTranslations('areas');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const [formData, setFormData] = useState<AreaFormData>({
    regionName: initialData?.regionName || '',
    regionCode: initialData?.regionCode || '',
    userId: initialData?.userId || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<Partial<Record<keyof AreaFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AreaFormData, string>> = {};

    // Validate region name
    if (!formData.regionName.trim()) {
      newErrors.regionName = 'שם אזור הוא שדה חובה';
    } else if (formData.regionName.trim().length < 2) {
      newErrors.regionName = 'שם אזור חייב להכיל לפחות 2 תווים';
    }

    // Code is auto-generated, just ensure it exists
    if (!formData.regionCode.trim()) {
      newErrors.regionCode = 'שגיאה ביצירת קוד אזור';
    }

    // User selection is OPTIONAL - areas can exist without managers
    // No validation needed for userId

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      const result = await onSubmit(formData);

      if (result.success) {
        onClose();
        // Reset form
        setFormData({
          regionName: '',
          regionCode: '',
          userId: '',
          description: '',
          isActive: true,
        });
      } else {
        setError(result.error || 'שגיאה בשמירת האזור');
      }
    } catch (err) {
      console.error('Error submitting area:', err);
      setError('שגיאה בשמירת האזור. אנא נסה שוב.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof AreaFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }

    if (error) {
      setError('');
    }
  };

  // Auto-generate region code from region name when creating
  useEffect(() => {
    if (mode === 'create' && formData.regionName) {
      const autoCode = formData.regionName
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9א-ת-]/g, '')
        .toLowerCase()
        .slice(0, 50);

      setFormData((prev) => ({ ...prev, regionCode: autoCode }));
    }
  }, [formData.regionName, mode]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          direction: isRTL ? 'rtl' : 'ltr',
          borderRadius: '20px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.15)',
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
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
          },
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          pb: 3,
          pt: 4,
          px: 4,
          background: 'linear-gradient(135deg, #F5F5FF 0%, #FFFFFF 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #6161FF 0%, #5034FF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 16px rgba(97, 97, 255, 0.25)',
            }}
          >
            <PublicIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {mode === 'create' ? t('newArea') : 'עריכת אזור'}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {mode === 'create' ? 'הוסף אזור חדש למערכת' : 'ערוך את פרטי האזור'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3, px: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Basic Information */}
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              backgroundColor: '#FAFBFC',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#F5F6F8',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 24,
                  borderRadius: '3px',
                  background: 'linear-gradient(135deg, #6161FF 0%, #5034FF 100%)',
                }}
              />
              מידע בסיסי
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="שם האזור"
                value={formData.regionName}
                onChange={handleChange('regionName')}
                error={!!errors.regionName}
                helperText={errors.regionName || 'לדוגמה: מחוז המרכז, מחוז תל אביב'}
                fullWidth
                required
                autoFocus
                placeholder="הכנס שם אזור בעברית"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(97, 97, 255, 0.1)',
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 4px 12px rgba(97, 97, 255, 0.15)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem',
                    fontWeight: 500,
                  },
                }}
              />

              {/* Show auto-generated code (read-only, for reference) */}
              {mode === 'create' && formData.regionCode && (
                <Typography
                  variant="caption"
                  sx={{
                    color: 'text.secondary',
                    fontStyle: 'italic',
                    mt: 0.5,
                    fontFamily: 'monospace',
                  }}
                >
                  קוד אזור: {formData.regionCode} (נוצר אוטומטית)
                </Typography>
              )}
              {mode === 'edit' && (
                <TextField
                  label="קוד אזור"
                  value={formData.regionCode}
                  fullWidth
                  disabled
                  helperText="לא ניתן לשנות קוד אזור קיים"
                  inputProps={{
                    style: { fontFamily: 'monospace' },
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: 'white',
                    },
                  }}
                />
              )}
            </Box>
          </Box>

          {/* User Assignment */}
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              backgroundColor: '#FAFBFC',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#F5F6F8',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: '#00C875',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 24,
                  borderRadius: '3px',
                  background: 'linear-gradient(135deg, #00C875 0%, #00A661 100%)',
                }}
              />
              מנהל מחוז
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Autocomplete
                value={availableUsers.find((user) => user.id === formData.userId) || null}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, userId: newValue?.id || '' }));
                  if (errors.userId) {
                    setErrors((prev) => ({ ...prev, userId: undefined }));
                  }
                  if (error) {
                    setError('');
                  }
                }}
                options={availableUsers}
                getOptionLabel={(option) => option.fullName}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText="אין משתמשים זמינים"
                loading={availableUsers.length === 0}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="בחר משתמש (אופציונלי)"
                    placeholder="חפש לפי שם, אימייל או טלפון..."
                    error={!!errors.userId}
                    helperText={errors.userId || 'אזור יכול להיות ללא מנהל. רק משתמשים עם תפקיד "מנהל מחוז" זמינים'}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '12px',
                        backgroundColor: 'white',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: '0 2px 8px rgba(0, 200, 117, 0.1)',
                        },
                        '&.Mui-focused': {
                          boxShadow: '0 4px 12px rgba(0, 200, 117, 0.15)',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        fontSize: '1rem',
                        fontWeight: 500,
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
                          backgroundColor: 'rgba(0, 200, 117, 0.08)',
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
                sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    color: '#00C875',
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                    color: '#00C875',
                  },
                }}
              />

              {availableUsers.length === 0 && (
                <Alert severity="info" sx={{ mt: 1 }}>
                  אין משתמשים זמינים עם תפקיד &quot;מנהל מחוז&quot;. האזור יווצר ללא מנהל ותוכל להקצות מנהל מאוחר יותר.
                </Alert>
              )}
            </Box>
          </Box>

          {/* Additional Information */}
          <Box
            sx={{
              p: 3,
              borderRadius: '16px',
              backgroundColor: '#FAFBFC',
              border: '1px solid',
              borderColor: 'divider',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: '#F5F6F8',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: '#A25DDC',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 6,
                  height: 24,
                  borderRadius: '3px',
                  background: 'linear-gradient(135deg, #A25DDC 0%, #8B4BCF 100%)',
                }}
              />
              מידע נוסף
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="תיאור"
                value={formData.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={3}
                placeholder="תיאור האזור, אחריות, סמכויות..."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: '12px',
                    backgroundColor: 'white',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: '0 2px 8px rgba(162, 93, 220, 0.1)',
                    },
                    '&.Mui-focused': {
                      boxShadow: '0 4px 12px rgba(162, 93, 220, 0.15)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    fontSize: '1rem',
                    fontWeight: 500,
                  },
                }}
              />

              <FormControlLabel
                control={
                  <Switch checked={formData.isActive} onChange={handleChange('isActive')} />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {tCommon('active')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      אזור פעיל זמין לשיוך ערים ופעילות
                    </Typography>
                  </Box>
                }
              />
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          px: 4,
          py: 3,
          gap: 2,
          backgroundColor: '#FAFBFC',
          borderTop: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          size="large"
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            borderWidth: 2,
            borderColor: 'divider',
            color: 'text.secondary',
            transition: 'all 0.2s ease',
            '&:hover': {
              borderWidth: 2,
              borderColor: 'primary.main',
              backgroundColor: 'transparent',
              color: 'primary.main',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(97, 97, 255, 0.15)',
            },
          }}
        >
          {tCommon('cancel')}
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          size="large"
          sx={{
            borderRadius: '12px',
            px: 4,
            py: 1.5,
            fontWeight: 600,
            background: 'linear-gradient(135deg, #6161FF 0%, #5034FF 100%)',
            boxShadow: '0 4px 12px rgba(97, 97, 255, 0.3)',
            transition: 'all 0.2s ease',
            '&:hover': {
              background: 'linear-gradient(135deg, #5034FF 0%, #4028E6 100%)',
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(97, 97, 255, 0.4)',
            },
            '&:active': {
              transform: 'translateY(0)',
            },
          }}
        >
          {loading ? <CircularProgress size={24} /> : tCommon('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
