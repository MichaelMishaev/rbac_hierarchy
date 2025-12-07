'use client';

import { useState } from 'react';
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
  Divider,
  InputAdornment,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Code as CodeIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useTranslations } from 'next-intl';

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

type CorporationModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CorporationFormData) => Promise<void>;
  initialData?: Partial<CorporationFormData>;
  mode: 'create' | 'edit';
  areaManagers: AreaManager[];
};

export default function CorporationModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  areaManagers,
}: CorporationModalProps) {
  const t = useTranslations('corporations');
  const tCommon = useTranslations('common');

  const [formData, setFormData] = useState<CorporationFormData>({
    name: initialData?.name || '',
    code: initialData?.code || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    address: initialData?.address || '',
    description: initialData?.description || '',
    isActive: initialData?.isActive ?? true,
    areaManagerId: initialData?.areaManagerId || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof CorporationFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof CorporationFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Code is required';
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
      console.error('Error submitting corporation:', error);
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <BusinessIcon sx={{ fontSize: 28, color: 'primary.main' }} />
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
                      <BusinessIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  label={t('code')}
                  value={formData.code}
                  onChange={handleChange('code')}
                  error={!!errors.code}
                  helperText={errors.code}
                  required
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CodeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  select
                  label="מנהל אזור"
                  value={formData.areaManagerId}
                  onChange={handleChange('areaManagerId')}
                  error={!!errors.areaManagerId}
                  helperText={errors.areaManagerId}
                  required={mode === 'create'}
                  sx={{ flex: 1 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonIcon fontSize="small" />
                      </InputAdornment>
                    ),
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
              </Box>
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
                  required
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
              <TextField
                label={t('description')}
                value={formData.description}
                onChange={handleChange('description')}
                fullWidth
                multiline
                rows={2}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                      <DescriptionIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <FormControlLabel
                control={
                  <Switch checked={formData.isActive} onChange={handleChange('isActive')} />
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
