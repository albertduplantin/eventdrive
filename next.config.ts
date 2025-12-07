import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  experimental: {
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
  // Disable static export to avoid build issues with Clerk in Next.js 16
  output: undefined,
};

export default nextConfig;
