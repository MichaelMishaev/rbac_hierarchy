import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography, Card, CardContent, Chip } from '@mui/material';
import { getTranslations, getLocale } from 'next-intl/server';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';

export default async function SystemRulesPage() {
  const session = await auth();
  const t = await getTranslations('systemRules');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin can access this page
  if (session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  // Define worker creation permissions data
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

      {/* Worker Creation Permissions Card */}
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
          <Typography
            variant="h5"
            sx={{
              fontWeight: 600,
              mb: 1,
            }}
          >
            {t('workerCreation.title')}
          </Typography>
          <Typography
            variant="body2"
            sx={{
              opacity: 0.95,
            }}
          >
            {t('workerCreation.description')}
          </Typography>
        </Box>

        <CardContent
          sx={{
            p: { xs: 2, md: 3 },
          }}
        >
          {/* Desktop Table View */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              overflowX: 'auto',
            }}
          >
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
                תפקיד
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
                סיבה
              </Box>

              {/* Data Rows */}
              {workerCreationRules.map((rule, index) => (
                <>
                  {/* Badge */}
                  <Box
                    key={`badge-${index}`}
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
                    key={`role-${index}`}
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
                    key={`status-${index}`}
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
                          background: colors.status.greenLight,
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
                          background: colors.status.redLight,
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
                    key={`reason-${index}`}
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
                </>
              ))}
            </Box>
          </Box>

          {/* Mobile Card View */}
          <Box
            sx={{
              display: { xs: 'block', md: 'none' },
            }}
          >
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
                          background: colors.status.greenLight,
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
                          background: colors.status.redLight,
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
            הערה חשובה
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              color: colors.neutral[700],
              lineHeight: 1.6,
            }}
          >
            כללים אלו נקבעו על פי מבנה ההיררכיה וההרשאות של המערכת. רק מנהלי תאגידים
            אחראים על ניהול משאבי אנוש, כולל יצירת עובדים חדשים.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
