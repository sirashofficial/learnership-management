/**
 * Server-Sent Events (SSE) Endpoint for Real-Time Updates
 * 
 * This endpoint allows clients to subscribe to real-time events:
 * - assessment:marked - When assessments are marked
 * - attendance:bulk-marked - When attendance is marked in bulk
 * - student:updated - When students are created/updated/deleted
 * - group:modified - When groups are modified
 * - module:completed - When modules are completed
 * 
 * Usage from client:
 *   const eventSource = new EventSource('/api/events/stream');
 *   eventSource.addEventListener('assessment:marked', (event) => {
 *     const data = JSON.parse(event.data);
 *     // Handle real-time assessment marking
 *   });
 * 
 * Benefits:
 * - Real-time updates without polling
 * - Collaborative attendance marking without page refresh
 * - Immediate feedback to all connected clients
 * - Reduces server load significantly
 */

import { NextRequest, NextResponse } from 'next/server';
import { eventBus, EventType, EventPayload } from '@/lib/events/eventBus';
import { requireAuth } from '@/lib/middleware';

// Mark request as dynamic to prevent static generation
export const dynamic = 'force-dynamic';

// Store active clients for testing/stats
const activeConnections = new Map<string, NodeJS.Timer>();

// GET /api/events/stream - Connect to SSE stream
async function handleGet(request: NextRequest) {
  try {
    // ============================================
    // AUTHENTICATION CHECK
    // ============================================
    // Require authentication for event stream
    const { error } = await requireAuth(request);
    if (error) {
      console.warn('[SSE] Unauthorized connection attempt');
      // Include CORS headers in error response
      const errorResponse = error.clone();
      errorResponse.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');
      return errorResponse;
    }

    // ============================================
    // CORS CONFIGURATION
    // ============================================
    // Define allowed origins
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      'http://localhost:3000',
    ];

    // Check request origin against whitelist
    const requestOrigin = request.headers.get('origin');
    const allowedOrigin = requestOrigin && allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    // Create a unique ID for this client connection
    const clientId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Set up SSE headers with restricted CORS
    const responseHeaders = new Headers({
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable buffering for Nginx
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': 'true',
    });

    // Create a custom response body that implements the ReadableStream
    const encoder = new TextEncoder();

    // Create a ReadableStream that sends SSE events
    const stream = new ReadableStream({
      start(controller) {
        // Send initial connection message
        const connectMsg = `:connected-${clientId}\n\n`;
        controller.enqueue(encoder.encode(connectMsg));

        console.log(`📡 SSE client connected: ${clientId}`);

        // Create typed event handlers
        const eventHandlers: { [key: string]: (payload: EventPayload) => void } = {};
        const eventTypes: EventType[] = [
          'student:updated',
          'assessment:marked',
          'attendance:bulk-marked',
          'group:modified',
          'module:completed',
        ];

        // Subscribe to all events
        for (const eventType of eventTypes) {
          eventHandlers[eventType] = (payload: EventPayload) => {
            try {
              // Format as SSE event
              const eventData = {
                type: eventType,
                timestamp: new Date().toISOString(),
                data: payload,
              };

              // Send as SSE formatted message
              const sseMessage = `event: ${eventType}\ndata: ${JSON.stringify(eventData)}\n\n`;
              controller.enqueue(encoder.encode(sseMessage));

              console.log(`📤 SSE broadcasted to ${clientId}: ${eventType}`);
            } catch (error) {
              console.error(`❌ Error broadcasting event to SSE client:`, error);
            }
          };

          // Subscribe to event
          eventBus.on(eventType, eventHandlers[eventType]);
        }

        // Keep-alive: Send heartbeat every 30 seconds to prevent connection timeout
        const heartbeatInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`:heartbeat\n\n`));
          } catch (error) {
            clearInterval(heartbeatInterval);
          }
        }, 30000);

        // Store interval for cleanup
        activeConnections.set(clientId, heartbeatInterval);

        // Handle client disconnect
        request.signal.addEventListener('abort', () => {
          console.log(`📡 SSE client disconnected: ${clientId}`);
          
          // Clear heartbeat
          clearInterval(heartbeatInterval);
          activeConnections.delete(clientId);

          // Unsubscribe from all events
          for (const eventType of eventTypes) {
            eventBus.off(eventType as EventType, eventHandlers[eventType]);
          }

          // Close stream
          try {
            controller.close();
          } catch (error) {
            // Stream already closed
          }
        });
      },

      cancel() {
        // Handle stream cancellation
        console.log(`📡 SSE stream cancelled`);
      },
    });

    return new NextResponse(stream, { headers: responseHeaders });
  } catch (error) {
    console.error('❌ SSE endpoint error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Failed to establish SSE connection' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// HEAD handler for initialization check
async function handleHead(request: NextRequest) {
  try {
    // Verify authentication
    const { error } = await requireAuth(request);
    if (error) {
      return new NextResponse(null, { status: 401 });
    }
    
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('❌ HEAD request error:', error);
    return new NextResponse(null, { status: 500 });
  }
}

// Export handlers
export const GET = handleGet;
export const HEAD = handleHead;
