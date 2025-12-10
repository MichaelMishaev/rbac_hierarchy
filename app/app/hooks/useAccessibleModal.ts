'use client';

import { useEffect, useRef, useCallback } from 'react';

interface UseAccessibleModalOptions {
  isOpen: boolean;
  onClose: () => void;
  returnFocusOnClose?: boolean;
  trapFocus?: boolean;
}

/**
 * Hook for creating accessible modals with focus management
 *
 * Features:
 * - Focus trapping inside modal
 * - Return focus to trigger element on close
 * - Escape key to close
 * - ARIA attributes management
 *
 * @example
 * ```tsx
 * const { modalRef, titleId, descId } = useAccessibleModal({
 *   isOpen: isModalOpen,
 *   onClose: () => setIsModalOpen(false),
 *   trapFocus: true
 * });
 *
 * <Dialog
 *   open={isModalOpen}
 *   onClose={onClose}
 *   ref={modalRef}
 *   aria-labelledby={titleId}
 *   aria-describedby={descId}
 * >
 *   <DialogTitle id={titleId}>כותרת</DialogTitle>
 *   <DialogContent id={descId}>תוכן</DialogContent>
 * </Dialog>
 * ```
 */
export function useAccessibleModal({
  isOpen,
  onClose,
  returnFocusOnClose = true,
  trapFocus = true
}: UseAccessibleModalOptions) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useRef(`modal-title-${Math.random().toString(36).substr(2, 9)}`);
  const descId = useRef(`modal-desc-${Math.random().toString(36).substr(2, 9)}`);

  // Store the element that opened the modal
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
    }
  }, [isOpen]);

  // Focus management
  useEffect(() => {
    if (!isOpen || !modalRef.current) return;

    // Focus first focusable element
    const focusableElements = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Focus first element
    setTimeout(() => firstElement?.focus(), 100);

    if (!trapFocus) return;

    // Focus trap handler
    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);

      // Return focus to previous element
      if (returnFocusOnClose && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, trapFocus, returnFocusOnClose]);

  // Escape key handler
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  return {
    modalRef,
    titleId: titleId.current,
    descId: descId.current
  };
}
