/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes and backend functionality
  images: {
    unoptimized: true,
  },
  // Enable server-side features
  reactStrictMode: true,
  // Disable ESLint during build (Phase 1 - focus on TypeScript errors)
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
