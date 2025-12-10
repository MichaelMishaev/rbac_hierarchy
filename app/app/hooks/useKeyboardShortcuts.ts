'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  action: () => void;
  description: string;
}

interface UseKeyboardShortcutsOptions {
  onCommandPalette?: () => void;
  onNewTask?: () => void;
  onQuickSearch?: () => void;
  onCloseModal?: () => void;
  customShortcuts?: KeyboardShortcut[];
}

/**
 * Global keyboard shortcuts hook for improved accessibility
 *
 * Default shortcuts:
 * - Cmd/Ctrl + K: Open command palette
 * - Cmd/Ctrl + N: Create new task
 * - Cmd/Ctrl + F: Focus search
 * - Escape: Close modals/dialogs
 * - ?: Show keyboard shortcuts help
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   onCommandPalette: () => setCommandPaletteOpen(true),
 *   onNewTask: () => setTaskModalOpen(true),
 *   onQuickSearch: () => searchInputRef.current?.focus()
 * });
 * ```
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions = {}) {
  const router = useRouter();

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    const target = e.target as HTMLElement;
    const isInputField = target.tagName === 'INPUT' ||
                        target.tagName === 'TEXTAREA' ||
                        target.isContentEditable;

    // Command Palette (Cmd/Ctrl + K)
    if ((e.metaKey || e.ctrlKey) && e.key === 'k' && !isInputField) {
      e.preventDefault();
      options.onCommandPalette?.();
    }

    // New Task (Cmd/Ctrl + N)
    if ((e.metaKey || e.ctrlKey) && e.key === 'n' && !isInputField) {
      e.preventDefault();
      options.onNewTask?.();
    }

    // Quick Search (Cmd/Ctrl + F)
    if ((e.metaKey || e.ctrlKey) && e.key === 'f' && !isInputField) {
      e.preventDefault();
      options.onQuickSearch?.();
    }

    // Escape - Close modals
    if (e.key === 'Escape') {
      options.onCloseModal?.();
    }

    // Navigation shortcuts (Cmd/Ctrl + number)
    if ((e.metaKey || e.ctrlKey) && !isInputField) {
      switch(e.key) {
        case '1':
          e.preventDefault();
          router.push('/dashboard');
          break;
        case '2':
          e.preventDefault();
          router.push('/activists');
          break;
        case '3':
          e.preventDefault();
          router.push('/tasks');
          break;
        case '4':
          e.preventDefault();
          router.push('/map');
          break;
      }
    }

    // Custom shortcuts
    if (options.customShortcuts) {
      for (const shortcut of options.customShortcuts) {
        const matchesKey = e.key.toLowerCase() === shortcut.key.toLowerCase();
        const matchesCtrl = shortcut.ctrlKey ? e.ctrlKey : !e.ctrlKey;
        const matchesMeta = shortcut.metaKey ? e.metaKey : !e.metaKey;
        const matchesShift = shortcut.shiftKey ? e.shiftKey : !e.shiftKey;
        const matchesAlt = shortcut.altKey ? e.altKey : !e.altKey;

        if (matchesKey && matchesCtrl && matchesMeta && matchesShift && matchesAlt) {
          e.preventDefault();
          shortcut.action();
        }
      }
    }
  }, [options, router]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);
}

/**
 * Hook for displaying keyboard shortcuts help dialog
 */
export function useKeyboardShortcutsHelp() {
  const shortcuts = [
    { keys: ['⌘/Ctrl', 'K'], description: 'פתח לוח פקודות' },
    { keys: ['⌘/Ctrl', 'N'], description: 'צור משימה חדשה' },
    { keys: ['⌘/Ctrl', 'F'], description: 'חיפוש מהיר' },
    { keys: ['⌘/Ctrl', '1-4'], description: 'ניווט מהיר בין עמודים' },
    { keys: ['Esc'], description: 'סגור חלונות' },
    { keys: ['Tab'], description: 'נווט בין אלמנטים' },
    { keys: ['?'], description: 'הצג קיצורי מקלדת' }
  ];

  return shortcuts;
}
