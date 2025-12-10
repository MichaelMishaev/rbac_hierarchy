/**
 * Swipeable Task Card Component
 * Mobile-optimized card with swipe gestures for quick actions
 *
 * Swipe Actions:
 * - Swipe Right: Mark as complete
 * - Swipe Left: Edit/View details
 *
 * Features:
 * - Smooth animations
 * - Visual feedback
 * - Touch-friendly (56x56px action buttons)
 * - RTL support
 * - Priority indicators
 */

'use client';

import { useState } from 'react';
import { useSwipeable } from 'react-swipeable';
import { Card, CardContent, Box, Typography, IconButton, Chip } from '@mui/material';
import { colors, shadows } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EditIcon from '@mui/icons-material/Edit';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FlagIcon from '@mui/icons-material/Flag';

interface Task {
  id: string;
  title: string;
  body: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  dueDate?: Date | null;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assignedTo?: string;
}

interface TaskCardSwipeableProps {
  task: Task;
  onComplete?: (taskId: string) => void;
  onEdit?: (taskId: string) => void;
}

const PRIORITY_COLORS = {
  LOW: colors.neutral[400],
  MEDIUM: colors.status.blue,
  HIGH: colors.status.orange,
  URGENT: colors.status.red,
};

const PRIORITY_LABELS = {
  LOW: 'נמוכה',
  MEDIUM: 'בינונית',
  HIGH: 'גבוהה',
  URGENT: 'דחוף',
};

export default function TaskCardSwipeable({
  task,
  onComplete,
  onEdit,
}: TaskCardSwipeableProps) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handlers = useSwipeable({
    onSwiping: (eventData) => {
      setIsDragging(true);
      // Limit offset to -120px (left) and 120px (right)
      const newOffset = Math.max(-120, Math.min(120, eventData.deltaX));
      setOffset(newOffset);
    },
    onSwipedRight: () => {
      if (offset > 80) {
        // Trigger complete
        onComplete?.(task.id);
      }
      setOffset(0);
      setIsDragging(false);
    },
    onSwipedLeft: () => {
      if (offset < -80) {
        // Trigger edit
        onEdit?.(task.id);
      }
      setOffset(0);
      setIsDragging(false);
    },
    onSwiped: () => {
      setOffset(0);
      setIsDragging(false);
    },
    trackMouse: true, // Enable mouse dragging for desktop testing
  });

  const completeVisible = offset > 40;
  const editVisible = offset < -40;

  const formatDueDate = (date: Date | null | undefined) => {
    if (!date) return null;
    const d = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (d.toDateString() === today.toDateString()) {
      return 'היום';
    } else if (d.toDateString() === tomorrow.toDateString()) {
      return 'מחר';
    } else {
      return d.toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        mb: 2,
      }}
      data-testid="task-card-swipeable"
    >
      {/* Background Actions */}
      <Box
        sx={{
          position: 'absolute',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          px: 2,
        }}
      >
        {/* Right Swipe Action - Complete */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: '100%',
            bgcolor: colors.status.green,
            borderRadius: '16px 0 0 16px',
            opacity: completeVisible ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <CheckCircleIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>

        {/* Left Swipe Action - Edit */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: '100%',
            bgcolor: colors.primary.main,
            borderRadius: '0 16px 16px 0',
            opacity: editVisible ? 1 : 0,
            transition: 'opacity 0.2s',
          }}
        >
          <EditIcon sx={{ color: 'white', fontSize: 32 }} />
        </Box>
      </Box>

      {/* Main Card */}
      <Card
        {...handlers}
        sx={{
          transform: `translateX(${offset}px)`,
          transition: isDragging ? 'none' : 'transform 0.3s ease',
          cursor: 'grab',
          '&:active': {
            cursor: 'grabbing',
          },
          boxShadow: shadows.soft,
          borderRadius: '16px',
          bgcolor: colors.neutral[0],
          border: `1px solid ${colors.neutral[200]}`,
          borderLeft: `4px solid ${PRIORITY_COLORS[task.priority]}`,
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Priority Indicator */}
            <Box
              sx={{
                width: 6,
                height: 56,
                bgcolor: PRIORITY_COLORS[task.priority],
                borderRadius: '3px',
                flexShrink: 0,
              }}
            />

            {/* Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: colors.neutral[700],
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {task.title}
                </Typography>

                <Chip
                  icon={<FlagIcon sx={{ fontSize: 14 }} />}
                  label={PRIORITY_LABELS[task.priority]}
                  size="small"
                  sx={{
                    bgcolor: PRIORITY_COLORS[task.priority] + '20',
                    color: PRIORITY_COLORS[task.priority],
                    fontWeight: 600,
                    fontSize: '0.7rem',
                    height: 24,
                    '& .MuiChip-icon': {
                      color: PRIORITY_COLORS[task.priority],
                    },
                  }}
                />
              </Box>

              <Typography
                variant="body2"
                sx={{
                  color: colors.neutral[600],
                  mb: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {task.body}
              </Typography>

              {/* Footer */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                {task.dueDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CalendarTodayIcon sx={{ fontSize: 14, color: colors.neutral[400] }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDueDate(task.dueDate)}
                    </Typography>
                  </Box>
                )}

                {task.assignedTo && (
                  <Chip
                    label={task.assignedTo}
                    size="small"
                    sx={{
                      bgcolor: colors.pastel.blueLight,
                      fontSize: '0.7rem',
                      height: 20,
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Desktop Actions (Visible on hover) */}
            <Box
              sx={{
                display: { xs: 'none', md: 'flex' },
                gap: 1,
                opacity: 0,
                transition: 'opacity 0.2s',
                '&:hover': {
                  opacity: 1,
                },
              }}
            >
              <IconButton
                size="small"
                onClick={() => onComplete?.(task.id)}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: colors.status.green + '20',
                  '&:hover': {
                    bgcolor: colors.status.green,
                    color: 'white',
                  },
                }}
              >
                <CheckCircleIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => onEdit?.(task.id)}
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: colors.primary.main + '20',
                  '&:hover': {
                    bgcolor: colors.primary.main,
                    color: 'white',
                  },
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
