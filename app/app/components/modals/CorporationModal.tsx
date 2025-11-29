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
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';

export type CorporationFormData = {
  name: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  description: string;
  isActive: boolean;
};

type CorporationModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CorporationFormData) => Promise<void>;
  initialData?: Partial<CorporationFormData>;
  mode: 'create' | 'edit';
};

export default function CorporationModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
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
    // Clear error for this field
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField
            label={t('name')}
            value={formData.name}
            onChange={handleChange('name')}
            error={!!errors.name}
            helperText={errors.name}
            fullWidth
            required
            autoFocus
          />

          <TextField
            label={t('code')}
            value={formData.code}
            onChange={handleChange('code')}
            error={!!errors.code}
            helperText={errors.code}
            fullWidth
            required
          />

          <TextField
            label={t('email')}
            value={formData.email}
            onChange={handleChange('email')}
            error={!!errors.email}
            helperText={errors.email}
            type="email"
            fullWidth
            required
          />

          <TextField
            label={t('phone')}
            value={formData.phone}
            onChange={handleChange('phone')}
            fullWidth
          />

          <TextField
            label={t('address')}
            value={formData.address}
            onChange={handleChange('address')}
            fullWidth
            multiline
            rows={2}
          />

          <TextField
            label={t('description')}
            value={formData.description}
            onChange={handleChange('description')}
            fullWidth
            multiline
            rows={3}
          />

          <FormControlLabel
            control={
              <Switch checked={formData.isActive} onChange={handleChange('isActive')} />
            }
            label={tCommon('active')}
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
