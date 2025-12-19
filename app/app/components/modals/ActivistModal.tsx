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
  Chip,
  Autocomplete,
  Typography,
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';

export type WorkerFormData = {
  name: string;
  phone: string;
  email: string;
  position: string;
  notes: string;
  tags: string[];
  siteId: string;
  supervisorId: string;
  isActive: boolean;
  startDate?: string;
  giveLoginAccess?: boolean;
  generatedPassword?: string;
};

type Area = {
  id: string;
  regionName: string;
  regionCode: string;
};

type City = {
  id: string;
  name: string;
  code: string;
  areaManagerId: string;
};

type Site = {
  id: string;
  name: string;
  cityId: string;
  city?: {
    id: string;
    name: string;
  };
};

type Supervisor = {
  id: string;
  name: string;
  email: string;
};

type ActivistModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WorkerFormData) => Promise<{ success: boolean; error?: string }>;
  initialData?: Partial<WorkerFormData>;
  mode: 'create' | 'edit';
  areas: Area[];
  cities: City[];
  neighborhoods: Site[];
  activistCoordinators: Supervisor[];
  defaultSiteId?: string;
  defaultSupervisorId?: string;
};

const COMMON_TAGS = [
  'בכיר',
  'מתמחה',
  'זמני',
  'קבוע',
  'משמרת בוקר',
  'משמרת ערב',
  'משמרת לילה',
  'נהג',
  'טכנאי',
  'מנהל צוות',
];

