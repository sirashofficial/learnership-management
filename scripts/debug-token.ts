/**
 * Debug script to verify JWT token generation and verification
 */

import { SignJWT, jwtVerify } from 'jose';

const SECRET = 'yeha-learnership-secret-key-2026';
const key = new TextEncoder().encode(SECRET);

async function main() {
  console.log('🔍 Testing JWT Token Generation and Verification');
  console.log('=====================================');
  console.log(`Secret: ${SECRET}`);
  console.log(`Key encoding: UTF-8`);
  console.log('');

  // Generate a token
  console.log('1️⃣  Generating token...');
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    userId: 'test-user-123',
    email: 'testadmin@yeha.org',
    role: 'ADMIN',
    iat: now,
    exp: now + 3600,
  };

  console.log(`Payload: ${JSON.stringify(payload, null, 2)}`);

  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .sign(key);

  console.log(`✅ Token generated: ${token.substring(0, 50)}...`);
  console.log(`Token length: ${token.length}`);
  console.log('');

  // Verify the token
  console.log('2️⃣  Verifying token...');
  try {
    const verified = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    console.log(`✅ Token verified successfully!`);
    console.log(`Payload: ${JSON.stringify(verified.payload, null, 2)}`);
  } catch (error) {
    console.error(`❌ Token verification failed:`, error);
  }

  console.log('');
  console.log('3️⃣  Testing with different secret (should fail)...');
  const wrongKey = new TextEncoder().encode('wrong-secret');
  try {
    await jwtVerify(token, wrongKey, {
      algorithms: ['HS256'],
    });
    console.error('❌ Token verified with wrong key - CRITICAL ERROR!');
  } catch (error) {
    console.log(`✅ Correctly rejected with wrong key: ${(error as Error).message}`);
  }
}

main().catch(console.error);
