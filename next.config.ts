import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Self-hosted on Hostinger behind a reverse proxy, so we ship a standalone
  // bundle rather than relying on a platform adapter.
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,

  async redirects() {
    return [
      { source: '/tos', destination: '/terms', permanent: true },
      { source: '/extension', destination: '/setup', permanent: false },
    ];
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
        ],
      },
    ];
  },
};

export default nextConfig;
