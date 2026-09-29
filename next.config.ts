import type { NextConfig } from "next";

// Applied to every response. HSTS is left to the HTTPS reverse proxy (see README),
// since only it knows the site is actually served over HTTPS.
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
  // Geolocation is used for prayer times; nothing else needs device access.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self), browsing-topics=()' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const nextConfig: NextConfig = {
  // Self-contained server bundle for the Docker image (see Dockerfile).
  output: 'standalone',
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async redirects() {
    return [
      {
        source: '/prayer',
        destination: '/planner?view=prayer',
        permanent: true,
      },
      {
        source: '/prayer-planner',
        destination: '/planner?view=prayer',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
