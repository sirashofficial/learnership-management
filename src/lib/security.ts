import { NextRequest, NextResponse } from 'next/server';

/**
 * ============================================================================
 * SECURITY HEADERS
 * ============================================================================
 */

export const securityHeaders: Record<string, string> = {
  // Prevent clickjacking attacks
  'X-Frame-Options': 'DENY',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable XSS protection in older browsers
  'X-XSS-Protection': '1; mode=block',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy (formerly Feature-Policy)
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
  
  // Strict transport security (HTTPS only)
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
};

/**
 * ============================================================================
 * CORS CONFIGURATION
 * ============================================================================
 */

export interface CorsOptions {
  allowedOrigins?: string[];
  allowedMethods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

export const defaultCorsOptions: CorsOptions = {
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Apply CORS headers to response
 */
export function applyCorsHeaders(
  response: NextResponse,
  origin: string | null,
  options: CorsOptions = defaultCorsOptions
): NextResponse {
  // Check if origin is allowed
  const allowedOrigins = options.allowedOrigins || [];
  const isOriginAllowed =
    origin && allowedOrigins.includes(origin) ||
    allowedOrigins.includes('*');

  if (isOriginAllowed && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }

  if (options.credentials) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  if (options.allowedMethods) {
    response.headers.set(
      'Access-Control-Allow-Methods',
      options.allowedMethods.join(', ')
    );
  }

  if (options.allowedHeaders) {
    response.headers.set(
      'Access-Control-Allow-Headers',
      options.allowedHeaders.join(', ')
    );
  }

  if (options.exposedHeaders) {
    response.headers.set(
      'Access-Control-Expose-Headers',
      options.exposedHeaders.join(', ')
    );
  }

  if (options.maxAge) {
    response.headers.set('Access-Control-Max-Age', options.maxAge.toString());
  }

  return response;
}

/**
 * Handle CORS preflight requests
 */
export function handleCorsPreFlight(
  request: NextRequest,
  options: CorsOptions = defaultCorsOptions
): NextResponse | null {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  const response = new NextResponse(null, { status: 200 });
  
  return applyCorsHeaders(response, origin, options);
}

/**
 * ============================================================================
 * RATE LIMITING
 * ============================================================================
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-memory rate limiter (use Redis for production)
 */
class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(cleanupIntervalMs: number = 60000) {
    // Cleanup old entries every minute
    this.cleanupInterval = setInterval(() => this.cleanup(), cleanupIntervalMs);
  }

  /**
   * Check if rate limit is exceeded
   */
  isLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now > entry.resetTime) {
      // Create new entry
      this.store.set(key, {
        count: 1,
        resetTime: now + windowMs,
      });
      return false;
    }

    entry.count++;
    return entry.count > limit;
  }

  /**
   * Get current count for a key
   */
  getCount(key: string): number {
    const entry = this.store.get(key);
    if (!entry || Date.now() > entry.resetTime) {
      return 0;
    }
    return entry.count;
  }

  /**
   * Reset count for a key
   */
  reset(key: string): void {
    this.store.delete(key);
  }

  /**
   * Cleanup expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Destroy the limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

/**
 * Global rate limiter instances
 */
export const globalRateLimiter = new RateLimiter();

/**
 * Rate limiting presets
 */
export const rateLimitPresets = {
  strict: { limit: 10, windowMs: 60 * 1000 }, // 10 requests per minute
  moderate: { limit: 30, windowMs: 60 * 1000 }, // 30 requests per minute
  relaxed: { limit: 100, windowMs: 60 * 1000 }, // 100 requests per minute
  auth: { limit: 5, windowMs: 15 * 60 * 1000 }, // 5 requests per 15 minutes
  upload: { limit: 20, windowMs: 60 * 60 * 1000 }, // 20 uploads per hour
};

/**
 * Create rate limit middleware
 */
export function createRateLimitMiddleware(
  limit: number,
  windowMs: number
) {
  return function rateLimitMiddleware(request: NextRequest): NextResponse | null {
    const key = getClientIdentifier(request);

    if (globalRateLimiter.isLimited(key, limit, windowMs)) {
      return new NextResponse(
        JSON.stringify({
          success: false,
          error: 'Too many requests',
          code: 'RATE_LIMITED',
          retryAfter: Math.ceil(windowMs / 1000),
        }),
        {
          status: 429,
          headers: {
            'Retry-After': Math.ceil(windowMs / 1000).toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    return null;
  };
}

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get from auth token first (authenticated users)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return `auth:${authHeader.substring(7)}`;
  }

  // Fall back to IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ip =
    forwardedFor?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.ip ||
    'unknown';

  return `ip:${ip}`;
}

/**
 * ============================================================================
 * INPUT SANITIZATION
 * ============================================================================
 */

/**
 * Sanitize string input to prevent XSS
 */
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = { ...obj };

  for (const [key, value] of Object.entries(sanitized)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeString(value);
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'string' ? sanitizeString(item) : item
      );
    }
  }

  return sanitized as T;
}

/**
 * ============================================================================
 * SECURITY CHECKS
 * ============================================================================
 */

/**
 * Check if request contains suspicious patterns
 */
export function checkForSuspiciousPatterns(input: string): boolean {
  const suspiciousPatterns = [
    /union\s+select/gi, // SQL injection
    /drop\s+table/gi,
    /insert\s+into/gi,
    /delete\s+from/gi,
    /exec\s*\(/gi, // Code execution
    /eval\s*\(/gi,
    /\.\.\/\.\.\//g, // Path traversal
    /<script/gi, // XSS
    /javascript:/gi,
    /on\w+\s*=/gi,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate request content-length
 */
export function validateContentLength(
  request: NextRequest,
  maxBytes: number
): { valid: boolean; error?: string } {
  const contentLength = request.headers.get('content-length');

  if (!contentLength) {
    return { valid: true };
  }

  const bytes = parseInt(contentLength, 10);

  if (isNaN(bytes)) {
    return {
      valid: false,
      error: 'Invalid content-length header',
    };
  }

  if (bytes > maxBytes) {
    return {
      valid: false,
      error: `Request body exceeds maximum size of ${(maxBytes / 1024 / 1024).toFixed(2)}MB`,
    };
  }

  return { valid: true };
}
