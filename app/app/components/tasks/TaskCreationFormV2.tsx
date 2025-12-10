'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Autocomplete,
  Chip,
  CircularProgress,
  Alert,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
  Fade,
  Skeleton,
  InputAdornment,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { he } from 'date-fns/locale';
import { addDays, addWeeks, startOfTomorrow } from 'date-fns';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InboxIcon from '@mui/icons-material/Inbox';
import AddIcon from '@mui/icons-material/Add';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import EventIcon from '@mui/icons-material/Event';
import GroupsIcon from '@mui/icons-material/Groups';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import SpamPreventionModalV2 from './SpamPreventionModalV2';

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
      activistCoordinator: number;
    };
    by_city: Array<{
      corporation_id: string;
      name: string;
      count: number;
    }>;
  };
}

interface TaskCreationFormV2Props {
  senderId: string;
  senderRole: string;
  senderName?: string;
}

export default function TaskCreationFormV2({ senderId, senderRole, senderName }: TaskCreationFormV2Props) {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');
  const router = useRouter();

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
  const [formTouched, setFormTouched] = useState(false);

  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [recipientPreview, setRecipientPreview] = useState<RecipientPreview | null>(null);

  // Submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validation state
  const [taskBodyError, setTaskBodyError] = useState<string | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Load available recipients (only if sendTo = 'selected')
  useEffect(() => {
    if (sendTo === 'selected') {
      loadRecipients();
    }
  }, [sendTo, searchQuery, page]);

  // Real-time validation
  useEffect(() => {
    if (!formTouched) return;

    if (taskBody.length > 0 && taskBody.length < 10) {
      setTaskBodyError('תיאור המשימה קצר מדי (מינימום 10 תווים)');
    } else if (taskBody.length > 2000) {
      setTaskBodyError('תיאור המשימה ארוך מדי (מקסימום 2000 תווים)');
    } else {
      setTaskBodyError(null);
    }
  }, [taskBody, formTouched]);

  useEffect(() => {
    if (!formTouched) return;

    if (executionDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (executionDate < today) {
        setDateError('לא ניתן לבחור תאריך בעבר');
      } else {
        setDateError(null);
      }
    }
  }, [executionDate, formTouched]);

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
      return 'תיאור המשימה קצר מדי (מינימום 10 תווים)';
    }
    if (taskBody.length > 2000) {
      return 'תיאור המשימה ארוך מדי (מקסימום 2000 תווים)';
    }
    if (!executionDate) {
      return 'יש לבחור תאריך ביצוע';
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (executionDate < today) {
      return 'לא ניתן לבחור תאריך בעבר';
    }
    if (sendTo === 'selected' && selectedRecipients.length === 0) {
      return 'יש לבחור לפחות נמען אחד';
    }
    return null;
  };

  const handleSendClick = async () => {
    setFormTouched(true);

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
        setError(errorData.error || 'שגיאה ביצירת המשימה');
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
      setError('שגיאה ביצירת המשימה');
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
        setError(errorData.error || 'שגיאה ביצירת המשימה');
        return;
      }

      // Success - Show modern toast with next actions
      const recipientCount = recipientPreview?.count || 0;
      setShowConfirmModal(false);

      // Custom success toast with action buttons (2025 UX best practice)
      toast.custom(
        (toastInstance) => (
          <Box
            sx={{
              background: `linear-gradient(135deg, ${colors.success} 0%, #2e7d32 100%)`,
              color: '#fff',
              borderRadius: borderRadius.xl,
              padding: '24px',
              boxShadow: shadows.xl,
              maxWidth: '450px',
              direction: 'rtl',
              border: '2px solid rgba(255,255,255,0.2)',
            }}
          >
            {/* Success Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <CheckCircleIcon sx={{ fontSize: 40 }} />
              <Box>
                <Typography sx={{ fontWeight: 700, fontSize: '18px' }}>
                  המשימה נשלחה בהצלחה!
                </Typography>
                <Typography sx={{ fontSize: '14px', opacity: 0.9 }}>
                  נשלחה ל-{recipientCount} נמענים
                </Typography>
              </Box>
            </Box>

            {/* Next Steps Info */}
            <Typography sx={{ fontSize: '13px', opacity: 0.9, mb: 2.5, lineHeight: 1.5 }}>
              הנמענים יקבלו התראה ויוכלו לצפות במשימה בתיבת המשימות שלהם
            </Typography>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end' }}>
              <Button
                size="medium"
                onClick={() => {
                  toast.dismiss(toastInstance.id);
                  router.push('/he/tasks/inbox');
                }}
                sx={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 2.5,
                  borderRadius: borderRadius.lg,
                  border: '1.5px solid rgba(255,255,255,0.3)',
                  display: 'flex',
                  gap: 1,
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.3)',
                    border: '1.5px solid rgba(255,255,255,0.5)',
                  },
                }}
              >
                צפה בתיבת המשימות
                <InboxIcon fontSize="small" />
              </Button>
              <Button
                size="medium"
                onClick={() => {
                  toast.dismiss(toastInstance.id);
                }}
                sx={{
                  backgroundColor: '#fff',
                  color: colors.success,
                  textTransform: 'none',
                  fontWeight: 700,
                  px: 3,
                  borderRadius: borderRadius.lg,
                  display: 'flex',
                  gap: 1,
                  '&:hover': {
                    backgroundColor: '#f5f5f5',
                    transform: 'translateY(-2px)',
                    boxShadow: shadows.medium,
                  },
                  transition: 'all 0.2s ease',
                }}
              >
                שלח משימה נוספת
                <AddIcon fontSize="small" />
              </Button>
            </Box>
          </Box>
        ),
        {
          duration: 7000,
          position: 'top-center',
        }
      );

      // Reset form
      setTaskBody('');
      setSelectedRecipients([]);
      setExecutionDate(null);
      setSendTo('all');
      setFormTouched(false);
    } catch (err) {
      console.error('Error creating task:', err);
      setError('שגיאה ביצירת המשימה');
    } finally {
      setSubmitting(false);
    }
  };

  // Quick date selection
  const setQuickDate = (date: Date) => {
    setExecutionDate(date);
    setFormTouched(true);
  };

  // Character count with visual feedback
  const getCharCountColor = () => {
    if (taskBody.length === 0) return colors.neutral[400];
    if (taskBody.length < 10) return colors.error;
    if (taskBody.length < 100) return colors.warning;
    if (taskBody.length > 1800) return colors.warning;
    if (taskBody.length > 2000) return colors.error;
    return colors.success;
  };

  const getCharCountLabel = () => {
    if (taskBody.length < 10) return `נדרשים עוד ${10 - taskBody.length} תווים`;
    if (taskBody.length > 2000) return `יותר מדי ב-${taskBody.length - 2000} תווים`;
    return `${taskBody.length} / 2000`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={he}>
      <Fade in timeout={400}>
        <Card
          sx={{
            borderRadius: borderRadius.xl,
            boxShadow: shadows.large,
            maxWidth: 900,
            margin: '0 auto',
            border: `1px solid ${colors.neutral[200]}`,
          }}
        >
          <CardContent sx={{ p: { xs: 3, md: 4 } }}>
            {/* Error Message */}
            {error && (
              <Fade in>
                <Alert
                  severity="error"
                  sx={{
                    mb: 3,
                    borderRadius: borderRadius.lg,
                    border: `2px solid ${colors.error}`,
                  }}
                  onClose={() => setError(null)}
                >
                  {error}
                </Alert>
              </Fade>
            )}

            {/* Task Description */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '16px', color: colors.neutral[900] }}>
                  תיאור המשימה *
                </Typography>
                <DescriptionIcon sx={{ color: colors.primary }} />
              </Box>
              <TextField
                fullWidth
                multiline
                rows={7}
                value={taskBody}
                onChange={(e) => {
                  setTaskBody(e.target.value);
                  if (!formTouched) setFormTouched(true);
                }}
                placeholder="תאר את המשימה בפירוט... מה צריך לעשות, מתי, ואיך?"
                inputProps={{
                  maxLength: 2100,
                  dir: 'rtl',
                }}
                error={!!taskBodyError}
                helperText={taskBodyError}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: borderRadius.lg,
                    fontSize: '15px',
                    lineHeight: 1.7,
                    backgroundColor: colors.neutral[50],
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: '#fff',
                    },
                    '&.Mui-focused': {
                      backgroundColor: '#fff',
                      boxShadow: `0 0 0 3px ${colors.primary}20`,
                    },
                  },
                }}
                data-testid="task-body"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                <Chip
                  label={getCharCountLabel()}
                  size="small"
                  sx={{
                    backgroundColor: `${getCharCountColor()}20`,
                    color: getCharCountColor(),
                    fontWeight: 600,
                    border: `1.5px solid ${getCharCountColor()}`,
                  }}
                />
                {taskBody.length >= 10 && taskBody.length <= 2000 && (
                  <Chip
                    icon={<CheckCircleIcon />}
                    label="אורך מתאים"
                    size="small"
                    sx={{
                      backgroundColor: `${colors.success}20`,
                      color: colors.success,
                      fontWeight: 600,
                      border: `1.5px solid ${colors.success}`,
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Send To - Toggle Button Style */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '16px', color: colors.neutral[900] }}>
                  שלח אל *
                </Typography>
                <GroupsIcon sx={{ color: colors.primary }} />
              </Box>
              <ToggleButtonGroup
                value={sendTo}
                exclusive
                onChange={(_, newValue) => {
                  if (newValue !== null) {
                    setSendTo(newValue);
                    setFormTouched(true);
                  }
                }}
                fullWidth
                sx={{
                  gap: 2,
                  '& .MuiToggleButtonGroup-grouped': {
                    border: `2px solid ${colors.neutral[200]}`,
                    borderRadius: `${borderRadius.lg} !important`,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '15px',
                    py: 2,
                    '&.Mui-selected': {
                      backgroundColor: colors.primary,
                      color: '#fff',
                      borderColor: colors.primary,
                      '&:hover': {
                        backgroundColor: colors.primary,
                        filter: 'brightness(0.95)',
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="all" data-testid="send-to-all">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    כל הנמענים תחתיי
                    <GroupsIcon />
                  </Box>
                </ToggleButton>
                <ToggleButton value="selected">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    נמענים ספציפיים
                    <PersonIcon />
                  </Box>
                </ToggleButton>
              </ToggleButtonGroup>

              {/* Searchable Multi-Select (only if sendTo = selected) */}
              {sendTo === 'selected' && (
                <Fade in>
                  <Box sx={{ mt: 3 }}>
                    <Autocomplete
                      multiple
                      options={availableRecipients}
                      value={selectedRecipients}
                      onChange={(_, newValue) => {
                        setSelectedRecipients(newValue);
                        setFormTouched(true);
                      }}
                      onInputChange={(_, newInputValue) => handleSearchChange(newInputValue)}
                      getOptionLabel={(option) => `${option.full_name} - ${option.corporation_name}`}
                      loading={loadingRecipients}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="חפש נמענים לפי שם או תאגיד..."
                          InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                              <>
                                {loadingRecipients ? <CircularProgress size={20} /> : null}
                                {params.InputProps.endAdornment}
                              </>
                            ),
                            sx: {
                              borderRadius: borderRadius.lg,
                              backgroundColor: colors.neutral[50],
                              '&:hover': {
                                backgroundColor: '#fff',
                              },
                            },
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
                            sx={{
                              backgroundColor: colors.primary,
                              color: '#fff',
                              fontWeight: 600,
                              '& .MuiChip-deleteIcon': {
                                color: 'rgba(255,255,255,0.7)',
                                '&:hover': {
                                  color: '#fff',
                                },
                              },
                            }}
                          />
                        ))
                      }
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          p: 1.5,
                        },
                      }}
                    />
                    {selectedRecipients.length > 0 && (
                      <Box
                        sx={{
                          mt: 2,
                          p: 2,
                          backgroundColor: `${colors.success}10`,
                          borderRadius: borderRadius.lg,
                          border: `2px solid ${colors.success}40`,
                          textAlign: 'right',
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600, color: colors.success }}>
                          נבחרו {selectedRecipients.length} נמענים
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Fade>
              )}
            </Box>

            {/* Execution Date with Quick Actions */}
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, justifyContent: 'flex-end' }}>
                <Typography sx={{ fontWeight: 700, fontSize: '16px', color: colors.neutral[900] }}>
                  תאריך ביצוע *
                </Typography>
                <EventIcon sx={{ color: colors.primary }} />
              </Box>

              {/* Quick Date Buttons */}
              <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQuickDate(startOfTomorrow())}
                  sx={{
                    textTransform: 'none',
                    borderRadius: borderRadius.lg,
                    fontWeight: 600,
                    borderColor: colors.neutral[300],
                    color: colors.neutral[700],
                    display: 'flex',
                    gap: 1,
                    '&:hover': {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}10`,
                    },
                  }}
                >
                  מחר
                  <TodayIcon fontSize="small" />
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQuickDate(addDays(new Date(), 3))}
                  sx={{
                    textTransform: 'none',
                    borderRadius: borderRadius.lg,
                    fontWeight: 600,
                    borderColor: colors.neutral[300],
                    color: colors.neutral[700],
                    display: 'flex',
                    gap: 1,
                    '&:hover': {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}10`,
                    },
                  }}
                >
                  בעוד 3 ימים
                  <DateRangeIcon fontSize="small" />
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setQuickDate(addWeeks(new Date(), 1))}
                  sx={{
                    textTransform: 'none',
                    borderRadius: borderRadius.lg,
                    fontWeight: 600,
                    borderColor: colors.neutral[300],
                    color: colors.neutral[700],
                    display: 'flex',
                    gap: 1,
                    '&:hover': {
                      borderColor: colors.primary,
                      backgroundColor: `${colors.primary}10`,
                    },
                  }}
                >
                  בעוד שבוע
                  <DateRangeIcon fontSize="small" />
                </Button>
              </Box>

              <DatePicker
                value={executionDate}
                onChange={(newValue) => {
                  setExecutionDate(newValue);
                  setFormTouched(true);
                }}
                minDate={new Date()}
                format="dd/MM/yyyy"
                slotProps={{
                  textField: {
                    fullWidth: true,
                    error: !!dateError,
                    helperText: dateError,
                    inputProps: { dir: 'rtl' },
                    sx: {
                      '& .MuiOutlinedInput-root': {
                        borderRadius: borderRadius.lg,
                        backgroundColor: colors.neutral[50],
                        '&:hover': {
                          backgroundColor: '#fff',
                        },
                        '&.Mui-focused': {
                          backgroundColor: '#fff',
                          boxShadow: `0 0 0 3px ${colors.primary}20`,
                        },
                      },
                    },
                  },
                }}
              />

              {executionDate && (
                <Fade in>
                  <Box
                    sx={{
                      mt: 2,
                      p: 2,
                      backgroundColor: `${colors.info}10`,
                      borderRadius: borderRadius.lg,
                      border: `2px solid ${colors.info}40`,
                      textAlign: 'right',
                    }}
                  >
                    <Typography variant="body2" sx={{ color: colors.info, fontWeight: 600 }}>
                      המשימה תהיה זמינה לביצוע ב-
                      {executionDate.toLocaleDateString('he-IL', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Fade>
              )}
            </Box>

            {/* Send Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleSendClick}
                disabled={submitting || !!taskBodyError || !!dateError}
                sx={{
                  minWidth: 280,
                  py: 1.8,
                  fontSize: '16px',
                  fontWeight: 700,
                  backgroundColor: colors.primary,
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.medium,
                  textTransform: 'none',
                  display: 'flex',
                  gap: 1.5,
                  '&:hover': {
                    backgroundColor: colors.primary,
                    filter: 'brightness(0.95)',
                    transform: 'translateY(-2px)',
                    boxShadow: shadows.large,
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                  transition: 'all 0.2s ease',
                }}
                data-testid="send-task-button"
              >
                {submitting ? (
                  <>
                    <CircularProgress size={20} sx={{ color: '#fff' }} />
                    שולח משימה...
                  </>
                ) : (
                  <>
                    שלח משימה
                    <SendIcon sx={{ transform: 'rotate(180deg)' }} />
                  </>
                )}
              </Button>
            </Box>

            {/* Helper text */}
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                textAlign: 'center',
                mt: 2,
                color: colors.neutral[500],
                fontStyle: 'italic',
              }}
            >
              * שדות חובה
            </Typography>
          </CardContent>
        </Card>
      </Fade>

      {/* Spam Prevention Confirmation Modal */}
      {recipientPreview && (
        <SpamPreventionModalV2
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
