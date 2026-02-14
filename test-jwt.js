const { SignJWT, jwtVerify } = require('jose');

const secretKey = 'yeha-learnership-secret-key-2026';
const key = new TextEncoder().encode(secretKey);

async function testToken() {
  // Generate a test token
  const token = await new SignJWT({
    userId: 'adc25a2c-3aeb-43aa-af8f-5e2fe3028caa',
    email: 'ash@yeha.training',
    role: 'ADMIN'
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key);

  console.log('Generated token:', token.substring(0, 50) + '...');

  // Verify the token
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    console.log('✅ Token verification successful');
    console.log('Payload:', payload);
  } catch (error) {
    console.log('❌ Token verification failed:', error.message);
  }
}

testToken();