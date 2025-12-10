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
} from '@mui/material';
import { Business as BusinessIcon } from '@mui/icons-material';
import { useTranslations } from 'next-intl';
import { generateCityCode } from '@/lib/transliteration';

export type CorporationFormData = {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  isActive: boolean;
  areaManagerId: string;
};

type AreaManager = {
  id: string;
  regionName: string;
  fullName: string;
  email: string;
};

type CityModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CorporationFormData) => Promise<void>;
  initialData?: Partial<CorporationFormData>;
  mode: 'create' | 'edit';
  areaManagers: AreaManager[];
  userRole?: string; // To determine if area dropdown should be disabled
};

export default function CityModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  areaManagers,
  userRole = 'SUPERADMIN',
}: CityModalProps) {
  const t = useTranslations('citys');
  const tCommon = useTranslations('common');

  // Area Managers can only create cities in their own area (dropdown disabled)
  const isAreaManagerRestricted = userRole === 'AREA_MANAGER' && mode === 'create';

  const [formData, setFormData] = useState<CorporationFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true,
    // For Area Managers creating cities: auto-select their area if only one available
    areaManagerId: initialData?.areaManagerId || (isAreaManagerRestricted && areaManagers.length === 1 ? areaManagers[0].id : ''),
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CorporationFormData, string>>>({});

  // Auto-generate code from city name when creating a new city
  useEffect(() => {
    if (mode === 'create' && formData.name) {
      const generatedCode = generateCityCode(formData.name);
      setFormData((prev) => ({ ...prev, code: generatedCode }));
    }
  }, [formData.name, mode]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CorporationFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    // Code is auto-generated, no need to validate user input
    // Just ensure it exists before submit
    if (!formData.code.trim()) {
      newErrors.code = 'Code generation failed';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (mode === 'create' && !formData.areaManagerId.trim()) {
      newErrors.areaManagerId = 'Area Manager is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error('Error submitting city:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof CorporationFormData) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = field === 'isActive' ? event.target.checked : event.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
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
            <BusinessIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {mode === 'create' ? t('createTitle') : t('editTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {mode === 'create' ? 'צור עיר חדשה במערכת' : 'עדכן פרטי העיר'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3, px: 4 }}>
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
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label={t('name')}
                value={formData.name}
                onChange={handleChange('name')}
                error={!!errors.name}
                helperText={errors.name}
                fullWidth
                required
                autoFocus
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

              <TextField
                select
                label="מנהל אזור"
                value={formData.areaManagerId}
                onChange={handleChange('areaManagerId')}
                error={!!errors.areaManagerId}
                helperText={
                  errors.areaManagerId ||
                  (isAreaManagerRestricted
                    ? 'מנהלי אזור יכולים ליצור ערים רק באזור שלהם'
                    : undefined)
                }
                required={mode === 'create'}
                disabled={isAreaManagerRestricted}
                fullWidth
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
              >
                <MenuItem value="">
                  <em>{mode === 'create' ? 'בחר מנהל אזור' : 'לא לשנות'}</em>
                </MenuItem>
                {areaManagers.map((am) => (
                  <MenuItem key={am.id} value={am.id}>
                    {am.regionName} - {am.fullName}
                  </MenuItem>
                ))}
              </TextField>

              {mode === 'create' && formData.code && (
                <Box
                  sx={{
                    p: 2,
                    borderRadius: '10px',
                    backgroundColor: '#E8E8FF',
                    border: '1px dashed',
                    borderColor: 'primary.light',
                  }}
                >
                  <Typography variant="caption" sx={{ color: 'primary.dark', fontWeight: 500 }}>
                    קוד: {formData.code} (נוצר אוטומטית)
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Contact Information */}
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
                  background: 'linear-gradient(135deg, #00C875 0%, #00A661 100%)',
                }}
              />
              פרטי התקשרות
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  label={t('email')}
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  type="email"
                  required
                  sx={{
                    flex: 1,
                    minWidth: '200px',
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

                <TextField
                  label={t('phone')}
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  sx={{
                    flex: 1,
                    minWidth: '200px',
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
              </Box>

              <TextField
                label={t('address')}
                value={formData.address}
                onChange={handleChange('address')}
                fullWidth
                multiline
                rows={2}
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
                  background: 'linear-gradient(135deg, #A25DDC 0%, #8B4BCF 100%)',
                }}
              />
              מידע נוסף
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label={t('description')}
                value={formData.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={3}
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

              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: formData.isActive ? '#E5FFF3' : '#FFE8EC',
                  border: '1px solid',
                  borderColor: formData.isActive ? '#00C875' : '#E44258',
                  transition: 'all 0.3s ease',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive}
                      onChange={handleChange('isActive')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#00C875',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#00C875',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                      {tCommon('active')}
                    </Typography>
                  }
                  sx={{ margin: 0 }}
                />
              </Box>
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
          {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : tCommon('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
