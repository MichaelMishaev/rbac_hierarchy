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
  Typography,
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  LocationCity as LocationCityIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';

export type SiteFormData = {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  corporationId: string;
  supervisorId: string;
  isActive: boolean;
};

type Corporation = {
  id: string;
  name: string;
  code: string;
};

type Supervisor = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
};

type SiteModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SiteFormData) => Promise<void>;
  initialData?: Partial<SiteFormData>;
  mode: 'create' | 'edit';
  corporations: Corporation[];
  supervisors: Supervisor[];
};

export default function SiteModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  corporations,
  supervisors,
}: SiteModalProps) {
  const t = useTranslations('sites');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const isRTL = locale === 'he';

  const [formData, setFormData] = useState<SiteFormData>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    country: initialData?.country || 'ישראל',
    phone: initialData?.phone || '',
    email: initialData?.email || '',
    corporationId: initialData?.corporationId || '',
    supervisorId: '',
    isActive: initialData?.isActive ?? true,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof SiteFormData, string>>>({});

  // Reset form when modal opens with new initialData
  useEffect(() => {
    if (open) {
      setFormData({
        name: initialData?.name || '',
        address: initialData?.address || '',
        city: initialData?.city || '',
        country: initialData?.country || 'ישראל',
        phone: initialData?.phone || '',
        email: initialData?.email || '',
        corporationId: initialData?.corporationId || corporations[0]?.id || '',
        supervisorId: '',
        isActive: initialData?.isActive ?? true,
      });
      setErrors({});
    }
  }, [open, initialData, corporations]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SiteFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = isRTL ? 'שם האתר נדרש' : 'Site name is required';
    }

    if (!formData.corporationId) {
      newErrors.corporationId = isRTL ? 'יש לבחור תאגיד' : 'Corporation is required';
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
      console.error('Error submitting site:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SiteFormData) => (
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocationCityIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h5" component="span" sx={{ fontWeight: 700 }}>
            {mode === 'create' ? t('createTitle') : t('editTitle')}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Basic Information */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                mb: 2,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationCityIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl fullWidth required error={!!errors.corporationId}>
                <InputLabel>{t('corporation')}</InputLabel>
                <Select
                  value={formData.corporationId}
                  onChange={(e) => handleChange('corporationId')(e as any)}
                  label={t('corporation')}
                  startAdornment={
                    <InputAdornment position="start">
                      <BusinessIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {corporations.map((corp) => (
                    <MenuItem key={corp.id} value={corp.id}>
                      {corp.name} ({corp.code})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Box>

          <Divider />

          {/* Location Information */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                mb: 2,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              מיקום
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={t('city')}
                  value={formData.city}
                  onChange={handleChange('city')}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LocationCityIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label={t('country')}
                  value={formData.country}
                  onChange={handleChange('country')}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PublicIcon fontSize="small" />
                      </InputAdornment>
                    ),
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
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <LocationIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
            </Box>
          </Box>

          <Divider />

          {/* Contact Information */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                mb: 2,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
              פרטי התקשרות
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={t('email')}
                  value={formData.email}
                  onChange={handleChange('email')}
                  error={!!errors.email}
                  helperText={errors.email}
                  type="email"
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  label={t('phone')}
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Additional Information */}
          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                color: 'text.secondary',
                mb: 2,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                letterSpacing: '0.5px',
              }}
            >
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

      <DialogActions>
        <Button onClick={onClose} variant="outlined" disabled={loading} size="large">
          {tCommon('cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading} size="large">
          {loading ? <CircularProgress size={24} /> : tCommon('save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}






