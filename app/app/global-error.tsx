'use client';

/**
 * Global Error Boundary - Catches root layout errors
 *
 * This catches errors in the root layout that error.tsx can't catch.
 * Required to have its own <html> and <body> tags.
 *
 * See: https://nextjs.org/docs/app/building-your-application/routing/error-handling#handling-errors-in-root-layouts
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Global Error Boundary] Critical error caught:', error);

    // Log to API
    fetch('/api/log-error', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: error.message,
        stack: error.stack,
        digest: error.digest,
        level: 'CRITICAL',
        errorType: 'GlobalLayoutError',
        url: typeof window !== 'undefined' ? window.location.href : 'unknown',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timestamp: new Date().toISOString(),
      }),
    }).catch(console.error);
  }, [error]);

  return (
    <html dir="rtl" lang="he">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            padding: '20px',
            textAlign: 'center',
            backgroundColor: '#f5f5f5',
          }}
        >
          <div
            style={{
              maxWidth: '500px',
              padding: '40px',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <div
              style={{
                fontSize: '64px',
                marginBottom: '20px',
                color: '#d32f2f',
              }}
            >
              ⚠️
            </div>

            <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#333' }}>
              שגיאה קריטית במערכת
            </h1>

            <p style={{ fontSize: '16px', color: '#666', marginBottom: '30px' }}>
              אירעה שגיאה חמורה. אנא רענן את הדף או פנה לתמיכה.
            </p>

            {process.env.NODE_ENV === 'development' && (
              <div
                style={{
                  padding: '16px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '8px',
                  textAlign: 'right',
                  fontSize: '14px',
                  fontFamily: 'monospace',
                  marginBottom: '20px',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}
              >
                <code style={{ color: '#d32f2f' }}>{error.message}</code>
                {error.digest && (
                  <div style={{ marginTop: '8px', fontSize: '12px' }}>
                    Digest: {error.digest}
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={reset}
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                נסה שוב
              </button>

              <Link
                href="/"
                style={{
                  padding: '12px 24px',
                  fontSize: '16px',
                  backgroundColor: 'white',
                  color: '#1976d2',
                  border: '2px solid #1976d2',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontWeight: 600,
                  display: 'inline-block',
                }}
              >
                חזור לדף הבית
              </Link>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
