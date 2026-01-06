'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Timeline,
  TimelineItem,
  TimelineSeparator,
  TimelineConnector,
  TimelineContent,
  TimelineDot,
  TimelineOppositeContent,
  Grid,
  Paper,
  Fade,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Rocket as RocketIcon,
  Settings as SettingsIcon,
  Code as CodeIcon,
  CalendarToday as CalendarIcon,
  AccountTree as BranchIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Schedule as ScheduleIcon,
  GitHub as GitHubIcon,
  ExpandMore as ExpandMoreIcon,
  NewReleases as NewReleasesIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import type { VersionData } from '@/app/actions/version';

type VersionControlClientProps = {
  versionData: VersionData;
  gitInfo: {
    hash: string;
    message: string;
    author: string;
    date: string;
  } | null;
};

export default function VersionControlClient({
  versionData,
  gitInfo,
}: VersionControlClientProps) {
  const [expandedChangelog, setExpandedChangelog] = useState<string[]>([
    versionData.changelog[0]?.version || '',
  ]);

  const toggleChangelog = (version: string) => {
    setExpandedChangelog((prev) =>
      prev.includes(version)
        ? prev.filter((v) => v !== version)
        : [...prev, version]
    );
  };

  // Helper function to get type color
  const getTypeColor = (
    type: 'production' | 'development' | 'service-worker' | 'service-worker-major'
  ) => {
    switch (type) {
      case 'production':
        return '#10B981'; // Green
      case 'development':
        return '#3B82F6'; // Blue
      case 'service-worker':
        return '#F59E0B'; // Orange
      case 'service-worker-major':
        return '#EF4444'; // Red
      default:
        return colors.neutral[400];
    }
  };

  // Helper function to get type label
  const getTypeLabel = (
    type: 'production' | 'development' | 'service-worker' | 'service-worker-major'
  ) => {
    switch (type) {
      case 'production':
        return 'ייצור';
      case 'development':
        return 'פיתוח';
      case 'service-worker':
        return 'Service Worker';
      case 'service-worker-major':
        return 'SW Major';
      default:
        return type;
    }
  };

  // Helper function to get deployment status icon and color
  const getDeploymentStatus = (status: 'success' | 'failed' | 'in-progress') => {
    switch (status) {
      case 'success':
        return { icon: <CheckCircleIcon />, color: '#10B981', label: 'הצליח' };
      case 'failed':
        return { icon: <ErrorIcon />, color: '#EF4444', label: 'נכשל' };
      case 'in-progress':
        return { icon: <ScheduleIcon />, color: '#F59E0B', label: 'בתהליך' };
      default:
        return { icon: <CheckCircleIcon />, color: colors.neutral[400], label: status };
    }
  };

  return (
    <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
      {/* Header */}
      <Fade in timeout={300}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <RocketIcon sx={{ fontSize: 40, color: colors.primary.main }} />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '28px', sm: '32px', md: '36px' },
                color: colors.neutral[900],
              }}
            >
              בקרת גרסאות
            </Typography>
          </Box>
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[600],
              fontSize: '16px',
              maxWidth: 600,
            }}
          >
            מעקב אחר גרסאות המערכת, שינויים ופריסות בזמן אמת
          </Typography>
        </Box>
      </Fade>

      {/* Version Cards Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* App Version Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={400}>
            <Card
              sx={{
                background: `linear-gradient(135deg, ${colors.primary.main}15 0%, ${colors.primary.main}05 100%)`,
                border: `2px solid ${colors.primary.main}30`,
                borderRadius: borderRadius.xl,
                boxShadow: shadows.soft,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: shadows.medium,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: borderRadius.lg,
                      background: `linear-gradient(135deg, ${colors.primary.main} 0%, ${colors.primary.dark} 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: shadows.soft,
                    }}
                  >
                    <CodeIcon sx={{ color: '#fff', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[600],
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '11px',
                      }}
                    >
                      גרסת אפליקציה
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: colors.primary.main,
                        fontFamily: 'monospace',
                      }}
                    >
                      v{versionData.version}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label={versionData.branch}
                  size="small"
                  icon={<BranchIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: `${colors.primary.main}20`,
                    color: colors.primary.main,
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                />
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Service Worker Version Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={500}>
            <Card
              sx={{
                background: `linear-gradient(135deg, #F59E0B15 0%, #F59E0B05 100%)`,
                border: `2px solid #F59E0B30`,
                borderRadius: borderRadius.xl,
                boxShadow: shadows.soft,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: shadows.medium,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: borderRadius.lg,
                      background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: shadows.soft,
                    }}
                  >
                    <SettingsIcon sx={{ color: '#fff', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[600],
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '11px',
                      }}
                    >
                      Service Worker
                    </Typography>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 800,
                        color: '#F59E0B',
                        fontFamily: 'monospace',
                      }}
                    >
                      v{versionData.serviceWorkerVersion}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="פעיל"
                  size="small"
                  icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: '#10B98120',
                    color: '#10B981',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                />
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Release Date Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Fade in timeout={600}>
            <Card
              sx={{
                background: `linear-gradient(135deg, #8B5CF615 0%, #8B5CF605 100%)`,
                border: `2px solid #8B5CF630`,
                borderRadius: borderRadius.xl,
                boxShadow: shadows.soft,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: shadows.medium,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: borderRadius.lg,
                      background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: shadows.soft,
                    }}
                  >
                    <CalendarIcon sx={{ color: '#fff', fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: colors.neutral[600],
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                        fontSize: '11px',
                      }}
                    >
                      תאריך שחרור
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: '#8B5CF6',
                        fontSize: '18px',
                      }}
                    >
                      {new Date(versionData.releaseDate).toLocaleDateString('he-IL', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Typography>
                  </Box>
                </Box>
                <Chip
                  label="עדכון אחרון"
                  size="small"
                  icon={<NewReleasesIcon sx={{ fontSize: 16 }} />}
                  sx={{
                    backgroundColor: '#8B5CF620',
                    color: '#8B5CF6',
                    fontWeight: 600,
                    fontSize: '12px',
                  }}
                />
              </CardContent>
            </Card>
          </Fade>
        </Grid>

        {/* Git Info Card */}
        {gitInfo && (
          <Grid item xs={12} sm={6} md={3}>
            <Fade in timeout={700}>
              <Card
                sx={{
                  background: `linear-gradient(135deg, ${colors.neutral[800]}15 0%, ${colors.neutral[800]}05 100%)`,
                  border: `2px solid ${colors.neutral[800]}30`,
                  borderRadius: borderRadius.xl,
                  boxShadow: shadows.soft,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: shadows.medium,
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: borderRadius.lg,
                        background: `linear-gradient(135deg, ${colors.neutral[800]} 0%, ${colors.neutral[900]} 100%)`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: shadows.soft,
                      }}
                    >
                      <GitHubIcon sx={{ color: '#fff', fontSize: 28 }} />
                    </Box>
                    <Box>
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.neutral[600],
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                          fontSize: '11px',
                        }}
                      >
                        Git Commit
                      </Typography>
                      <Tooltip title={gitInfo.message} placement="top">
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: colors.neutral[800],
                            fontFamily: 'monospace',
                            fontSize: '18px',
                          }}
                        >
                          {gitInfo.hash}
                        </Typography>
                      </Tooltip>
                    </Box>
                  </Box>
                  <Chip
                    label={gitInfo.author}
                    size="small"
                    sx={{
                      backgroundColor: `${colors.neutral[800]}20`,
                      color: colors.neutral[800],
                      fontWeight: 600,
                      fontSize: '12px',
                    }}
                  />
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        )}
      </Grid>

      {/* Changelog Timeline */}
      {versionData.changelog && versionData.changelog.length > 0 && (
        <Fade in timeout={800}>
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: borderRadius.xl,
              boxShadow: shadows.medium,
              mb: 4,
              background: colors.neutral[0],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <BuildIcon sx={{ fontSize: 32, color: colors.primary.main }} />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: colors.neutral[900],
                }}
              >
                היסטוריית שינויים
              </Typography>
            </Box>

            <Timeline position="right" sx={{ p: 0, m: 0 }}>
              {versionData.changelog.map((entry, index) => {
                const isExpanded = expandedChangelog.includes(entry.version);
                const typeColor = getTypeColor(entry.type);
                const typeLabel = getTypeLabel(entry.type);

                return (
                  <TimelineItem key={entry.version}>
                    <TimelineOppositeContent
                      sx={{
                        flex: 0.3,
                        py: 2,
                        textAlign: 'left',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.neutral[600],
                          fontWeight: 600,
                          fontFamily: 'monospace',
                        }}
                      >
                        {new Date(entry.date).toLocaleDateString('he-IL', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Typography>
                    </TimelineOppositeContent>

                    <TimelineSeparator>
                      <TimelineDot
                        sx={{
                          backgroundColor: typeColor,
                          boxShadow: `0 0 0 4px ${typeColor}20`,
                          width: 16,
                          height: 16,
                        }}
                      />
                      {index < versionData.changelog.length - 1 && (
                        <TimelineConnector
                          sx={{
                            backgroundColor: colors.neutral[200],
                            width: 2,
                          }}
                        />
                      )}
                    </TimelineSeparator>

                    <TimelineContent sx={{ py: 2, pr: 3 }}>
                      <Card
                        sx={{
                          backgroundColor: `${typeColor}05`,
                          border: `2px solid ${typeColor}30`,
                          borderRadius: borderRadius.lg,
                          boxShadow: shadows.soft,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            boxShadow: shadows.medium,
                            transform: 'translateX(-4px)',
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              mb: 1.5,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Typography
                                variant="h6"
                                sx={{
                                  fontWeight: 700,
                                  color: colors.neutral[900],
                                  fontFamily: 'monospace',
                                }}
                              >
                                v{entry.version}
                              </Typography>
                              <Chip
                                label={typeLabel}
                                size="small"
                                sx={{
                                  backgroundColor: typeColor,
                                  color: '#fff',
                                  fontWeight: 600,
                                  fontSize: '11px',
                                }}
                              />
                            </Box>
                            <IconButton
                              size="small"
                              onClick={() => toggleChangelog(entry.version)}
                              sx={{
                                color: colors.neutral[600],
                                transition: 'transform 0.3s ease',
                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                              }}
                            >
                              <ExpandMoreIcon />
                            </IconButton>
                          </Box>

                          <Collapse in={isExpanded}>
                            <Box sx={{ mt: 2 }}>
                              {entry.changes.map((change, idx) => (
                                <Box
                                  key={idx}
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 1.5,
                                    mb: 1.5,
                                    '&:last-child': { mb: 0 },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      width: 6,
                                      height: 6,
                                      borderRadius: '50%',
                                      backgroundColor: typeColor,
                                      mt: 0.8,
                                      flexShrink: 0,
                                    }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      color: colors.neutral[700],
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {change}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </Collapse>
                        </CardContent>
                      </Card>
                    </TimelineContent>
                  </TimelineItem>
                );
              })}
            </Timeline>
          </Paper>
        </Fade>
      )}

      {/* Deployment History */}
      {versionData.deployments && versionData.deployments.length > 0 && (
        <Fade in timeout={900}>
          <Paper
            sx={{
              p: { xs: 3, md: 4 },
              borderRadius: borderRadius.xl,
              boxShadow: shadows.medium,
              background: colors.neutral[0],
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <RocketIcon sx={{ fontSize: 32, color: '#10B981' }} />
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  color: colors.neutral[900],
                }}
              >
                היסטוריית פריסות
              </Typography>
            </Box>

            <Grid container spacing={2}>
              {versionData.deployments.map((deployment, index) => {
                const statusInfo = getDeploymentStatus(deployment.status);

                return (
                  <Grid item xs={12} md={6} key={index}>
                    <Card
                      sx={{
                        backgroundColor: `${statusInfo.color}05`,
                        border: `2px solid ${statusInfo.color}30`,
                        borderRadius: borderRadius.lg,
                        boxShadow: shadows.soft,
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          boxShadow: shadows.medium,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            mb: 2,
                          }}
                        >
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: colors.neutral[900],
                              fontFamily: 'monospace',
                            }}
                          >
                            v{deployment.version}
                          </Typography>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: statusInfo.color,
                              color: '#fff',
                              fontWeight: 600,
                            }}
                          />
                        </Box>

                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{
                                color: colors.neutral[600],
                                fontWeight: 600,
                              }}
                            >
                              סביבה:
                            </Typography>
                            <Chip
                              label={deployment.environment}
                              size="small"
                              sx={{
                                backgroundColor: colors.neutral[100],
                                color: colors.neutral[700],
                                fontSize: '11px',
                              }}
                            />
                          </Box>

                          <Typography
                            variant="caption"
                            sx={{
                              color: colors.neutral[600],
                            }}
                          >
                            {new Date(deployment.date).toLocaleString('he-IL')}
                          </Typography>

                          {deployment.commitHash && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: colors.neutral[600],
                                fontFamily: 'monospace',
                              }}
                            >
                              Commit: {deployment.commitHash}
                            </Typography>
                          )}

                          {deployment.deployedBy && (
                            <Typography
                              variant="caption"
                              sx={{
                                color: colors.neutral[600],
                              }}
                            >
                              נפרס על ידי: {deployment.deployedBy}
                            </Typography>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Fade>
      )}

      {/* Empty State */}
      {versionData.changelog.length === 0 && versionData.deployments.length === 0 && (
        <Fade in timeout={1000}>
          <Paper
            sx={{
              p: 6,
              borderRadius: borderRadius.xl,
              boxShadow: shadows.soft,
              textAlign: 'center',
              background: `linear-gradient(135deg, ${colors.neutral[50]} 0%, ${colors.neutral[100]} 100%)`,
            }}
          >
            <RocketIcon
              sx={{ fontSize: 64, color: colors.neutral[300], mb: 2 }}
            />
            <Typography
              variant="h6"
              sx={{
                color: colors.neutral[600],
                fontWeight: 600,
                mb: 1,
              }}
            >
              אין נתונים זמינים
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: colors.neutral[500],
              }}
            >
              היסטוריית שינויים ופריסות תופיע כאן
            </Typography>
          </Paper>
        </Fade>
      )}
    </Box>
  );
}
