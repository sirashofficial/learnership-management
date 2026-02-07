import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
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

export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const token = getAuthToken(request);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}
