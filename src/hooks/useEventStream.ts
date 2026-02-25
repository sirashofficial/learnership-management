/**
 * React Hook for Real-Time Event Streaming
 * 
 * This hook establishes a connection to the SSE endpoint and handles
 * real-time events from the server. It automatically manages connection
 * lifecycle and reconnection logic.
 * 
 * Usage:
 *   const events = useEventStream();
 *   
 *   useEffect(() => {
 *     events.on('assessment:marked', (data) => {
 *       console.log('Assessment marked:', data);
 *       // Trigger cache invalidation or UI update
 *     });
 *   }, [events]);
 */

import { useEffect, useRef, useCallback } from 'react';

export interface StreamEvent {
  type: string;
  timestamp: string;
  data: any;
}

export interface EventStreamHook {
  /**
   * Subscribe to a specific event type
   */
  on: (eventType: string, handler: (data: StreamEvent) => void) => void;

  /**
   * Unsubscribe from an event
   */
  off: (eventType: string, handler: (data: StreamEvent) => void) => void;

  /**
   * Check if stream is connected
   */
  isConnected: boolean;

  /**
   * Manually disconnect
   */
  disconnect: () => void;

  /**
   * Manually reconnect
   */
  reconnect: () => void;
}

/**
 * Hook to subscribe to real-time events via SSE
 * 
 * @param autoConnect - Auto-connect on mount (default: true)
 * @param retryInterval - Interval in ms to retry connection on failure (default: 5000)
 * @param maxRetries - Max retry attempts before stopping (default: 10)
 */
export function useEventStream(
  autoConnect = true,
  retryInterval = 5000,
  maxRetries = 10
): EventStreamHook {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handlersRef = useRef<Map<string, Set<(data: StreamEvent) => void>>>(new Map());
  const isConnectedRef = useRef(false);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectableRef = useRef(true);

  /**
   * Connect to SSE endpoint
   */
  const connect = useCallback(() => {
    if (eventSourceRef.current) {
      return; // Already connected
    }

    try {
      console.log('🔌 Connecting to event stream...');
      const eventSource = new EventSource('/api/events/stream');

      // Handle initial connection
      eventSource.addEventListener('message', (event) => {
        if (event.data.includes('connected-')) {
          console.log('✅ Event stream connected');
          isConnectedRef.current = true;
          retryCountRef.current = 0;
        }
      });

      // Handle heartbeat to keep connection alive
      eventSource.addEventListener('heartbeat', () => {
        // Heartbeat received, connection is alive
      });

      // Handle custom events
      const eventTypes = [
        'student:updated',
        'assessment:marked',
        'attendance:bulk-marked',
        'group:modified',
        'module:completed',
      ];

      for (const eventType of eventTypes) {
        eventSource.addEventListener(eventType, (event) => {
          try {
            const streamEvent: StreamEvent = JSON.parse(event.data);
            // Call registered handlers
            const handlers = handlersRef.current.get(eventType);
            if (handlers) {
              handlers.forEach((handler) => {
                try {
                  handler(streamEvent);
                } catch (error) {
                  console.error(`Error in event handler for ${eventType}:`, error);
                }
              });
            }
          } catch (error) {
            console.error(`Error parsing event data for ${eventType}:`, error);
          }
        });
      }

      // Handle errors
      eventSource.onerror = (error) => {
        console.error('❌ Event stream error:', error);
        isConnectedRef.current = false;

        // Close current connection
        eventSource.close();
        eventSourceRef.current = null;

        // Attempt reconnection with exponential backoff
        if (
          reconnectableRef.current &&
          retryCountRef.current < maxRetries
        ) {
          retryCountRef.current++;
          const nextRetry = retryInterval * Math.pow(1.5, retryCountRef.current - 1);
          console.log(`⏳ Retrying connection in ${nextRetry}ms (attempt ${retryCountRef.current}/${maxRetries})`);

          retryTimeoutRef.current = setTimeout(() => {
            connect();
          }, nextRetry);
        } else if (retryCountRef.current >= maxRetries) {
          console.error('❌ Max retries reached. Event stream unavailable.');
        }
      };

      eventSourceRef.current = eventSource;
    } catch (error) {
      console.error('Failed to connect to event stream:', error);
    }
  }, [retryInterval, maxRetries]);

  /**
   * Disconnect from SSE
   */
  const disconnect = useCallback(() => {
    console.log('🔌 Disconnecting from event stream...');
    reconnectableRef.current = false;

    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    isConnectedRef.current = false;
  }, []);

  /**
   * Reconnect to SSE
   */
  const reconnect = useCallback(() => {
    console.log('🔄 Reconnecting to event stream...');
    disconnect();
    retryCountRef.current = 0;
    reconnectableRef.current = true;
    connect();
  }, [connect, disconnect]);

  /**
   * Subscribe to an event type
   */
  const on = useCallback((eventType: string, handler: (data: StreamEvent) => void) => {
    if (!handlersRef.current.has(eventType)) {
      handlersRef.current.set(eventType, new Set());
    }
    handlersRef.current.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => {
      const handlers = handlersRef.current.get(eventType);
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }, []);

  /**
   * Unsubscribe from an event
   */
  const off = useCallback((eventType: string, handler: (data: StreamEvent) => void) => {
    const handlers = handlersRef.current.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }, []);

  /**
   * Auto-connect on mount
   */
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    // Cleanup on unmount
    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  return {
    on,
    off,
    isConnected: isConnectedRef.current,
    disconnect,
    reconnect,
  };
}

/**
 * Example usage in a component:
 * 
 * function DashboardWithRealTimeUpdates() {
 *   const events = useEventStream();
 * 
 *   useEffect(() => {
 *     const unsubscribe = events.on('assessment:marked', ({ data }) => {
 *       console.log('Assessment marked by another user:', data);
 *       // Trigger cache invalidation
 *     });
 * 
 *     return unsubscribe;
 *   }, [events]);
 * 
 *   return <div>Dashboard with real-time updates</div>;
 * }
 */
