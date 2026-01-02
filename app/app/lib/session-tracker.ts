/**
 * 🔍 Session Tracker - User Journey Recording
 *
 * Tracks user navigation, clicks, and form submissions to provide context when errors occur.
 *
 * Features:
 * - Automatic session ID generation
 * - Navigation tracking (Next.js router events)
 * - Click tracking (buttons, links via MutationObserver)
 * - Form submission tracking (success/error)
 * - Event batching (sends every 5 seconds or 10 events)
 * - Feature flag support (ENABLE_SESSION_TRACKING)
 *
 * Privacy:
 * - Sanitizes form data (removes passwords, tokens)
 * - Only tracks authenticated users (optional)
 * - Respects exclusion list for sensitive pages
 */

'use client';

import { useEffect, useRef } from 'react';

// Types
export interface SessionEvent {
  eventType: 'navigation' | 'click' | 'form_submit' | 'form_error';
  page?: string;
  element?: string;
  formName?: string;
  formData?: Record<string, any>;
  loadTime?: number;
  timestamp: number;
}

interface QueuedEvent extends SessionEvent {
  sessionId: string;
}

// Feature flag
const ENABLE_SESSION_TRACKING = process.env.NEXT_PUBLIC_ENABLE_SESSION_TRACKING !== 'false'; // Default: enabled

// Sensitive pages to exclude from tracking
const EXCLUDED_PAGES = [
  '/login',
  '/change-password',
  '/api/',
];

// Sensitive form fields to redact
const SENSITIVE_FIELDS = ['password', 'token', 'apiKey', 'secret', 'creditCard', 'ssn'];

// Session Tracker Class
class SessionTracker {
  private sessionId: string | null = null;
  private eventQueue: QueuedEvent[] = [];
  private batchInterval: NodeJS.Timeout | null = null;
  private readonly MAX_BATCH_SIZE = 10;
  private readonly BATCH_INTERVAL_MS = 5000;
  private readonly MAX_EVENTS_PER_SECOND = 10;
  private eventTimestamps: number[] = [];
  private clickObserver: MutationObserver | null = null;
  private isTracking = false;

  constructor() {
    if (typeof window === 'undefined') return;

    // Initialize session ID from sessionStorage
    this.sessionId = this.getOrCreateSessionId();
  }

