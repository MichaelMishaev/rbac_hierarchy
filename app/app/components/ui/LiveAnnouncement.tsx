'use client';

import { useEffect, useState } from 'react';
import { Box } from '@mui/material';

interface LiveAnnouncementProps {
  message: string;
  priority?: 'polite' | 'assertive' | 'off';
  clearAfter?: number; // milliseconds
}

/**
 * Accessible live region for screen reader announcements
 * Used for dynamic content updates (task created, check-in success, etc.)
 *
 * @example
 * ```tsx
 * const [announcement, setAnnouncement] = useState('');
 *
 * const handleTaskCreated = () => {
 *   setAnnouncement('משימה חדשה נוצרה בהצלחה');
 * };
 *
 * <LiveAnnouncement message={announcement} priority="polite" clearAfter={3000} />
 * ```
 */
export default function LiveAnnouncement({
  message,
  priority = 'polite',
  clearAfter = 5000
}: LiveAnnouncementProps) {
  const [currentMessage, setCurrentMessage] = useState(message);

  useEffect(() => {
    setCurrentMessage(message);

    if (message && clearAfter > 0) {
      const timer = setTimeout(() => {
        setCurrentMessage('');
      }, clearAfter);

      return () => clearTimeout(timer);
    }
  }, [message, clearAfter]);

  if (!currentMessage) return null;

  return (
    <Box
      role="status"
      aria-live={priority}
      aria-atomic="true"
      sx={{
        position: 'absolute',
        left: -9999,
        width: 1,
        height: 1,
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap'
      }}
    >
      {currentMessage}
    </Box>
  );
}
