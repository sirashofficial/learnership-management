import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // milliseconds
  maxRequests: number;
}

const store = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(config: RateLimitConfig = { interval: 60000, maxRequests: 10 }) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const identifier = getIdentifier(request);
    const now = Date.now();
    const record = store.get(identifier);

    if (!record || now > record.resetTime) {
      store.set(identifier, { count: 1, resetTime: now + config.interval });
      return null;
    }

    if (record.count >= config.maxRequests) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    record.count++;
    return null;
  };
}

function getIdentifier(request: NextRequest): string {
  // Try to get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const real = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (real) {
    return real;
  }

  // Fallback to a combination of user agent and other headers
  return `${request.headers.get('user-agent')}-${request.headers.get('accept-language')}`;
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store.entries()) {
    if (now > record.resetTime) {
      store.delete(key);
    }
  }
}, 60000); // Clean up every minute