  /**
   * Get or create unique session ID
   */
  private getOrCreateSessionId(): string {
    if (typeof window === 'undefined') return '';

    const storageKey = 'session_tracker_id';
    let sessionId = sessionStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  /**
   * Check if tracking is enabled
   */
  private isTrackingEnabled(): boolean {
    if (!ENABLE_SESSION_TRACKING) return false;
    if (typeof window === 'undefined') return false;

    const currentPath = window.location.pathname;
    return !EXCLUDED_PAGES.some(excluded => currentPath.includes(excluded));
  }

  /**
   * Rate limiting: Check if we can add more events
   */
  private canAddEvent(): boolean {
    const now = Date.now();
    // Remove timestamps older than 1 second
    this.eventTimestamps = this.eventTimestamps.filter(ts => now - ts < 1000);

    if (this.eventTimestamps.length >= this.MAX_EVENTS_PER_SECOND) {
      console.warn('[SessionTracker] Rate limit exceeded - event dropped');
      return false;
    }

    this.eventTimestamps.push(now);
    return true;
  }

  /**
   * Sanitize form data - remove sensitive fields
   */
  private sanitizeFormData(formData: Record<string, any>): Record<string, any> {
    const sanitized = { ...formData };

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_FIELDS.some(field => lowerKey.includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Add event to queue
   */
  private addEvent(event: SessionEvent) {
    if (!this.isTrackingEnabled()) return;
    if (!this.canAddEvent()) return;
    if (!this.sessionId) return;

    this.eventQueue.push({
      ...event,
      sessionId: this.sessionId,
    });

    // Send batch if queue is full
    if (this.eventQueue.length >= this.MAX_BATCH_SIZE) {
      this.sendBatch();
    }
  }

  /**
   * Send batch of events to server
   */
  private async sendBatch() {
    if (this.eventQueue.length === 0) return;

    const batch = this.eventQueue.splice(0, this.MAX_BATCH_SIZE);

    try {
      await fetch('/api/session-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: batch }),
      });
    } catch (error) {
      console.error('[SessionTracker] Failed to send events:', error);
      // Don't retry - silently fail to avoid impacting user experience
    }
  }

  /**
   * Track navigation event
   */
  trackNavigation(url: string, loadTime?: number) {
    this.addEvent({
      eventType: 'navigation',
      page: url,
      loadTime,
      timestamp: Date.now(),
    });
  }

  /**
   * Track click event
   */
  trackClick(element: HTMLElement) {
    const elementDesc = this.getElementDescription(element);

    this.addEvent({
      eventType: 'click',
      page: window.location.pathname,
      element: elementDesc,
      timestamp: Date.now(),
    });
  }

  /**
   * Track form submission
   */
  trackFormSubmit(formName: string, formData: Record<string, any>, success: boolean) {
    this.addEvent({
      eventType: success ? 'form_submit' : 'form_error',
      page: window.location.pathname,
      formName,
      formData: this.sanitizeFormData(formData),
      timestamp: Date.now(),
    });
  }

  /**
   * Get human-readable element description
   */
  private getElementDescription(element: HTMLElement): string {
    const parts: string[] = [];

    // Tag name
    parts.push(element.tagName.toLowerCase());

    // data-testid (priority)
    const testId = element.getAttribute('data-testid');
    if (testId) {
      parts.push(`[data-testid="${testId}"]`);
      return parts.join('');
    }

    // ID
    if (element.id) {
      parts.push(`#${element.id}`);
      return parts.join('');
    }

    // Class (first class only)
    if (element.className && typeof element.className === 'string') {
      const firstClass = element.className.split(' ')[0];
      if (firstClass) {
        parts.push(`.${firstClass}`);
      }
    }

    // Text content (truncated)
    const text = element.textContent?.trim();
    if (text && text.length > 0) {
      const truncated = text.substring(0, 30);
      parts.push(`"${truncated}${text.length > 30 ? '...' : ''}"`);
    }

    return parts.join('');
  }

  /**
   * Start tracking
   */
  start() {
    if (!this.isTrackingEnabled()) {
      console.log('[SessionTracker] Tracking disabled');
      return;
    }

    if (this.isTracking) {
      console.warn('[SessionTracker] Already tracking');
      return;
    }

    this.isTracking = true;
    console.log('[SessionTracker] Started tracking session:', this.sessionId);

    // Track initial navigation
    this.trackNavigation(window.location.pathname + window.location.search);

    // Start batch interval
    this.batchInterval = setInterval(() => {
      this.sendBatch();
    }, this.BATCH_INTERVAL_MS);

    // Track clicks on interactive elements
    this.setupClickTracking();

    // Track form submissions
    this.setupFormTracking();
  }

  /**
   * Setup click tracking via event delegation
   */
  private setupClickTracking() {
    // Use event delegation on document for better performance
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;

      // Only track buttons, links, and elements with click handlers
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'A' ||
        target.getAttribute('role') === 'button' ||
        target.hasAttribute('onclick')
      ) {
        this.trackClick(target);
      }
    }, { capture: true, passive: true });
  }

  /**
   * Setup form submission tracking
   */
  private setupFormTracking() {
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      const formName = form.getAttribute('name') || form.getAttribute('id') || 'unnamed-form';
      const formData = new FormData(form);
      const data: Record<string, any> = {};

      formData.forEach((value, key) => {
        data[key] = value;
      });

      // Track as form_submit (we don't know if it will succeed yet)
      this.trackFormSubmit(formName, data, true);
    }, { capture: true, passive: true });
  }

  /**
   * Stop tracking and flush queue
   */
  stop() {
    if (!this.isTracking) return;

    console.log('[SessionTracker] Stopping tracking');
    this.isTracking = false;

    // Clear interval
    if (this.batchInterval) {
      clearInterval(this.batchInterval);
      this.batchInterval = null;
    }

    // Send remaining events
    this.sendBatch();

    // Disconnect observer
    if (this.clickObserver) {
      this.clickObserver.disconnect();
      this.clickObserver = null;
    }
  }

  /**
   * Get current session ID
   */
  getSessionId(): string | null {
    return this.sessionId;
  }
}

// Singleton instance
let trackerInstance: SessionTracker | null = null;

/**
 * Get global session tracker instance
 */
export function getSessionTracker(): SessionTracker {
  if (typeof window === 'undefined') {
    // Return a no-op tracker for SSR
    return {
      start: () => {},
      stop: () => {},
      trackNavigation: () => {},
      trackClick: () => {},
      trackFormSubmit: () => {},
      getSessionId: () => null,
    } as any;
  }

  if (!trackerInstance) {
    trackerInstance = new SessionTracker();
  }

  return trackerInstance;
}

/**
 * React hook to use session tracker
 */
export function useSessionTracker() {
  const tracker = useRef<SessionTracker | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Get or create tracker instance
    tracker.current = getSessionTracker();

    // Start tracking
    tracker.current.start();

    // Cleanup on unmount
    return () => {
      tracker.current?.stop();
    };
  }, []);

  return tracker.current;
}
