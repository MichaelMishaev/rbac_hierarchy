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
  Alert,
  Collapse,
  IconButton,
} from '@mui/material';
import {
  LocationCity as LocationCityIcon,
  Business as BusinessIcon,
  Public as PublicIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  SupervisorAccount as SupervisorIcon,
  Add as AddIcon,
  Close as CloseIcon,
  ContentCopy as CopyIcon,
} from '@mui/icons-material';
import { useTranslations, useLocale } from 'next-intl';
import { createSupervisorQuick } from '@/app/actions/supervisor-sites';

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
  onSubmit: (data: SiteFormData) => Promise<{ success: boolean; error?: string }>;
  initialData?: Partial<SiteFormData>;
  mode: 'create' | 'edit';
  corporations: Corporation[];
  supervisors: Supervisor[];
  onCorporationChange?: (corporationId: string) => Promise<void>;
};

export default function SiteModal({
  open,
  onClose,
  onSubmit,
  initialData,
  mode,
  corporations,
  supervisors,
  onCorporationChange,
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

  // Quick supervisor creation state
  const [showCreateSupervisor, setShowCreateSupervisor] = useState(false);
  const [supervisorFormData, setSupervisorFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    title: '',
  });
  const [supervisorErrors, setSupervisorErrors] = useState<Record<string, string>>({});
  const [creatingSupervisor, setCreatingSupervisor] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

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
        supervisorId: initialData?.supervisorId || supervisors[0]?.id || '',
        isActive: initialData?.isActive ?? true,
      });
      setErrors({});
      setShowCreateSupervisor(false);
      setSupervisorFormData({ fullName: '', email: '', phone: '', title: '' });
      setSupervisorErrors({});
      setTempPassword(null);
    }
  }, [open, initialData, corporations, supervisors]);

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof SiteFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = isRTL ? 'שם האתר נדרש' : 'Site name is required';
    }

    if (!formData.corporationId) {
      newErrors.corporationId = isRTL ? 'יש לבחור תאגיד' : 'Corporation is required';
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
      const result = await onSubmit(formData);
      if (result.success) {
        onClose();
      } else {
        // Show error message
        const errorField: keyof SiteFormData = 'name';
        setErrors((prev) => ({ ...prev, [errorField]: result.error || 'Failed to save site' }));
      }
    } catch (error) {
      console.error('Error submitting site:', error);
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

    // When corporation changes, fetch supervisors for that corporation
    if (field === 'corporationId' && onCorporationChange) {
      await onCorporationChange(value as string);
      // Reset supervisor selection when corporation changes
      setFormData((prev) => ({ ...prev, supervisorId: '' }));
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
      const result = await createSupervisorQuick({
        fullName: supervisorFormData.fullName,
        email: supervisorFormData.email,
        phone: supervisorFormData.phone,
        corporationId: formData.corporationId,
        title: supervisorFormData.title || 'Supervisor',
      });

      if (result.success && result.supervisor && result.tempPassword) {
        // Show temporary password
        setTempPassword(result.tempPassword);

        // Refresh supervisors list
        if (onCorporationChange) {
          await onCorporationChange(formData.corporationId);
        }

        // Auto-select the new supervisor
        setFormData((prev) => ({ ...prev, supervisorId: result.supervisor.id }));

        // Reset supervisor form
        setSupervisorFormData({ fullName: '', email: '', phone: '', title: '' });
        setSupervisorErrors({});
        setShowCreateSupervisor(false);
      } else {
        setSupervisorErrors({ general: result.error || 'Failed to create supervisor' });
      }
    } catch (error) {
      console.error('Error creating supervisor:', error);
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
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocationCityIcon sx={{ fontSize: 28, color: 'primary.main' }} />
          <Box component="span">
            {mode === 'create' ? t('createTitle') : t('editTitle')}
          </Box>
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

              <FormControl fullWidth required error={!!errors.supervisorId}>
                <InputLabel>{isRTL ? 'מפקח' : 'Supervisor'}</InputLabel>
                <Select
                  value={formData.supervisorId}
                  onChange={(e) => handleChange('supervisorId')(e as any)}
                  label={isRTL ? 'מפקח' : 'Supervisor'}
                  disabled={supervisors.length === 0}
                  startAdornment={
                    <InputAdornment position="start">
                      <SupervisorIcon fontSize="small" />
                    </InputAdornment>
                  }
                >
                  {supervisors.length === 0 ? (
                    <MenuItem disabled value="">
                      {isRTL ? 'אין מפקחים זמינים' : 'No supervisors available'}
                    </MenuItem>
                  ) : (
                    supervisors.map((supervisor) => (
                      <MenuItem key={supervisor.id} value={supervisor.id}>
                        {supervisor.fullName}
                      </MenuItem>
                    ))
                  )}
                </Select>
                {errors.supervisorId && (
                  <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 2 }}>
                    {errors.supervisorId}
                  </Typography>
                )}
              </FormControl>

              {/* Quick supervisor creation when none exist */}
              {supervisors.length === 0 && formData.corporationId && (
                <Box sx={{ mt: 2 }}>
                  <Alert
                    severity="info"
                    sx={{ mb: 2 }}
                    action={
                      !showCreateSupervisor && (
                        <Button
                          size="small"
                          startIcon={<AddIcon />}
                          onClick={() => setShowCreateSupervisor(true)}
                          sx={{ textTransform: 'none' }}
                        >
                          {isRTL ? 'צור מפקח' : 'Create Supervisor'}
                        </Button>
                      )
                    }
                  >
                    {isRTL
                      ? 'לא נמצאו מפקחים לתאגיד זה. יש ליצור מפקח חדש כדי להמשיך.'
                      : 'No supervisors found for this corporation. Create a new supervisor to continue.'}
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
                          {isRTL ? 'יצירת מפקח חדש' : 'Create New Supervisor'}
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
                          label={isRTL ? 'שם מלא *' : 'Full Name *'}
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
                          label={isRTL ? 'אימייל *' : 'Email *'}
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
                          label={isRTL ? 'טלפון' : 'Phone'}
                          value={supervisorFormData.phone}
                          onChange={(e) =>
                            setSupervisorFormData((prev) => ({ ...prev, phone: e.target.value }))
                          }
                          fullWidth
                          size="small"
                        />
                        <TextField
                          label={isRTL ? 'תפקיד' : 'Title'}
                          value={supervisorFormData.title}
                          onChange={(e) =>
                            setSupervisorFormData((prev) => ({ ...prev, title: e.target.value }))
                          }
                          placeholder={isRTL ? 'מפקח' : 'Supervisor'}
                          fullWidth
                          size="small"
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
                          ) : isRTL ? (
                            'צור מפקח'
                          ) : (
                            'Create Supervisor'
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
                    {isRTL ? 'מפקח נוצר בהצלחה!' : 'Supervisor created successfully!'}
                  </Typography>
                  <Typography variant="body2">
                    {isRTL ? 'סיסמה זמנית: ' : 'Temporary password: '}
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
                    {isRTL
                      ? 'שמור את הסיסמה במקום בטוח. המפקח יתבקש לשנות אותה בכניסה הראשונה.'
                      : 'Save this password in a safe place. The supervisor will be asked to change it on first login.'}
                  </Typography>
                </Alert>
              )}
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







