'use client';

import { useState, useEffect, useRef } from 'react';
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
  Select,
  InputLabel,
  FormControl,
  Typography,
  Alert,
  Collapse,
  IconButton,
  Autocomplete,
} from '@mui/material';
import RtlButton from '@/app/components/ui/RtlButton';
import {
  LocationCity as LocationCityIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  SupervisorAccount as SupervisorIcon,
  Add as AddIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { createActivistCoordinatorQuick } from '@/app/actions/activist-coordinator-neighborhoods';

export type SiteFormData = {
  name: string;
  cityId: string;
  activistCoordinatorId: string;
  isActive: boolean;
};

type Area = {
  id: string;
  regionName: string;
  regionCode: string;
};

type Corporation = {
  id: string;
  name: string;
  code: string;
  areaManagerId?: string;
};

type Supervisor = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
};

type NeighborhoodModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SiteFormData) => Promise<{ success: boolean; error?: string }>;
  initialData?: Partial<SiteFormData>;
  mode: 'create' | 'edit';
  areas: Area[];
  cities: Corporation[];
  activistCoordinators: Supervisor[];
  onCityChange?: (cityId: string) => Promise<void>;
  userCityId?: string; // For City Coordinators - auto-select and lock their city
  onSupervisorCreated?: (cityId: string) => Promise<void>;
};

