import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Allow images from any domain for logos
  images: {
    remotePatterns: [],
  },
  // Disable x-powered-by header
  poweredByHeader: false,
};

export default nextConfig;
