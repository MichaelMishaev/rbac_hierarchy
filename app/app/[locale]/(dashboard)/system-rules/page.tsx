import React from 'react';
import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
} from '@mui/material';
import { getLocale } from 'next-intl/server';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PublicIcon from '@mui/icons-material/Public';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PeopleIcon from '@mui/icons-material/People';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import GroupsIcon from '@mui/icons-material/Groups';
import WarningIcon from '@mui/icons-material/Warning';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import Link from 'next/link';
import SecurityIcon from '@mui/icons-material/Security';
import InfoIcon from '@mui/icons-material/Info';

export default async function SystemRulesPage() {
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

  // Setup steps with actual links
  const setupSteps = [
    {
      order: 1,
      title: '🔐 צור מנהלי אזור (Area Managers)',
      description: 'מנהלי אזור מנהלים מספר ערים באזור גיאוגרפי',
      icon: <PublicIcon />,
      color: colors.pastel.orange,
      link: '/areas',
      linkText: '➤ עבור לדף מנהלי אזור',
      steps: [
        'לחץ על כפתור "+ מנהל אזור חדש"',
        'בחר משתמש קיים או צור משתמש חדש',
        'הזן שם אזור (לדוגמה: "מחוז המרכז", "מחוז הצפון")',
        'הזן קוד אזור (לדוגמה: "CENTER", "NORTH")',
        'שמור ולחץ "צור מנהל אזור"',
      ],
      tip: 'קמפיין קטן? אתה יכול לדלג על שלב זה ולנהל ישירות ערים כ-SuperAdmin',
    },
    {
      order: 2,
      title: '🏙️ צור ערים',
      description: 'כל עיר היא יחידה ארגונית עצמאית בקמפיין',
      icon: <LocationCityIcon />,
      color: colors.pastel.blue,
      link: '/cities',
      linkText: '➤ עבור לדף ערים',
      steps: [
        'לחץ על כפתור "+ עיר חדשה"',
        'הזן שם עיר (לדוגמה: "תל אביב-יפו", "ירושלים")',
        'הזן קוד עיר (לדוגמה: "TLV", "JRS")',
        'בחר מנהל אזור (אם יש) או השאר ריק',
        'הוסף תיאור אופציונלי',
        'שמור ולחץ "צור עיר"',
      ],
      tip: 'התחל עם 1-2 ערים כדי לבדוק את המערכת לפני הוספת יותר',
    },
    {
      order: 3,
      title: '👤 צור רכזי עיר (City Coordinators)',
      description: 'רכז עיר מנהל את כל הפעילות של עיר אחת',
      icon: <PeopleIcon />,
      color: colors.pastel.blue,
      link: '/users',
      linkText: '➤ עבור לדף משתמשים',
      steps: [
        'לחץ על כפתור "+ משתמש חדש"',
        'בחר תפקיד: "רכז עיר" (City Coordinator)',
        'הזן פרטי משתמש: שם מלא, אימייל, טלפון',
        'בחר עיר שהרכז ינהל',
        'הגדר סיסמה זמנית (המשתמש יוכל לשנות אותה)',
        'שמור ולחץ "צור משתמש"',
      ],
      tip: 'כל עיר צריכה לפחות רכז עיר אחד. ערים גדולות יכולות לקבל מספר רכזים',
    },
    {
      order: 4,
      title: '🏘️ צור שכונות',
      description: 'שכונות הן מחוזות הקמפיין - אזורים גיאוגרפיים בתוך עיר',
      icon: <HomeWorkIcon />,
      color: colors.status.lightGreen,
      link: '/neighborhoods',
      linkText: '➤ עבור לדף שכונות',
      steps: [
        'לחץ על כפתור "+ שכונה חדשה"',
        'הזן שם שכונה (לדוגמה: "פלורנטין", "נווה צדק")',
        'בחר עיר',
        'הוסף כתובת מרכזית (אופציונלי)',
        'הוסף קואורדינטות GPS (אופציונלי - למפה)',
        'שמור ולחץ "צור שכונה"',
      ],
      tip: 'המלצה: 3-15 שכונות לכל עיר, תלוי בגודל העיר ומבנה הקלפיות',
    },
    {
      order: 5,
      title: '👥 צור רכזי שכונות (Activist Coordinators)',
      description: 'רכז שכונתי מארגן פעילים ב-1 עד 5 שכונות',
      icon: <GroupsIcon />,
      color: colors.pastel.green,
      link: '/users',
      linkText: '➤ עבור לדף משתמשים',
      steps: [
        'לחץ על כפתור "+ משתמש חדש"',
        'בחר תפקיד: "רכז שכונתי" (Activist Coordinator)',
        'הזן פרטי משתמש: שם מלא, אימייל, טלפון',
        'בחר עיר',
        'הקצה 1-5 שכונות שהרכז ינהל',
        'הגדר סיסמה זמנית',
        'שמור ולחץ "צור משתמש"',
      ],
      tip: 'רכז שכונתי טוב יכול לנהל 30-50 פעילים. תכנן בהתאם',
    },
    {
      order: 6,
      title: '🎯 גייס פעילים (Activists)',
      description: 'פעילי שטח - מתנדבים בשטח שעושים את העבודה',
      icon: <GroupsIcon />,
      color: colors.neutral[500],
      link: '/activists',
      linkText: '➤ עבור לדף פעילים',
      steps: [
        'לחץ על כפתור "+ פעיל חדש"',
        'הזן שם מלא',
        'הזן מספר טלפון (חובה לתקשורת)',
        'בחר שכונה שבה הפעיל פעיל',
        'הוסף תפקיד (לדוגמה: "מאבטח קלפי", "מפיץ עלונים")',
        'הוסף תגיות לקטגוריזציה',
        'שמור ולחץ "צור פעיל"',
      ],
      tip: 'התחל עם 5-10 פעילים לשכונה כדי לבדוק את התהליך',
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
          <RocketLaunchIcon sx={{ fontSize: 48, color: colors.pastel.purple }} />
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 700,
                color: colors.neutral[900],
                mb: 0.5,
              }}
            >
              מדריך אתחול מערכת - SuperAdmin
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.neutral[600],
                fontWeight: 500,
              }}
            >
              הדרכה שלב אחר שלב להקמת מערכת הקמפיין שלך
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Critical Warning */}
      <Alert severity="error" sx={{ mb: 4, borderRadius: borderRadius.lg }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <WarningIcon sx={{ fontSize: 28 }} />
          <Box>
            <Typography sx={{ fontWeight: 700, fontSize: '16px', mb: 0.5 }}>
              ⚠️ קריטי: החלף את משתמש ה-SuperAdmin לפני כל דבר אחר!
            </Typography>
            <Typography sx={{ fontSize: '14px' }}>
              המערכת יוצרת משתמש דמו בשם <code>superadmin@election.test</code>. אתה חייב להחליף את
              הפרטים שלו (אימייל, שם, טלפון, סיסמה) לפני שתתחיל לעבוד. השתמש ב-Prisma Studio:{' '}
              <code>npm run db:studio</code>
            </Typography>
          </Box>
        </Box>
      </Alert>

      {/* Campaign Organizational Hierarchy - Visual Flow */}
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
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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
              📊 מבנה היררכי של מערכת הבחירות
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              זה המבנה הארגוני שתצור בשלבים הבאים
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
              maxWidth: '900px',
              mx: 'auto',
            }}
          >
            {/* SuperAdmin */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.purple}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.purple}15 0%, ${colors.pastel.purple}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.purple,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <AdminPanelSettingsIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      SuperAdmin (אתה!)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      ניהול מלא של המערכת - גישה לכל הנתונים
                    </Typography>
                  </Box>
                  <Chip
                    label="מותקן"
                    sx={{
                      background: colors.status.green,
                      color: colors.neutral[0],
                      fontWeight: 700,
                    }}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Area Manager */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.orange}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.orange}15 0%, ${colors.pastel.orange}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.orange,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <PublicIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 1: Area Managers (מנהלי אזור)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      מנהל מחוז - מנהל מספר ערים באזור גיאוגרפי
                    </Typography>
                  </Box>
                  <Chip label="אופציונלי" sx={{ background: colors.pastel.orangeLight, fontWeight: 600 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Cities */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.blue}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.blue}15 0%, ${colors.pastel.blue}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.blue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <LocationCityIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 2: Cities (ערים)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      יחידות ארגוניות עצמאיות - תל אביב, ירושלים, חיפה וכו&apos;
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* City Coordinators */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.blue}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.blue}15 0%, ${colors.pastel.blue}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.blue,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <PeopleIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 3: City Coordinators (רכזי עיר)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      רכז עיר - מנהל את כל הפעילות של עיר אחת
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Neighborhoods */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.status.lightGreen}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.status.lightGreen}15 0%, ${colors.status.lightGreen}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.status.lightGreen,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <HomeWorkIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 4: Neighborhoods (שכונות)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      מחוזות קמפיין - אזורים גיאוגרפיים בתוך עיר (פלורנטין, נווה צדק וכו&apos;)
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Activist Coordinators */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.pastel.green}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.pastel.green}15 0%, ${colors.pastel.green}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.pastel.green,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <GroupsIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 5: Activist Coordinators (רכזי שכונות)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      רכז שכונתי - מארגן פעילים ב-1 עד 5 שכונות
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>

            {/* Arrow */}
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <ArrowDownwardIcon sx={{ fontSize: 32, color: colors.neutral[400] }} />
            </Box>

            {/* Activists */}
            <Card
              sx={{
                borderRadius: borderRadius.lg,
                border: `3px solid ${colors.neutral[400]}`,
                boxShadow: shadows.large,
                background: `linear-gradient(135deg, ${colors.neutral[200]}15 0%, ${colors.neutral[100]}05 100%)`,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: colors.neutral[400],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: colors.neutral[0],
                    }}
                  >
                    <GroupsIcon />
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 700, fontSize: '18px', color: colors.neutral[900] }}>
                      שלב 6: Activists (פעילי שטח)
                    </Typography>
                    <Typography sx={{ fontSize: '14px', color: colors.neutral[600] }}>
                      מתנדבי קמפיין בשטח - אלו שעושים את העבודה בפועל
                    </Typography>
                  </Box>
                  <Chip label="חובה" sx={{ background: colors.status.red, color: colors.neutral[0], fontWeight: 700 }} />
                </Box>
              </CardContent>
            </Card>
          </Box>
        </CardContent>
      </Card>

      {/* Step-by-Step Setup Guide */}
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          color: colors.neutral[900],
          mb: 3,
          textAlign: 'center',
        }}
      >
        📋 הדרכה שלב אחר שלב
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {setupSteps.map((step) => (
          <Grid item xs={12} key={step.order}>
            <Card
              sx={{
                borderRadius: borderRadius.xl,
                boxShadow: shadows.medium,
                border: `2px solid ${step.color}`,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: shadows.large,
                  transform: 'translateY(-4px)',
                },
              }}
            >
              {/* Step Header */}
              <Box
                sx={{
                  background: `linear-gradient(135deg, ${step.color} 0%, ${step.color}CC 100%)`,
                  p: 3,
                  color: colors.neutral[0],
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: colors.neutral[0],
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: step.color,
                      fontWeight: 700,
                      fontSize: '20px',
                    }}
                  >
                    {step.order}
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.95 }}>
                      {step.description}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <CardContent sx={{ p: 3 }}>
                {/* Action Link */}
                <Link href={step.link} passHref style={{ textDecoration: 'none' }}>
                  <Box
                    sx={{
                      mb: 3,
                      p: 2.5,
                      background: `${step.color}15`,
                      borderRadius: borderRadius.lg,
                      border: `2px solid ${step.color}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        background: `${step.color}25`,
                        transform: 'translateX(-4px)',
                      },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: '16px',
                          color: colors.neutral[900],
                          flex: 1,
                        }}
                      >
                        {step.linkText}
                      </Typography>
                      <Box
                        sx={{
                          px: 2,
                          py: 1,
                          background: step.color,
                          color: colors.neutral[0],
                          borderRadius: borderRadius.md,
                          fontWeight: 700,
                          fontSize: '14px',
                        }}
                      >
                        לחץ כאן
                      </Box>
                    </Box>
                  </Box>
                </Link>

                {/* Step Instructions */}
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, mb: 2, color: colors.neutral[800] }}
                >
                  איך לעשות את זה:
                </Typography>
                <List dense>
                  {step.steps.map((instruction, idx) => (
                    <ListItem key={idx} sx={{ alignItems: 'flex-start' }}>
                      <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                        <CheckCircleIcon sx={{ fontSize: 20, color: step.color }} />
                      </ListItemIcon>
                      <ListItemText
                        primary={instruction}
                        primaryTypographyProps={{
                          fontSize: '14px',
                          color: colors.neutral[700],
                          lineHeight: 1.6,
                        }}
                      />
                    </ListItem>
                  ))}
                </List>

                {/* Tip */}
                {step.tip && (
                  <Alert severity="info" sx={{ mt: 2, borderRadius: borderRadius.md }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      <InfoIcon sx={{ fontSize: 20, mt: 0.2 }} />
                      <Typography sx={{ fontSize: '13px', lineHeight: 1.5 }}>
                        <strong>טיפ:</strong> {step.tip}
                      </Typography>
                    </Box>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Quick Reference Card */}
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
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <InfoIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              📖 מידע נוסף
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              משאבים נוספים ועזרה
            </Typography>
          </Box>
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Link href="/onboarding" passHref style={{ textDecoration: 'none' }}>
                <Card
                  sx={{
                    p: 2.5,
                    borderRadius: borderRadius.lg,
                    border: `2px solid ${colors.pastel.blue}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: shadows.medium,
                      transform: 'translateY(-2px)',
                    },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <RocketLaunchIcon sx={{ fontSize: 32, color: colors.pastel.blue }} />
                    <Box>
                      <Typography sx={{ fontWeight: 700, fontSize: '15px', color: colors.neutral[900] }}>
                        מדריך אתחול מפורט
                      </Typography>
                      <Typography sx={{ fontSize: '13px', color: colors.neutral[600] }}>
                        מידע נוסף על תכנון המערכת ושאלות נפוצות
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              </Link>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  p: 2.5,
                  borderRadius: borderRadius.lg,
                  border: `2px solid ${colors.pastel.green}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <SecurityIcon sx={{ fontSize: 32, color: colors.pastel.green }} />
                  <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '15px', color: colors.neutral[900] }}>
                      אבטחה וגיבויים
                    </Typography>
                    <Typography sx={{ fontSize: '13px', color: colors.neutral[600] }}>
                      אל תשכח: גיבויים יומיים ו-HTTPS בפרודקשן
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Final Checklist */}
      <Card
        sx={{
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `2px solid ${colors.status.green}`,
          overflow: 'hidden',
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
          <CheckCircleIcon sx={{ fontSize: 32 }} />
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
              ✅ רשימת בדיקה לפני השקה
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.95 }}>
              וודא שביצעת את כל השלבים הבאים
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
                  'החלפת משתמש SuperAdmin בפרטים אמיתיים',
                  'סיסמאות חזקות לכל המשתמשים',
                  'HTTPS מופעל בפרודקשן',
                  'משתני סביבה (.env) מאובטחים',
                  'גיבוי ראשוני בוצע',
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
                📊 נתונים
              </Typography>
              <List dense>
                {[
                  'לפחות עיר אחת נוצרה',
                  'לפחות רכז עיר אחד הוקצה',
                  'לפחות 3 שכונות נוצרו',
                  'לפחות רכז שכונתי אחד הוקצה',
                  'נתונים נבדקו עם: npm run db:check-integrity',
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
    </Box>
  );
}
