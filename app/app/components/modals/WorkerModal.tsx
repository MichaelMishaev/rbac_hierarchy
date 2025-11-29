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
  Select,
  InputLabel,
  FormControl,
  Chip,
  Autocomplete,
} from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';

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
};

type Site = {
  id: string;
  name: string;
  corporationId: string;
  corporation?: {
    id: string;
    name: string;
  };
};

type Supervisor = {
  id: string;
  name: string;
  email: string;
};

type WorkerModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WorkerFormData) => Promise<void>;
  initialData?: Partial<WorkerFormData>;
  mode: 'create' | 'edit';
  sites: Site[];
  supervisors: Supervisor[];
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

export default function WorkerModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  sites,
  supervisors,
  defaultSiteId,
  defaultSupervisorId,
}: WorkerModalProps) {
  const t = useTranslations('workers');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'he';

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

  // Reset form when modal opens with new initialData
  useEffect(() => {
    if (open) {
      setFormData({
        name: initialData?.name || '',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        position: initialData?.position || '',
        notes: initialData?.notes || '',
        tags: initialData?.tags || [],
        siteId: initialData?.siteId || defaultSiteId || sites[0]?.id || '',
        supervisorId: initialData?.supervisorId || defaultSupervisorId || supervisors[0]?.id || '',
        isActive: initialData?.isActive ?? true,
        startDate: initialData?.startDate || new Date().toISOString().split('T')[0],
      });
      setErrors({});
    }
  }, [open, initialData, sites, supervisors, defaultSiteId, defaultSupervisorId]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof WorkerFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = isRTL ? 'שם העובד נדרש' : 'Worker name is required';
    }

    if (!formData.siteId) {
      newErrors.siteId = isRTL ? 'יש לבחור אתר' : 'Site is required';
    }

    if (!formData.supervisorId) {
      newErrors.supervisorId = isRTL ? 'יש לבחור מפקח' : 'Supervisor is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = isRTL ? 'פורמט אימייל שגוי' : 'Invalid email format';
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
      console.error('Error submitting worker:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof WorkerFormData) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: unknown } }
  ) => {
    const value = field === 'isActive' 
      ? (event.target as HTMLInputElement).checked 
      : event.target.value as string;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: borderRadius.xl,
          boxShadow: shadows.large,
          direction: isRTL ? 'rtl' : 'ltr',
        },
      }}
    >
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: '24px',
          color: colors.neutral[900],
          pb: 2,
        }}
      >
        {mode === 'create' ? t('createTitle') : t('editTitle')}
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
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
                borderRadius: borderRadius.lg,
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl fullWidth required error={!!errors.siteId}>
              <InputLabel>{t('site')}</InputLabel>
              <Select
                value={formData.siteId}
                onChange={(e) => handleChange('siteId')(e as any)}
                label={t('site')}
                sx={{
                  borderRadius: borderRadius.lg,
                }}
              >
                {sites.map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name} {site.corporation && `(${site.corporation.name})`}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required error={!!errors.supervisorId}>
              <InputLabel>{isRTL ? 'מפקח' : 'Supervisor'}</InputLabel>
              <Select
                value={formData.supervisorId}
                onChange={(e) => handleChange('supervisorId')(e as any)}
                label={isRTL ? 'מפקח' : 'Supervisor'}
                sx={{
                  borderRadius: borderRadius.lg,
                }}
              >
                {supervisors.map((supervisor) => (
                  <MenuItem key={supervisor.id} value={supervisor.id}>
                    {supervisor.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <TextField
            label={t('position')}
            value={formData.position}
            onChange={handleChange('position')}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.lg,
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={isRTL ? 'טלפון' : 'Phone'}
              value={formData.phone}
              onChange={handleChange('phone')}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.lg,
                },
              }}
            />
            <TextField
              label={isRTL ? 'אימייל' : 'Email'}
              value={formData.email}
              onChange={handleChange('email')}
              error={!!errors.email}
              helperText={errors.email}
              type="email"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.lg,
                },
              }}
            />
          </Box>

          <TextField
            label={t('startDate')}
            type="date"
            value={formData.startDate}
            onChange={handleChange('startDate')}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.lg,
              },
            }}
          />

          <Autocomplete
            multiple
            freeSolo
            options={COMMON_TAGS}
            value={formData.tags}
            onChange={(_, newValue) => {
              setFormData((prev) => ({ ...prev, tags: newValue as string[] }));
            }}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  key={option}
                  label={option}
                  size="small"
                  sx={{
                    backgroundColor: colors.pastel.blueLight,
                    color: colors.pastel.blue,
                    fontWeight: 500,
                  }}
                />
              ))
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label={t('tags')}
                placeholder={isRTL ? 'הוסף תגיות...' : 'Add tags...'}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: borderRadius.lg,
                  },
                }}
              />
            )}
          />

          <TextField
            label={isRTL ? 'הערות' : 'Notes'}
            value={formData.notes}
            onChange={handleChange('notes')}
            fullWidth
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: borderRadius.lg,
              },
            }}
          />

          <FormControlLabel
            control={
              <Switch 
                checked={formData.isActive} 
                onChange={handleChange('isActive')}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.pastel.green,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.pastel.green,
                  },
                }}
              />
            }
            label={tCommon('active')}
            sx={{
              '& .MuiFormControlLabel-label': {
                fontWeight: 500,
                color: colors.neutral[700],
              },
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button
          onClick={onClose}
          variant="outlined"
          disabled={loading}
          sx={{
            borderColor: colors.neutral[300],
            color: colors.neutral[700],
            borderRadius: borderRadius.lg,
            px: 3,
            '&:hover': {
              borderColor: colors.neutral[400],
              backgroundColor: colors.neutral[50],
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
            background: colors.gradients.primary,
            boxShadow: shadows.soft,
            borderRadius: borderRadius.lg,
            px: 3,
            '&:hover': {
              boxShadow: shadows.glowBlue,
            },
          }}
        >
          {loading ? <CircularProgress size={24} /> : tCommon('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}


