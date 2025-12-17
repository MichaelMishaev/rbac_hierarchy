/**
 * Voter Form Component - Hebrew RTL
 *
 * Features (2025 UX Best Practices):
 * - Progressive disclosure with tabs/steps
 * - Visual hierarchy with cards
 * - Inline validation
 * - Sticky action bar
 * - Auto-focus first field
 * - Mobile-first responsive design
 * - Accessibility (ARIA labels)
 */

'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  Typography,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  Paper,
  Divider,
  Stepper,
  Step,
  StepLabel,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Assessment as AssessmentIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { createVoterSchema, type CreateVoterFormData } from '@/lib/voters/validation/schemas';
import { createVoter, updateVoter } from '@/lib/voters/actions/voter-actions';
import type { Voter } from '@/lib/voters';

interface VoterFormProps {
  voter?: Voter;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const steps = ['מידע אישי', 'מידע גאוגרפי', 'סטטוס קמפיין'];

export function VoterForm({ voter, onSuccess, onCancel }: VoterFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const isEditMode = !!voter;

  // Reset state when dialog opens/closes (voter prop changes)
  useEffect(() => {
    setSuccess(false);
    setError(null);
    setActiveStep(0);
    setIsSubmitting(false);
  }, [voter]);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, touchedFields },
    trigger,
    setFocus,
  } = useForm<CreateVoterFormData>({
    resolver: zodResolver(createVoterSchema),
    mode: 'onTouched', // Only validate after user interacts
    reValidateMode: 'onChange', // Re-validate on change after first touch
    defaultValues: voter
      ? ({
          fullName: voter.fullName,
          phone: voter.phone,
          idNumber: voter.idNumber || '',
          email: voter.email || '',
          dateOfBirth: voter.dateOfBirth || null,
          gender: voter.gender || '',
          voterAddress: voter.voterAddress || '',
          voterCity: voter.voterCity || '',
          voterNeighborhood: voter.voterNeighborhood || '',
          supportLevel: voter.supportLevel || '',
          contactStatus: voter.contactStatus || '',
          priority: voter.priority || '',
          notes: voter.notes || '',
        } as any)
      : {},
  });

  // Auto-focus first field on mount using React Hook Form's setFocus
  useEffect(() => {
    const timer = setTimeout(() => {
      setFocus('fullName');
    }, 100);
    return () => clearTimeout(timer);
  }, [setFocus]);

  const handleNext = async () => {
    // Validate current step fields before proceeding
    const fieldsToValidate = {
      0: ['fullName', 'phone', 'idNumber', 'email', 'dateOfBirth', 'gender'],
      1: ['voterAddress', 'voterCity', 'voterNeighborhood'],
      2: ['supportLevel', 'contactStatus', 'priority', 'notes'],
    }[activeStep] as Array<keyof CreateVoterFormData>;

    const isValid = await trigger(fieldsToValidate);
    if (isValid && activeStep < steps.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const onSubmit = async (data: CreateVoterFormData) => {
    // CRITICAL: Only allow submission when user is on the final step
    if (activeStep !== steps.length - 1) {
      console.warn('[VoterForm] Prevented premature submission at step', activeStep);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert null to undefined for dateOfBirth and lastContactedAt
      const submitData = {
        ...data,
        dateOfBirth: data.dateOfBirth ?? undefined,
        lastContactedAt: data.lastContactedAt ?? undefined,
      };

      let result;
      if (isEditMode) {
        result = await updateVoter(voter.id, submitData);
      } else {
        result = await createVoter(submitData);
      }

      if (result.success) {
        setSuccess(true);
        // Delay closing dialog to let user see success message
        setTimeout(() => {
          onSuccess?.();
        }, 1500);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step content
  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Paper
            key="step-0"
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 4 },
              backgroundColor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PersonIcon color="primary" sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                מידע אישי
              </Typography>
            </Box>
            <Divider sx={{ mb: 4, borderColor: 'primary.light', borderWidth: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('fullName')}
                  label="שם מלא"
                  fullWidth
                  required
                  error={!!errors.fullName}
                  helperText={errors.fullName?.message}
                  disabled={isSubmitting}
                  autoComplete="off"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('phone')}
                  label="טלפון"
                  fullWidth
                  required
                  error={!!errors.phone}
                  helperText={errors.phone?.message}
                  disabled={isSubmitting}
                  placeholder="05xxxxxxxx"
                  autoComplete="off"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('idNumber')}
                  label="תעודת זהות"
                  fullWidth
                  error={!!errors.idNumber}
                  helperText={errors.idNumber?.message}
                  disabled={isSubmitting}
                  placeholder="9 ספרות"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('email')}
                  label="אימייל"
                  type="email"
                  fullWidth
                  error={!!errors.email}
                  helperText={errors.email?.message}
                  disabled={isSubmitting}
                  autoComplete="off"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="תאריך לידה"
                      value={field.value}
                      onChange={(date) => field.onChange(date)}
                      disabled={isSubmitting}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.dateOfBirth,
                          helperText: errors.dateOfBirth?.message,
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 2,
                              paddingInlineStart: '14px',
                              paddingInlineEnd: '14px',
                            },
                            '& .MuiOutlinedInput-input': {
                              paddingInlineEnd: '48px !important',
                            },
                            '& .MuiInputAdornment-root': {
                              position: 'absolute',
                              left: 'auto',
                              right: '8px',
                              marginInlineStart: 0,
                              marginInlineEnd: 0,
                            },
                          },
                        },
                        openPickerButton: {
                          sx: {
                            marginInlineStart: 0,
                            marginInlineEnd: 0,
                          },
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.gender}>
                  <InputLabel>מגדר</InputLabel>
                  <Select
                    {...register('gender')}
                    label="מגדר"
                    disabled={isSubmitting}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">בחר</MenuItem>
                    <MenuItem value="זכר">זכר</MenuItem>
                    <MenuItem value="נקבה">נקבה</MenuItem>
                    <MenuItem value="אחר">אחר</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Paper>
        );

      case 1:
        return (
          <Paper
            key="step-1"
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 4 },
              backgroundColor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <LocationIcon color="primary" sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                מידע גאוגרפי
              </Typography>
            </Box>
            <Divider sx={{ mb: 4, borderColor: 'primary.light', borderWidth: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  {...register('voterAddress')}
                  label="כתובת"
                  fullWidth
                  error={!!errors.voterAddress}
                  helperText={errors.voterAddress?.message}
                  disabled={isSubmitting}
                  autoComplete="off"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('voterCity')}
                  label="עיר"
                  fullWidth
                  error={!!errors.voterCity}
                  helperText={errors.voterCity?.message}
                  disabled={isSubmitting}
                  autoComplete="off"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  {...register('voterNeighborhood')}
                  label="שכונה"
                  fullWidth
                  error={!!errors.voterNeighborhood}
                  helperText={errors.voterNeighborhood?.message}
                  disabled={isSubmitting}
                  autoComplete="off"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        );

      case 2:
        return (
          <Paper
            key="step-2"
            elevation={2}
            sx={{
              p: { xs: 2.5, sm: 4 },
              backgroundColor: 'background.paper',
              borderRadius: 3,
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'primary.light',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AssessmentIcon color="primary" sx={{ fontSize: 28 }} />
              </Box>
              <Typography variant="h6" fontWeight={600} color="text.primary">
                סטטוס קמפיין
              </Typography>
            </Box>
            <Divider sx={{ mb: 4, borderColor: 'primary.light', borderWidth: 2 }} />

            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.supportLevel}>
                  <InputLabel>רמת תמיכה</InputLabel>
                  <Select
                    {...register('supportLevel')}
                    label="רמת תמיכה"
                    disabled={isSubmitting}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">בחר</MenuItem>
                    <MenuItem value="תומך">תומך</MenuItem>
                    <MenuItem value="מהסס">מהסס</MenuItem>
                    <MenuItem value="מתנגד">מתנגד</MenuItem>
                    <MenuItem value="לא ענה">לא ענה</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.contactStatus}>
                  <InputLabel>סטטוס קשר</InputLabel>
                  <Select
                    {...register('contactStatus')}
                    label="סטטוס קשר"
                    disabled={isSubmitting}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">בחר</MenuItem>
                    <MenuItem value="נוצר קשר">נוצר קשר</MenuItem>
                    <MenuItem value="נקבע פגישה">נקבע פגישה</MenuItem>
                    <MenuItem value="הצביע">הצביע</MenuItem>
                    <MenuItem value="לא זמין">לא זמין</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={!!errors.priority}>
                  <InputLabel>עדיפות</InputLabel>
                  <Select
                    {...register('priority')}
                    label="עדיפות"
                    disabled={isSubmitting}
                    sx={{ borderRadius: 2 }}
                  >
                    <MenuItem value="">בחר</MenuItem>
                    <MenuItem value="גבוה">גבוה</MenuItem>
                    <MenuItem value="בינוני">בינוני</MenuItem>
                    <MenuItem value="נמוך">נמוך</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  {...register('notes')}
                  label="הערות"
                  fullWidth
                  multiline
                  rows={4}
                  error={!!errors.notes}
                  helperText={errors.notes?.message}
                  disabled={isSubmitting}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    },
                  }}
                />
              </Grid>
            </Grid>
          </Paper>
        );

      default:
        return null;
    }
  };

  // Completely prevent Enter key from submitting form in multi-step wizard
  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key === 'Enter') {
      // Only allow Enter on the actual submit button when on last step
      const target = e.target as HTMLElement;
      const isSubmitButton = target.tagName === 'BUTTON' &&
                             target.getAttribute('type') === 'submit' &&
                             activeStep === steps.length - 1;

      if (!isSubmitButton) {
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        onKeyDown={handleKeyDown}
        dir="rtl"
        autoComplete="off"
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        }}
      >
        {/* Error/Success Alerts - Fixed at top */}
        {(error || success) && (
          <Box sx={{ px: 3, pt: 2, pb: 1 }}>
            {error && (
              <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 0 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 0 }}>
                {isEditMode ? 'הבוחר עודכן בהצלחה!' : 'הבוחר נוסף בהצלחה!'}
              </Alert>
            )}
          </Box>
        )}

        {/* Stepper - Only show on desktop */}
        {!isMobile && (
          <Box sx={{ px: 3, pt: 3, pb: 2 }}>
            <Stepper
              activeStep={activeStep}
              sx={{
                '& .MuiStepLabel-root': {
                  fontSize: '1rem',
                },
                '& .MuiStepLabel-label': {
                  fontWeight: 500,
                  mt: 1,
                },
                '& .MuiStepIcon-root': {
                  fontSize: '2rem',
                },
                '& .MuiStepIcon-root.Mui-active': {
                  color: 'primary.main',
                  transform: 'scale(1.1)',
                },
                '& .MuiStepIcon-root.Mui-completed': {
                  color: 'success.main',
                },
              }}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Mobile step indicator */}
        {isMobile && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              gap: 1,
              px: 3,
              pt: 2,
              pb: 1,
            }}
          >
            {steps.map((_, index) => (
              <Box
                key={index}
                sx={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor:
                    index === activeStep
                      ? 'primary.main'
                      : index < activeStep
                      ? 'success.main'
                      : 'grey.300',
                  transition: 'all 0.3s',
                }}
              />
            ))}
          </Box>
        )}

        {/* Step Content - Scrollable */}
        <Box
          key={`step-content-${activeStep}`}
          sx={{
            flex: 1,
            overflowY: 'auto',
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 3 },
          }}
        >
          {renderStepContent(activeStep)}
        </Box>

        {/* Action Bar - Fixed at bottom */}
        <Box
          sx={{
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            px: { xs: 2, sm: 3 },
            py: { xs: 2, sm: 2.5 },
            mt: 'auto',
            boxShadow: '0 -2px 8px rgba(0,0,0,0.06)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              gap: 1.5,
              flexDirection: { xs: 'column-reverse', sm: 'row' },
              justifyContent: 'space-between',
            }}
          >
            {/* Left side: Back + Cancel */}
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flex: { xs: 1, sm: 'none' },
              }}
            >
              <Button
                type="button"
                variant="outlined"
                onClick={handleBack}
                disabled={activeStep === 0 || isSubmitting}
                sx={{
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { sm: 100 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                }}
              >
                חזור
              </Button>

              {onCancel && (
                <Button
                  type="button"
                  variant="text"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  sx={{
                    flex: { xs: 1, sm: 'none' },
                    minWidth: { sm: 100 },
                    py: { xs: 1.25, sm: 1.5 },
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    fontWeight: 600,
                    borderRadius: 2,
                  }}
                >
                  ביטול
                </Button>
              )}
            </Box>

            {/* Right side: Next/Submit */}
            {activeStep === steps.length - 1 ? (
              <Button
                type="submit"
                variant="contained"
                disabled={isSubmitting || success}
                startIcon={isSubmitting && <CircularProgress size={20} />}
                sx={{
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { sm: 140 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                {isSubmitting
                  ? 'שומר...'
                  : success
                  ? 'נשמר!'
                  : isEditMode
                  ? 'עדכן בוחר'
                  : 'הוסף בוחר'}
              </Button>
            ) : (
              <Button
                type="button"
                variant="contained"
                onClick={handleNext}
                disabled={isSubmitting || success}
                sx={{
                  flex: { xs: 1, sm: 'none' },
                  minWidth: { sm: 100 },
                  py: { xs: 1.25, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  fontWeight: 600,
                  borderRadius: 2,
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                  },
                }}
              >
                הבא
              </Button>
            )}
          </Box>
        </Box>
      </Box>
    </LocalizationProvider>
  );
}
