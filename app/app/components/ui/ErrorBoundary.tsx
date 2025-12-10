'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Button, Typography, Card } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';
import { colors, borderRadius } from '@/lib/design-system';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors in child components and displays friendly error UI
 * Prevents entire app crash from component errors
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    this.setState({
      error,
      errorInfo
    });

    // Log to error reporting service (Sentry, LogRocket, etc.)
    // logErrorToService(error, errorInfo);
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            p: 3
          }}
        >
          <Card
            sx={{
              maxWidth: 500,
              p: 4,
              textAlign: 'center',
              borderRadius: borderRadius['2xl'],
              border: `2px solid ${colors.error}`
            }}
          >
            <ErrorOutlineIcon
              sx={{
                fontSize: 64,
                color: colors.error,
                mb: 2
              }}
            />

            <Typography variant="h5" sx={{ fontWeight: 700, mb: 1, color: colors.neutral[900] }}>
              משהו השתבש
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, color: colors.neutral[600] }}>
              אנחנו מצטערים, אירעה שגיאה בלתי צפויה. אנא נסה לרענן את הדף.
            </Typography>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  bgcolor: colors.neutral[50],
                  borderRadius: borderRadius.md,
                  textAlign: 'left',
                  direction: 'ltr',
                  maxHeight: 200,
                  overflow: 'auto'
                }}
              >
                <Typography variant="caption" component="pre" sx={{ color: colors.error, fontSize: '11px' }}>
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </Typography>
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<RefreshIcon />}
                onClick={() => window.location.reload()}
              >
                רענן דף
              </Button>

              <Button
                variant="outlined"
                onClick={this.handleReset}
              >
                נסה שוב
              </Button>
            </Box>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

/**
 * Simple Error Fallback Component
 * For use with React Query error boundaries
 */
export function ErrorFallback({
  error,
  resetErrorBoundary
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <Box sx={{ p: 3, textAlign: 'center' }}>
      <ErrorOutlineIcon sx={{ fontSize: 48, color: colors.error, mb: 2 }} />
      <Typography variant="h6" gutterBottom>
        שגיאה בטעינת הנתונים
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {error.message}
      </Typography>
      <Button variant="outlined" onClick={resetErrorBoundary}>
        נסה שוב
      </Button>
    </Box>
  );
}
