'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  RadioGroup,
  FormControlLabel,
  Radio,
  Button,
  Autocomplete,
  Chip,
  CircularProgress,
  Tooltip,
  Alert,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import InfoIcon from '@mui/icons-material/Info';
import SendIcon from '@mui/icons-material/Send';
import SpamPreventionModal from './SpamPreventionModal';

interface Recipient {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  corporation_name?: string;
  site_names?: string[];
}

interface RecipientPreview {
  count: number;
  breakdown: {
    by_role: {
      area_manager: number;
      corporation_manager: number;
      supervisor: number;
    };
    by_corporation: Array<{
      corporation_id: string;
      name: string;
      count: number;
    }>;
  };
}

export default function TaskCreationForm() {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const { data: session } = useSession();

  // Form state
  const [taskBody, setTaskBody] = useState('');
  const [sendTo, setSendTo] = useState<'all' | 'selected'>('all');
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([]);
  const [executionDate, setExecutionDate] = useState<Date | null>(null);

  // UI state
  const [availableRecipients, setAvailableRecipients] = useState<Recipient[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load available recipients (only if sendTo = 'selected')
  useEffect(() => {
    if (sendTo === 'selected') {
      loadRecipients();
    }
  }, [sendTo, searchQuery, page]);

  const loadRecipients = async () => {
    setLoadingRecipients(true);
    try {
      const response = await fetch(
        `/api/tasks/available-recipients?search=${searchQuery}&page=${page}&limit=20`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailableRecipients(prev =>
          page === 1 ? data.recipients : [...prev, ...data.recipients]
        );
        setHasMore(data.pagination.has_more);
      }
    } catch (err) {
      console.error('Error loading recipients:', err);
    } finally {
      setLoadingRecipients(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
    setAvailableRecipients([]);
  };

  const validateForm = (): string | null => {
    if (!taskBody || taskBody.length < 10) {
      return t('taskBodyTooShort');
    }
    if (taskBody.length > 2000) {
      return t('taskBodyTooLong');
    }
    if (!executionDate) {
      return t('selectAtLeastOneRecipient');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (executionDate < today) {
      return t('executionDateInPast');
    }
    if (sendTo === 'selected' && selectedRecipients.length === 0) {
      return t('selectAtLeastOneRecipient');
    }
    return null;
  };

  const handleSendClick = async () => {
    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    // Get preview
    try {
      const response = await fetch('/api/tasks/preview-recipients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          send_to: sendTo,
          recipient_user_ids: sendTo === 'selected'
            ? selectedRecipients.map(r => r.user_id)
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t('taskCreatedError'));
        return;
      }

      const preview = await response.json();
      setRecipientPreview(preview);

      // Show confirmation modal only if recipients > 1
      if (preview.count > 1) {
        setShowConfirmModal(true);
      } else {
        // Send immediately
        await handleConfirmSend();
      }
    } catch (err) {
      console.error('Error getting preview:', err);
      setError(t('taskCreatedError'));
    }
  };

  const handleConfirmSend = async () => {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'Task',
          body: taskBody,
          execution_date: executionDate?.toISOString().split('T')[0],
          send_to: sendTo,
          recipient_user_ids: sendTo === 'selected'
            ? selectedRecipients.map(r => r.user_id)
            : undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.error || t('taskCreatedError'));
        return;
      }

      // Success
      setSuccess(true);
      setShowConfirmModal(false);

      // Reset form
      setTimeout(() => {
        setTaskBody('');
        setSelectedRecipients([]);
        setExecutionDate(null);
        setSendTo('all');
        setSuccess(false);
      }, 2000);
    } catch (err) {
      console.error('Error creating task:', err);
      setError(t('taskCreatedError'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: colors.primary,
              textAlign: 'right',
            }}
          >
            {t('newTask')}
          </Typography>

          {/* Success Message */}
          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {t('taskCreatedSuccess')}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Task Type (Hard-coded) */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 600, textAlign: 'right' }}>
              {t('taskType')}:
            </Typography>
            <TextField
              fullWidth
              value={t('task')}
              disabled
              InputProps={{
                sx: { backgroundColor: colors.neutral[50] },
              }}
            />
          </Box>

          {/* Task Description */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 600, textAlign: 'right' }}>
              {t('taskDescription')}: *
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={taskBody}
              onChange={(e) => setTaskBody(e.target.value)}
              placeholder={t('taskDescriptionPlaceholder')}
              inputProps={{
                maxLength: 2000,
                dir: 'rtl',
              }}
              helperText={`${taskBody.length} / 2000 ${tCommon('characters')}`}
              data-testid="task-body"
            />
          </Box>

          {/* Send To */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 600, textAlign: 'right' }}>
              {t('sendTo')}: *
            </Typography>
            <RadioGroup
              value={sendTo}
              onChange={(e) => setSendTo(e.target.value as 'all' | 'selected')}
              sx={{ textAlign: 'right' }}
            >
              <FormControlLabel
                value="all"
                control={<Radio />}
                label={t('allUnderMe')}
                sx={{ flexDirection: 'row-reverse', ml: 0 }}
                data-testid="send-to-all"
              />
              <FormControlLabel
                value="selected"
                control={<Radio />}
                label={t('specificRecipients')}
                sx={{ flexDirection: 'row-reverse', ml: 0 }}
              />
            </RadioGroup>

            {/* Searchable Multi-Select (only if sendTo = selected) */}
            {sendTo === 'selected' && (
              <Box sx={{ mt: 2 }}>
                <Autocomplete
                  multiple
                  options={availableRecipients}
                  value={selectedRecipients}
                  onChange={(_, newValue) => setSelectedRecipients(newValue)}
                  onInputChange={(_, newInputValue) => handleSearchChange(newInputValue)}
                  getOptionLabel={(option) => `${option.full_name} - ${option.corporation_name}`}
                  loading={loadingRecipients}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      placeholder={t('searchRecipients')}
                      InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                          <>
                            {loadingRecipients ? <CircularProgress size={20} /> : null}
                            {params.InputProps.endAdornment}
                          </>
                        ),
                      }}
                      inputProps={{
                        ...params.inputProps,
                        dir: 'rtl',
                      }}
                    />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                      <Chip
                        label={option.full_name}
                        {...getTagProps({ index })}
                        key={option.user_id}
                      />
                    ))
                  }
                />
                <Typography
                  variant="body2"
                  sx={{ mt: 1, textAlign: 'right', color: colors.neutral[600] }}
                >
                  {t('selected')}: {selectedRecipients.length} {t('recipients')}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Execution Date */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, justifyContent: 'flex-end' }}>
              <Tooltip title={t('executionDateTooltip')} arrow>
                <InfoIcon fontSize="small" color="action" />
              </Tooltip>
              <Typography sx={{ fontWeight: 600 }}>
                {t('executionDate')}: *
              </Typography>
            </Box>
            <Typography
              variant="body2"
              sx={{ mb: 1, color: colors.neutral[600], fontStyle: 'italic', textAlign: 'right' }}
            >
              {t('executionDateInfo')}
              <br />
              {t('executionDateNote')}
            </Typography>
            <DatePicker
              value={executionDate}
              onChange={(newValue) => setExecutionDate(newValue)}
              minDate={new Date()}
              format="dd/MM/yyyy"
              slotProps={{
                textField: {
                  fullWidth: true,
                  inputProps: { dir: 'rtl' },
                  'data-testid': 'execution-date',
                },
              }}
            />
          </Box>

          {/* Sent By (Auto-filled) */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ mb: 1, fontWeight: 600, textAlign: 'right' }}>
              {t('sentBy')}:
            </Typography>
            <TextField
              fullWidth
              value={session?.user?.fullName || session?.user?.email || ''}
              disabled
              InputProps={{
                sx: { backgroundColor: colors.neutral[50] },
              }}
            />
          </Box>

          {/* Send Button */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSendClick}
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : <SendIcon />}
              sx={{
                minWidth: 200,
                backgroundColor: colors.primary,
                '&:hover': {
                  backgroundColor: colors.primary,
                  filter: 'brightness(0.9)',
                },
              }}
              data-testid="send-task-button"
            >
              {submitting ? tCommon('loading') : t('sendTask')}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Spam Prevention Confirmation Modal */}
      {recipientPreview && (
        <SpamPreventionModal
          open={showConfirmModal}
          onClose={() => setShowConfirmModal(false)}
          onConfirm={handleConfirmSend}
          recipientPreview={recipientPreview}
          taskBody={taskBody}
          executionDate={executionDate}
          submitting={submitting}
        />
      )}
    </LocalizationProvider>
  );
}