export default function NeighborhoodModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  areas,
  cities,
  activistCoordinators,
  onCityChange,
  userCityId,
  onSupervisorCreated,
}: NeighborhoodModalProps) {
  const t = useTranslations('sites');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'he';

  // Hierarchical selection state
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');

  const [formData, setFormData] = useState<SiteFormData>({
    name: initialData?.name || '',
    cityId: initialData?.cityId || '',
    activistCoordinatorId: '',
    isActive: initialData?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SiteFormData, string>>>({});

  // Quick supervisor creation state
  const [showCreateSupervisor, setShowCreateSupervisor] = useState(false);
  const [supervisorFormData, setSupervisorFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    tempPassword: '', // Custom temp password field
  });
  const [supervisorErrors, setSupervisorErrors] = useState<Record<string, string>>({});
  const [creatingSupervisor, setCreatingSupervisor] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  // Filtered cities based on selected area
  const filteredCities = selectedAreaId
    ? cities.filter((city) => city.areaManagerId === selectedAreaId)
    : [];

  // Handle area change - clear city
  const handleAreaChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const areaId = e.target.value as string;
    setSelectedAreaId(areaId);
    setFormData((prev) => ({ ...prev, cityId: '', activistCoordinatorId: '' })); // Clear dependent city
    if (errors.cityId) {
      setErrors((prev) => ({ ...prev, cityId: undefined }));
    }
  };

  // Reset form when modal opens with new initialData
  // Track previous open state to only reset on open transition
  const prevOpenRef = useRef(open);

  useEffect(() => {
    // Only reset form when modal transitions from closed to open
    const justOpened = open && !prevOpenRef.current;

    if (justOpened) {
      let cityToSelect = initialData?.cityId || '';
      let areaToSelect = '';

      // CITY COORDINATOR FIX: If userCityId is provided, auto-select that city
      if (userCityId && mode === 'create') {
        cityToSelect = userCityId;
        const city = cities.find((c) => c.id === userCityId);
        if (city?.areaManagerId) {
          areaToSelect = city.areaManagerId;
        }
      }
      // If editing and has initial city, pre-select area
      else if (initialData?.cityId) {
        const city = cities.find((c) => c.id === initialData.cityId);
        if (city?.areaManagerId) {
          areaToSelect = city.areaManagerId;
        }
      }
      // When creating new neighborhood with only 1 area, auto-select it
      else if (areas.length === 1) {
        areaToSelect = areas[0].id;
      }

      setSelectedAreaId(areaToSelect);

      // Reset form data
      setFormData({
        name: initialData?.name || '',
        cityId: cityToSelect,
        activistCoordinatorId: initialData?.activistCoordinatorId || '',
        isActive: initialData?.isActive ?? true,
      });
      setErrors({});
      setShowCreateSupervisor(false);
      setSupervisorFormData({ fullName: '', email: '', phone: '', tempPassword: '' });
      setSupervisorErrors({});
      setTempPassword(null);
    }

    // Update ref for next render
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, userCityId, mode]);  // cities and areas intentionally excluded to prevent form reset

  // Auto-select first activist coordinator when loaded (but don't reset form!)
  // Track if we've just created a supervisor to prevent auto-selection override
  const justCreatedSupervisorRef = useRef(false);

  useEffect(() => {
    // Don't auto-select if we just created a supervisor - it will be manually selected
    if (justCreatedSupervisorRef.current) {
      justCreatedSupervisorRef.current = false;
      return;
    }

    if (open && activistCoordinators.length > 0 && !formData.activistCoordinatorId) {
      setFormData((prev) => ({
        ...prev,
        activistCoordinatorId: activistCoordinators[0].id,
      }));
    }
  }, [open, activistCoordinators, formData.activistCoordinatorId]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SiteFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם השכונה נדרש';
    }

    // CITY COORDINATOR FIX: Skip area validation if user city is locked
    if (userCityId && mode === 'create') {
      // City is already set, no area validation needed
      if (!formData.cityId) {
        newErrors.cityId = 'יש לבחור עיר';
      }
    } else {
      // Normal flow: validate area first, then city
      if (!selectedAreaId) {
        // Add area validation as a city error since area affects city selection
        newErrors.cityId = 'יש לבחור מחוז תחילה';
      } else if (!formData.cityId) {
        newErrors.cityId = 'יש לבחור עיר';
      }
    }

    if (!formData.activistCoordinatorId) {
      newErrors.activistCoordinatorId = 'יש לבחור רכז שכונתי';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const result = await onSubmit(formData);
      if (result.success) {
        onClose();
      } else {
        // Show error message
        const errorField: keyof SiteFormData = 'name';
        setErrors((prev) => ({ ...prev, [errorField]: result.error || 'Failed to save site' }));
      }
    } catch (error) {
      console.error('Error submitting neighborhood:', error);
      const errorField: keyof SiteFormData = 'name';
      setErrors((prev) => ({ ...prev, [errorField]: 'An unexpected error occurred' }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SiteFormData) => async (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = field === 'isActive'
      ? (event.target as HTMLInputElement).checked
      : event.target.value as string;

    setFormData((prev) => ({ ...prev, [field]: value }));

    // When city changes, fetch activist coordinators for that city
    if (field === 'cityId' && onCityChange) {
      await onCityChange(value as string);
      // Reset activist coordinator selection when city changes
      setFormData((prev) => ({ ...prev, activistCoordinatorId: '' }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleCreateSupervisor = async () => {
    // Validate supervisor form
    const newErrors: Record<string, string> = {};
    if (!supervisorFormData.fullName.trim()) {
      newErrors.fullName = isRTL ? 'שם מלא נדרש' : 'Full name is required';
    }
    if (!supervisorFormData.email.trim()) {
      newErrors.email = isRTL ? 'אימייל נדרש' : 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supervisorFormData.email)) {
      newErrors.email = isRTL ? 'פורמט אימייל שגוי' : 'Invalid email format';
    }

    if (Object.keys(newErrors).length > 0) {
      setSupervisorErrors(newErrors);
      return;
    }

    setCreatingSupervisor(true);
    try {
      const result = await createActivistCoordinatorQuick({
        fullName: supervisorFormData.fullName,
        email: supervisorFormData.email,
        phone: supervisorFormData.phone,
        cityId: formData.cityId,
        title: 'רכז שכונתי', // Fixed role for activist coordinators
        tempPassword: supervisorFormData.tempPassword || undefined, // Pass custom password if provided
      });

      if (result.success && result.activistCoordinator && result.tempPassword) {
        // Show temporary password
        setTempPassword(result.tempPassword);

        // Set flag to prevent auto-selection from overriding our manual selection
        justCreatedSupervisorRef.current = true;

        // Refresh activist coordinators list
        if (onSupervisorCreated) {
          await onSupervisorCreated(formData.cityId);
        }

        // Auto-select the new activist coordinator
        setFormData((prev) => ({ ...prev, activistCoordinatorId: result.activistCoordinator.id }));

        // Reset supervisor form
        setSupervisorFormData({ fullName: '', email: '', phone: '', tempPassword: '' });
        setSupervisorErrors({});
        setShowCreateSupervisor(false);
      } else {
        setSupervisorErrors({ general: result.error || 'Failed to create supervisor' });
      }
    } catch (error) {
      console.error('Error creating activistCoordinator:', error);
      setSupervisorErrors({ general: 'An unexpected error occurred' });
    } finally {
      setCreatingSupervisor(false);
    }
  };

  const handleCopyPassword = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
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
            <LocationCityIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {mode === 'create' ? t('createTitle') : t('editTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {mode === 'create' ? 'הוסף שכונה חדשה למערכת' : 'ערוך את פרטי השכונה'}
            </Typography>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 4, pb: 3, px: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {/* Validation Error Summary */}
          {Object.keys(errors).length > 0 && (
            <Alert
              severity="error"
              sx={{
                borderRadius: '12px',
                '& .MuiAlert-message': { width: '100%' }
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                יש למלא את השדות הבאים:
              </Typography>
              <Box component="ul" sx={{ m: 0, pl: isRTL ? 0 : 2, pr: isRTL ? 2 : 0 }}>
                {errors.name && (
                  <li>
                    <Typography variant="body2">{errors.name}</Typography>
                  </li>
                )}
                {errors.cityId && (
                  <li>
                    <Typography variant="body2">{errors.cityId}</Typography>
                  </li>
                )}
                {errors.activistCoordinatorId && (
                  <li>
                    <Typography variant="body2">{errors.activistCoordinatorId}</Typography>
                  </li>
                )}
              </Box>
            </Alert>
          )}

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

              {/* HIERARCHICAL CASCADE: Area → City */}
              {/* CITY COORDINATOR FIX: Hide area/city selection if user city is locked */}
              {userCityId && mode === 'create' ? (
                // For City Coordinators: Show city as read-only field
                <TextField
                  label={t('city')}
                  value={cities.find(c => c.id === userCityId)?.name || ''}
                  fullWidth
                  disabled
                  required
                  InputProps={{
                    readOnly: true,
                  }}
                  helperText="העיר שלך נבחרה אוטומטית"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      backgroundColor: '#F5F5F5',
                    },
                    '& .MuiInputLabel-root': {
                      fontSize: '1rem',
                      fontWeight: 500,
                    },
                  }}
                />
              ) : (
                <>
                  <FormControl
                    fullWidth
                    required
                    error={!!errors.cityId && !selectedAreaId}
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
                    <InputLabel>אזור</InputLabel>
                    <Select
                      value={selectedAreaId}
                      onChange={handleAreaChange as any}
                      label="אזור"
                      error={!!errors.cityId && !selectedAreaId}
                    >
                      <MenuItem value="">
                        <em>בחר מחוז</em>
                      </MenuItem>
                      {areas.map((area) => (
                        <MenuItem key={area.id} value={area.id}>
                          {area.regionName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <FormControl
                    fullWidth
                    required
                    error={!!errors.cityId}
                    disabled={!selectedAreaId}
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
                    <InputLabel>{t('city')}</InputLabel>
                    <Select
                      value={formData.cityId}
                      onChange={(e) => handleChange('cityId')(e as any)}
                      label={t('city')}
                    >
                      <MenuItem value="">
                        <em>בחר עיר</em>
                      </MenuItem>
                      {filteredCities.map((city) => (
                        <MenuItem key={city.id} value={city.id}>
                          {city.name} ({city.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </>
              )}

              <Autocomplete
                value={activistCoordinators.find((ac) => ac.id === formData.activistCoordinatorId) || null}
                onChange={(event, newValue) => {
                  setFormData((prev) => ({ ...prev, activistCoordinatorId: newValue?.id || '' }));
                  if (errors.activistCoordinatorId) {
                    setErrors((prev) => ({ ...prev, activistCoordinatorId: undefined }));
                  }
                }}
                options={activistCoordinators}
                getOptionLabel={(option) => option.fullName}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                noOptionsText="אין רכזי שכונות זמינים"
                disabled={activistCoordinators.length === 0}
                fullWidth
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="רכז שכונתי"
                    placeholder="חפש לפי שם או אימייל..."
                    error={!!errors.activistCoordinatorId}
                    helperText={errors.activistCoordinatorId}
                    required
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
                          backgroundColor: 'rgba(97, 97, 255, 0.08)',
                        },
                      }}
                    >
                      <Box sx={{ width: '100%' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {option.fullName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {option.email}
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
                      option.email.toLowerCase().includes(searchTerm)
                  );
                }}
                sx={{
                  '& .MuiAutocomplete-popupIndicator': {
                    color: 'primary.main',
                  },
                  '& .MuiAutocomplete-clearIndicator': {
                    color: 'primary.main',
                  },
                }}
              />

              {/* Quick supervisor creation when none exist */}
              {activistCoordinators.length === 0 && formData.cityId && (
                <Box sx={{ mt: 2 }}>
                  <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    action={
                      !showCreateSupervisor && (
                        <RtlButton
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setShowCreateSupervisor(true)}
                          sx={{ textTransform: 'none' }}
                        >
                          צור רכז שכונתי
                        </RtlButton>
                      )
                    }
                  >
                    לא נמצאו רכזי שכונות לעיר זו. יש ליצור רכז שכונתי חדש כדי להמשיך.
                  </Alert>

                  {/* Quick supervisor creation form */}
                  <Collapse in={showCreateSupervisor}>
                    <Box
                      sx={{
                        p: 3,
                        border: '2px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 2,
                        backgroundColor: 'primary.50',
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                          יצירת רכז שכונתי חדש
                        </Typography>
                        <IconButton size="small" onClick={() => setShowCreateSupervisor(false)}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      {supervisorErrors.general && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          {supervisorErrors.general}
                        </Alert>
                      )}

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <TextField
                          label="שם מלא *"
                          value={supervisorFormData.fullName}
                          onChange={(e) => {
                            setSupervisorFormData((prev) => ({ ...prev, fullName: e.target.value }));
                            setSupervisorErrors((prev) => ({ ...prev, fullName: '' }));
                          }}
                          error={!!supervisorErrors.fullName}
                          helperText={supervisorErrors.fullName}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="אימייל *"
                          type="email"
                          value={supervisorFormData.email}
                          onChange={(e) => {
                            setSupervisorFormData((prev) => ({ ...prev, email: e.target.value }));
                            setSupervisorErrors((prev) => ({ ...prev, email: '' }));
                          }}
                          error={!!supervisorErrors.email}
                          helperText={supervisorErrors.email}
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="טלפון"
                          value={supervisorFormData.phone}
                          onChange={(e) =>
                            setSupervisorFormData((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label="תפקיד"
                          value="רכז שכונתי"
                          fullWidth
                          size="small"
                          disabled
                          InputProps={{
                            readOnly: true,
                          }}
                          helperText="התפקיד מוגדר אוטומטית"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              backgroundColor: '#F5F5F5',
                            },
                          }}
                        />
                        <TextField
                          label="סיסמה זמנית (אופציונלי)"
                          value={supervisorFormData.tempPassword}
                          onChange={(e) =>
                            setSupervisorFormData((prev) => ({ ...prev, tempPassword: e.target.value }))
                          }
                          placeholder="ברירת מחדל: admin0"
                          fullWidth
                          size="small"
                          helperText="השאר ריק עבור ברירת מחדל: admin0"
                        />
                        <Button
                          variant="contained"
                          onClick={handleCreateSupervisor}
                          disabled={creatingSupervisor}
                          fullWidth
                          sx={{ mt: 1 }}
                        >
                          {creatingSupervisor ? (
                            <CircularProgress size={24} />
                          ) : (
                            'צור רכז שכונתי'
                          )}
                        </Button>
                      </Box>
                    </Box>
                  </Collapse>
                </Box>
              )}

              {/* Temporary password display */}
              {tempPassword && (
                <Alert
                  severity="success"
                  sx={{ mt: 2 }}
                  action={
                    <IconButton size="small" onClick={handleCopyPassword}>
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  }
                >
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                    רכז שכונתי נוצר בהצלחה!
                  </Typography>
                  <Typography variant="body2">
                    סיסמה זמנית:
                    <Box
                      component="span"
                      sx={{
                        fontFamily: 'monospace',
                        fontWeight: 600,
                        backgroundColor: 'rgba(0,0,0,0.1)',
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      {tempPassword}
                    </Box>
                  </Typography>
                  <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                    שמור את הסיסמה במקום בטוח. הרכז השכונתי יתבקש לשנות אותה בכניסה הראשונה.
                  </Typography>
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
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={handleChange('isActive')}
                  />
                }
                label={tCommon('active')}
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








