import { auth } from '@/auth.config';
import { redirect, notFound } from 'next/navigation';
import { Box, Typography, Card, CardContent, Breadcrumbs, Chip } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import { getWikiCategory } from '@/app/actions/wiki';
import { getLocale } from 'next/intl/server';
import Link from 'next/link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ArticleIcon from '@mui/icons-material/Article';

export default async function WikiCategoryPage({
  params,
}: {
  params: { categorySlug: string };
}) {
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

  // Fetch category
  const result = await getWikiCategory(params.categorySlug);

  if (!result.success || !result.category) {
    notFound();
  }

  const category = result.category;

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        background: colors.neutral[50],
        minHeight: '100vh',
        direction: isRTL ? 'rtl' : 'ltr',
      }}
    >
      {/* Breadcrumbs */}
      <Breadcrumbs
        separator={<NavigateNextIcon fontSize="small" />}
        sx={{ mb: 3 }}
        aria-label="breadcrumb"
      >
        <Link
          href={`/${locale}/dashboard`}
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: colors.neutral[600],
          }}
        >
          <HomeIcon sx={{ marginInlineEnd: 0.5 }} fontSize="inherit" />
          דשבורד
        </Link>
        <Link
          href={`/${locale}/wiki`}
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: colors.neutral[600],
          }}
        >
          <MenuBookIcon sx={{ marginInlineEnd: 0.5 }} fontSize="inherit" />
          ויקי
        </Link>
        <Typography color="text.primary">{category.name}</Typography>
      </Breadcrumbs>

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
          {category.name}
        </Typography>
        {category.description && (
          <Typography
            variant="body1"
            sx={{
              color: colors.neutral[600],
              fontWeight: 500,
            }}
          >
            {category.description}
          </Typography>
        )}
        <Chip
          label={`${category.pageCount} דפים`}
          size="small"
          sx={{
            mt: 2,
            backgroundColor: colors.neutral[100],
            color: colors.neutral[600],
            fontWeight: 500,
          }}
        />
      </Box>

      {/* Pages List */}
      {category.pages.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {category.pages.map((page) => (
            <Link
              key={page.id}
              href={`/${locale}/wiki/${category.slug}/${page.slug}`}
              style={{ textDecoration: 'none' }}
            >
              <Card
                sx={{
                  borderRadius: borderRadius.lg,
                  boxShadow: shadows.small,
                  border: `1px solid ${colors.neutral[200]}`,
                  transition: 'all 0.2s',
                  '&:hover': {
                    boxShadow: shadows.medium,
                    transform: 'translateY(-2px)',
                    borderColor: colors.primary,
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: borderRadius.md,
                        backgroundColor: colors.pastel.blueLight,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: colors.status.blue,
                        flexShrink: 0,
                      }}
                    >
                      <ArticleIcon />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: colors.neutral[900],
                          mb: 0.5,
                        }}
                      >
                        {page.title}
                      </Typography>
                      {page.excerpt && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: colors.neutral[600],
                            mb: 1,
                            lineHeight: 1.6,
                          }}
                        >
                          {page.excerpt}
                        </Typography>
                      )}
                      {/* Tags */}
                      {page.tags && page.tags.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {page.tags.slice(0, 3).map((tag) => (
                            <Chip
                              key={tag}
                              label={tag}
                              size="small"
                              sx={{
                                backgroundColor: colors.neutral[100],
                                color: colors.neutral[600],
                                fontSize: '0.75rem',
                              }}
                            />
                          ))}
                          {page.tags.length > 3 && (
                            <Chip
                              label={`+${page.tags.length - 3}`}
                              size="small"
                              sx={{
                                backgroundColor: colors.neutral[100],
                                color: colors.neutral[600],
                                fontSize: '0.75rem',
                              }}
                            />
                          )}
                        </Box>
                      )}
                    </Box>
                    {/* View Count */}
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: 0.5,
                      }}
                    >
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.neutral[500],
                        }}
                      >
                        {page.viewCount} צפיות
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Link>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            textAlign: 'center',
            py: 8,
          }}
        >
          <ArticleIcon sx={{ fontSize: 80, color: colors.neutral[300], mb: 2 }} />
          <Typography variant="h6" sx={{ color: colors.neutral[600], mb: 1 }}>
            אין דפים בקטגוריה זו כרגע
          </Typography>
          <Typography variant="body2" sx={{ color: colors.neutral[500] }}>
            תוכן יתווסף בקרוב
          </Typography>
        </Box>
      )}
    </Box>
  );
}
