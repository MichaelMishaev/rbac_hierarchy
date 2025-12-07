'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Badge,
  Tabs,
  Tab,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useTranslations } from 'next-intl';
import { colors, borderRadius, shadows } from '@/lib/design-system';
import InboxIcon from '@mui/icons-material/Inbox';
import ArchiveIcon from '@mui/icons-material/Archive';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';

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
}

export default function TaskInbox() {
  const t = useTranslations('tasks');
  const tCommon = useTranslations('common');

  // State
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [counts, setCounts] = useState({
    total: 0,
    unread: 0,
    archived: 0,
    deleted: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load tasks
  useEffect(() => {
    loadTasks();
  }, [activeTab, statusFilter]);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const status = activeTab === 'archived' ? 'archived' : statusFilter;
      const response = await fetch(`/api/tasks/inbox?status=${status}`);

      if (!response.ok) {
        throw new Error('Failed to load tasks');
      }

      const data = await response.json();
      setTasks(data.tasks);
      setCounts({
        total: data.total_count,
        unread: data.unread_count,
        archived: data.archived_count,
        deleted: data.deleted_count,
      });
    } catch (err) {
      console.error('Error loading tasks:', err);
      setError('שגיאה בטעינת המשימות');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.error.includes('נמחקה')) {
          setError(t('cannotModifyDeletedTask'));
        } else {
          throw new Error(errorData.error);
        }
        return;
      }

      setSuccess(t('taskUpdatedSuccess'));
      loadTasks(); // Reload
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('שגיאה בעדכון המשימה');
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
      setSuccess(`${data.archived_count} משימות הועברו לארכיון`);
      loadTasks();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error bulk archiving:', err);
      setError('שגיאה בארכוב משימות');
    }
  };

  const renderTaskCard = (task: Task) => {
    const isDeleted = task.is_deleted;

    return (
      <Card
        key={task.task_id}
        data-testid={`task-${task.task_id}`}
        sx={{
          mb: 2,
          borderRadius: borderRadius.lg,
          opacity: isDeleted ? 0.5 : 1,
          backgroundColor: isDeleted ? colors.neutral[100] : '#fff',
          borderLeft: isDeleted
            ? `4px solid ${colors.error}`
            : task.status === 'unread'
            ? `4px solid ${colors.primary}`
            : `4px solid ${colors.neutral[300]}`,
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: shadows.medium,
          },
        }}
      >
        <CardContent sx={{ direction: 'rtl' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <Typography
              variant="body2"
              sx={{ color: colors.neutral[600], textAlign: 'right' }}
            >
              📅{' '}
              {new Date(task.execution_date).toLocaleDateString('he-IL', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
              })}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                textDecoration: isDeleted ? 'line-through' : 'none',
                color: isDeleted ? colors.neutral[500] : colors.neutral[800],
              }}
            >
              {isDeleted ? '🗑️ ' + t('taskDeleted') : '📋 ' + t('task')}
            </Typography>
          </Box>

          {/* Sender Info */}
          <Typography
            variant="body2"
            sx={{ color: colors.neutral[600], mb: 0.5, textAlign: 'right' }}
          >
            {t('from')}: {task.sender_name}
          </Typography>
          <Typography
            variant="body2"
            sx={{ color: colors.neutral[600], mb: 2, textAlign: 'right' }}
          >
            {t('sent')}:{' '}
            {new Date(task.created_at).toLocaleDateString('he-IL', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Typography>

          {/* Deleted Warning */}
          {isDeleted && task.deleted_for_recipient_at && (
            <Alert
              severity="warning"
              icon={<WarningIcon />}
              sx={{ mb: 2, textAlign: 'right' }}
            >
              <Typography variant="body2">
                {t('deletedBySender')}:{' '}
                {new Date(task.deleted_for_recipient_at).toLocaleDateString('he-IL', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Typography>
            </Alert>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Task Body */}
          {isDeleted ? (
            <Alert severity="warning" icon={<WarningIcon />}>
              ⚠️ {t('taskWasDeletedBySender')}
            </Alert>
          ) : (
            <Typography
              variant="body1"
              sx={{
                whiteSpace: 'pre-wrap',
                color: colors.neutral[800],
                textAlign: 'right',
              }}
              className="task-body"
            >
              {task.body}
            </Typography>
          )}

          {/* Action Buttons */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {isDeleted ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => handleStatusChange(task.task_id, 'archived')}
              >
                {t('close')}
              </Button>
            ) : (
              <>
                {task.status === 'unread' && (
                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => handleStatusChange(task.task_id, 'read')}
                    sx={{
                      backgroundColor: colors.primary,
                      '&:hover': { backgroundColor: colors.primary, filter: 'brightness(0.9)' },
                    }}
                  >
                    🔵 {t('markAsRead')}
                  </Button>
                )}
                {task.status === 'read' && (
                  <Button
                    variant="contained"
                    size="small"
                    color="success"
                    onClick={() => handleStatusChange(task.task_id, 'acknowledged')}
                  >
                    ✅ {t('acknowledge')}
                  </Button>
                )}
                {task.status !== 'archived' && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => handleStatusChange(task.task_id, 'archived')}
                    startIcon={<ArchiveIcon />}
                  >
                    {t('archive')}
                  </Button>
                )}
              </>
            )}
          </Box>

          {/* Status Badges */}
          <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {task.status === 'unread' && !isDeleted && (
              <Chip label={t('unread')} size="small" color="primary" />
            )}
            {task.status === 'read' && !isDeleted && (
              <Chip label={t('read')} size="small" color="default" />
            )}
            {task.status === 'acknowledged' && !isDeleted && (
              <Chip label={t('acknowledged')} size="small" color="success" />
            )}
            {isDeleted && (
              <Chip
                label={t('deleted')}
                size="small"
                sx={{ backgroundColor: colors.error, color: '#fff' }}
                className="deleted-label"
              />
            )}
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          direction: 'rtl',
        }}
      >
        <Badge badgeContent={counts.unread} color="error">
          <Typography variant="h4" sx={{ fontWeight: 700, color: colors.primary }}>
            📥 {t('inbox')}
          </Typography>
        </Badge>
        <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
          🔔 {counts.unread} {t('newTasks')}
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onChange={(_, val) => setActiveTab(val)} sx={{ mb: 3 }}>
        <Tab label={`📑 ${t('active')}`} value="active" />
        <Tab label={`📦 ${t('archive')} (${counts.archived})`} value="archived" />
      </Tabs>

      {/* Filters (only in active tab) */}
      {activeTab === 'active' && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            backgroundColor: colors.neutral[50],
            borderRadius: borderRadius.lg,
            direction: 'rtl',
          }}
        >
          <Typography sx={{ mb: 1, fontWeight: 600, textAlign: 'right' }}>
            {t('filter')}:
          </Typography>
          <RadioGroup
            row
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            sx={{ justifyContent: 'flex-end' }}
          >
            <FormControlLabel
              value="all"
              control={<Radio />}
              label={tCommon('all')}
              sx={{ flexDirection: 'row-reverse', ml: 2 }}
            />
            <FormControlLabel
              value="unread"
              control={<Radio />}
              label={t('unread')}
              sx={{ flexDirection: 'row-reverse', ml: 2 }}
            />
            <FormControlLabel
              value="read"
              control={<Radio />}
              label={t('read')}
              sx={{ flexDirection: 'row-reverse', ml: 2 }}
            />
            <FormControlLabel
              value="acknowledged"
              control={<Radio />}
              label={t('acknowledged')}
              sx={{ flexDirection: 'row-reverse', ml: 2 }}
            />
            <FormControlLabel
              value="deleted"
              control={<Radio />}
              label={t('deleted') + ` (${counts.deleted})`}
              sx={{ flexDirection: 'row-reverse', ml: 2 }}
            />
          </RadioGroup>
        </Box>
      )}

      {/* Bulk Actions */}
      {activeTab === 'active' && (
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={handleBulkArchive}
            startIcon={<ArchiveIcon />}
          >
            {t('clearAllRead')}
          </Button>
        </Box>
      )}

      {/* Tasks List */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : tasks.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            py: 10,
            color: colors.neutral[500],
          }}
        >
          <InboxIcon sx={{ fontSize: 64, mb: 2 }} />
          <Typography variant="h6">אין משימות להצגה</Typography>
        </Box>
      ) : (
        tasks.map((task) => renderTaskCard(task))
      )}
    </Box>
  );
}
