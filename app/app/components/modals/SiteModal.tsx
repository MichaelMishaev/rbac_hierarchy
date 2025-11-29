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
} from '@mui/material';
import { useTranslations, useLocale } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';

export type SiteFormData = {
  name: string;
  address: string;
  city: string;
  country: string;
  phone: string;
  email: string;
  corporationId: string;
  isActive: boolean;
};

type Corporation = {
  id: string;
  name: string;
  code: string;
};

type SiteModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: SiteFormData) => Promise<void>;
  initialData?: Partial<SiteFormData>;
  mode: 'create' | 'edit';
  corporations: Corporation[];
};

export default function SiteModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  corporations,
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

          <FormControl fullWidth required error={!!errors.corporationId}>
            <InputLabel>{t('corporation')}</InputLabel>
            <Select
              value={formData.corporationId}
              onChange={(e) => handleChange('corporationId')(e as any)}
              label={t('corporation')}
              sx={{
                borderRadius: borderRadius.lg,
              }}
            >
              {corporations.map((corp) => (
                <MenuItem key={corp.id} value={corp.id}>
                  {corp.name} ({corp.code})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('city')}
              value={formData.city}
              onChange={handleChange('city')}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.lg,
                },
              }}
            />
            <TextField
              label={t('country')}
              value={formData.country}
              onChange={handleChange('country')}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.lg,
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
                borderRadius: borderRadius.lg,
              },
            }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label={t('email')}
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
            <TextField
              label={t('phone')}
              value={formData.phone}
              onChange={handleChange('phone')}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.lg,
                },
              }}
            />
          </Box>

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


