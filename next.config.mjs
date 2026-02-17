/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes and backend functionality
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable server-side features
  reactStrictMode: true,
  // Disable ESLint during build (Phase 1 - focus on TypeScript errors)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
