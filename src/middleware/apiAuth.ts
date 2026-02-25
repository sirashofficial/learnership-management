import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/auth';
import { errorResponse, validationErrorResponse } from '@/lib/api-utils';
import { createRateLimitMiddleware } from '@/lib/security';
import prisma from '@/lib/prisma';
import { sanitizeString } from '@/lib/input-sanitizer';

export type ApiHandler = (
  request: NextRequest,
  context?: any
) => Promise<NextResponse>;

export type RateLimitTier = 'strict' | 'moderate' | 'generous';

export interface AuthContext {
  user: {
    userId: string;
    email: string;
    role: string;
  };
  allowedGroupIds: string[];
}

const rateLimitTiers: Record<RateLimitTier, { limit: number; windowMs: number }> = {
  strict: { limit: 5, windowMs: 60 * 1000 },
  moderate: { limit: 100, windowMs: 15 * 60 * 1000 },
  generous: { limit: 1000, windowMs: 15 * 60 * 1000 },
};

function applyApiSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }

  return response;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return request.ip ?? 'unknown';
}

function getEntityContext(request: NextRequest) {
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split('/').filter(Boolean);
  const entityType = segments[1] || 'unknown';
  const entityId = segments.length > 2 ? segments[2] : undefined;

  return { entityType, entityId };
}

function shouldAuditMethod(method: string): boolean {
  return ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());
}

async function logAuditEntry(request: NextRequest, userId: string) {
  if (!shouldAuditMethod(request.method)) {
    return;
  }

  const { entityType, entityId } = getEntityContext(request);
  const ipAddress = getClientIp(request);

  try {
    // @ts-ignore - AuditLog model will be available after migration
    await prisma.auditLog.create({
      data: {
        userId,
        action: request.method.toUpperCase(),
        entityType,
        entityId: entityId ?? null,
        timestamp: new Date(),
        ipAddress,
        metadata: JSON.stringify({
          path: new URL(request.url).pathname,
          query: Object.fromEntries(new URL(request.url).searchParams.entries()),
        }),
      },
    });
  } catch (error) {
    // Fail gracefully - audit logging is non-critical
    console.error('Audit logging failed (table may not exist yet):', error);
  }
}

function sanitizePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizePayload(entry));
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value)) {
      sanitized[key] = sanitizePayload(entry);
    }
    return sanitized;
  }

  if (typeof value === 'string') {
    return sanitizeString(value);
  }

  return value;
}

export async function getAllowedGroupIds(userId: string): Promise<string[]> {
  const [studentGroups, sessionGroups, lessonGroups, planGroups] = await Promise.all([
    prisma.student.findMany({
      where: { facilitatorId: userId },
      select: { groupId: true },
    }),
    prisma.session.findMany({
      where: { facilitatorId: userId },
      select: { groupId: true },
    }),
    prisma.lessonPlan.findMany({
      where: { facilitatorId: userId },
      select: { groupId: true },
    }),
    prisma.plan.findMany({
      where: { facilitatorId: userId },
      select: { groupId: true },
    }),
  ]);

  const groupIds = new Set<string>();
  for (const entry of studentGroups) groupIds.add(entry.groupId);
  for (const entry of sessionGroups) groupIds.add(entry.groupId);
  for (const entry of lessonGroups) if (entry.groupId) groupIds.add(entry.groupId);
  for (const entry of planGroups) groupIds.add(entry.groupId);

  return Array.from(groupIds);
}

export function getAuthContext(request: NextRequest): AuthContext | null {
  const authUser = (request as unknown as { authUser?: AuthContext['user'] }).authUser;
  const allowedGroupIds = (request as unknown as { allowedGroupIds?: string[] }).allowedGroupIds;

  if (!authUser) {
    return null;
  }

  return {
    user: authUser,
    allowedGroupIds: allowedGroupIds ?? [],
  };
}

export function enforceGroupAccess(groupId: string | null | undefined, context: AuthContext | null) {
  if (!context || context.user.role !== 'FACILITATOR') {
    return null;
  }

  if (!groupId) {
    return errorResponse('Forbidden. Group access required.', 403);
  }

  if (!context.allowedGroupIds.includes(groupId)) {
    return errorResponse('Forbidden. Insufficient permissions.', 403);
  }

  return null;
}

export function withAuth(handler: ApiHandler, allowedRoles: string[] = []): ApiHandler {
  return async (request, context) => {
    const user = await getUserFromRequest(request);
    const isPublic = allowedRoles.includes('PUBLIC');

    if (!user && !isPublic) {
      return applyApiSecurityHeaders(errorResponse('Unauthorized. Please login.', 401));
    }

    if (user && allowedRoles.length > 0 && !isPublic && !allowedRoles.includes(user.role)) {
      return applyApiSecurityHeaders(errorResponse('Forbidden. Insufficient permissions.', 403));
    }

    if (user) {
      (request as unknown as { authUser?: AuthContext['user'] }).authUser = {
        userId: user.userId,
        email: user.email,
        role: user.role,
      };

      if (user.role === 'FACILITATOR') {
        const groupIds = await getAllowedGroupIds(user.userId);
        (request as unknown as { allowedGroupIds?: string[] }).allowedGroupIds = groupIds;
      }
    }

    const response = await handler(request, context);
    const securedResponse = applyApiSecurityHeaders(response);

    if (user && shouldAuditMethod(request.method) && securedResponse.status < 400) {
      await logAuditEntry(request, user.userId);
    }

    return securedResponse;
  };
}

export function withRateLimit(handler: ApiHandler, tier: RateLimitTier): ApiHandler {
  const config = rateLimitTiers[tier];
  const limiter = createRateLimitMiddleware(config.limit, config.windowMs);

  return async (request, context) => {
    const limitResponse = limiter(request);
    if (limitResponse) {
      return applyApiSecurityHeaders(limitResponse);
    }

    const response = await handler(request, context);
    return applyApiSecurityHeaders(response);
  };
}

export function withValidation<T extends z.ZodTypeAny>(handler: ApiHandler, schema: T): ApiHandler {
  return async (request, context) => {
    const contentType = request.headers.get('content-type') || '';

    if (!contentType.includes('application/json')) {
      return handler(request, context);
    }

    try {
      const rawBody = await request.text();
      const parsedBody = rawBody ? JSON.parse(rawBody) : {};
      const sanitizedBody = sanitizePayload(parsedBody);
      const validatedBody = schema.parse(sanitizedBody);

      const headers = new Headers(request.headers);
      headers.set('content-type', 'application/json');

      const nextRequest = new NextRequest(request.url, {
        method: request.method,
        headers,
        body: JSON.stringify(validatedBody),
      });

      (nextRequest as unknown as { authUser?: AuthContext['user']; allowedGroupIds?: string[] }).authUser =
        (request as unknown as { authUser?: AuthContext['user'] }).authUser;
      (nextRequest as unknown as { allowedGroupIds?: string[] }).allowedGroupIds =
        (request as unknown as { allowedGroupIds?: string[] }).allowedGroupIds;
      (nextRequest as unknown as { validatedBody?: unknown }).validatedBody = validatedBody;

      return handler(nextRequest, context);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return applyApiSecurityHeaders(validationErrorResponse(error, 422));
      }

      return applyApiSecurityHeaders(errorResponse('Invalid JSON payload', 400));
    }
  };
}
