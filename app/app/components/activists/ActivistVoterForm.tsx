'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  TextField,
  Button,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Simplified schema for activists (less fields than admin form)
const voterSchema = z.object({
  fullName: z.string().min(1, 'שם מלא הוא שדה חובה'),
  phone: z.string().min(9, 'מספר טלפון לא תקין'),
  supportLevel: z.enum(['תומך', 'מהסס', 'מתנגד', 'לא ענה']).optional(),
  voterAddress: z.string().optional(),
  voterCity: z.string().optional(),
  voterNeighborhood: z.string().optional(),
  notes: z.string().optional(),
});

type VoterFormData = z.infer<typeof voterSchema>;

interface ActivistVoterFormProps {
  userId: string;
  userName: string;
  neighborhoodName: string;
  cityName: string;
  initialData?: Partial<VoterFormData> & { id?: string };
}

export function ActivistVoterForm({
  userId,
  userName,
  neighborhoodName,
  cityName,
  initialData,
}: ActivistVoterFormProps) {
  const router = useRouter();
  const [isSubmittingLocal, setIsSubmittingLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting: formIsSubmitting },
  } = useForm<VoterFormData>({
    resolver: zodResolver(voterSchema),
    defaultValues: initialData || {
      supportLevel: undefined,
    },
  });

  // Use both local state and form state for double protection
  const isSubmitting = isSubmittingLocal || formIsSubmitting;

  const onSubmit = async (data: VoterFormData) => {
    // Prevent double submissions
    if (isSubmittingLocal) return;

    setIsSubmittingLocal(true);
    setError(null);

    try {
      const payload = {
        ...data,
        insertedByUserId: userId,
        insertedByUserName: userName,
        insertedByUserRole: 'פעיל שטח',
        insertedByNeighborhoodName: neighborhoodName,
        insertedByCityName: cityName,
      };

      const url = initialData?.id
        ? `/api/activists/voters/${initialData.id}`
        : '/api/activists/voters';

      const method = initialData?.id ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'שגיאה בשמירת הבוחר');
      }

      // Success - redirect back to voters list
      router.push('/voters');
      router.refresh();
    } catch (err) {
      console.error('Error saving voter:', err);
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setIsSubmittingLocal(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Stack spacing={3}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Full Name */}
        <TextField
          fullWidth
          label="שם מלא *"
          {...register('fullName')}
          error={!!errors.fullName}
          helperText={errors.fullName?.message}
          disabled={isSubmitting}
          data-testid="voter-fullname-input"
        />

        {/* Phone */}
        <TextField
          fullWidth
          label="טלפון *"
          {...register('phone')}
          error={!!errors.phone}
          helperText={errors.phone?.message}
          disabled={isSubmitting}
          placeholder="05X-XXX-XXXX"
          data-testid="voter-phone-input"
        />

        {/* Support Level */}
        <Box>
          <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
            רמת תמיכה
          </Typography>
          <Controller
            name="supportLevel"
            control={control}
            render={({ field }) => (
              <ToggleButtonGroup
                {...field}
                exclusive
                fullWidth
                color="primary"
                disabled={isSubmitting}
                data-testid="voter-support-level"
              >
                <ToggleButton value="תומך">
                  🟢 תומך
                </ToggleButton>
                <ToggleButton value="מהסס">
                  🟡 מהסס
                </ToggleButton>
                <ToggleButton value="מתנגד">
                  🔴 מתנגד
                </ToggleButton>
                <ToggleButton value="לא ענה">
                  ⚪ לא ענה
                </ToggleButton>
              </ToggleButtonGroup>
            )}
          />
        </Box>

        {/* Address */}
        <TextField
          fullWidth
          label="כתובת"
          {...register('voterAddress')}
          disabled={isSubmitting}
          placeholder="רחוב, מספר בית, עיר"
          data-testid="voter-address-input"
        />

        {/* City */}
        <TextField
          fullWidth
          label="עיר מגורים"
          {...register('voterCity')}
          disabled={isSubmitting}
          data-testid="voter-city-input"
        />

        {/* Neighborhood */}
        <TextField
          fullWidth
          label="שכונה"
          {...register('voterNeighborhood')}
          disabled={isSubmitting}
          data-testid="voter-neighborhood-input"
        />

        {/* Notes */}
        <TextField
          fullWidth
          multiline
          rows={4}
          label="הערות (אופציונלי)"
          {...register('notes')}
          disabled={isSubmitting}
          placeholder="הערות נוספות על הבוחר..."
          data-testid="voter-notes-input"
        />

        {/* Actions */}
        <Stack direction="row" spacing={2}>
          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            data-testid="submit-voter-button"
          >
            {isSubmitting ? (
              <CircularProgress size={24} color="inherit" />
            ) : initialData?.id ? (
              'עדכן'
            ) : (
              'שמור'
            )}
          </Button>
          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={() => router.back()}
            disabled={isSubmitting}
            data-testid="cancel-voter-button"
          >
            ביטול
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
