import { auth } from '@/auth.config';
import { redirect, notFound } from 'next/navigation';
import { Box, Typography, Chip, Breadcrumbs } from '@mui/material';
import { colors, shadows, borderRadius } from '@/lib/design-system';
import { getWikiPage, incrementWikiPageView } from '@/app/actions/wiki';
import { getLocale } from 'next-intl/server';
import Link from 'next/link';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import HomeIcon from '@mui/icons-material/Home';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ReactMarkdown from 'react-markdown';

export default async function WikiPageView({
  params,
}: {
  params: Promise<{ categorySlug: string; pageSlug: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();
  const isRTL = locale === 'he';
  const { categorySlug, pageSlug } = await params;

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

  // Fetch wiki page
  const result = await getWikiPage(pageSlug);

  if (!result.success || !result.page) {
    notFound();
  }

  const page = result.page;

  // Increment view count (fire-and-forget with error handling)
  incrementWikiPageView(page.id).catch((error) => {
    // Log error but don't block page render - analytics are non-critical
    console.error('[Wiki] Failed to increment view count:', error);
  });

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
        <Link
          href={`/${locale}/wiki/${categorySlug}`}
          style={{ textDecoration: 'none', color: colors.neutral[600] }}
        >
          {page.category.name}
        </Link>
        <Typography color="text.primary">{page.title}</Typography>
      </Breadcrumbs>

      {/* Content Card */}
      <Box
        sx={{
          background: colors.neutral[0],
          borderRadius: borderRadius.xl,
          boxShadow: shadows.medium,
          border: `1px solid ${colors.neutral[200]}`,
          p: { xs: 3, sm: 4, md: 5 },
          maxWidth: '900px',
          mx: 'auto',
        }}
      >
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: colors.neutral[900],
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            {page.title}
          </Typography>

          {/* Tags */}
          {page.tags && page.tags.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {page.tags.map((tag) => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    backgroundColor: colors.neutral[100],
                    color: colors.neutral[700],
                    fontWeight: 500,
                  }}
                />
              ))}
            </Box>
          )}

          {/* Metadata */}
          <Typography variant="body2" sx={{ color: colors.neutral[500] }}>
            {page.viewCount} צפיות • עודכן לאחרונה:{' '}
            {new Date(page.updatedAt).toLocaleDateString('he-IL')}
          </Typography>
        </Box>

        {/* Content */}
        <Box
          sx={{
            '& h1': {
              fontSize: '2rem',
              fontWeight: 700,
              marginTop: 3,
              marginBottom: 2,
              color: colors.neutral[900],
              borderBottom: `2px solid ${colors.neutral[200]}`,
              paddingBottom: 1,
            },
            '& h2': {
              fontSize: '1.5rem',
              fontWeight: 600,
              marginTop: 3,
              marginBottom: 1.5,
              color: colors.neutral[800],
            },
            '& h3': {
              fontSize: '1.25rem',
              fontWeight: 600,
              marginTop: 2,
              marginBottom: 1,
              color: colors.neutral[700],
            },
            '& p': {
              marginBottom: 1.5,
              lineHeight: 1.8,
              color: colors.neutral[700],
            },
            '& ul, & ol': {
              marginBottom: 2,
              paddingInlineStart: 3,
            },
            '& li': {
              marginBottom: 0.5,
              lineHeight: 1.6,
              color: colors.neutral[700],
            },
            '& a': {
              color: colors.primary.main,
              textDecoration: 'underline',
              '&:hover': {
                color: colors.primary.dark,
              },
            },
            '& code': {
              backgroundColor: colors.neutral[100],
              padding: '2px 6px',
              borderRadius: borderRadius.sm,
              fontSize: '0.9em',
              fontFamily: 'monospace',
            },
            '& pre': {
              backgroundColor: colors.neutral[900],
              color: colors.neutral[50],
              padding: 2,
              borderRadius: borderRadius.md,
              overflow: 'auto',
              marginBottom: 2,
            },
            '& pre code': {
              backgroundColor: 'transparent',
              padding: 0,
              color: colors.neutral[50],
            },
            '& blockquote': {
              borderInlineStart: `4px solid ${colors.primary}`,
              paddingInlineStart: 2,
              marginInlineStart: 0,
              marginInlineEnd: 0,
              marginBottom: 2,
              color: colors.neutral[600],
              fontStyle: 'italic',
            },
            '& table': {
              width: '100%',
              borderCollapse: 'collapse',
              marginBottom: 2,
            },
            '& th, & td': {
              border: `1px solid ${colors.neutral[200]}`,
              padding: 1.5,
              textAlign: 'start',
            },
            '& th': {
              backgroundColor: colors.neutral[100],
              fontWeight: 600,
            },
            '& img': {
              maxWidth: '100%',
              borderRadius: borderRadius.md,
              marginBottom: 2,
            },
            '& hr': {
              border: 'none',
              borderTop: `2px solid ${colors.neutral[200]}`,
              marginTop: 3,
              marginBottom: 3,
            },
          }}
        >
          <ReactMarkdown>{page.content}</ReactMarkdown>
        </Box>
      </Box>
    </Box>
  );
}
