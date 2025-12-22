import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography, Grid, Card, CardContent, Breadcrumbs, Divider, Badge } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import { getWikiCategories, getPopularWikiPages, getRecentWikiPages } from '@/app/actions/wiki';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { CategoryIcon } from './components/CategoryIcon';
import { WikiHeaderIcon } from './components/WikiHeaderIcon';
import { WikiTrendingIcon, WikiRecentIcon, WikiEmptyIcon } from './components/QuickLinkIcons';
import { WikiSearchClient } from './components/WikiSearchClient';

export const metadata = {
  title: 'מערכת ויקי - מדריך למנהל על',
  description: 'מרכז הידע המלא של מערכת ניהול הקמפיין - למנהלי על בלבד',
};

// 🚀 PERFORMANCE: Server-side caching
export const revalidate = 300; // 5 minutes
export const dynamic = 'force-dynamic'; // Required for auth()
export const fetchCache = 'force-cache';

export default async function WikiIndexPage() {
  const session = await auth();
  const locale = await getLocale();
  const isRTL = locale === 'he';

  if (!session) {
    redirect('/login');
  }

  // 🔒 RBAC: SuperAdmin only
  if (session.user.role !== 'SUPERADMIN') {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          גישה נדחתה. רק מנהל על יכול לצפות במערכת הויקי.
        </Typography>
      </Box>
    );
  }

  // Fetch wiki data
  const [categoriesResult, popularResult, recentResult] = await Promise.all([
    getWikiCategories(),
    getPopularWikiPages(5),
    getRecentWikiPages(5),
  ]);

  if (!categoriesResult.success) {
    return (
      <Box sx={{ p: 4, direction: isRTL ? 'rtl' : 'ltr' }}>
        <Typography variant="h5" color="error">
          שגיאה: {categoriesResult.error}
        </Typography>
      </Box>
    );
  }

  const categories = categoriesResult.categories || [];
  const popularPages = popularResult.pages || [];
  const recentPages = recentResult.pages || [];

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Breadcrumbs - 2025 Best Practice: Clear Navigation */}
      <Breadcrumbs
        sx={{
          mb: 3,
          '& .MuiBreadcrumbs-separator': { mx: 1 },
        }}
      >
        <Link href={`/${locale}/dashboard`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <HomeIcon sx={{ fontSize: 18, color: colors.neutral[600] }} />
          <Typography sx={{ color: colors.neutral[600], '&:hover': { color: colors.primary } }}>
            דשבורד
          </Typography>
        </Link>
        <Typography sx={{ color: colors.neutral[900], fontWeight: 600 }}>
          מערכת ויקי
        </Typography>
      </Breadcrumbs>

      {/* Header with Modern Typography Hierarchy */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: borderRadius.full,
              backgroundColor: colors.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: shadows.medium,
            }}
          >
            <WikiHeaderIcon sx={{ fontSize: 32, color: '#fff' }} />
          </Box>
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: colors.neutral[900],
                mb: 0.5,
                letterSpacing: '-0.02em',
              }}
            >
              מערכת ויקי
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: colors.neutral[600],
                fontWeight: 500,
              }}
            >
              כל מה שאתה צריך לדעת על ניהול מערכת הקמפיין במקום אחד
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Search Bar - 2025 Best Practice: Essential for Documentation */}
      <WikiSearchClient categories={categories} locale={locale} />

      <Divider sx={{ my: 4, borderColor: colors.neutral[200] }} />

      {/* Stats Summary Box - 2025 Best Practice: Quick Metrics */}
      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              borderRadius: borderRadius.lg,
              boxShadow: shadows.soft,
              backgroundColor: colors.pastel.blueLight,
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'transform 0.2s',
              '&:hover': {
                transform: 'translateY(-2px)',
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: colors.primary.main, mb: 1 }}>
                {categories.reduce((sum, cat) => sum + cat.pageCount, 0)}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.neutral[600], fontWeight: 600 }}>
                📄 סך כל המאמרים
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              borderRadius: borderRadius.xl,
              boxShadow: shadows.medium,
              backgroundColor: colors.pastel.purpleLight,
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'transform 0.2s ease-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: shadows.large,
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: colors.status.purple, mb: 1 }}>
                {categories.length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.neutral[600], fontWeight: 600 }}>
                📁 קטגוריות
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              borderRadius: borderRadius.xl,
              boxShadow: shadows.medium,
              backgroundColor: colors.pastel.greenLight,
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'transform 0.2s ease-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: shadows.large,
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: colors.status.green, mb: 1 }}>
                {popularPages.length + recentPages.length}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.neutral[600], fontWeight: 600 }}>
                👁️ נצפו לאחרונה
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card
            sx={{
              borderRadius: borderRadius.xl,
              boxShadow: shadows.medium,
              backgroundColor: colors.pastel.orangeLight,
              border: `1px solid ${colors.neutral[200]}`,
              transition: 'transform 0.2s ease-out',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: shadows.large,
              },
            }}
          >
            <CardContent sx={{ textAlign: 'center', p: 3 }}>
              <Typography variant="h3" sx={{ fontWeight: 800, color: colors.status.orange, mb: 1 }}>
                {new Date().toLocaleDateString('he-IL', { day: 'numeric', month: 'short' })}
              </Typography>
              <Typography variant="body2" sx={{ color: colors.neutral[600], fontWeight: 600 }}>
                🕒 עדכון אחרון
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Access Section - 2025: AI-Powered Personalization */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: colors.neutral[900],
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        ⚡ גישה מהירה
      </Typography>

      {(popularPages.length > 0 || recentPages.length > 0) && (
        <Grid container spacing={3} sx={{ mb: 5 }}>
          {/* Popular Pages - Enhanced with Badge */}
          {popularPages.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: borderRadius.xl,
                  boxShadow: shadows.medium,
                  border: `2px solid ${colors.status.orange}`,
                  background: '#fff',
                  transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: shadows.large,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Badge
                      badgeContent="🔥"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '14px',
                          minWidth: '24px',
                          height: '24px',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: borderRadius.full,
                          backgroundColor: colors.status.orange,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <WikiTrendingIcon sx={{ color: '#fff', fontSize: 24 }} />
                      </Box>
                    </Badge>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.neutral[900] }}>
                      דפים פופולריים
                    </Typography>
                  </Box>
                  {popularPages.map((page, index) => (
                    <Link
                      key={page.id}
                      href={`/${locale}/wiki/${page.categorySlug}/${page.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          mb: 1.5,
                          borderRadius: borderRadius.lg,
                          border: `1px solid ${colors.neutral[200]}`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: colors.pastel.blueLight,
                            borderColor: colors.primary,
                            transform: 'translateX(-4px)',
                          },
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography
                            sx={{
                              fontSize: '18px',
                              fontWeight: 700,
                              color: colors.status.orange,
                              minWidth: '24px',
                            }}
                          >
                            {index + 1}
                          </Typography>
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600, color: colors.neutral[900], mb: 0.5 }}
                            >
                              {page.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                              📁 {page.categoryName}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Recent Pages - Enhanced with Clock Icon */}
          {recentPages.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: borderRadius.xl,
                  boxShadow: shadows.medium,
                  border: `2px solid ${colors.status.blue}`,
                  background: '#fff',
                  transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: shadows.large,
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                    <Badge
                      badgeContent="⏱️"
                      sx={{
                        '& .MuiBadge-badge': {
                          fontSize: '14px',
                          minWidth: '24px',
                          height: '24px',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: borderRadius.full,
                          backgroundColor: colors.status.blue,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <WikiRecentIcon sx={{ color: '#fff', fontSize: 24 }} />
                      </Box>
                    </Badge>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.neutral[900] }}>
                      נצפו לאחרונה
                    </Typography>
                  </Box>
                  {recentPages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/${locale}/wiki/${page.categorySlug}/${page.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box
                        sx={{
                          p: 2,
                          mb: 1.5,
                          borderRadius: borderRadius.lg,
                          border: `1px solid ${colors.neutral[200]}`,
                          transition: 'all 0.2s',
                          '&:hover': {
                            backgroundColor: colors.pastel.blueLight,
                            borderColor: colors.status.blue,
                            transform: 'translateX(-4px)',
                          },
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Box
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: borderRadius.full,
                              backgroundColor: colors.status.blue,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 600, color: colors.neutral[900], mb: 0.5 }}
                            >
                              {page.title}
                            </Typography>
                            <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                              📁 {page.categoryName}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Categories Grid - 2025 Glassmorphism Design */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 700,
          color: colors.neutral[900],
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        📂 קטגוריות
      </Typography>

      <Grid container spacing={3}>
        {categories.map((category, index) => {
          const colorSchemes = [
            { bg: colors.pastel.blueLight, icon: colors.primary.main, glow: shadows.glowBlue },
            { bg: colors.pastel.purpleLight, icon: colors.status.purple, glow: shadows.glowPurple },
            { bg: colors.pastel.greenLight, icon: colors.status.green, glow: shadows.glowGreen },
            { bg: colors.pastel.orangeLight, icon: colors.status.orange, glow: shadows.glowOrange },
            { bg: colors.pastel.pinkLight, icon: colors.status.pink, glow: shadows.glowPink },
            { bg: colors.pastel.yellowLight, icon: colors.status.yellow, glow: shadows.glowOrange },
          ];
          const colorScheme = colorSchemes[index % colorSchemes.length];

          return (
            <Grid item xs={12} sm={6} md={4} key={category.id}>
              <Link href={`/${locale}/wiki/${category.slug}`} style={{ textDecoration: 'none' }}>
                <Card
                  sx={{
                    borderRadius: borderRadius.xl,
                    boxShadow: shadows.soft,
                    border: `1px solid ${colors.neutral[200]}`,
                    transition: 'all 0.2s ease-out',
                    height: '100%',
                    background: '#fff',
                    position: 'relative',
                    overflow: 'hidden',
                    '&:hover': {
                      boxShadow: shadows.large,
                      transform: 'translateY(-4px)',
                      borderColor: colorScheme.icon,
                      backgroundColor: colorScheme.bg,
                    },
                  }}
                >
                  <CardContent sx={{ p: 3, position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: borderRadius.full,
                          backgroundColor: colorScheme.bg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colorScheme.icon,
                          flexShrink: 0,
                        }}
                      >
                        <CategoryIcon iconName={category.icon} sx={{ fontSize: 28 }} />
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 700,
                            color: colors.neutral[900],
                            mb: 1,
                            lineHeight: 1.3,
                          }}
                        >
                          {category.name}
                        </Typography>
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                          }}
                        >
                          <Box
                            sx={{
                              flex: 1,
                              height: 6,
                              borderRadius: borderRadius.full,
                              backgroundColor: colors.neutral[200],
                              overflow: 'hidden',
                              position: 'relative',
                            }}
                          >
                            <Box
                              sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                height: '100%',
                                width: `${Math.min((category.pageCount / 20) * 100, 100)}%`,
                                backgroundColor: colorScheme.icon,
                                borderRadius: borderRadius.full,
                                transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                              }}
                            />
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              color: colorScheme.icon,
                              fontWeight: 700,
                              fontSize: '11px',
                            }}
                          >
                            {category.pageCount}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>

                    {category.description && (
                      <Typography
                        variant="body2"
                        sx={{
                          color: colors.neutral[600],
                          lineHeight: 1.7,
                          fontWeight: 500,
                        }}
                      >
                        {category.description}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Link>
            </Grid>
          );
        })}
      </Grid>

      {/* Empty State */}
      {categories.length === 0 && (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <WikiEmptyIcon sx={{ fontSize: 80, color: colors.neutral[300], mb: 2 }} />
          <Typography variant="h6" sx={{ color: colors.neutral[600], mb: 1 }}>
            אין תוכן זמין כרגע
          </Typography>
          <Typography variant="body2" sx={{ color: colors.neutral[500] }}>
            מערכת הויקי תאוכלס בקרוב בתוכן מקיף
          </Typography>
        </Box>
      )}
    </Box>
  );
}
