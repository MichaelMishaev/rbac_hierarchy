import React from 'react';
import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import { getLocale } from 'next-intl/server';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import GroupsIcon from '@mui/icons-material/Groups';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import TimelineIcon from '@mui/icons-material/Timeline';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';

export default async function OnboardingPage() {
  const session = await auth();
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // Only SuperAdmin can access this page
  if (session.user.role !== 'SUPERADMIN') {
    redirect('/dashboard');
  }

  // Initial State Data
  const initialState = {
    superAdmin: 1,
    areaManagers: 6,
    cities: 2,
    neighborhoods: 4,
    cityCoordinators: 2,
    activistCoordinators: 3,
    activists: 33,
  };

  // Onboarding steps
  const onboardingSteps = [
    {
      label: 'שלב 0: החלפת SuperAdmin',
      description: 'החלף את משתמש הדמו בפרטים אמיתיים',
      critical: true,
      icon: <AdminPanelSettingsIcon />,
      color: colors.status.red,
      tasks: [
        'פתח Prisma Studio: npm run db:studio',
        'מצא את המשתמש admin@election.test',
        'ערוך: email, fullName, phone, passwordHash',
        'התנתק והתחבר עם הפרטים החדשים',
      ],
      warning: 'קריטי לאבטחה! אל תדלג על שלב זה!',
    },
    {
      label: 'שלב 1: תכנון המבנה הארגוני',
      description: 'החלט כמה מחוזות וערים תצטרך',
      critical: false,
      icon: <TimelineIcon />,
      color: colors.pastel.blue,
      tasks: [
        'שטח קטן (עיר אחת): מחק את כל ה-Area Managers',
        'שטח בינוני (2-5 ערים): השתמש ב-1 Area Manager',
        'שטח ארצי (6+ ערים): השתמש בכל 6 המחוזות',
        'צור רשימה של ערים שתצטרך',
      ],
    },
    {
      label: 'שלב 2: עדכון/יצירת מנהלי אזור',
      description: 'החלף את פרטי מנהלי האזור או צור חדשים',
      critical: false,
      icon: <VerifiedUserIcon />,
      color: colors.pastel.orange,
      tasks: [
        'עבור דרך כל מנהל מחוז שתשאיר',
        'החלף אימייל, שם, טלפון בפרטים אמיתיים',
        'מחק מנהלי אזור שלא צריך (אם שטח קטן)',
        'צור מנהלי אזור חדשים אם נדרש',
      ],
    },
    {
      label: 'שלב 3: יצירת ערים',
      description: 'צור את הערים בהן השטח יפעל',
      critical: false,
      icon: <LocationCityIcon />,
      color: colors.pastel.blue,
      tasks: [
        'התחבר כ-SuperAdmin או Area Manager',
        'עבור ל: ניהול → ערים',
        'לחץ: + עיר חדשה',
        'מלא: שם עיר, קוד, תיאור, מחוז',
        'חזור על כל עיר שתצטרך',
      ],
    },
    {
      label: 'שלב 4: יצירת רכזי עיר',
      description: 'הוסף רכז עיר לכל עיר',
      critical: false,
      icon: <PeopleIcon />,
      color: colors.pastel.green,
      tasks: [
        'התחבר כ-SuperAdmin או Area Manager',
        'עבור ל: ניהול → משתמשים',
        'לחץ: + משתמש חדש',
        'בחר תפקיד: רכז עיר',
        'הקצה לעיר המתאימה',
        'חזור לכל עיר',
      ],
    },
    {
      label: 'שלב 5: יצירת שכונות',
      description: 'חלק כל עיר לשכונות',
      critical: false,
      icon: <HomeWorkIcon />,
      color: colors.status.lightGreen,
      tasks: [
        'התחבר כ-City Coordinator (או SuperAdmin)',
        'עבור ל: ניהול → שכונות',
        'לחץ: + שכונה חדשה',
        'מלא: שם, כתובת, מיקום GPS (אופציונלי)',
        'צור 3-15 שכונות לכל עיר (לפי גודל)',
      ],
    },
    {
      label: 'שלב 6: יצירת רכזי שכונות',
      description: 'הוסף רכזי שכונות והקצה שכונות',
      critical: false,
      icon: <GroupsIcon />,
      color: colors.pastel.purple,
      tasks: [
        'התחבר כ-City Coordinator (או SuperAdmin)',
        'עבור ל: ניהול → משתמשים',
        'לחץ: + משתמש חדש',
        'בחר תפקיד: רכז שכונתי',
        'הקצה 1-5 שכונות לכל רכז',
        'צור מספיק רכזים לכיסוי כל השכונות',
      ],
    },
    {
      label: 'שלב 7: גיוס פעילים',
      description: 'התחל לגייס פעילי שטח',
      critical: false,
      icon: <GroupsIcon />,
      color: colors.neutral[500],
      tasks: [
        'התחבר כ-Activist Coordinator',
        'עבור ל: ניהול → פעילים',
        'לחץ: + פעיל חדש',
        'מלא: שם, טלפון, שכונה, תפקיד',
        'הוסף תגיות לקטגוריזציה',
        'המשך לגייס לפי צורך',
      ],
    },
  ];

  // Organization size paths
  const organizationPaths = [
    {
      title: 'שטח קטן',
      subtitle: 'עיר אחת, 50-200 פעילים',
      time: '2-4 שעות',
      color: colors.pastel.green,
      structure: [
        'SuperAdmin',
        '1 City Coordinator',
        '3-5 Activist Coordinators',
        '10-40 Activists per coordinator',
      ],
    },
    {
      title: 'שטח בינוני',
      subtitle: '2-5 ערים, 200-1000 פעילים',
      time: '1-2 ימים',
      color: colors.pastel.blue,
      structure: [
        'SuperAdmin',
        '1 Area Manager',
        '2-5 Cities',
        '1 City Coordinator per city',
        '3-8 Activist Coordinators per city',
        '10-30 Activists per coordinator',
      ],
    },
    {
      title: 'שטח ארצי',
      subtitle: '6+ ערים, 1000+ פעילים',
      time: '1-2 שבועות',
      color: colors.pastel.purple,
      structure: [
        'SuperAdmin',
        '6 Area Managers (כל המחוזות)',
        '1-10 Cities per district',
        '1-2 City Coordinators per city',
        '5-20 Activist Coordinators per city',
        '10-50 Activists per coordinator',
      ],
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <RocketLaunchIcon sx={{ fontSize: 48, color: colors.pastel.blue }} />
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: colors.neutral[900],
                mb: 0.5,
              }}
            >
              מדריך אתחול מערכת בחירות
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.neutral[600],
                fontWeight: 500,
              }}
            >
              התחל לעבוד עם המערכת תוך דקות - מדריך שלב אחר שלב
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* What You Get Initially */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.success,
            p: 3,
            color: colors.neutral[0],
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            🎁 מה מקבל הלקוח בהתקנה ראשונית?
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }}>
            לאחר הרצת `npm run db:seed`, המערכת יוצרת אוטומטית:
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card sx={{ background: colors.pastel.purpleLight, borderRadius: borderRadius.lg }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colors.pastel.purple, mb: 1 }}>
                    {initialState.superAdmin}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: colors.neutral[700], fontWeight: 600 }}>
                    SuperAdmin
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ background: colors.pastel.orangeLight, borderRadius: borderRadius.lg }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colors.pastel.orange, mb: 1 }}>
                    {initialState.areaManagers}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: colors.neutral[700], fontWeight: 600 }}>
                    מנהלי אזור
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ background: colors.pastel.blueLight, borderRadius: borderRadius.lg }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colors.pastel.blue, mb: 1 }}>
                    {initialState.cities}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: colors.neutral[700], fontWeight: 600 }}>
                    ערים (דמו)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card sx={{ background: colors.pastel.greenLight, borderRadius: borderRadius.lg }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: colors.pastel.green, mb: 1 }}>
                    {initialState.activists}
                  </Typography>
                  <Typography sx={{ fontSize: '13px', color: colors.neutral[700], fontWeight: 600 }}>
                    פעילים (דמו)
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }}>
            <Typography sx={{ fontSize: '14px' }}>
              <strong>חשוב:</strong> נתוני הדמו (ערים, פעילים) הם לצורך הדגמה בלבד. אתה צריך להחליף אותם או
              למחוק אותם לפני עליה לפרודקשן.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* Choose Your Path */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.primary,
            p: 3,
            color: colors.neutral[0],
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            🎯 בחר את המסלול שלך
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }}>
            בחר את המסלול המתאים לגודל השטח שלך
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {organizationPaths.map((path, index) => (
              <Grid item xs={12} md={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: borderRadius.lg,
                    border: `2px solid ${path.color}`,
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: shadows.large,
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent>
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: path.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Typography sx={{ fontSize: '24px', color: colors.neutral[0] }}>
                        {index + 1}
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {path.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.neutral[600], mb: 2 }}>
                      {path.subtitle}
                    </Typography>
                    <Chip
                      label={`זמן אתחול: ${path.time}`}
                      size="small"
                      sx={{
                        background: `${path.color}20`,
                        color: path.color,
                        fontWeight: 600,
                        mb: 2,
                      }}
                    />
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="caption" sx={{ fontWeight: 600, color: colors.neutral[700], mb: 1, display: 'block' }}>
                      מבנה מומלץ:
                    </Typography>
                    <List dense>
                      {path.structure.map((item, idx) => (
                        <ListItem key={idx} sx={{ py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 28 }}>
                            <CheckCircleIcon sx={{ fontSize: 16, color: path.color }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            primaryTypographyProps={{ fontSize: '13px', color: colors.neutral[700] }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.info,
            p: 3,
            color: colors.neutral[0],
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            📋 מדריך שלב אחר שלב
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }}>
            עקוב אחר השלבים הבאים להפעלה מוצלחת של המערכת
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Stepper orientation="vertical">
            {onboardingSteps.map((step, index) => (
              <Step key={index} active={true}>
                <StepLabel
                  icon={
                    <Box
                      sx={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: step.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.neutral[0],
                      }}
                    >
                      {step.icon}
                    </Box>
                  }
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '16px' }}>{step.label}</Typography>
                    {step.critical && (
                      <Chip
                        label="קריטי"
                        size="small"
                        sx={{
                          background: colors.status.red,
                          color: colors.neutral[0],
                          fontWeight: 600,
                          fontSize: '11px',
                        }}
                      />
                    )}
                  </Box>
                  <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                    {step.description}
                  </Typography>
                </StepLabel>
                <StepContent>
                  {step.warning && (
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography sx={{ fontSize: '13px', fontWeight: 600 }}>{step.warning}</Typography>
                    </Alert>
                  )}
                  <List dense>
                    {step.tasks.map((task, taskIndex) => (
                      <ListItem key={taskIndex}>
                        <ListItemIcon>
                          <CheckCircleIcon sx={{ fontSize: 20, color: step.color }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={task}
                          primaryTypographyProps={{ fontSize: '14px', color: colors.neutral[700] }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Security Checklist */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `2px solid ${colors.status.red}`,
          overflow: 'hidden',
          mb: 4,
        }}
      >
        <Box
          sx={{
            background: colors.gradients.error,
            p: 3,
            color: colors.neutral[0],
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <WarningIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              ✅ רשימת בדיקות לפני פרודקשן
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              וודא שביצעת את כל הפעולות הבאות לפני עליה לפרודקשן
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: colors.neutral[800] }}>
                🔐 אבטחה
              </Typography>
              <List dense>
                {[
                  'החלפת כל סיסמאות ברירת המחדל',
                  'הגדרת SMTP אמיתי (לא MailHog)',
                  'HTTPS מופעל',
                  'משתני סביבה (.env) לא בגרסה שליטה',
                  'רק SuperAdmin אמיתי במערכת (לא demo users)',
                ].map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ fontSize: 20, color: colors.status.green }} />
                    </ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ fontSize: '14px' }} />
                  </ListItem>
                ))}
              </List>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, color: colors.neutral[800] }}>
                🗄️ נתונים
              </Typography>
              <List dense>
                {[
                  'נתוני דמו נמחקו (אם לא צריך)',
                  'גיבוי ראשוני בוצע',
                  'בדיקת תקינות עברה: npm run db:check-integrity',
                  'Area Managers מעודכנים בפרטים אמיתיים',
                  'ערים נוצרו לפי תכנון',
                ].map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <CheckCircleIcon sx={{ fontSize: 20, color: colors.pastel.blue }} />
                    </ListItemIcon>
                    <ListItemText primary={item} primaryTypographyProps={{ fontSize: '14px' }} />
                  </ListItem>
                ))}
              </List>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* FAQs */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            background: colors.gradients.warning,
            p: 3,
            color: colors.neutral[0],
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
            ❓ שאלות נפוצות
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.95 }}>
            תשובות לשאלות שכיחות בתהליך האתחול
          </Typography>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>איך אני מחליף את משתמש ה-SuperAdmin?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontSize: '14px', color: colors.neutral[700], mb: 1 }}>
                השתמש ב-Prisma Studio או סקריפט ייעודי:
              </Typography>
              <Box
                component="pre"
                sx={{
                  background: colors.neutral[900],
                  color: colors.neutral[0],
                  p: 2,
                  borderRadius: borderRadius.md,
                  fontSize: '12px',
                  overflow: 'auto',
                }}
              >
                {`npm run db:studio
# עדכן את המשתמש admin@election.test
# שדות: email, fullName, phone, passwordHash`}
              </Box>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>האם אני צריך את כל 6 המחוזות?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontSize: '14px', color: colors.neutral[700] }}>
                תלוי בגודל השטח שלך:
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="שטח קטן (עיר אחת): מחק את כל ה-Area Managers"
                    primaryTypographyProps={{ fontSize: '13px' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="שטח בינוני (2-5 ערים): השתמש ב-1 Area Manager"
                    primaryTypographyProps={{ fontSize: '13px' }}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="שטח ארצי: השתמש בכל 6 המחוזות"
                    primaryTypographyProps={{ fontSize: '13px' }}
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>כמה שכונות צריך ליצור לכל עיר?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontSize: '14px', color: colors.neutral[700] }}>
                המלצה: 3-15 שכונות לכל עיר, תלוי בגודל העיר ומבנה הקלפיות. כל שכונה צריכה לכסות 3,000-15,000
                תושבים באופן אידיאלי.
              </Typography>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography sx={{ fontWeight: 600 }}>איך אני מוחק את נתוני הדמו?</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ fontSize: '14px', color: colors.neutral[700], mb: 1 }}>
                השתמש ב-Prisma Studio או SQL:
              </Typography>
              <Box
                component="pre"
                sx={{
                  background: colors.neutral[900],
                  color: colors.neutral[0],
                  p: 2,
                  borderRadius: borderRadius.md,
                  fontSize: '12px',
                  overflow: 'auto',
                }}
              >
                {`DELETE FROM activists;
DELETE FROM activist_coordinator_neighborhoods;
DELETE FROM activist_coordinators;
DELETE FROM city_coordinators;
DELETE FROM neighborhoods;
DELETE FROM cities;
-- אל תמחק את ה-SuperAdmin!`}
              </Box>
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography sx={{ fontSize: '13px' }}>
                  <strong>זהירות:</strong> עשה גיבוי לפני מחיקה!
                </Typography>
              </Alert>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>

      {/* Documentation Link */}
      <Box
        sx={{
          mt: 4,
          p: 3,
          background: colors.pastel.blueLight,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.pastel.blue}`,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <InfoIcon sx={{ fontSize: 32, color: colors.pastel.blue }} />
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '15px', color: colors.neutral[800], mb: 0.5 }}>
            מסמך מפורט יותר זמין
          </Typography>
          <Typography sx={{ fontSize: '14px', color: colors.neutral[700] }}>
            למדריך אתחול מלא ומפורט, ראה: <code>docs/CUSTOMER_ONBOARDING_GUIDE.md</code>
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
