import { NextRequest, NextResponse } from 'next/server';
import { securityHeaders, applyCorsHeaders, createRateLimitMiddleware, rateLimitPresets } from './security';

/**
 * ============================================================================
 * API ROUTE SECURITY HELPERS
 * ============================================================================
 */

export interface ApiRouteOptions {
  /** Enable CORS headers */
  cors?: boolean;
  
  /** Enable rate limiting */
  rateLimit?: {
    limit: number;
    windowMs: number;
  } | 'strict' | 'moderate' | 'relaxed' | 'auth';
  
  /** Maximum request body size in bytes */
  maxBodySize?: number;
  
  /** Enable security headers */
  securityHeaders?: boolean;
  
  /** Custom security headers to apply */
  customHeaders?: Record<string, string>;
}

const defaultOptions: ApiRouteOptions = {
  cors: true,
  rateLimit: 'moderate',
  maxBodySize: 5 * 1024 * 1024, // 5MB
  securityHeaders: true,
};

/**
 * Wrap API route handler with security features
 */
export function withSecurity(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: ApiRouteOptions = {}
) {
  const mergedOptions = { ...defaultOptions, ...options };

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // Check content length if needed
      if (mergedOptions.maxBodySize) {
        const contentLength = request.headers.get('content-length');
        if (contentLength) {
          const bytes = parseInt(contentLength, 10);
          if (bytes > mergedOptions.maxBodySize) {
            return new NextResponse(
              JSON.stringify({
                success: false,
                error: `Request body exceeds maximum size of ${(mergedOptions.maxBodySize / 1024 / 1024).toFixed(2)}MB`,
                code: 'PAYLOAD_TOO_LARGE',
              }),
              { status: 413 }
            );
          }
        }
      }

      // Apply rate limiting if configured
      if (mergedOptions.rateLimit) {
        const limitConfig = typeof mergedOptions.rateLimit === 'string'
          ? rateLimitPresets[mergedOptions.rateLimit]
          : mergedOptions.rateLimit;

        const rateLimitMiddleware = createRateLimitMiddleware(
          limitConfig.limit,
          limitConfig.windowMs
        );

        const rateLimitResponse = rateLimitMiddleware(request);
        if (rateLimitResponse) {
          return rateLimitResponse;
        }
      }

      // Call the actual handler
      let response = await handler(request);

      // Apply CORS headers if enabled
      if (mergedOptions.cors) {
        const origin = request.headers.get('origin');
        response = applyCorsHeaders(response, origin);
      }

      // Apply security headers if enabled
      if (mergedOptions.securityHeaders) {
        for (const [key, value] of Object.entries(securityHeaders)) {
          response.headers.set(key, value);
        }
      }

      // Apply custom headers if provided
      if (mergedOptions.customHeaders) {
        for (const [key, value] of Object.entries(mergedOptions.customHeaders)) {
          response.headers.set(key, value);
        }
      }

      return response;
    } catch (error) {
      console.error('Security wrapper error:', error);
      
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          code: 'INTERNAL_ERROR',
        }),
        { status: 500 }
      );
    }
  };
}

/**
 * Apply security headers to a response
 */
export function applySecurityHeaders(
  response: NextResponse,
  options: ApiRouteOptions = {}
): NextResponse {
  const mergedOptions = { ...defaultOptions, ...options };

  // Apply security headers
  if (mergedOptions.securityHeaders) {
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }
  }

  // Apply custom headers
  if (mergedOptions.customHeaders) {
    for (const [key, value] of Object.entries(mergedOptions.customHeaders)) {
      response.headers.set(key, value);
    }
  }

  // Apply CORS
  if (mergedOptions.cors) {
    const origin = new URL(response.url || `http://localhost:3000`).origin;
    response = applyCorsHeaders(response, origin);
  }

  return response;
}

/**
 * Create an OPTIONS handler for CORS preflight
 */
export function createCorsOptionsHandler() {
  return async (request: NextRequest): Promise<NextResponse> => {
    const response = new NextResponse(null, { status: 204 });
    const origin = request.headers.get('origin');
    return applyCorsHeaders(response, origin);
  };
}
