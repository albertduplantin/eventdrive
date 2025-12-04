import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
    // Exclude specific pages from static generation
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  // Skip pre-rendering for pages that require authentication
  async headers() {
    return [
      {
        source: '/dashboard/:path*',
        headers: [
          {
            key: 'x-robots-tag',
            value: 'noindex, nofollow',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
