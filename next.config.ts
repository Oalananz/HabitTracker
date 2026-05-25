import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.100.11'],
  serverExternalPackages: ['@supabase/ssr'],
  async redirects() {
    return [
      {
        source: '/prayer',
        destination: '/prayer-planner',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