export default function ActivistModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  areas,
  cities,
  neighborhoods,
  activistCoordinators,
  defaultSiteId,
  defaultSupervisorId,
}: ActivistModalProps) {
  const t = useTranslations('workers');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'he';

  // Hierarchical selection state
  const [selectedAreaId, setSelectedAreaId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');

  const [formData, setFormData] = useState<WorkerFormData>({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    position: initialData?.position || '',
    notes: initialData?.notes || '',
    tags: initialData?.tags || [],
    siteId: initialData?.siteId || defaultSiteId || '',
    supervisorId: initialData?.supervisorId || defaultSupervisorId || '',
    isActive: initialData?.isActive ?? true,
    startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkerFormData, string>>>({});

  // State for neighborhood-specific coordinators (filtered by selected neighborhood)
  const [neighborhoodCoordinators, setNeighborhoodCoordinators] = useState<Supervisor[]>(activistCoordinators);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);

  // Filtered cities based on selected area
  const filteredCities = selectedAreaId
    ? cities.filter((city) => city.areaManagerId === selectedAreaId)
    : [];

  // Filtered neighborhoods based on selected city
  const filteredNeighborhoods = selectedCityId
    ? neighborhoods.filter((neighborhood) => neighborhood.cityId === selectedCityId)
    : [];

  // Reset form when modal opens with new initialData
  // Track previous open state to only reset on open transition
  const prevOpenRef = useRef(open);

  // Separate useEffect for area/city pre-selection based on neighborhood
  // This runs when modal opens OR when data (neighborhoods/cities) updates
  useEffect(() => {
    if (!open) return;

    // If editing and has initial neighborhood, pre-select area and city
    if (initialData?.siteId && neighborhoods.length > 0 && cities.length > 0) {
      const neighborhood = neighborhoods.find((n) => n.id === initialData.siteId);
      if (neighborhood) {
        const city = cities.find((c) => c.id === neighborhood.cityId);
        if (city && city.areaManagerId) {
          setSelectedAreaId(city.areaManagerId);
          setSelectedCityId(city.id);
        }
      }
    } else if (!initialData?.siteId && areas.length > 0 && cities.length > 0) {
      // When creating new activist:
      // If user only has access to 1 area (e.g., Area Manager), auto-select it
      const firstArea = areas[0];
      if (areas.length === 1 && firstArea) {
        setSelectedAreaId(firstArea.id);
        // If only 1 city in that area, auto-select it too
        const areaCities = cities.filter((c) => c.areaManagerId === firstArea.id);
        const firstCity = areaCities[0];
        if (areaCities.length === 1 && firstCity) {
          setSelectedCityId(firstCity.id);
        } else {
          setSelectedCityId('');
        }
      } else {
        // Reset cascade for new activist (multiple areas available)
        setSelectedAreaId('');
        setSelectedCityId('');
      }
    }
  }, [open, initialData?.siteId, neighborhoods, cities, areas]);

  // Reset form data when modal opens
  useEffect(() => {
    // Only reset form when modal transitions from closed to open
    const justOpened = open && !prevOpenRef.current;

    if (justOpened) {
      setFormData({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        position: initialData?.position || '',
        notes: initialData?.notes || '',
        tags: initialData?.tags || [],
        siteId: initialData?.siteId || defaultSiteId || '',
        supervisorId: initialData?.supervisorId || defaultSupervisorId || activistCoordinators[0]?.id || '',
        isActive: initialData?.isActive ?? true,
        startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }

    // Update ref for next render
    prevOpenRef.current = open;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialData, defaultSiteId, defaultSupervisorId]);

  // Fetch coordinators assigned to the selected neighborhood
  useEffect(() => {
    const fetchNeighborhoodCoordinators = async () => {
      if (!formData.siteId || !open) {
        setNeighborhoodCoordinators(activistCoordinators);
        return;
      }

      setLoadingCoordinators(true);
      try {
        const { listActivistCoordinatorsByNeighborhood } = await import('@/app/actions/neighborhoods');
        const result = await listActivistCoordinatorsByNeighborhood(formData.siteId);

        if (result.success && result.activistCoordinators) {
          // Transform to match the expected Supervisor format
          const transformed = result.activistCoordinators.map((ac) => ({
            id: ac.id,
            name: ac.fullName,
            email: ac.email,
          }));
          setNeighborhoodCoordinators(transformed);

          // If current supervisorId is not in the filtered list, clear it
          const isCurrentSupervisorValid = transformed.some((ac) => ac.id === formData.supervisorId);
          if (!isCurrentSupervisorValid && formData.supervisorId) {
            setFormData((prev) => ({ ...prev, supervisorId: '' }));
          }
        } else {
          setNeighborhoodCoordinators([]);
        }
      } catch (error) {
        console.error('Error fetching neighborhood coordinators:', error);
        setNeighborhoodCoordinators([]);
      } finally {
        setLoadingCoordinators(false);
      }
    };

    fetchNeighborhoodCoordinators();
  }, [formData.siteId, open, activistCoordinators, formData.supervisorId]);

  // Handle area change - clear city and neighborhood
  const handleAreaChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const areaId = e.target.value as string;
    setSelectedAreaId(areaId);
    setSelectedCityId(''); // Clear dependent city
    setFormData((prev) => ({ ...prev, siteId: '' })); // Clear dependent neighborhood
    if (errors.siteId) {
      setErrors((prev) => ({ ...prev, siteId: undefined }));
    }
  };

  // Handle city change - clear neighborhood
  const handleCityChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const cityId = e.target.value as string;
    setSelectedCityId(cityId);
    setFormData((prev) => ({ ...prev, siteId: '' })); // Clear dependent neighborhood
    if (errors.siteId) {
      setErrors((prev) => ({ ...prev, siteId: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof WorkerFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'שם העובד נדרש';
    }

    if (!formData.siteId) {
      newErrors.siteId = 'יש לבחור אתר';
    }

    if (!formData.supervisorId) {
      newErrors.supervisorId = 'יש לבחור רכז שכונתי';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'פורמט אימייל שגוי';
    }

    // Validate phone is provided when login access is enabled
    if (formData.giveLoginAccess && !formData.phone?.trim()) {
      newErrors.phone = 'מספר טלפון נדרש כאשר גישה למערכת מופעלת';
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
        const errorField: keyof WorkerFormData = 'name'; // Show error on name field
        setErrors((prev) => ({ ...prev, [errorField]: result.error || 'Failed to save worker' }));
      }
    } catch (error) {
      console.error('Error submitting activist:', error);
      const errorField: keyof WorkerFormData = 'name';
      setErrors((prev) => ({ ...prev, [errorField]: 'An unexpected error occurred' }));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof WorkerFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = (field === 'isActive' || field === 'giveLoginAccess')
      ? (event.target as HTMLInputElement).checked
      : event.target.value as string;

    // Generate password when giveLoginAccess is checked
    if (field === 'giveLoginAccess' && value === true) {
      const defaultPassword = 'active0'; // Default password for all activists
      setFormData((prev) => ({ ...prev, [field]: value, generatedPassword: defaultPassword }));
    } else if (field === 'giveLoginAccess' && value === false) {
      setFormData((prev) => ({ ...prev, [field]: value, generatedPassword: undefined, phone: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }

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
            <PersonIcon sx={{ fontSize: 32, color: 'white' }} />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'text.primary' }}>
              {mode === 'create' ? t('createTitle') : t('editTitle')}
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
              {mode === 'create' ? 'הוסף פעיל חדש למערכת' : 'עדכן פרטי הפעיל'}
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

              {/* HIERARCHICAL CASCADE: Area → City → Neighborhood */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Step 1: Select Area */}
                <FormControl sx={{ flex: 1, minWidth: '200px' }} required>
                  <InputLabel>{isRTL ? 'אזור' : 'Area'}</InputLabel>
                  <Select
                    value={selectedAreaId}
                    onChange={handleAreaChange as any}
                    label={isRTL ? 'אזור' : 'Area'}
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(97, 97, 255, 0.1)',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>בחר אזור</em>
                    </MenuItem>
                    {areas.map((area) => (
                      <MenuItem key={area.id} value={area.id}>
                        {area.regionName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {/* Step 2: Select City (filtered by area) */}
                <FormControl sx={{ flex: 1, minWidth: '200px' }} required disabled={!selectedAreaId}>
                  <InputLabel>עיר</InputLabel>
                  <Select
                    value={selectedCityId}
                    onChange={handleCityChange as any}
                    label="עיר"
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(97, 97, 255, 0.1)',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>בחר עיר</em>
                    </MenuItem>
                    {filteredCities.map((city) => (
                      <MenuItem key={city.id} value={city.id}>
                        {city.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {/* Step 3: Select Neighborhood (filtered by city) */}
                <FormControl sx={{ flex: 1, minWidth: '200px' }} required error={!!errors.siteId} disabled={!selectedCityId}>
                  <InputLabel>{t('site')}</InputLabel>
                  <Select
                    value={formData.siteId}
                    onChange={(e) => handleChange('siteId')(e as any)}
                    label={t('site')}
                    sx={{
                      borderRadius: '12px',
                      backgroundColor: 'white',
                      '&:hover': {
                        boxShadow: '0 2px 8px rgba(97, 97, 255, 0.1)',
                      },
                    }}
                  >
                    <MenuItem value="">
                      <em>בחר שכונה</em>
                    </MenuItem>
                    {filteredNeighborhoods.map((neighborhood) => (
                      <MenuItem key={neighborhood.id} value={neighborhood.id}>
                        {neighborhood.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {errors.siteId && (
                    <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                      {errors.siteId}
                    </Typography>
                  )}
                </FormControl>

                {/* Activist Coordinator */}
                <Box sx={{ flex: 1, minWidth: '200px' }}>
                  <Autocomplete
                    value={neighborhoodCoordinators.find((ac) => ac.id === formData.supervisorId) || null}
                    onChange={(event, newValue) => {
                      setFormData((prev) => ({ ...prev, supervisorId: newValue?.id || '' }));
                      if (errors.supervisorId) {
                        setErrors((prev) => ({ ...prev, supervisorId: undefined }));
                      }
                    }}
                    options={neighborhoodCoordinators}
                    getOptionLabel={(option) => option.name}
                    isOptionEqualToValue={(option, value) => option.id === value.id}
                    noOptionsText={
                      loadingCoordinators
                        ? 'טוען רכזים...'
                        : !formData.siteId
                        ? 'נא לבחור שכונה תחילה'
                        : 'אין רכזים משוייכים לשכונה זו'
                    }
                    loading={loadingCoordinators}
                    disabled={!formData.siteId || loadingCoordinators}
                    fullWidth
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="רכז שכונתי"
                        placeholder="חפש לפי שם או אימייל..."
                        error={!!errors.supervisorId}
                        helperText={errors.supervisorId}
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
                              {option.name}
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
                          option.name.toLowerCase().includes(searchTerm) ||
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
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Login Access Section (Create mode only) */}
          {mode === 'create' && (
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
                גישה למערכת
              </Typography>
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  p: 2,
                  borderRadius: '12px',
                  backgroundColor: formData.giveLoginAccess ? '#E8F4FF' : '#F5F5F5',
                  border: '1px solid',
                  borderColor: formData.giveLoginAccess ? '#6161FF' : '#E0E0E0',
                  transition: 'all 0.3s ease',
                }}
              >
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.giveLoginAccess || false}
                      onChange={handleChange('giveLoginAccess')}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#6161FF',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#6161FF',
                        },
                      }}
                    />
                  }
                  label={
                    <Typography sx={{ fontWeight: 600, color: 'text.primary' }}>
                      🔐 אפשר גישה למערכת (יצירת חשבון משתמש)
                    </Typography>
                  }
                  sx={{ margin: 0 }}
                />

                {formData.giveLoginAccess && (
                  <>
                    {/* Phone Number Field */}
                    <TextField
                      fullWidth
                      label="📱 מספר טלפון *"
                      value={formData.phone}
                      onChange={handleChange('phone')}
                      required={formData.giveLoginAccess}
                      error={!!errors.phone}
                      helperText={errors.phone}
                      placeholder="0501234567"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '12px',
                          backgroundColor: 'white',
                        },
                      }}
                    />

                    {/* Password Display */}
                    {formData.generatedPassword && (
                      <Box
                        sx={{
                          p: 2,
                          borderRadius: '8px',
                          backgroundColor: '#FFF9E6',
                          border: '1px dashed #FDAB3D',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, color: '#D68000' }}>
                          ⚠️ סיסמה ברירת מחדל - תן לפעיל:
                        </Typography>
                        <Typography
                          variant="h6"
                          sx={{
                            fontFamily: 'monospace',
                            fontWeight: 700,
                            color: '#D68000',
                            letterSpacing: '2px',
                          }}
                        >
                          {formData.generatedPassword}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#A86800', mt: 0.5, display: 'block' }}>
                          הפעיל יתבקש לשנות סיסמה בכניסה הראשונה
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
              </Box>
            </Box>
          )}
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
