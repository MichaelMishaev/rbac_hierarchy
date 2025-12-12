import React from 'react';
import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography, Card, CardContent, Chip, Grid, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import BusinessIcon from '@mui/icons-material/Business';
import PeopleIcon from '@mui/icons-material/People';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import SecurityIcon from '@mui/icons-material/Security';
import EditIcon from '@mui/icons-material/Edit';

export default async function SystemRulesPage() {
  const session = await auth();
  const t = await getTranslations('systemRules');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin can access this page
  if (session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  // Define worker creation permissions data (keep as is - already business focused)
  const workerCreationRules = [
    {
      role: t('workerCreation.superAdmin'),
      canCreate: false,
      reason: t('workerCreation.reasons.superAdmin'),
      badge: 'SA',
      color: colors.pastel.purple,
    },
    {
      role: t('workerCreation.areaManager'),
      canCreate: false,
      reason: t('workerCreation.reasons.areaManager'),
      badge: 'AM',
      color: colors.pastel.orange,
    },
    {
      role: t('workerCreation.corporationManager'),
      canCreate: true,
      reason: t('workerCreation.reasons.corporationManager'),
      badge: 'M',
      color: colors.pastel.blue,
    },
    {
      role: t('workerCreation.supervisor'),
      canCreate: false,
      reason: t('workerCreation.reasons.supervisor'),
      badge: 'S',
      color: colors.pastel.green,
    },
    {
      role: t('workerCreation.worker'),
      canCreate: false,
      reason: t('workerCreation.reasons.worker'),
      badge: 'W',
      color: colors.neutral[400],
    },
  ];

  // Organizational hierarchy data
  const hierarchyLevels = [
    {
      level: 1,
      role: t('hierarchy.superAdmin'),
      reportsTo: t('hierarchy.superAdminReports'),
      responsibilities: t('hierarchy.superAdminResp'),
      color: colors.pastel.purple,
      badge: 'SA',
    },
    {
      level: 2,
      role: t('hierarchy.manager'),
      reportsTo: t('hierarchy.managerReports'),
      responsibilities: t('hierarchy.managerResp'),
      color: colors.pastel.blue,
      badge: 'M',
    },
    {
      level: 3,
      role: t('hierarchy.supervisor'),
      reportsTo: t('hierarchy.supervisorReports'),
      responsibilities: t('hierarchy.supervisorResp'),
      color: colors.pastel.green,
      badge: 'S',
    },
    {
      level: 4,
      role: t('hierarchy.worker'),
      reportsTo: t('hierarchy.workerReports'),
      responsibilities: t('hierarchy.workerResp'),
      color: colors.neutral[400],
      badge: 'W',
    },
  ];

  // Role capabilities matrix
  const capabilitiesMatrix = [
    {
      capability: t('roleCapabilities.createCorporations'),
      superAdmin: t('roleCapabilities.yes'),
      manager: t('roleCapabilities.no'),
      activistCoordinator: t('roleCapabilities.no'),
    },
    {
      capability: t('roleCapabilities.manageSites'),
      superAdmin: t('roleCapabilities.fullAccess'),
      manager: t('roleCapabilities.corpOnly'),
      activistCoordinator: t('roleCapabilities.no'),
    },
    {
      capability: t('roleCapabilities.manageUsers'),
      superAdmin: t('roleCapabilities.fullAccess'),
      manager: t('roleCapabilities.corpOnly'),
      activistCoordinator: t('roleCapabilities.no'),
    },
    {
      capability: t('roleCapabilities.manageWorkers'),
      superAdmin: t('roleCapabilities.fullAccess'),
      manager: t('roleCapabilities.corpOnly'),
      activistCoordinator: t('roleCapabilities.assignedSitesOnly'),
    },
    {
      capability: t('roleCapabilities.viewReports'),
      superAdmin: t('roleCapabilities.fullAccess'),
      manager: t('roleCapabilities.corpOnly'),
      activistCoordinator: t('roleCapabilities.assignedSitesOnly'),
    },
  ];

  // Access scope rules
  const accessScopeRules = [
    {
      role: t('accessScope.superAdminScope'),
      explanation: t('accessScope.superAdminScopeExplain'),
      icon: <SecurityIcon />,
      color: colors.pastel.purple,
    },
    {
      role: t('accessScope.managerScope'),
      explanation: t('accessScope.managerScopeExplain'),
      icon: <BusinessIcon />,
      color: colors.pastel.blue,
    },
    {
      role: t('accessScope.supervisorScope'),
      explanation: t('accessScope.supervisorScopeExplain'),
      icon: <PeopleIcon />,
      color: colors.pastel.green,
    },
    {
      role: t('accessScope.workerScope'),
      explanation: t('accessScope.workerScopeExplain'),
      icon: <PeopleIcon />,
      color: colors.neutral[400],
    },
  ];

  // Multi-tenant isolation rules
  const isolationRules = [
    {
      rule: t('multiTenant.fullIsolation'),
      explanation: t('multiTenant.fullIsolationExplain'),
      icon: <SecurityIcon />,
      color: colors.status.red,
    },
    {
      rule: t('multiTenant.managerBoundary'),
      explanation: t('multiTenant.managerBoundaryExplain'),
      icon: <BusinessIcon />,
      color: colors.pastel.blue,
    },
    {
      rule: t('multiTenant.supervisorBoundary'),
      explanation: t('multiTenant.supervisorBoundaryExplain'),
      icon: <PeopleIcon />,
      color: colors.pastel.green,
    },
    {
      rule: t('multiTenant.superAdminException'),
      explanation: t('multiTenant.superAdminExceptionExplain'),
      icon: <SecurityIcon />,
      color: colors.pastel.purple,
    },
  ];

  // Modification rights matrix
  const modificationMatrix = [
    {
      entity: t('modificationRights.corporations'),
      create: t('modificationRights.superAdminOnly'),
      edit: t('modificationRights.superAdminAndManager'),
      delete: t('modificationRights.superAdminOnly'),
    },
    {
      entity: t('modificationRights.sites'),
      create: t('modificationRights.superAdminAndManager'),
      edit: t('modificationRights.superAdminAndManager'),
      delete: t('modificationRights.superAdminAndManager'),
    },
    {
      entity: t('modificationRights.managers'),
      create: t('modificationRights.superAdminAndManager'),
      edit: t('modificationRights.superAdminAndManager'),
      delete: t('modificationRights.superAdminAndManager'),
    },
    {
      entity: t('modificationRights.supervisors'),
      create: t('modificationRights.superAdminAndManager'),
      edit: t('modificationRights.superAdminAndManager'),
      delete: t('modificationRights.superAdminAndManager'),
    },
    {
      entity: t('modificationRights.workers'),
      create: t('modificationRights.superAdminAndManager'),
      edit: t('modificationRights.superAdminManagerSupervisor'),
      delete: t('modificationRights.superAdminManagerSupervisor'),
    },
  ];

  // Reusable component for rule lists
  const RuleList = ({
    title,
    description,
    icon,
    gradient,
    rules,
  }: {
    title: string;
    description: string;
    icon: React.ReactNode;
    gradient: string;
    rules: Array<{ rule?: string; role?: string; explanation: string; icon: React.ReactNode; color: string }>;
  }) => (
    <Card
      sx={{
        borderRadius: borderRadius.xl,
        boxShadow: shadows.medium,
        border: `1px solid ${colors.neutral[200]}`,
        overflow: 'hidden',
        mb: 3,
      }}
    >
      <Box
        sx={{
          background: gradient,
          p: 3,
          color: colors.neutral[0],
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Box sx={{ fontSize: 32 }}>{icon}</Box>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }}>
            {description}
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        <Grid container spacing={2}>
          {rules.map((item, index) => (
            <Grid item xs={12} md={6} key={`rule-${index}`}>
              <Card
                sx={{
                  borderRadius: borderRadius.lg,
                  border: `2px solid ${item.color}20`,
                  boxShadow: shadows.soft,
                  height: '100%',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    boxShadow: shadows.medium,
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.neutral[0],
                        fontSize: 20,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '15px', color: colors.neutral[800], flex: 1 }}>
                      {item.rule || item.role}
                    </Typography>
                  </Box>
                  <Typography sx={{ fontSize: '14px', color: colors.neutral[600], lineHeight: 1.6 }}>
                    {item.explanation}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 1,
          }}
        >
          {t('title')}
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: colors.neutral[600],
            fontWeight: 500,
          }}
        >
          {t('description')}
        </Typography>
      </Box>

      {/* 1. Worker Creation Permissions (keep as is) */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.primary,
            p: 3,
            color: colors.neutral[0],
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 1 }}>
            {t('workerCreation.title')}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }}>
            {t('workerCreation.description')}
          </Typography>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Desktop Table View */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '40px 200px 140px 1fr',
                gap: 2,
                minWidth: 600,
              }}
            >
              {/* Header Row */}
              <Box />
              <Box
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: colors.neutral[700],
                  pb: 2,
                  borderBottom: `2px solid ${colors.neutral[200]}`,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('workerCreation.roleHeader')}
              </Box>
              <Box
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: colors.neutral[700],
                  pb: 2,
                  borderBottom: `2px solid ${colors.neutral[200]}`,
                  textAlign: 'center',
                }}
              >
                {t('workerCreation.canCreate')}?
              </Box>
              <Box
                sx={{
                  fontWeight: 700,
                  fontSize: '14px',
                  color: colors.neutral[700],
                  pb: 2,
                  borderBottom: `2px solid ${colors.neutral[200]}`,
                  textAlign: isRTL ? 'right' : 'left',
                }}
              >
                {t('workerCreation.reasonHeader')}
              </Box>

              {/* Data Rows */}
              {workerCreationRules.map((rule, index) => (
                <React.Fragment key={`rule-row-${index}`}>
                  {/* Badge */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 2,
                      borderBottom:
                        index < workerCreationRules.length - 1
                          ? `1px solid ${colors.neutral[100]}`
                          : 'none',
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: rule.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.neutral[0],
                        fontWeight: 700,
                        fontSize: '13px',
                      }}
                    >
                      {rule.badge}
                    </Box>
                  </Box>

                  {/* Role Name */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 2,
                      borderBottom:
                        index < workerCreationRules.length - 1
                          ? `1px solid ${colors.neutral[100]}`
                          : 'none',
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '15px',
                        color: colors.neutral[800],
                      }}
                    >
                      {rule.role}
                    </Typography>
                  </Box>

                  {/* Can Create Status */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      py: 2,
                      borderBottom:
                        index < workerCreationRules.length - 1
                          ? `1px solid ${colors.neutral[100]}`
                          : 'none',
                    }}
                  >
                    {rule.canCreate ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={t('workerCreation.canCreate')}
                        sx={{
                          background: colors.pastel.greenLight,
                          color: colors.status.green,
                          fontWeight: 600,
                          fontSize: '13px',
                          '& .MuiChip-icon': {
                            color: colors.status.green,
                          },
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<CancelIcon />}
                        label={t('workerCreation.cannotCreate')}
                        sx={{
                          background: colors.pastel.redLight,
                          color: colors.status.red,
                          fontWeight: 600,
                          fontSize: '13px',
                          '& .MuiChip-icon': {
                            color: colors.status.red,
                          },
                        }}
                      />
                    )}
                  </Box>

                  {/* Reason */}
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 2,
                      borderBottom:
                        index < workerCreationRules.length - 1
                          ? `1px solid ${colors.neutral[100]}`
                          : 'none',
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: colors.neutral[600],
                        lineHeight: 1.5,
                      }}
                    >
                      {rule.reason}
                    </Typography>
                  </Box>
                </React.Fragment>
              ))}
            </Box>
          </Box>

          {/* Mobile Card View */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {workerCreationRules.map((rule, index) => (
              <Card
                key={`mobile-${index}`}
                sx={{
                  mb: 2,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.neutral[200]}`,
                  boxShadow: shadows.soft,
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      mb: 2,
                    }}
                  >
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: rule.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.neutral[0],
                        fontWeight: 700,
                        fontSize: '16px',
                      }}
                    >
                      {rule.badge}
                    </Box>
                    <Typography
                      sx={{
                        fontWeight: 600,
                        fontSize: '16px',
                        color: colors.neutral[800],
                        flex: 1,
                      }}
                    >
                      {rule.role}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    {rule.canCreate ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label={t('workerCreation.canCreate')}
                        sx={{
                          background: colors.pastel.greenLight,
                          color: colors.status.green,
                          fontWeight: 600,
                          fontSize: '13px',
                          '& .MuiChip-icon': {
                            color: colors.status.green,
                          },
                        }}
                      />
                    ) : (
                      <Chip
                        icon={<CancelIcon />}
                        label={t('workerCreation.cannotCreate')}
                        sx={{
                          background: colors.pastel.redLight,
                          color: colors.status.red,
                          fontWeight: 600,
                          fontSize: '13px',
                          '& .MuiChip-icon': {
                            color: colors.status.red,
                          },
                        }}
                      />
                    )}
                  </Box>

                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1,
                      p: 2,
                      background: colors.neutral[50],
                      borderRadius: borderRadius.md,
                    }}
                  >
                    <InfoIcon
                      sx={{
                        fontSize: 18,
                        color: colors.neutral[500],
                        mt: 0.2,
                      }}
                    />
                    <Typography
                      sx={{
                        fontSize: '14px',
                        color: colors.neutral[600],
                        lineHeight: 1.5,
                      }}
                    >
                      {rule.reason}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 2. Organizational Hierarchy */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.secondary,
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ fontSize: 32 }}>
            <AccountTreeIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {t('hierarchy.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              {t('hierarchy.description')}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Desktop Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('hierarchy.level')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('hierarchy.role')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('hierarchy.reports')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('hierarchy.responsibilities')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {hierarchyLevels.map((level, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: level.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.neutral[0],
                          fontWeight: 700,
                          fontSize: '13px',
                        }}
                      >
                        {level.level}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>{level.role}</TableCell>
                    <TableCell>{level.reportsTo}</TableCell>
                    <TableCell>{level.responsibilities}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {hierarchyLevels.map((level, index) => (
              <Card
                key={`mobile-hierarchy-${index}`}
                sx={{
                  mb: 2,
                  borderRadius: borderRadius.lg,
                  border: `2px solid ${level.color}20`,
                  boxShadow: shadows.soft,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: level.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.neutral[0],
                        fontWeight: 700,
                        fontSize: '16px',
                      }}
                    >
                      {level.badge}
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                        {t('hierarchy.level')} {level.level}
                      </Typography>
                      <Typography sx={{ fontWeight: 600, fontSize: '16px', color: colors.neutral[800] }}>
                        {level.role}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" sx={{ color: colors.neutral[500], fontWeight: 600 }}>
                      {t('hierarchy.reports')}:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                      {level.reportsTo}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ color: colors.neutral[500], fontWeight: 600 }}>
                      {t('hierarchy.responsibilities')}:
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                      {level.responsibilities}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 3. Role Capabilities Matrix */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.success,
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ fontSize: 32 }}>
            <PeopleIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {t('roleCapabilities.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              {t('roleCapabilities.description')}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Desktop Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('roleCapabilities.capability')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {t('roleCapabilities.superAdmin')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {t('roleCapabilities.manager')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>
                    {t('roleCapabilities.supervisor')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {capabilitiesMatrix.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.capability}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{item.superAdmin}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{item.manager}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{item.activistCoordinator}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {capabilitiesMatrix.map((item, index) => (
              <Card
                key={`mobile-cap-${index}`}
                sx={{
                  mb: 2,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.neutral[200]}`,
                  boxShadow: shadows.soft,
                }}
              >
                <CardContent>
                  <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 2, color: colors.neutral[800] }}>
                    {item.capability}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
                        {t('roleCapabilities.superAdmin')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                        {item.superAdmin}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
                        {t('roleCapabilities.manager')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                        {item.manager}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" sx={{ color: colors.neutral[600] }}>
                        {t('roleCapabilities.supervisor')}:
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.neutral[800] }}>
                        {item.activistCoordinator}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* 4. Access Scope Rules */}
      <RuleList
        title={t('accessScope.title')}
        description={t('accessScope.description')}
        icon={<SecurityIcon />}
        gradient={colors.gradients.info}
        rules={accessScopeRules}
      />

      {/* 5. Multi-Tenant Isolation */}
      <RuleList
        title={t('multiTenant.title')}
        description={t('multiTenant.description')}
        icon={<BusinessIcon />}
        gradient={colors.gradients.error}
        rules={isolationRules}
      />

      {/* 6. Modification Rights Matrix */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 3,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.warning,
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Box sx={{ fontSize: 32 }}>
            <EditIcon />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              {t('modificationRights.title')}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              {t('modificationRights.description')}
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {/* Desktop Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('modificationRights.entity')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('modificationRights.create')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('modificationRights.edit')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, textAlign: isRTL ? 'right' : 'left' }}>
                    {t('modificationRights.delete')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {modificationMatrix.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell sx={{ fontWeight: 600 }}>{item.entity}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{item.create}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{item.edit}</TableCell>
                    <TableCell sx={{ fontSize: '13px' }}>{item.delete}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            {modificationMatrix.map((item, index) => (
              <Card
                key={`mobile-mod-${index}`}
                sx={{
                  mb: 2,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.neutral[200]}`,
                  boxShadow: shadows.soft,
                }}
              >
                <CardContent>
                  <Typography sx={{ fontWeight: 600, fontSize: '15px', mb: 2, color: colors.neutral[800] }}>
                    {item.entity}
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: colors.neutral[500], fontWeight: 600 }}>
                        {t('modificationRights.create')}:
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                        {item.create}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: colors.neutral[500], fontWeight: 600 }}>
                        {t('modificationRights.edit')}:
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                        {item.edit}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: colors.neutral[500], fontWeight: 600 }}>
                        {t('modificationRights.delete')}:
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.neutral[700] }}>
                        {item.delete}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Info Box */}
      <Box
        sx={{
          p: 3,
          background: colors.pastel.blueLight,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.pastel.blue}`,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 2,
        }}
      >
        <InfoIcon
          sx={{
            color: colors.pastel.blue,
            fontSize: 24,
            mt: 0.2,
          }}
        />
        <Box>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '15px',
              color: colors.neutral[800],
              mb: 0.5,
            }}
          >
            {t('important')}
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              color: colors.neutral[700],
              lineHeight: 1.6,
            }}
          >
            {t('importantNote')}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
