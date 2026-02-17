import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Add it to your .env.local file.');
}

const key = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  [key: string]: any; // Allow generic payload for jose compatibility
}

export async function generateToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  expiresIn: string = '24h'
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as JWTPayload;
  } catch (error) {
    // console.error('Token verification failed:', error);
    return null;
  }
}

export function getAuthToken(request: NextRequest): string | null {
  // First check Authorization header
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Then check cookies
  const token = request.cookies.get('auth_token')?.value;
  if (token) {
    return token;
  }

  return null;
}

export async function getUserFromRequest(request: NextRequest): Promise<JWTPayload | null> {
  const token = getAuthToken(request);

  if (!token) {
    return null;
  }

  return await verifyToken(token);
}
