'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Checkbox,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Collapse,
  Stack,
  Paper,
  Fade,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';

// Modern Material Icons
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import EventIcon from '@mui/icons-material/Event';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

interface Task {
  task_id: string;
  type: string;
  body: string;
  execution_date: string;
  sender_name: string;
  sender_role: string;
  created_at: string;
  status: string;
  read_at: string | null;
  acknowledged_at: string | null;
  archived_at: string | null;
  deleted_for_recipient_at: string | null;
  is_deleted: boolean;
  recipients_count?: number;
  read_count?: number;
  acknowledged_count?: number;
  recipients?: Array<{
    user_id: string;
    user_name: string;
    status: string;
    read_at: string | null;
    acknowledged_at: string | null;
  }>;
}

type ViewTab = 'received' | 'sent';
type ViewMode = 'active' | 'archived';
type StatusFilter = 'all' | 'unread' | 'read' | 'acknowledged' | 'deleted';

export default function TaskInbox() {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');

  // State
  const [viewTab, setViewTab] = useState<ViewTab>('received');
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [bulkMenuAnchor, setBulkMenuAnchor] = useState<null | HTMLElement>(null);
  const [currentTaskMenu, setCurrentTaskMenu] = useState<string | null>(null);
  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    archived: 0,
    deleted: 0,
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // PERFORMANCE FIX: Use ref for cache to avoid re-render loops
  const cacheRef = useRef<{
    received: { tasks: Task[]; counts: typeof counts; timestamp: number } | null;
    sent: { tasks: Task[]; counts: typeof counts; timestamp: number } | null;
  }>({
    received: null,
    sent: null,
  });

  // Load tasks with intelligent caching
  const loadTasks = useCallback(async (forceRefresh = false) => {
    const status = viewMode === 'archived' ? 'archived' : statusFilter;
    const cached = cacheRef.current[viewTab];

    // PERFORMANCE: Use cache if available and not stale (< 30 seconds old)
    const cacheAge = cached ? Date.now() - cached.timestamp : Infinity;
    const isCacheValid = cached && cacheAge < 30000 && !forceRefresh;

    if (isCacheValid) {
      // INSTANT tab switch using cached data (no API call!)
      setTasks(cached.tasks);
      setCounts(cached.counts);
      setLoading(false);
      return;
    }

    // Show loading only if no cache available (first load)
    if (!cached) {
      setLoading(true);
    }

    try {
      const response = await fetch(`/api/tasks/inbox?view=${viewTab}&status=${status}`);

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data = await response.json();
      const newTasks = data.tasks;
      const newCounts = {
        total: data.total_count,
        unread: data.unread_count,
        archived: data.archived_count,
        deleted: data.deleted_count,
      };

      setTasks(newTasks);
      setCounts(newCounts);

      // Update cache in ref (no re-render)
      cacheRef.current = {
        ...cacheRef.current,
        [viewTab]: {
          tasks: newTasks,
          counts: newCounts,
          timestamp: Date.now(),
        },
      };
    } catch (err) {
      console.error('Error loading tasks:', err);
      showNotification('שגיאה בטעינת המשימות', 'error');
    } finally {
      setLoading(false);
    }
  }, [viewTab, viewMode, statusFilter]);

  // Load tasks on mount and when filters change
  useEffect(() => {
    loadTasks();
  }, [viewTab, viewMode, statusFilter]);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter and search tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        searchQuery === '' ||
        task.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.sender_name.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [tasks, searchQuery]);

  // Group tasks by date
  const groupedTasks = useMemo(() => {
    const groups: { [key: string]: Task[] } = {};

    filteredTasks.forEach((task) => {
      const date = new Date(task.execution_date);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let label: string;
      if (date.toDateString() === today.toDateString()) {
        label = 'היום';
      } else if (date.toDateString() === yesterday.toDateString()) {
        label = 'אתמול';
      } else if (date < today) {
        label = 'קודם';
      } else {
        label = 'עתידי';
      }

      if (!groups[label]) {
        groups[label] = [];
      }
      groups[label].push(task);
    });

    return groups;
  }, [filteredTasks]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTasks(new Set(filteredTasks.map((t) => t.task_id)));
    } else {
      setSelectedTasks(new Set());
    }
  };

  const handleSelectTask = (taskId: string, checked: boolean) => {
    const newSelected = new Set(selectedTasks);
    if (checked) {
      newSelected.add(taskId);
    } else {
      newSelected.delete(taskId);
    }
    setSelectedTasks(newSelected);
  };

  // Task actions
  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
      }

      showNotification('המשימה עודכנה בהצלחה', 'success');

      // PERFORMANCE: Invalidate cache and force refresh
      cacheRef.current = { ...cacheRef.current, [viewTab]: null };
      loadTasks(true);
    } catch (err: any) {
      console.error('Error updating task status:', err);
      showNotification(err.message || 'שגיאה בעדכון המשימה', 'error');
    }
  };

  const handleBulkAction = async (action: 'read' | 'acknowledged' | 'archived') => {
    try {
      await Promise.all(
        Array.from(selectedTasks).map((taskId) => handleStatusChange(taskId, action))
      );
      setSelectedTasks(new Set());
      setBulkMenuAnchor(null);
      showNotification(`${selectedTasks.size} משימות עודכנו`, 'success');
    } catch (err) {
      showNotification('שגיאה בעדכון המשימות', 'error');
    }
  };

  const handleBulkArchive = async () => {
    try {
      const response = await fetch('/api/tasks/bulk-archive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archive_read: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk archive');
      }

      const data = await response.json();
      showNotification(`${data.archived_count} משימות הועברו לארכיון`, 'success');

      // PERFORMANCE: Invalidate cache and force refresh
      cacheRef.current = { received: null, sent: null };
      loadTasks(true);
    } catch (err) {
      console.error('Error bulk archiving:', err);
      showNotification('שגיאה בארכוב משימות', 'error');
    }
  };

  // Render task card with modern design (memoized for performance)
  const renderTaskCard = useCallback((task: Task) => {
    const isDeleted = task.is_deleted;
    const isExpanded = expandedTask === task.task_id;
    const isSelected = selectedTasks.has(task.task_id);
    const isSentView = viewTab === 'sent';

    // Status color mapping
    const getStatusColor = () => {
      if (isDeleted) return colors.error;

      if (isSentView) {
        // For sent tasks, color based on completion rate
        if (!task.recipients_count) return colors.neutral[400];
        const completionRate = (task.acknowledged_count || 0) / task.recipients_count;
        if (completionRate === 1) return colors.success; // All acknowledged
        if (completionRate > 0.5) return colors.warning; // More than half
        if ((task.read_count || 0) > 0) return colors.primary; // Some read
        return colors.neutral[400]; // None read
      }

      switch (task.status) {
        case 'unread':
          return colors.primary;
        case 'read':
          return colors.warning;
        case 'acknowledged':
          return colors.success;
        default:
          return colors.neutral[400];
      }
    };

    return (
      <Card
        key={task.task_id}
        data-testid={`task-${task.task_id}`}
        sx={{
          mb: 1.5,
          borderRadius: borderRadius.md,
          border: `1px solid ${colors.neutral[200]}`,
          backgroundColor: isSelected ? colors.primary.main + '08' : '#fff',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            borderColor: colors.primary.main,
            boxShadow: shadows.soft,
            transform: 'translateY(-1px)',
          },
        }}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 }, direction: 'rtl' }}>
          {/* Compact Header */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              cursor: 'pointer',
            }}
            onClick={() => setExpandedTask(isExpanded ? null : task.task_id)}
          >
            {/* Checkbox */}
            <Checkbox
              size="small"
              checked={isSelected}
              onChange={(e) => {
                e.stopPropagation();
                handleSelectTask(task.task_id, e.target.checked);
              }}
              onClick={(e) => e.stopPropagation()}
              sx={{
                color: colors.neutral[400],
                '&.Mui-checked': { color: colors.primary },
              }}
            />

            {/* Status Indicator */}
            <Box
              sx={{
                width: 4,
                height: 32,
                borderRadius: 2,
                backgroundColor: getStatusColor(),
                flexShrink: 0,
              }}
            />

            {/* Task Info */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              {/* Sender/Recipients and Date */}
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                }}
              >
                {isSentView ? (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.neutral[900],
                      textAlign: 'right',
                    }}
                  >
                    {task.recipients_count} נמענים • {task.acknowledged_count}/{task.read_count} אישרו/קראו
                  </Typography>
                ) : (
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      color: colors.neutral[900],
                      textAlign: 'right',
                    }}
                  >
                    {task.sender_name}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  sx={{
                    color: colors.neutral[500],
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <EventIcon sx={{ fontSize: 14 }} />
                  {new Date(task.execution_date).toLocaleDateString('he-IL')}
                </Typography>
              </Box>

              {/* Task Preview */}
              <Typography
                variant="body2"
                sx={{
                  color: isDeleted ? colors.neutral[500] : colors.neutral[700],
                  textAlign: 'right',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: isExpanded ? 'normal' : 'nowrap',
                  textDecoration: isDeleted ? 'line-through' : 'none',
                }}
              >
                {isDeleted ? t('taskWasDeletedBySender') : task.body}
              </Typography>
            </Box>

            {/* Quick Actions */}
            <Stack direction="row" spacing={0.5} onClick={(e) => e.stopPropagation()}>
              {/* Quick Acknowledge (only for received tasks) */}
              {!isSentView && !isDeleted && task.status !== 'archived' && task.status !== 'acknowledged' && (
                <Tooltip title={t('acknowledge')} placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.task_id, 'acknowledged');
                    }}
                    sx={{
                      color: colors.success,
                      '&:hover': { backgroundColor: colors.success + '10' },
                    }}
                  >
                    <CheckCircleOutlineIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* Quick Archive (only for received tasks) */}
              {!isSentView && !isDeleted && task.status !== 'archived' && (
                <Tooltip title={t('archive')} placement="top">
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStatusChange(task.task_id, 'archived');
                    }}
                    sx={{
                      color: colors.neutral[600],
                      '&:hover': { backgroundColor: colors.neutral[100] },
                    }}
                  >
                    <ArchiveOutlinedIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              )}

              {/* More Options (only for received tasks) */}
              {!isSentView && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTaskMenu(task.task_id);
                    setAnchorEl(e.currentTarget);
                  }}
                  sx={{
                    color: colors.neutral[600],
                    '&:hover': { backgroundColor: colors.neutral[100] },
                  }}
                >
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              )}

              {/* Expand Icon */}
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setExpandedTask(isExpanded ? null : task.task_id);
                }}
                sx={{ color: colors.neutral[600] }}
              >
                {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
              </IconButton>
            </Stack>
          </Box>

          {/* Expanded Content */}
          <Collapse in={isExpanded} timeout="auto">
            <Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${colors.neutral[200]}` }}>
              {/* Full Task Body */}
              {!isDeleted && (
                <Typography
                  variant="body1"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    color: colors.neutral[800],
                    textAlign: 'right',
                    mb: 2,
                    p: 2,
                    backgroundColor: colors.neutral[50],
                    borderRadius: borderRadius.sm,
                  }}
                >
                  {task.body}
                </Typography>
              )}

              {/* Metadata */}
              <Stack spacing={1} sx={{ mb: 2 }}>
                {!isSentView && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonOutlineIcon sx={{ fontSize: 16, color: colors.neutral[500] }} />
                    <Typography variant="caption" sx={{ color: colors.neutral[600] }}>
                      {t('from')}: {task.sender_name} ({task.sender_role})
                    </Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: colors.neutral[500] }} />
                  <Typography variant="caption" sx={{ color: colors.neutral[600] }}>
                    {t('sent')}:{' '}
                    {new Date(task.created_at).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
                {isSentView && task.recipients && (
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.neutral[600], fontWeight: 600, mb: 0.5, display: 'block' }}>
                      נמענים ({task.recipients.length}):
                    </Typography>
                    <Stack spacing={0.5}>
                      {task.recipients.slice(0, isExpanded ? undefined : 3).map((recipient) => {
                        const isAcknowledged = recipient.status === 'acknowledged';
                        const isRead = recipient.status === 'read';
                        const isUnread = recipient.status === 'unread';

                        return (
                          <Box key={recipient.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'flex-end' }}>
                            <Chip
                              label={isAcknowledged ? 'אושר' : isRead ? 'נקרא' : 'לא נקרא'}
                              size="small"
                              sx={{
                                fontSize: '0.65rem',
                                height: 20,
                                fontWeight: 600,
                                backgroundColor: isAcknowledged
                                  ? colors.success
                                  : isRead
                                  ? colors.warning
                                  : colors.error,
                                color: '#fff',
                                border: 'none',
                              }}
                            />
                            <Chip
                              label={recipient.user_name}
                              size="small"
                              sx={{
                                fontSize: '0.7rem',
                                height: 20,
                                backgroundColor: colors.neutral[100],
                                color: colors.neutral[800],
                                fontWeight: 500,
                              }}
                            />
                          </Box>
                        );
                      })}
                      {!isExpanded && task.recipients.length > 3 && (
                        <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                          ועוד {task.recipients.length - 3}...
                        </Typography>
                      )}
                    </Stack>
                  </Box>
                )}
              </Stack>

              {/* Deleted Warning */}
              {isDeleted && task.deleted_for_recipient_at && (
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: colors.error + '10',
                    border: `1px solid ${colors.error}`,
                    borderRadius: borderRadius.sm,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <WarningAmberIcon sx={{ color: colors.error }} />
                  <Typography variant="body2" sx={{ color: colors.error }}>
                    {t('deletedBySender')}:{' '}
                    {new Date(task.deleted_for_recipient_at).toLocaleDateString('he-IL', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Paper>
              )}

              {/* Action Buttons (only for received tasks) */}
              {!isSentView && !isDeleted && (
                <Stack direction="row" spacing={1} sx={{ mt: 2, direction: 'rtl' }}>
                  {task.status === 'unread' && (
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handleStatusChange(task.task_id, 'read')}
                      endIcon={<CheckCircleOutlineIcon />}
                      sx={{
                        borderColor: colors.primary,
                        color: colors.primary,
                        direction: 'rtl',
                        '&:hover': {
                          borderColor: colors.primary,
                          backgroundColor: colors.primary + '10',
                        },
                        '& .MuiButton-endIcon': {
                          marginLeft: 0,
                          marginRight: '8px',
                        },
                      }}
                    >
                      {t('markAsRead')}
                    </Button>
                  )}
                  {task.status === 'read' && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => handleStatusChange(task.task_id, 'acknowledged')}
                      endIcon={<CheckCircleIcon />}
                      sx={{
                        backgroundColor: colors.success,
                        direction: 'rtl',
                        '&:hover': { backgroundColor: colors.success, filter: 'brightness(0.9)' },
                        '& .MuiButton-endIcon': {
                          marginLeft: 0,
                          marginRight: '8px',
                        },
                      }}
                    >
                      {t('acknowledge')}
                    </Button>
                  )}
                </Stack>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>
    );
  }, [viewTab, expandedTask, selectedTasks, t, handleStatusChange, handleSelectTask, setExpandedTask, setCurrentTaskMenu, setAnchorEl]);

  return (
    <Box sx={{ maxWidth: 1000, margin: '0 auto', direction: 'rtl' }}>
      {/* Notification Snackbar */}
      {notification && (
        <Fade in={!!notification}>
          <Paper
            sx={{
              position: 'fixed',
              top: 80,
              right: 24,
              zIndex: 9999,
              p: 2,
              backgroundColor:
                notification.type === 'success'
                  ? colors.success
                  : notification.type === 'error'
                  ? colors.error
                  : colors.primary,
              color: '#fff',
              borderRadius: borderRadius.md,
              boxShadow: shadows.large,
              minWidth: 250,
            }}
          >
            <Typography variant="body2">{notification.message}</Typography>
          </Paper>
        </Fade>
      )}

      {/* Received / Sent Tabs */}
      <Paper
        sx={{
          mb: 2,
          borderRadius: borderRadius.lg,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', direction: 'rtl' }}>
          <Button
            variant={viewTab === 'received' ? 'contained' : 'text'}
            onClick={() => {
              setViewTab('received');
              setStatusFilter('all');
              setSelectedTasks(new Set()); // Clear selection on tab switch
            }}
            sx={{
              flex: 1,
              py: 2,
              borderRadius: 0,
              backgroundColor: viewTab === 'received' ? colors.primary : 'transparent',
              color: viewTab === 'received' ? '#fff' : colors.neutral[700],
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: viewTab === 'received' ? colors.primary : colors.neutral[100],
              },
            }}
          >
            התקבלו
          </Button>
          <Button
            variant={viewTab === 'sent' ? 'contained' : 'text'}
            onClick={() => {
              setViewTab('sent');
              setStatusFilter('all');
              setSelectedTasks(new Set()); // Clear selection on tab switch
            }}
            sx={{
              flex: 1,
              py: 2,
              borderRadius: 0,
              backgroundColor: viewTab === 'sent' ? colors.primary : 'transparent',
              color: viewTab === 'sent' ? '#fff' : colors.neutral[700],
              fontWeight: 600,
              fontSize: '1rem',
              transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              '&:hover': {
                backgroundColor: viewTab === 'sent' ? colors.primary : colors.neutral[100],
              },
            }}
          >
            נשלחו
          </Button>
        </Box>
      </Paper>

      {/* Header with Stats */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: borderRadius.lg,
          background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.primary}dd 100%)`,
          color: '#fff',
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
              {viewTab === 'received' ? 'משימות שהתקבלו' : 'משימות שנשלחו'}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              {counts.total} משימות בסך הכל
            </Typography>
          </Box>
          <Stack direction="row" spacing={2}>
            {viewTab === 'received' && (
              <Chip
                label={`${counts.unread} חדשות`}
                sx={{
                  backgroundColor: '#fff',
                  color: colors.primary,
                  fontWeight: 600,
                }}
              />
            )}
            {counts.archived > 0 && (
              <Chip
                label={`${counts.archived} בארכיון`}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  color: '#fff',
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
        </Box>
      </Paper>

      {/* Toolbar */}
      <Paper sx={{ p: 2, mb: 2, borderRadius: borderRadius.md }}>
        <Stack spacing={2}>
          {/* Search and View Toggle */}
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="חיפוש משימות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: colors.neutral[400] }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: borderRadius.sm,
                },
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant={viewMode === 'active' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('active')}
                sx={{
                  minWidth: 100,
                  backgroundColor: viewMode === 'active' ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                  color: viewMode === 'active' ? '#fff' : colors.primary,
                }}
              >
                פעיל
              </Button>
              <Button
                variant={viewMode === 'archived' ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setViewMode('archived')}
                sx={{
                  minWidth: 100,
                  backgroundColor: viewMode === 'archived' ? colors.primary : 'transparent',
                  borderColor: colors.primary,
                  color: viewMode === 'archived' ? '#fff' : colors.primary,
                }}
              >
                ארכיון
              </Button>
            </Stack>
          </Box>

          {/* Filters and Bulk Actions */}
          {viewMode === 'active' && viewTab === 'received' && (
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
              {/* Status Filter Chips (only for received) */}
              <Box sx={{ display: 'flex', gap: 1, flex: 1, flexWrap: 'wrap' }}>
                {(['all', 'unread', 'read', 'acknowledged', 'deleted'] as StatusFilter[]).map((filter) => (
                  <Chip
                    key={filter}
                    label={
                      filter === 'all'
                        ? `הכל (${counts.total})`
                        : filter === 'unread'
                        ? `לא נקרא (${counts.unread})`
                        : filter === 'deleted'
                        ? `נמחק (${counts.deleted})`
                        : t(filter)
                    }
                    onClick={() => setStatusFilter(filter)}
                    color={statusFilter === filter ? 'primary' : 'default'}
                    variant={statusFilter === filter ? 'filled' : 'outlined'}
                    size="small"
                    sx={{
                      borderRadius: borderRadius.sm,
                      fontWeight: statusFilter === filter ? 600 : 400,
                    }}
                  />
                ))}
              </Box>

              {/* Bulk Actions (only for received) */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {selectedTasks.size > 0 && (
                  <>
                    <Chip
                      label={`${selectedTasks.size} נבחרו`}
                      onDelete={() => setSelectedTasks(new Set())}
                      color="primary"
                      size="small"
                    />
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={(e) => setBulkMenuAnchor(e.currentTarget)}
                      startIcon={<DoneAllIcon />}
                    >
                      פעולות
                    </Button>
                  </>
                )}
                <Button
                  variant="text"
                  size="small"
                  onClick={handleBulkArchive}
                  startIcon={<ClearAllIcon />}
                  sx={{ color: colors.neutral[600] }}
                >
                  נקה הכל
                </Button>
              </Box>
            </Box>
          )}

          {/* Select All Checkbox (only for received) */}
          {viewTab === 'received' && filteredTasks.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Checkbox
                size="small"
                checked={selectedTasks.size === filteredTasks.length && filteredTasks.length > 0}
                indeterminate={selectedTasks.size > 0 && selectedTasks.size < filteredTasks.length}
                onChange={(e) => handleSelectAll(e.target.checked)}
                sx={{
                  color: colors.neutral[400],
                  '&.Mui-checked': { color: colors.primary },
                }}
              />
              <Typography variant="caption" sx={{ color: colors.neutral[600] }}>
                בחר הכל
              </Typography>
            </Box>
          )}
        </Stack>
      </Paper>

      {/* Tasks List */}
      {loading ? (
        <Stack spacing={1.5}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} variant="rectangular" height={80} sx={{ borderRadius: borderRadius.md }} />
          ))}
        </Stack>
      ) : filteredTasks.length === 0 ? (
        <Paper
          sx={{
            p: 8,
            textAlign: 'center',
            borderRadius: borderRadius.lg,
            backgroundColor: colors.neutral[50],
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: 64, color: colors.neutral[400], mb: 2 }} />
          <Typography variant="h6" sx={{ color: colors.neutral[600], mb: 1 }}>
            אין משימות להצגה
          </Typography>
          <Typography variant="body2" sx={{ color: colors.neutral[500] }}>
            {viewMode === 'archived' ? 'הארכיון ריק' : 'כל המשימות טופלו'}
          </Typography>
        </Paper>
      ) : (
        <Box>
          {Object.entries(groupedTasks).map(([label, groupTasks]) => (
            <Box key={label} sx={{ mb: 3 }}>
              {/* Group Header */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1,
                  px: 1,
                  color: colors.neutral[600],
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                {label}
              </Typography>

              {/* Tasks in Group */}
              {groupTasks.map((task) => renderTaskCard(task))}
            </Box>
          ))}
        </Box>
      )}

      {/* Task Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => {
          setAnchorEl(null);
          setCurrentTaskMenu(null);
        }}
        sx={{
          '& .MuiPaper-root': {
            direction: 'rtl',
          },
        }}
      >
        {currentTaskMenu &&
          tasks.find((t) => t.task_id === currentTaskMenu) &&
          !tasks.find((t) => t.task_id === currentTaskMenu)?.is_deleted && (
            <>
              <MenuItem
                onClick={() => {
                  handleStatusChange(currentTaskMenu, 'read');
                  setAnchorEl(null);
                }}
                sx={{ direction: 'rtl' }}
              >
                <ListItemText sx={{ textAlign: 'right' }}>{t('markAsRead')}</ListItemText>
                <ListItemIcon sx={{ minWidth: 36, justifyContent: 'flex-end' }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </ListItemIcon>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleStatusChange(currentTaskMenu, 'acknowledged');
                  setAnchorEl(null);
                }}
                sx={{ direction: 'rtl' }}
              >
                <ListItemText sx={{ textAlign: 'right' }}>{t('acknowledge')}</ListItemText>
                <ListItemIcon sx={{ minWidth: 36, justifyContent: 'flex-end' }}>
                  <CheckCircleIcon fontSize="small" />
                </ListItemIcon>
              </MenuItem>
              <MenuItem
                onClick={() => {
                  handleStatusChange(currentTaskMenu, 'archived');
                  setAnchorEl(null);
                }}
                sx={{ direction: 'rtl' }}
              >
                <ListItemText sx={{ textAlign: 'right' }}>{t('archive')}</ListItemText>
                <ListItemIcon sx={{ minWidth: 36, justifyContent: 'flex-end' }}>
                  <ArchiveOutlinedIcon fontSize="small" />
                </ListItemIcon>
              </MenuItem>
            </>
          )}
      </Menu>

      {/* Bulk Action Menu */}
      <Menu
        anchorEl={bulkMenuAnchor}
        open={Boolean(bulkMenuAnchor)}
        onClose={() => setBulkMenuAnchor(null)}
        sx={{
          '& .MuiPaper-root': {
            direction: 'rtl',
          },
        }}
      >
        <MenuItem onClick={() => handleBulkAction('read')} sx={{ direction: 'rtl' }}>
          <ListItemText sx={{ textAlign: 'right' }}>סמן הכל כנקרא</ListItemText>
          <ListItemIcon sx={{ minWidth: 36, justifyContent: 'flex-end' }}>
            <CheckCircleOutlineIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('acknowledged')} sx={{ direction: 'rtl' }}>
          <ListItemText sx={{ textAlign: 'right' }}>אשר הכל</ListItemText>
          <ListItemIcon sx={{ minWidth: 36, justifyContent: 'flex-end' }}>
            <CheckCircleIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
        <MenuItem onClick={() => handleBulkAction('archived')} sx={{ direction: 'rtl' }}>
          <ListItemText sx={{ textAlign: 'right' }}>העבר לארכיון</ListItemText>
          <ListItemIcon sx={{ minWidth: 36, justifyContent: 'flex-end' }}>
            <ArchiveOutlinedIcon fontSize="small" />
          </ListItemIcon>
        </MenuItem>
      </Menu>
    </Box>
  );
}
