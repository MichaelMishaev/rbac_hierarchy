import { auth } from '@/auth.config';
import { redirect } from 'next/navigation';
import { Box, Typography, Grid, Card, CardContent, Chip } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import { getWikiCategories, getPopularWikiPages, getRecentWikiPages } from '@/app/actions/wiki';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import { CategoryIcon } from './components/CategoryIcon';
import { WikiHeaderIcon } from './components/WikiHeaderIcon';
import { WikiTrendingIcon, WikiRecentIcon, WikiEmptyIcon } from './components/QuickLinkIcons';

export const metadata = {
  title: 'מערכת ויקי - מדריך למנהל על',
  description: 'מרכז הידע המלא של מערכת ניהול הקמפיין - למנהלי על בלבד',
};

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
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: colors.neutral[900],
            mb: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <WikiHeaderIcon sx={{ fontSize: 40, color: colors.primary }} />
          מערכת ויקי - מדריך למנהל על
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

      {/* Quick Links */}
      {(popularPages.length > 0 || recentPages.length > 0) && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Popular Pages */}
          {popularPages.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.medium,
                  border: `1px solid ${colors.neutral[200]}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WikiTrendingIcon sx={{ color: colors.status.orange }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      דפים פופולריים
                    </Typography>
                  </Box>
                  {popularPages.map((page) => (
                    <Link
                      key={page.id}
                      href={`/${locale}/wiki/${page.categorySlug}/${page.slug}`}
                      style={{ textDecoration: 'none' }}
                    >
                      <Box
                        sx={{
                          p: 1.5,
                          mb: 1,
                          borderRadius: borderRadius.md,
                          '&:hover': {
                            backgroundColor: colors.neutral[100],
                          },
                          cursor: 'pointer',
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: colors.neutral[800], mb: 0.5 }}
                        >
                          {page.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                          {page.categoryName}
                        </Typography>
                      </Box>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Recent Pages */}
          {recentPages.length > 0 && (
            <Grid item xs={12} md={6}>
              <Card
                sx={{
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.medium,
                  border: `1px solid ${colors.neutral[200]}`,
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <WikiRecentIcon sx={{ color: colors.status.blue }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                          p: 1.5,
                          mb: 1,
                          borderRadius: borderRadius.md,
                          '&:hover': {
                            backgroundColor: colors.neutral[100],
                          },
                          cursor: 'pointer',
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, color: colors.neutral[800], mb: 0.5 }}
                        >
                          {page.title}
                        </Typography>
                        <Typography variant="caption" sx={{ color: colors.neutral[500] }}>
                          {page.categoryName}
                        </Typography>
                      </Box>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      )}

      {/* Categories Grid */}
      <Typography
        variant="h5"
        sx={{
          fontWeight: 600,
          color: colors.neutral[800],
          mb: 3,
        }}
      >
        קטגוריות
      </Typography>

      <Grid container spacing={3}>
        {categories.map((category) => (
          <Grid item xs={12} sm={6} md={4} key={category.id}>
            <Link href={`/${locale}/wiki/${category.slug}`} style={{ textDecoration: 'none' }}>
              <Card
                sx={{
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.small,
                  border: `1px solid ${colors.neutral[200]}`,
                  transition: 'all 0.2s',
                  height: '100%',
                  '&:hover': {
                    boxShadow: shadows.large,
                    transform: 'translateY(-4px)',
                    borderColor: colors.primary,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: borderRadius.full,
                        backgroundColor: colors.pastel.blueLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.status.blue,
                      }}
                    >
                      <CategoryIcon iconName={category.icon} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: colors.neutral[900] }}>
                        {category.name}
                      </Typography>
                      <Chip
                        label={`${category.pageCount} דפים`}
                        size="small"
                        sx={{
                          mt: 0.5,
                          backgroundColor: colors.neutral[100],
                          color: colors.neutral[600],
                          fontWeight: 500,
                        }}
                      />
                    </Box>
                  </Box>

                  {category.description && (
                    <Typography
                      variant="body2"
                      sx={{
                        color: colors.neutral[600],
                        lineHeight: 1.6,
                      }}
                    >
                      {category.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Link>
          </Grid>
        ))}
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
