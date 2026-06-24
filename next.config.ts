import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
