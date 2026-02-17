import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from './lib/auth';
import { securityHeaders, handleCorsPreFlight, applyCorsHeaders, createRateLimitMiddleware, rateLimitPresets } from './lib/security';

// Paths that require authentication
const protectedPaths = [
    '/admin',
    '/api/users',
    '/api/assessments',
    '/api/groups',
    '/api/students',
];

// Public paths that don't require authentication
const publicPaths = [
    '/api/auth/login',
    '/api/auth/register',
    '/login',
    '/register',
    '/_next',
    '/favicon.ico',
];

// Rate limit middleware instances
const authRateLimiter = createRateLimitMiddleware(
  rateLimitPresets.auth.limit,
  rateLimitPresets.auth.windowMs
);

const apiRateLimiter = createRateLimitMiddleware(
  rateLimitPresets.moderate.limit,
  rateLimitPresets.moderate.windowMs
);

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    console.log(`🔹 [MIDDLEWARE] Request: ${request.method} ${pathname}`);

    // Handle CORS preflight
    const corsPreflightResponse = handleCorsPreFlight(request);
    if (corsPreflightResponse) {
      return corsPreflightResponse;
    }

    // Apply security headers
    let response = NextResponse.next();
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.headers.set(key, value);
    }

    // Apply CORS headers
    const origin = request.headers.get('origin');
    response = applyCorsHeaders(response, origin);

    // Check if path is public
    if (publicPaths.some(path => pathname.startsWith(path))) {
      console.log(`✅ [MIDDLEWARE] Public path allowed`);
      
      // Apply rate limiting to login endpoint
      if (pathname === '/api/auth/login') {
        const authLimitResponse = authRateLimiter(request);
        if (authLimitResponse) return authLimitResponse;
      }
      
      return response;
    }

    // Apply general rate limiting to API routes
    if (pathname.startsWith('/api')) {
      const apiLimitResponse = apiRateLimiter(request);
      if (apiLimitResponse) return apiLimitResponse;
    }

    // Check for auth token in cookies
    const token = request.cookies.get('auth_token')?.value;

    if (!token) {
      console.log(`Middleware: No token found for ${pathname}`);
      // Redirect to login if accessing protected page
      if (!pathname.startsWith('/api')) {
        const url = new URL('/login', request.url);
        url.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(url);
      }
      // Return 401 for API requests
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token
    const payload = await verifyToken(token);

    if (!payload) {
        console.log(`Middleware: Invalid token for ${pathname}`);
        // Token is invalid/expired
        if (!pathname.startsWith('/api')) {
            const url = new URL('/login', request.url);
            return NextResponse.redirect(url);
        }
        return NextResponse.json({ success: false, error: 'Invalid token' }, { status: 401 });
    }

    console.log(`Middleware: Valid token for user ${payload.userId}`);

    // Role-based access control for /admin
    if (pathname.startsWith('/admin') && payload.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // Add user info to headers for API routes
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-user-id', payload.userId);
    requestHeaders.set('x-user-role', payload.role);

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
