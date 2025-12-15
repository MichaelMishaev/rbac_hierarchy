'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

export interface RecentPage {
  path: string;
  label: string;
  timestamp: number;
}

const STORAGE_KEY = 'recentPages';
const MAX_RECENT_PAGES = 5;

// Page labels mapping (Hebrew)
const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'לוח בקרה',
  '/attendance': 'נוכחות',
  '/map': 'מפה',
  '/tasks/inbox': 'תיבת משימות',
  '/tasks/new': 'משימה חדשה',
  '/areas': 'מחוזות',
  '/cities': 'ערים',
  '/neighborhoods': 'שכונות',
  '/activists': 'פעילים',
  '/users': 'משתמשים',
  '/system-rules': 'כללי מערכת',
};

export function useRecentPages() {
  const pathname = usePathname();
  const [recentPages, setRecentPages] = useState<RecentPage[]>([]);

  // Load recent pages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setRecentPages(parsed);
      }
    } catch (error) {
      console.error('Failed to load recent pages:', error);
    }
  }, []);

  // Add current page to recent pages when pathname changes
  useEffect(() => {
    if (!pathname) return;

    // Remove locale prefix (e.g., /he or /en)
    const cleanPath = pathname.replace(/^\/(he|en)/, '') || '/';

    // Skip if this is not a tracked page
    if (!PAGE_LABELS[cleanPath]) return;

    addRecentPage({
      path: cleanPath,
      label: PAGE_LABELS[cleanPath],
      timestamp: Date.now(),
    });
  }, [pathname]);

  const addRecentPage = useCallback((page: RecentPage) => {
    setRecentPages((prev) => {
      // Remove duplicates (same path)
      const filtered = prev.filter((p) => p.path !== page.path);

      // Add new page at the beginning
      const updated = [page, ...filtered].slice(0, MAX_RECENT_PAGES);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent pages:', error);
      }

      return updated;
    });
  }, []);

  const clearRecentPages = useCallback(() => {
    setRecentPages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear recent pages:', error);
    }
  }, []);

  return {
    recentPages,
    addRecentPage,
    clearRecentPages,
  };
}
