/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed 'output: export' to enable API routes and backend functionality
  images: {
    unoptimized: true,
  },
  // Enable server-side features
  reactStrictMode: true,
};

export default nextConfig;
