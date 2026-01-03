/**
 * Notifications Center Page
 *
 * Shows all notifications for the current user:
 * - Task assignments
 * - System notifications
 * - Push notification status
 *
 * Hebrew-only, RTL interface
 */

import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Chip,
  Button,
  Alert,
} from '@mui/material';
import Link from 'next/link';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SettingsIcon from '@mui/icons-material/Settings';
import { colors, borderRadius } from '@/lib/design-system';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

export default async function NotificationsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect('/login');
  }

  const userId = session.user.id;

  // Get push subscription status
  const pushSubscription = await prisma.pushSubscription.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });

  // Get recent task assignments (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const taskAssignments = await prisma.taskAssignment.findMany({
    where: {
      targetUserId: userId,
      task: {
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    },
    include: {
      task: {
        include: {
          senderUser: {
            select: {
              fullName: true,
              email: true,
            },
          },
        },
      },
    },
    orderBy: {
      task: {
        createdAt: 'desc',
      },
    },
    take: 20,
  });

  const isPushEnabled = !!pushSubscription;
  const unreadCount = taskAssignments.filter((a) => a.status === 'unread').length;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🔔 מרכז התראות
        </Typography>
        <Typography variant="body1" color="text.secondary">
          צפה בכל ההתראות והמשימות שנשלחו אליך
        </Typography>
      </Box>

      {/* Push Notification Status Card */}
      <Card
        sx={{
          mb: 3,
          borderRadius: borderRadius['2xl'],
          background: isPushEnabled
            ? colors.gradients.success
            : colors.gradients.warning,
          color: 'white',
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            {isPushEnabled ? (
              <NotificationsActiveIcon sx={{ fontSize: 40 }} />
            ) : (
              <NotificationsOffIcon sx={{ fontSize: 40 }} />
            )}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" fontWeight="bold">
                {isPushEnabled ? 'התראות דחיפה פעילות' : 'התראות דחיפה כבויות'}
              </Typography>
              <Typography variant="body2">
                {isPushEnabled
                  ? 'אתה מקבל התראות על משימות חדשות'
                  : 'הפעל התראות כדי לקבל עדכונים מיידיים'}
              </Typography>
            </Box>
            <Button
              variant="contained"
              component={Link}
              href="/settings/notifications"
              startIcon={<SettingsIcon />}
              sx={{
                bgcolor: 'rgba(255,255,255,0.2)',
                color: 'white',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.3)',
                },
                borderRadius: borderRadius.md,
                textTransform: 'none',
              }}
            >
              הגדרות
            </Button>
          </Box>

          {isPushEnabled && pushSubscription && (
            <Typography variant="caption">
              התחברת לראשונה:{' '}
              {formatDistanceToNow(pushSubscription.createdAt, {
                addSuffix: true,
                locale: he,
              })}
            </Typography>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Card sx={{ flex: 1, borderRadius: borderRadius['2xl'] }}>
          <CardContent>
            <Typography variant="h3" fontWeight="bold" color="primary">
              {unreadCount}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              משימות שלא נקראו
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: borderRadius['2xl'] }}>
          <CardContent>
            <Typography variant="h3" fontWeight="bold" color="success.main">
              {taskAssignments.filter((a) => a.status === 'done').length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              משימות שהושלמו
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ flex: 1, borderRadius: borderRadius['2xl'] }}>
          <CardContent>
            <Typography variant="h3" fontWeight="bold">
              {taskAssignments.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {`סה"כ משימות (30 יום)`}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Task Assignments List */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 2 }}>
        📋 משימות אחרונות
      </Typography>

      {taskAssignments.length === 0 ? (
        <Alert severity="info" sx={{ borderRadius: borderRadius.md }}>
          אין משימות חדשות בזמן האחרון
        </Alert>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {taskAssignments.map((assignment) => {
            const task = assignment.task;
            const isUnread = assignment.status === 'unread';
            const isDone = assignment.status === 'done';

            return (
              <Card
                key={assignment.id.toString()}
                sx={{
                  borderRadius: borderRadius['2xl'],
                  border: isUnread ? `2px solid ${colors.primary}` : undefined,
                  bgcolor: isUnread ? 'rgba(97, 97, 255, 0.05)' : undefined,
                  transition: 'all 0.2s',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 3,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        bgcolor: isDone ? colors.success : colors.primary,
                        borderRadius: '50%',
                        width: 48,
                        height: 48,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        flexShrink: 0,
                      }}
                    >
                      {isDone ? (
                        <CheckCircleIcon sx={{ fontSize: 28 }} />
                      ) : (
                        <AssignmentIcon sx={{ fontSize: 28 }} />
                      )}
                    </Box>

                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                        {isUnread && (
                          <Chip
                            label="חדש"
                            size="small"
                            sx={{
                              bgcolor: colors.primary,
                              color: 'white',
                              fontWeight: 'bold',
                            }}
                          />
                        )}
                        {isDone && (
                          <Chip
                            label="הושלם"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 'bold' }}
                          />
                        )}
                        <Chip
                          label={task.type || 'משימה'}
                          size="small"
                          variant="outlined"
                        />
                      </Box>

                      <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                        {task.body.substring(0, 100)}
                        {task.body.length > 100 && '...'}
                      </Typography>

                      <Box
                        sx={{
                          display: 'flex',
                          gap: 2,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          👤 מאת: {task.senderUser.fullName || task.senderUser.email}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          📅 תאריך ביצוע:{' '}
                          {new Date(task.executionDate).toLocaleDateString('he-IL')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          <AccessTimeIcon sx={{ fontSize: 14, mr: 0.5 }} />
                          {formatDistanceToNow(task.createdAt, {
                            addSuffix: true,
                            locale: he,
                          })}
                        </Typography>
                      </Box>
                    </Box>

                    <Button
                      variant={isUnread ? 'contained' : 'outlined'}
                      component={Link}
                      href="/tasks/inbox"
                      sx={{
                        borderRadius: borderRadius.md,
                        textTransform: 'none',
                      }}
                    >
                      {isUnread ? 'קרא עכשיו' : 'צפה'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      {/* Quick Actions */}
      <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
        <Button
          variant="outlined"
          component={Link}
          href="/tasks/inbox"
          startIcon={<AssignmentIcon />}
          sx={{
            borderRadius: borderRadius.md,
            textTransform: 'none',
          }}
        >
          כל המשימות
        </Button>
        <Button
          variant="outlined"
          component={Link}
          href="/settings/notifications"
          startIcon={<SettingsIcon />}
          sx={{
            borderRadius: borderRadius.md,
            textTransform: 'none',
          }}
        >
          הגדרות התראות
        </Button>
      </Box>
    </Container>
  );
}
