/**
 * Environment Variables Configuration
 *
 * Next.js 15+ no longer exposes process.env in the browser.
 * This file provides a typed interface to access public environment variables.
 *
 * IMPORTANT: Only NEXT_PUBLIC_* variables are available here.
 */

// Server-side: Read from process.env
// Client-side: These are inlined at build time by Next.js
// TEMPORARY FIX: Hardcoded for development until Next.js 15 env var issue is resolved
export const env = {
  /** Public app URL */
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',

  /** VAPID public key for push notifications (Generated 2025-12-18) */
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: 'BLU8IBvbYVu5tjZtN_2aWLcsUl7UJ751oyMTh0Hzb6KQQRnL1uERNmmC0pi5RIdLnjXnnWOGkujQXGLPpKQLYws',
} as const;

// Type-safe helper to check if we're on client or server
export const isServer = typeof window === 'undefined';
export const isClient = typeof window !== 'undefined';
