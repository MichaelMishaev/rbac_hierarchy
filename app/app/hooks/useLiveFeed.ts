/**
 * useLiveFeed Hook
 * Connects to SSE endpoint and receives real-time campaign events
 *
 * Features:
 * - Automatic reconnection on disconnect
 * - Connection status tracking
 * - Event buffering (keeps last 50 events)
 * - TypeScript type safety
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export interface LiveEvent {
  type: 'check_in' | 'check_out' | 'task_complete' | 'activist_added' | 'task_assigned' | 'connected';
  data: any;
  timestamp: number;
}

interface UseLiveFeedReturn {
  events: LiveEvent[];
  isConnected: boolean;
  error: string | null;
  clearEvents: () => void;
}

export function useLiveFeed(): UseLiveFeedReturn {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout | null = null;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/events/live-feed');

        eventSource.onopen = () => {
          console.log('[LiveFeed] Connected to event stream');
          setIsConnected(true);
          setError(null);
        };

        eventSource.onmessage = (e) => {
          try {
            const event: LiveEvent = JSON.parse(e.data);

            // Skip connection messages
            if (event.type === 'connected') {
              console.log('[LiveFeed] Connection confirmed');
              return;
            }

            // Add event to buffer (keep last 50)
            setEvents((prev) => {
              const newEvents = [event, ...prev];
              return newEvents.slice(0, 50);
            });

            console.log('[LiveFeed] New event received:', event.type);
          } catch (err) {
            console.error('[LiveFeed] Failed to parse event data:', err);
          }
        };

        eventSource.onerror = (e) => {
          console.error('[LiveFeed] Connection error:', e);
          setIsConnected(false);
          setError('Connection lost. Reconnecting...');

          // Close current connection
          eventSource?.close();

          // Attempt reconnection after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('[LiveFeed] Attempting to reconnect...');
            connect();
          }, 5000);
        };
      } catch (err) {
        console.error('[LiveFeed] Failed to create EventSource:', err);
        setError('Failed to connect to live feed');
      }
    };

    // Initial connection
    connect();

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        console.log('[LiveFeed] Closing connection');
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  return {
    events,
    isConnected,
    error,
    clearEvents,
  };
}
