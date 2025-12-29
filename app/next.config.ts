import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';
import path from 'path';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
  output: 'standalone',
  outputFileTracingRoot: path.join(__dirname),

  // Performance: Disable source maps in production (saves ~30-40% build time)
  productionBrowserSourceMaps: false,

  // ✅ SECURITY FIX (VULN-AUTH-003): Strip dev-only credentials from production
  webpack: (config, { isServer, webpack }) => {
    // Replace DevTestUsers with empty module in production builds
    if (process.env.NODE_ENV === 'production') {
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /app\/\[locale\]\/\(auth\)\/login\/DevTestUsers\.tsx$/,
          path.resolve(__dirname, 'lib/empty-module.ts')
        )
      );
    }
    return config;
  },

  env: {
    // Explicitly expose NEXT_PUBLIC_ vars to browser (Next.js 15+)
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
    // instrumentationHook is now default in Next.js 15+, no longer needed
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' blob:",
              "worker-src 'self' blob:",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https:",
              "frame-ancestors 'none'",
            ].join('; '),
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
      // Ensure PWA icons are properly cached
      {
        source: '/:path(icon-.*\\.png|manifest\\.json)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

// Wrap with Sentry config
export default withSentryConfig(
  withNextIntl(nextConfig),
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,

    // Only print logs for uploading source maps in CI
    silent: !process.env.CI,

    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Performance: Disable expensive source map uploads (reduces build time by ~1-2 minutes)
    // Only upload minimal source maps needed for error tracking
    widenClientFileUpload: false,

    // Route browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers.
    // This can increase your server load as well as your hosting bill.
    // Note: Check that the configured route will not match with your Next.js middleware, otherwise reporting of client-
    // side errors will fail.
    tunnelRoute: '/monitoring',

    // Webpack-specific options (moved from deprecated top-level)
    webpack: {
      // Performance: Disable React component annotation to speed up builds
      // Re-enable only if you need detailed component tracking in Sentry
      reactComponentAnnotation: {
        enabled: false,
      },

      // Enables automatic instrumentation of Vercel Cron Monitors. (Does not yet work with App Router route handlers.)
      // See the following for more information:
      // https://docs.sentry.io/product/crons/
      // https://vercel.com/docs/cron-jobs
      automaticVercelMonitors: true,
    },
  }
);
